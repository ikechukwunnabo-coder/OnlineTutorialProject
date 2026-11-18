# Ben Digital Solution

A content-first programming tutorial platform for absolute beginners.

- **Backend:** Django 5.2 LTS, Django REST Framework, PostgreSQL, Redis
- **Frontend:** Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind CSS 4
- **Deployment:** Docker Compose, Nginx TLS, Gunicorn, PostgreSQL 18.7, Redis 8.4.8
- **Docs:** `docs/PROJECT_STATUS.md` (living status), `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/RUNBOOK.md`, `docs/R1_GATE.md`, `docs/decisions/`

Release 1 is built in phases. Phases 0-6 are complete. Phase 7 production assets and AC-30 media validation are authored and local checks pass, but the **R1 gate is NOT PASSED**: production Compose/Nginx/TLS, PostgreSQL 18.7, Redis 8.4.8, CI, live email, and p75 LCP remain open. See `docs/R1_GATE.md`.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.14.8 | Local virtual environment |
| PostgreSQL | 18.7 | Docker service or local install |
| Redis | 8.4.8 | Docker service or local install |
| Docker + Compose | current | Optional for local development; required for parity |
| Node.js | 26.13.1 | Phase 5+; use containers/CI, not the host |
| Git | current | Repository is initialised |

## Quick start (local Python, SQLite fallback)

PowerShell:

```powershell
Copy-Item .env.example .env
python -m venv .venv
& .venv\Scripts\python.exe -m pip install -r backend\requirements\dev.txt
$env:DJANGO_SETTINGS_MODULE = "config.settings.dev"
Set-Location backend
& ..\.venv\Scripts\python.exe manage.py migrate
& ..\.venv\Scripts\python.exe manage.py createsuperuser
& ..\.venv\Scripts\python.exe manage.py seed_demo --author-email you@example.com
& ..\.venv\Scripts\python.exe manage.py runserver
email:admin@onlinetutorial.com Admin$1234
```

Open `http://localhost:8000/admin/` and `http://localhost:8000/api/v1/health/`.

If `DATABASE_URL` is unset, development falls back to `backend/db.sqlite3`. PostgreSQL is required for CI and production.

Frontend (Node 26.13.1 via `fnm`):

```powershell
Set-Location frontend
fnm exec --using 26.13.1 -- cmd /c "npm ci"
fnm exec --using 26.13.1 -- cmd /c "npm run dev"
```

Open `http://localhost:3000`. The development server proxies `/api/v1` to Django.

## Quick start (Docker Compose)

```powershell
Copy-Item .env.example .env
docker compose -f infra\compose\compose.yaml up --build
```

The API is at `http://localhost:8000/api/v1/`. Compose starts PostgreSQL, Redis, and Django with development settings. Database and Redis are bound to `127.0.0.1` only.

Run commands inside the backend container:

```powershell
docker compose -f infra\compose\compose.yaml exec backend python manage.py migrate
docker compose -f infra\compose\compose.yaml exec backend python manage.py seed_demo --author-email you@example.com
docker compose -f infra\compose\compose.yaml exec backend pytest
```

## Production deployment

The production stack is `infra/compose/compose.prod.yaml`, with Nginx TLS and a standalone Next.js image. It has not been executed on a Linux/Docker host in this workspace; treat it as unverified until the Phase 7 gate is completed.

```bash
cp .env.prod.example .env.prod
chmod 600 .env.prod
# Fill every placeholder, then validate:
docker compose --env-file .env.prod -f infra/compose/compose.prod.yaml config
# Obtain the first certificate, then:
chmod +x infra/scripts/*.sh
./infra/scripts/deploy.sh
```

See `docs/RUNBOOK.md` for TLS bootstrap/renewal, backups, restore/cutover, rollback, monitoring, and incident procedures. See `docs/R1_GATE.md` for the pass/fail status.

## Common commands

| Task | Command (from `backend/`) |
|---|---|
| Check configuration | `python manage.py check` |
| Create migrations | `python manage.py makemigrations` |
| Apply migrations | `python manage.py migrate` |
| Create admin user | `python manage.py createsuperuser` |
| Seed demo content | `python manage.py seed_demo --author-email <email>` |
| Remove demo content | `python manage.py purge_demo_content` |
| Run tests | `pytest` |
| Lint | `ruff check .` |
| Format check | `ruff format --check .` |
| Type check | `mypy .` |
| Dependency audit | `pip-audit -r requirements/base.txt` |
| Production dependency audit | `pip-audit -r requirements/prod.txt` |
| OpenAPI schema (dev) | `GET /api/v1/schema/` |

From `frontend/` with Node 26.13.1:

| Task | Command |
|---|---|
| Unit/component tests | `fnm exec --using 26.13.1 -- cmd /c "npm test"` |
| Lint | `fnm exec --using 26.13.1 -- cmd /c "npm run lint"` |
| Type check | `fnm exec --using 26.13.1 -- cmd /c "npm run typecheck"` |
| Production build | `fnm exec --using 26.13.1 -- cmd /c "npm run build"` |
| Production dependency audit | `fnm exec --using 26.13.1 -- cmd /c "npm audit --omit=dev"` |

`seed_demo` requires an existing author account; it never creates fake users. Demo records are marked `is_demo=True` and titled `Demo: ...`. They are excluded from public counts, search, and the sitemap once those features exist.

## Project layout

```text
backend/
  config/settings/     base, dev, prod, test
  apps/                accounts, catalog, seo, learning, contact, common
  requirements/        base, dev, prod pins
  tests/               factories and model/command tests per app
frontend/              Next.js app, Vitest, Playwright, production Dockerfile
infra/compose/         development and production Docker Compose
infra/nginx/           production Nginx TLS template
infra/scripts/         deploy, backup, restore, smoke-test scripts
docs/                  status, architecture, API contract, runbook, R1 gate, ADRs
```

## Configuration

All configuration is environment-based. See `.env.example` for the full inventory. Never commit `.env` or real credentials.

Key variables:

- `DJANGO_SETTINGS_MODULE` — `config.settings.dev` or `config.settings.prod`
- `DJANGO_SECRET_KEY` — required in production
- `DATABASE_URL` — PostgreSQL DSN in CI/production
- `REDIS_URL` — cache, sessions (`cached_db`), throttles
- `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`
- `EMAIL_*` — console backend in development, SMTP/API in production
- `REVALIDATE_SECRET`, `REVALIDATE_URL` — Phase 5 webhook
- `SENTRY_DSN` — optional; disabled when empty

## Tests and CI

```powershell
Set-Location backend
& ..\.venv\Scripts\python.exe -m pytest
```

CI (`.github/workflows/ci.yml`) runs Ruff, formatting, mypy, migration drift check, Django system checks, the production `check --deploy` baseline, OpenAPI schema validation, a dependency audit, and pytest against PostgreSQL 18.7 and Redis 8.4.8, plus a secret scan. The frontend job activates automatically when `frontend/package.json` exists.

Current local evidence: **162 backend tests at 93.28% coverage**, **20 frontend tests**, a **49-page standalone production build**, clean Ruff/ESLint/typecheck, clean production dependency audits, AC-30 media validation tests, and a local PostgreSQL 17 restore drill. CI has not executed, so AC-25 is still open.

Local tests default to in-memory SQLite unless `DATABASE_URL` is set. Run them against PostgreSQL (Compose or CI) before relying on database-specific behaviour.

## Windows notes

- If `Activate.ps1` is blocked, use the interpreter directly: `& .venv\Scripts\python.exe ...`.
- The repository uses LF line endings; `.gitattributes` enforces them for source files.
- Do not run Node builds on host Node 20; use Node 26.13.1 through `fnm`, Docker, or CI.
- Docker Desktop must be running before Compose commands.

## Security

- No secrets in the repository; `.env` is gitignored.
- Production requires `DJANGO_DEBUG=False`, a real `DJANGO_SECRET_KEY`, HTTPS cookies, and a trusted origin.
- Report security issues privately to the site owner.

## Documentation

- `docs/PROJECT_STATUS.md` — phase ledger, requirements, acceptance criteria, phase reports
- `docs/ARCHITECTURE.md` — topology, data model, permissions, caching, SEO
- `docs/API_CONTRACT.md` — R1 endpoint contract
- `docs/TEST_STRATEGY.md` — test layers, commands, and recorded evidence
- `docs/RUNBOOK.md` — production deploy, TLS, backup/restore, rollback, incidents
- `docs/R1_GATE.md` — criterion-level release gate status
- `docs/decisions/` — ADR log
- `docs/CONTENT_PLAN.md` — 20-chapter plan
- `docs/RISK_REGISTER.md` — risks and mitigations
