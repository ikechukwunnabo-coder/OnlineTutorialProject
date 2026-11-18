# Test Strategy — Ben Digital Solution

**Last updated:** 2026-11-18 (Phase 7)
**Scope:** R1 backend foundation, auth/account API, Next.js public/auth frontend, learner features, and Playwright/axe/performance checks. Production hardening is added in Phase 7.

## 1. Principles

- Tests assert behaviour, not implementation details.
- Every phase adds tests for the code it introduces; CI is the gate.
- Database constraints are tested at the database boundary, not only in Python.
- Permission tests use real request/users where practical.
- Demo content tests prove idempotency and isolation from real content.
- Coverage is a floor (85% of application code), not a goal by itself.
- No live email, Redis, or PostgreSQL is required for the local fast suite; parity runs in CI/Compose.

## 2. Layers and tools

| Layer | Tool | Current use |
|---|---|---|
| Unit/model tests | pytest + pytest-django | R1 models, constraints, indexes, managers, signals, reading-time logic |
| Admin/permission tests | pytest + Django test client | Staff/editor/admin boundaries, publication controls, audit logging |
| Command tests | `call_command` | `seed_demo` idempotency and `purge_demo_content` isolation |
| HTTP foundation tests | Django test client | Health, readiness, request ID, error envelope, placeholder page |
| Coverage | coverage.py via pytest-cov | 85% application-code threshold |
| Static checks | Ruff, mypy + django-stubs | Lint, formatting, type checking |
| Schema validation | drf-spectacular | OpenAPI generation and validation |
| Deployment baseline | `manage.py check --deploy` | Production settings warnings/errors |
| Dependency audit | pip-audit | Known vulnerabilities in production requirements |
| CI | GitHub Actions | PostgreSQL 18.7 + Redis 8.4.8 services, all checks |
| Frontend unit/component | Vitest + Testing Library + jsdom | API errors, formatting, forms, search combobox, copy interaction, auth login form |
| Frontend static checks | ESLint + `tsc --noEmit` | Next.js/TypeScript lint and type gates |
| Frontend build | `next build` | Route generation, server/client boundaries, production compile |
| E2E | Playwright + axe | Public, auth, learner, contact, accessibility, and opt-in performance flows against a production build |

## 3. Commands

From `backend/` with the virtual environment:

```powershell
& ..\.venv\Scripts\python.exe -m pytest
& ..\.venv\Scripts\python.exe -m ruff check .
& ..\.venv\Scripts\python.exe -m ruff format --check .
& ..\.venv\Scripts\python.exe -m mypy .
& ..\.venv\Scripts\python.exe manage.py check --settings=config.settings.test
& ..\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run --settings=config.settings.test
& ..\.venv\Scripts\python.exe manage.py spectacular --file schema.yaml --validate --settings=config.settings.test
& ..\.venv\Scripts\python.exe -m pip_audit -r requirements/base.txt
```

Production baseline (set `DATABASE_URL` to a PostgreSQL DSN, plus secret, hosts, CSRF origin, and email backend):

```powershell
& ..\.venv\Scripts\python.exe manage.py check --deploy --settings=config.settings.prod --fail-level ERROR
```

From `frontend/` with Node 26.13.1:

```powershell
fnm exec --using 26.13.1 -- cmd /c "npm test"
fnm exec --using 26.13.1 -- cmd /c "npm run lint"
fnm exec --using 26.13.1 -- cmd /c "npm run typecheck"
fnm exec --using 26.13.1 -- cmd /c "npm run build"
```

E2E against a production build (start `next start -p 3001` with the correct build-time `API_INTERNAL_URL`):

```powershell
$env:E2E_BASE_URL = "http://localhost:3001"
$env:E2E_NO_SERVER = "1"
fnm exec --using 26.13.1 -- cmd /c "npm run test:e2e"
$env:E2E_PERFORMANCE = "1"
fnm exec --using 26.13.1 -- cmd /c "npm run test:e2e -- e2e/performance.spec.ts"
```

## 4. Test settings

`config.settings.test` uses:

- MD5 password hasher for speed (never used in production).
- In-memory SQLite when `DATABASE_URL` is unset.
- LocMem cache when `REDIS_URL` is unset; Redis when `REDIS_URL` is set (CI).
- LocMem email backend.
- Coverage threshold enforced by `--cov-fail-under=85`.
- `CSRF_TRUSTED_ORIGINS` includes `http://localhost:3000`, `http://localhost:3001`, `http://127.0.0.1:3000`, and `http://127.0.0.1:3001` so authenticated unsafe requests work through the Next proxy.

## 5. Phase 2 evidence (2026-11-13)

| Check | Result |
|---|---|
| `pytest` | 60 passed; 93.58% application coverage |
| `ruff check .` | All checks passed |
| `ruff format --check .` | 65 files already formatted |
| `mypy .` | Success: no issues in 46 source files |
| `manage.py check --settings=config.settings.test` | No issues |
| `makemigrations --check --dry-run` | No changes detected |
| `migrate --settings=config.settings.test` | All migrations applied to SQLite |
| `spectacular --validate` | Schema generated with 0 warnings and 0 errors |
| `check --deploy --settings=config.settings.prod --fail-level ERROR` | No issues (with a 50+ character CI-only key) |
| `pip-audit -r requirements/base.txt` | No known vulnerabilities found |
| `pre-commit validate-config` | Config valid |
| YAML parse of CI, pre-commit, Compose | OK |
| Docker Compose stack | **Not run** — Docker daemon unavailable on this host |
| PostgreSQL/Redis test run | **Not run locally** — covered by CI services, not yet executed on GitHub |
| GitHub Actions workflow | **Not executed** — no remote repository yet |

### Test inventory

| Area | Tests |
|---|---|
| Accounts models/manager/signals | 8 |
| Catalog models/constraints | 17 |
| Catalog admin permissions/publication | 7 |
| Catalog management commands | 6 |
| Common health/readiness | 4 |
| Common middleware/error envelope | 5 |
| Common placeholder page | 1 |
| SEO slug redirects | 7 |
| Learning bookmarks/progress | 4 |
| Contact validation | 1 |
| **Total** | **60** |

## 6. Phase 3 evidence (2026-11-14)

| Check | Result |
|---|---|
| `pytest` | 99 passed; 92.62% application coverage |
| `ruff check .` | All checks passed |
| `ruff format --check .` | 96 files already formatted |
| `mypy .` | Success: no issues in 71 source files |
| `manage.py check --settings=config.settings.test` | No issues |
| `makemigrations --check --dry-run` | No changes detected |
| `spectacular --validate` | Schema generated with 0 warnings and 0 errors |
| `pip-audit -r requirements/base.txt` | No known vulnerabilities found |
| PostgreSQL GIN migration | Authored; SQL is a no-op on SQLite and **not executed against PostgreSQL locally** |
| PostgreSQL full-text search path | **Not run locally** — SQLite fallback exercised |
| Docker Compose stack | **Not run** — Docker daemon unavailable on this host |
| GitHub Actions workflow | **Not executed** — no remote repository yet |

### Phase 3 test inventory

| Area | Tests |
|---|---|
| Phase 2 suite (models, admin, commands, foundation, SEO, learning, contact) | 60 |
| Catalog API (visibility, filtering, ordering, detail, sanitisation, learner state) | 13 |
| Search API (validation, relevance fallback, type filters, demo exclusion, suggestions) | 8 |
| Learning API (auth, verification, bookmark idempotency, progress, timestamps) | 10 |
| Contact API (validation, honeypot, email failure, throttle, query budget) | 6 |
| Catalog/learning query budgets | 2 |
| **Total** | **99** |

## 7. Phase 4 evidence (2026-11-15)

| Check | Result |
|---|---|
| `pytest` (SQLite) | 131 passed; 93.61% application coverage |
| `pytest` (PostgreSQL 17.0) | 131 passed; 93.34% coverage; test database built from migrations |
| `ruff check .` | All checks passed |
| `ruff format --check .` | 102 files already formatted |
| `mypy apps config` | Success: no issues in 74 source files |
| `manage.py check` | No issues |
| `makemigrations --check --dry-run` | No changes detected |
| `spectacular --validate` | 0 warnings, 0 errors |
| PostgreSQL migrations | All 25 migrations applied to local `bds_r1` on PostgreSQL 17.0 |
| PostgreSQL GIN indexes | 7 weighted full-text indexes verified |
| Redis-backed session/throttle tests | **Not run locally** - local Redis 3.0.504 rejects the client `HELLO` handshake; LocMem used |
| Live email delivery | **Not run** - LocMem backend only |
| Docker Compose stack | **Not run** - Docker daemon unavailable on this host |
| GitHub Actions workflow | **Not executed** - no remote repository yet |
| `pip-audit -r requirements/base.txt` | No known vulnerabilities found |

### Phase 4 test inventory

| Area | Tests |
|---|---|
| Phase 3 suite (models, catalog, search, learning, contact) | 99 |
| Auth/account API (CSRF, registration, verification, login/logout, profile, reset, change, deactivate/delete, throttles) | 32 |
| **Total** | **131** |

## 8. Phase 5 evidence (2026-11-15)

| Check | Result |
|---|---|
| `npm test` | 18 passed in 6 files |
| `npm run lint` | Clean |
| `npm run typecheck` | Clean |
| `npm run build` | Next.js 16.4.6 production build succeeded; 20 static pages generated |
| Dev proxy CSRF | `GET /api/v1/auth/csrf/` returned `204`; cookie issued |
| Dev proxy login/me | `POST /auth/login/` returned `200`; `GET /auth/me/` returned the authenticated QA user |
| Session restoration | `/profile` rendered authenticated profile content with a session |
| Logout/revocation | `POST /auth/logout/` returned `204`; `/auth/me/` then returned `authenticated: false` |
| Anonymous profile | `/profile` emitted Next's `NEXT_REDIRECT` to `/login?next=/profile`; server did not render profile content |
| Auth pages | `/login`, `/register`, `/verify-email`, `/forgot-password`, and `/reset-password` returned `200` |
| Contact proxy | CSRF `204`; contact `POST` returned `201` |
| Production `next start` | Booted on port 3001, but rewrites used the build-time port 8000 destination; production proxy parity not claimed |
| Visual review | Headless screenshots generated but not visually reviewed |
| `npm audit` | 7 moderate dev-toolchain vulnerabilities reported; unresolved |
| Playwright/axe/Lighthouse | **Not run**; Phase 6 |
| Live revalidation webhook | **Not run**; route construction only |

### Phase 5 test inventory

| Area | Tests |
|---|---|
| Formatting helpers | 5 |
| API error envelope/field errors | 4 |
| Contact schema | 3 |
| Copy button | 2 |
| Search form debounce/suggestions | 2 |
| Login form submit/validation | 2 |
| **Total** | **18** |

## 9. Phase 6 evidence (2026-11-17)

| Check | Result |
|---|---|
| Backend `pytest` | 133 passed; 93.43% application coverage |
| Backend `ruff check .` | All checks passed |
| Frontend `npm test` | 20 passed in 7 files |
| Frontend `npm run lint` | Clean after ignoring generated Playwright reports |
| Frontend `npm run typecheck` | Clean |
| Frontend `npm run build` | 49 static pages; first attempt hit a transient catalog `503`, retry succeeded |
| Playwright default suite | 17 passed, 1 skipped (performance opt-in) |
| axe WCAG A/AA scans | 9/9 passed |
| Performance opt-in | Warm production lab run passed at LCP 340ms; one cold run measured 22.4s and is treated as host contention, not p75 |
| Live revalidation route | Correct secret `200`; wrong secret `401`; invalid body `400` |
| Live Django sender | Captured `POST /api/revalidate` with the configured secret, tags, and paths |
| CSRF through production proxy | Bookmark `POST` returned `201` with `Origin: http://localhost:3001` |
| Production proxy auth | `/api/v1/auth/me/` returned an authenticated payload |
| Visual review | Screenshots generated but not manually reviewed |
| `npm audit` | 7 moderate dev-toolchain vulnerabilities remain |
| Docker/PostgreSQL 18.7/Redis 8.4.8/GitHub Actions/live email | **Not run**; unchanged environment blockers |

### Phase 6 unit/component inventory

| Area | Tests |
|---|---|
| Phase 5 suite | 18 |
| Chapter learning controls | 2 |
| **Total** | **20** |

### Phase 6 E2E inventory

| Spec | Tests |
|---|---|
| `public.spec.ts` | 3 |
| `auth.spec.ts` | 2 |
| `learner.spec.ts` | 2 |
| `contact.spec.ts` | 1 |
| `accessibility.spec.ts` | 9 |
| `performance.spec.ts` | 1 (opt-in; skipped by default) |
| **Collected** | **18** |

## 10. Phase 7 evidence (2026-11-18)

| Check | Result |
|---|---|
| Backend `pytest` | **162 passed**; **93.28%** application coverage |
| Backend `ruff check .` | All checks passed |
| Backend `ruff format --check .` | 109 files already formatted |
| Backend `mypy .` | Success: no issues in 80 source files |
| `check --deploy` | No issues with production-style environment values |
| `pip-audit -r requirements/prod.txt -s osv` | No known vulnerabilities found |
| Frontend `npm run typecheck` | Clean |
| Frontend `npm run lint` | Clean |
| Frontend `npm test` | 20 passed in 7 files |
| Frontend `npm run build` | 49 static pages; standalone output generated after QA DB migration and backend cache restart |
| Frontend `npm audit --omit=dev` | 0 vulnerabilities |
| Frontend full lockfile audit | 18 dev-toolchain findings (6 moderate, 12 high); fix requires breaking changes |
| Compose model validation | Rendered successfully with a temporary `.env.prod` |
| Shell script syntax | `bash -n` passed for all four `infra/scripts/*.sh` |
| Backup/restore drill | PostgreSQL 17 custom dump restored into a clean database; 20 chapters, 5 tutorials, 4 categories, known title verified |
| Secret scan | Only placeholder values in `.env.example` and `.env.prod.example` |
| Content counts | 20 published chapters, 5 tutorials, 4 categories, 20 with content, 0 demo |
| AC-30 media validation | 27 backend tests for upload type/extension/magic bytes/size, alt text and decorative rules, strict YouTube/Vimeo parsing, API output, and admin inlines |
| Health/readiness | `/api/v1/health/` and `/api/v1/ready/` returned `200` on QA settings |
| Docker/Compose runtime | **Not run** - Docker daemon unavailable |
| Nginx/TLS runtime | **Not run** - no Nginx binary or Docker daemon |
| PostgreSQL 18.7 / Redis 8.4.8 | **Not run** - local PostgreSQL 17 and Redis 3.0.504 |
| GitHub Actions | **Not executed** - no remote repository |
| Live email | **Not run** - LocMem/console only |
| p75 LCP | **Not run** - warm lab 340ms is not p75 evidence |
| Manual accessibility/visual review | **Not run** - automated axe 9/9 only |

### Phase 7 test inventory

| Area | Tests |
|---|---|
| Backend suite (including JSON logging and AC-30 media validation) | 162 |
| Frontend Vitest suite | 20 |
| Playwright default suite (Phase 6; not rerun in Phase 7) | 17 passed, 1 opt-in skipped |
| axe scans (Phase 6; not rerun in Phase 7) | 9 |

## 11. Gaps and next layers

- Phase 5 delivered component tests and API-client coverage; Phase 6 added learner component tests, Playwright R1 flows, and axe scans.
- Phase 7 added production configuration checks, a local PostgreSQL restore drill, dependency/secret audits, AC-30 media validation, and the R1 gate. The gate is **not passed**: AC-21 (p75 LCP) and AC-25 (CI) remain unsatisfied; seven criteria are partial.
- p75 mobile LCP and real-device performance remain unmeasured; only a warm lab run is recorded.
- Manual keyboard, screen-reader, and visual review remain open despite passing automated axe scans.
- `npm audit` findings and the offline `next/font/google` build dependency remain open.
- PostgreSQL migrations, constraints, GIN indexes, and the full-text path passed on local PostgreSQL 17.0; PostgreSQL 18.7 and Redis-backed sessions/throttles still must be exercised in CI/Compose before the R1 gate.
- Search relevance has a deterministic SQLite fallback test set but no measured relevance benchmark against PostgreSQL yet.
- Cache-invalidation signal branches remain partially covered; later API/E2E phases should exercise slug changes, unpublish, and delete paths.
- Email-provider delivery, timeout, bounce, and inbox-rendering behaviour remain unverified; only LocMem call/failure paths are covered.
- Session revocation and throttle counters under Redis/multi-process deployment remain unverified locally.
