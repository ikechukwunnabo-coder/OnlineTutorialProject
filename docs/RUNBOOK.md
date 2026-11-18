# Production Runbook - Ben Digital Solution

**Last updated:** 2026-11-18 (Phase 7)
**Status:** Authored, not executed on a Linux/Docker production host. Treat every command as unverified until the Phase 7 gate is completed on the target VPS.

## 1. Scope

This runbook covers the R1 single-VPS deployment: Nginx TLS termination, the Next.js frontend, Django/Gunicorn, PostgreSQL, Redis, static/media volumes, backups, restore, certificate renewal, smoke tests, and rollback.

The production topology is defined in `infra/compose/compose.prod.yaml`; the Nginx template is `infra/nginx/templates/default.conf.template`.

## 2. Topology

```text
Internet
  |
  v
Nginx :80/:443  (TLS, security headers, gzip)
  |-- /api/v1/, /admin/  -> backend:8000 (Gunicorn)
  |-- /static/, /media/  -> shared volumes
  |-- /_next/static/     -> frontend:3000
  |-- /                  -> frontend:3000
        |
        +-- PostgreSQL 18.7 (internal only, pgdata volume)
        +-- Redis 8.4.8 (internal only, no persistence, 128 MB cap)
```

Only ports 80 and 443 are published. Database, Redis, Gunicorn, and Next.js remain on the private Compose network.

## 3. Prerequisites

- Linux VPS with Docker Engine and Docker Compose v2.
- DNS `A`/`AAAA` record for the primary domain pointing at the VPS.
- Firewall allowing SSH, TCP 80, and TCP 443 only.
- Host `certbot` installed, or another ACME client that writes certificates to `/etc/letsencrypt`.
- Outbound HTTPS for package/image pulls and email delivery.
- A backup destination outside the VPS (recommended).
- Optional: `age` for encrypted backups and `rclone` for off-host copies.

## 4. First deployment

### 4.1 Prepare the environment file

```bash
cd /srv/ben-digital-solution
cp .env.prod.example .env.prod
chmod 600 .env.prod
```

Fill every placeholder in `.env.prod`. At minimum:

- `DJANGO_SECRET_KEY`: at least 50 random characters.
- `POSTGRES_PASSWORD` and the password inside `DATABASE_URL`: the same value; URL-encode special characters in `DATABASE_URL`.
- `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`, `SITE_URL`, and `DOMAIN`.
- `EMAIL_*`: a real transactional provider.
- `REVALIDATE_SECRET`: a long random value shared with the frontend.
- `SENTRY_DSN`: optional; leave empty to disable error tracking.
- `CERTBOT_CONFIG_DIR` and `CERTBOT_WEBROOT`: absolute host paths.

Generate secrets with `openssl rand -base64 48`. Never commit `.env.prod`.

Validate the rendered Compose model before building:

```bash
docker compose --env-file .env.prod -f infra/compose/compose.prod.yaml config
```

### 4.2 Obtain the first TLS certificate

The Nginx container requires certificate files at startup. Obtain the first certificate before starting the stack:

```bash
sudo certbot certonly --standalone -d "$DOMAIN"
```

Port 80 must be free during this command. Confirm these files exist:

```text
/etc/letsencrypt/live/$DOMAIN/fullchain.pem
/etc/letsencrypt/live/$DOMAIN/privkey.pem
```

The template uses one primary domain (`DOMAIN`). If `www` must also serve the site, add it to the certificate and to the Nginx `server_name`/server blocks before deploying; do not assume the current template serves `www`.

### 4.3 Build and start

Make the scripts executable, then deploy:

```bash
chmod +x infra/scripts/*.sh
./infra/scripts/deploy.sh
```

`deploy.sh` builds images, starts PostgreSQL and Redis, applies migrations, starts backend/frontend/Nginx, waits for `/api/v1/ready/`, and runs the smoke test.

If the smoke test fails, inspect:

```bash
docker compose --env-file .env.prod -f infra/compose/compose.prod.yaml ps
docker compose --env-file .env.prod -f infra/compose/compose.prod.yaml logs --tail=100 backend frontend nginx db redis
```

### 4.4 Create the administrator and real content

```bash
docker compose --env-file .env.prod -f infra/compose/compose.prod.yaml \
  exec backend python manage.py createsuperuser
```

Create categories, tutorials, and chapters through Django admin at `https://$DOMAIN/admin/`.

Do not run `seed_demo` on production unless it is immediately followed by `purge_demo_content`. Demo records are excluded from public counts and the sitemap, but they should not exist on the launch database.

### 4.5 Verify

```bash
BASE_URL="https://$DOMAIN" ./infra/scripts/smoke-test.sh
```

Also verify manually:

- Home, category, tutorial, and chapter pages load over HTTPS.
- `/api/v1/health/` and `/api/v1/ready/` return `200`.
- Login, registration, verification, and password reset work with the live email provider.
- Admin login works and is not publicly linked.
- Response headers include HSTS, CSP, `X-Content-Type-Options`, and `Referrer-Policy`.
- A chapter with an admin-uploaded image shows the validated alt text (empty only when marked decorative), and a saved YouTube/Vimeo embed loads under the allowlisted `frame-src` CSP.
- `http://` redirects to `https://`.

## 5. Routine operations

### 5.1 Status and logs

```bash
docker compose --env-file .env.prod -f infra/compose/compose.prod.yaml ps
docker compose --env-file .env.prod -f infra/compose/compose.prod.yaml logs -f --tail=100 backend frontend nginx
```

Backend logs are JSON when production settings are active. Do not paste full logs containing user data into public tickets.

### 5.2 Deploy a new revision

```bash
./infra/scripts/backup.sh
git pull
./infra/scripts/deploy.sh
```

Run `./infra/scripts/smoke-test.sh` after every deploy. Migrations are forward-only; if a migration is incompatible with rollback, restore the pre-deploy backup instead of reverting the database by hand.

### 5.3 Backups

```bash
./infra/scripts/backup.sh
```

Optional environment variables:

- `BACKUP_DIR`: local backup root (default `./backups`).
- `BACKUP_AGE_RECIPIENT`: encrypt database and media archives with `age`.
- `BACKUP_REMOTE`: `rclone` destination for off-host copies.

Retention is 7 daily copies and 28 weekly copies. The script uses `pg_dump --format=custom` inside the database container and archives `/app/media` from the backend container.

Schedule daily execution with cron or a systemd timer, for example:

```cron
15 2 * * * cd /srv/ben-digital-solution && BACKUP_REMOTE=remote:bds-backups ./infra/scripts/backup.sh >> /var/log/bds-backup.log 2>&1
```

### 5.4 Restore drill and cutover

Restore into a separate database first; never restore directly over the live database:

```bash
CONFIRM_RESTORE=yes ./infra/scripts/restore.sh \
  backups/daily/db-YYYYMMDDTHHMMSSZ.dump \
  backups/daily/media-YYYYMMDDTHHMMSSZ.tar.gz
```

The script stops application containers, recreates `${POSTGRES_DB}_restore`, restores the dump with `--exit-on-error`, restores media, and restarts the stack. The application still points at the original `DATABASE_URL` after this step.

Verify the restored database:

```bash
docker compose --env-file .env.prod -f infra/compose/compose.prod.yaml \
  exec db sh -c 'psql -U "$POSTGRES_USER" -d "${POSTGRES_DB}_restore" \
  -c "SELECT count(*) FROM catalog_chapter;" \
  -c "SELECT title FROM catalog_chapter ORDER BY id LIMIT 5;"'
```

Cutover only after verification:

1. Stop application traffic or enter a short maintenance window.
2. Change `DATABASE_URL` in `.env.prod` to the restored database.
3. Restart backend, frontend, and Nginx.
4. Run the smoke test and a real chapter request.
5. Keep the old database until the new one has been verified.

### 5.5 TLS renewal

Use webroot renewal while Nginx is running. The HTTP server already exposes `/.well-known/acme-challenge/` from `${CERTBOT_WEBROOT}`:

```bash
sudo certbot renew --webroot -w /var/www/certbot --quiet \
  --deploy-hook "docker compose --env-file /srv/ben-digital-solution/.env.prod -f /srv/ben-digital-solution/infra/compose/compose.prod.yaml exec -T nginx nginx -s reload"
```

If the initial certificate was issued with `--standalone`, either switch the renewal configuration to webroot or stop Nginx during renewal with `--pre-hook`/`--post-hook`. Test renewal with `sudo certbot renew --dry-run`.

## 6. Rollback

1. Run `./infra/scripts/backup.sh` before changing anything.
2. Check out the last known-good revision.
3. Run `./infra/scripts/deploy.sh`.
4. Run `./infra/scripts/smoke-test.sh`.

If the previous revision expects an older schema, restore the matching database backup. Do not attempt to reverse migrations manually in production.

## 7. Security and monitoring

- Keep `.env.prod` owned by the deploy user with mode `600`.
- Publish only 80/443; do not expose PostgreSQL, Redis, Gunicorn, or Next.js.
- Use SSH keys and disable password SSH login.
- Keep Docker, the host OS, Python images, Node images, Nginx, PostgreSQL, and Redis patched.
- Keep `SENTRY_DSN` empty to disable Sentry, or set it to a project DSN. Backend Sentry is wired; frontend error tracking is not yet wired.
- Review `/api/v1/ready/` and container health checks after every deploy.
- Watch disk usage for `pgdata`, `media`, Docker images, and backups.
- Run `python manage.py check --deploy --settings=config.settings.prod` with production environment values before each release.
- Run `pip-audit -r backend/requirements/prod.txt` and `npm audit --omit=dev` before each release.

## 8. Incident checklist

| Symptom | First checks | Action |
|---|---|---|
| 502/504 from Nginx | `docker compose ps`, backend/frontend logs | Restart the failed service; verify `/api/v1/ready/`; check DB/Redis health |
| Database unavailable | `db` health, disk space, `pg_isready` | Restore service; if corrupted, restore the latest verified dump |
| Redis unavailable | `redis` health, memory | Restart Redis; sessions use `cached_db`, but throttles/cache degrade |
| Disk full | `df -h`, Docker disk usage | Remove old images/backups after confirming retention; expand disk |
| Certificate expired | `certbot certificates`, Nginx logs | Renew and reload Nginx; verify port 80 challenge path |
| Email failures | backend logs, provider status | Fix provider credentials/timeouts; use resend verification/reset paths |
| Suspected secret leak | Git history, image layers, logs | Rotate the secret, redeploy, invalidate sessions, review access logs |
| Bad deploy | smoke test, logs, recent revision | Roll back to the previous revision and matching backup |

## 9. Known gaps

The following are not verified in the current workspace:

- Docker/Compose stack, Nginx runtime configuration, and container health checks.
- PostgreSQL 18.7 and Redis 8.4.8 (local PostgreSQL is 17; local Redis is 3.0.504).
- GitHub Actions CI execution.
- Live transactional email delivery.
- p75 mobile LCP and manual keyboard/screen-reader/visual review.
- AC-30 image alt-text/type/size and allowlisted video embeds are implemented locally but not verified on the production Compose/Nginx stack.
- Frontend Sentry is not wired.
- Full `npm audit` reports dev-toolchain findings; production dependencies report none.

## 10. Command reference

```bash
# Validate Compose
docker compose --env-file .env.prod -f infra/compose/compose.prod.yaml config

# Deploy
./infra/scripts/deploy.sh

# Smoke test
BASE_URL="https://$DOMAIN" ./infra/scripts/smoke-test.sh

# Backup
./infra/scripts/backup.sh

# Restore into a clean database
CONFIRM_RESTORE=yes ./infra/scripts/restore.sh <db.dump> [media.tar.gz]

# Logs
docker compose --env-file .env.prod -f infra/compose/compose.prod.yaml logs -f --tail=100 backend frontend nginx

# Django checks
docker compose --env-file .env.prod -f infra/compose/compose.prod.yaml \
  exec backend python manage.py check --deploy --settings=config.settings.prod
```
