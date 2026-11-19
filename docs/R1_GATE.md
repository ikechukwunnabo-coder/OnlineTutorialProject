# R1 Release Gate - Ben Digital Solution

**Gate date:** 2026-11-18
**Update:** 2026-11-19 — the semantic UI/UX redesign was verified locally with typecheck, lint, Vitest, and a production build; no criterion status changed.
**Status:** **NOT PASSED**
**Reason:** Production deployment was not executed; AC-21 remains unsatisfied; seven criteria remain partial. AC-30 is implemented and AC-25 passed on GitHub Actions.

This is the Phase 7 evidence table. It records what was actually run in this workspace. It does not claim production readiness from configuration files alone.

## 1. Evidence environment

| Item | Value |
|---|---|
| Host | Windows, local workspace |
| Backend tests | Python 3.14.8, SQLite + LocMem cache; current local suite includes console CRUD tests |
| Database drill | Local PostgreSQL 17.0, scratch databases `bds_r1_phase7` and `bds_r1_phase7_restore` |
| Frontend checks | Node 26.13.1 via `fnm`, Next.js 16.4.6; latest local checks include the semantic UI/UX redesign |
| Production frontend build | `next build` with console routes and the redesigned public/learner/console UI included; earlier standalone build used `API_INTERNAL_URL=http://127.0.0.1:8010/api/v1` |
| Docker | CLI present; daemon unavailable; Compose stack not started |
| PostgreSQL 18.7 / Redis 8.4.8 | Not available locally |
| GitHub Actions | Executed: run `44268233115` on commit `bf20bd9`; backend, frontend, and secret-scan jobs passed. This predates the console follow-up and the UI/UX redesign, which are verified locally only. |
| Live email | Not executed; LocMem/console only |
| Git | R1 implementation and console follow-up are committed and pushed to `origin/main`; the UI/UX redesign is included in the commit that updates these records |

## 2. Phase 7 checks

| Check | Result | Evidence |
|---|---|---|
| Compose model validation | PASS | `docker compose --env-file .env.prod -f infra/compose/compose.prod.yaml config` rendered successfully with a temporary `.env.prod` |
| Production Compose runtime | NOT RUN | Docker daemon unavailable |
| Docker Desktop startup attempt | FAIL | VM guest-service sockets never appeared; `docker info` timed out; processes stopped |
| Nginx runtime/TLS | NOT RUN | Nginx binary and Docker daemon unavailable; template not syntax-tested by Nginx |
| Shell script syntax | PASS | `bash -n` passed for `backup.sh`, `restore.sh`, `smoke-test.sh`, and `deploy.sh` |
| Backend test suite | PASS | **176 passed**; **93.37%** application coverage; 85% threshold reached |
| Backend Ruff lint | PASS | All checks passed |
| Backend Ruff formatting | PASS | 111 files already formatted |
| Backend mypy | PASS | No issues in 80 source files |
| `check --deploy` | PASS | No issues with production settings and a 50+ character check-only key |
| Backend dependency audit | PASS | `pip-audit -r requirements/prod.txt -s osv` reported no known vulnerabilities |
| Frontend typecheck | PASS | `tsc --noEmit` clean |
| Frontend lint | PASS | `eslint .` clean |
| Frontend unit/component tests | PASS | **26 passed in 8 files** |
| UI/UX redesign static checks | PASS | After the redesign, `tsc --noEmit` and `eslint .` were clean; Vitest passed 26 tests in 8 files with `--pool=threads` after the configured fork pool repeatedly timed out on this Windows host; no tested label or `next` href changed |
| Frontend production build | PASS | Build passed with console routes and the redesigned UI included; 20 static pages generated in the latest run; earlier standalone output at `.next/standalone/server.js` |
| Frontend production dependency audit | PASS | `npm audit --omit=dev` found 0 vulnerabilities |
| Frontend full audit | PARTIAL | `npm audit --package-lock-only` reports **18 vulnerabilities (6 moderate, 12 high)** in dev tooling; fixing requires breaking changes |
| Secret scan | PASS (repo) | Pattern scan found only placeholder values in `.env.example` and `.env.prod.example`; images were not built |
| Health/readiness | PASS | `/api/v1/health/` returned `200 {"status":"ok"}`; `/api/v1/ready/` returned `200 {"status":"ready","checks":{"database":"ok","redis":"ok"}}` on QA settings |
| Editorial console smoke | PASS | Admin session: overview and all three content list endpoints `200`; unauth content list `401`; `/console/content` and `/console/content/categories/new` `200`; unauth `/console/content` returned the client-side login redirect shell |
| Backup/restore drill | PASS (PostgreSQL 17) | 85,299-byte custom dump; restored into clean `bds_r1_phase7_restore`; verified 20 chapters, 5 tutorials, 4 categories, and known title `Demo: What HTML Does` |
| Content counts | PASS | QA SQLite audit: 20 published chapters, 5 tutorials, 4 categories, 20 with content, 0 demo |
| Media validation (AC-30) | PASS | 27 backend tests cover upload extension/content-type/magic-byte/size checks, alt-text/decorative rules, strict YouTube/Vimeo URL parsing, API output, and admin inlines; Nginx `frame-src` allowlists only `www.youtube.com` and `player.vimeo.com` |
| Content checklist | NOT RUN | Manual editorial checklist not completed |
| Live email delivery | NOT RUN | No provider configured |
| GitHub Actions | PASS | Run `44268233115` completed all three jobs; Secret scan, Backend lint/types/tests (PostgreSQL 18.7 + Redis 8.4.8), and Frontend checks passed |
| p75 mobile LCP | NOT RUN | Only a warm lab run at 340ms and a cold outlier at 22.4s |
| Manual keyboard/screen-reader/visual review | NOT RUN | Automated axe 9/9 passed; manual review remains open |

## 3. R1 acceptance criteria

| ID | Status | Evidence / gap |
|---|---|---|
| AC-01 | PASS | Playwright public flow verified initial HTML for home, tutorial, and chapter pages |
| AC-02 | PASS | API and Playwright tests cover published-only visibility and draft 404s |
| AC-03 | PASS | Category API/Playwright coverage |
| AC-04 | PASS | Tutorial/chapter detail, TOC, and previous/next coverage |
| AC-05 | PASS | Code highlighting/copy component and Playwright coverage |
| AC-06 | PASS | Markdown sanitisation/XSS backend tests |
| AC-07 | PASS | Search API tests and Playwright search flow |
| AC-08 | PASS | Registration, verification, and verified-only action tests |
| AC-09 | PASS | Session cookie, logout, restoration, and multi-tab checks |
| AC-10 | PASS | Generic reset response, single-use/expiry, and session revocation tests |
| AC-11 | PASS | Profile API and accessible form tests |
| AC-12 | PASS | Deactivate/delete API tests and documented policy |
| AC-13 | PASS | Bookmark API and database uniqueness tests |
| AC-14 | PASS | Progress API and Playwright learner flow |
| AC-15 | PARTIAL | Metadata/canonical/JSON-LD implemented; no dedicated automated metadata test recorded for every public page |
| AC-16 | PARTIAL | Auth/search `noindex` and sitemap exclusion verified in Phase 5; full robots/sitemap rule set lacks a recorded automated test |
| AC-17 | PASS | Slug redirect and canonical backend tests |
| AC-18 | PASS | Contact validation, throttle, storage, email, and header-injection tests |
| AC-19 | PASS | About/Privacy/Terms/404/error Playwright coverage |
| AC-20 | PARTIAL | axe WCAG A/AA 9/9 passed before the UI redesign; semantic tokens, dark mode, labelled forms, visible focus, accessible mobile menu, and inline delete confirmation were added, but axe and manual keyboard/screen-reader/visual review have not been rerun on the redesigned UI |
| AC-21 | **FAIL** | p75 mobile LCP not measured; warm 340ms is not p75 evidence |
| AC-22 | PASS | `check --deploy` clean; production dependency audits clean; dev-toolchain findings documented |
| AC-23 | PASS | Health/readiness checks passed; email failure logging tested |
| AC-24 | PARTIAL | Restore drill passed on PostgreSQL 17; PostgreSQL 18.7 production restore not executed |
| AC-25 | PASS | GitHub Actions run `44268233115` passed on commit `bf20bd9`; backend matrix used PostgreSQL 18.7 and Redis 8.4.8, frontend built successfully, and gitleaks passed. Console follow-up was verified locally after this run. |
| AC-26 | PARTIAL | Counts pass (20/5/4/20); manual content checklist not completed |
| AC-27 | PARTIAL | Repository secret scan clean; production images were not built or scanned |
| AC-28 | PASS | Django admin and console CRUD permission tests cover create/edit/publish/unpublish/archive/delete boundaries, publication rules, and audit-log entries |
| AC-29 | PASS | Seed idempotency and demo-exclusion tests |
| AC-30 | PASS | Admin-only `ChapterImage` validates JPEG/PNG/WebP extension, content type, magic bytes, and 2 MB size, with required alt text or explicit decorative flag; `VideoEmbed` stores only parsed YouTube/Vimeo IDs and renders controlled `embed_url` values; arbitrary iframe HTML remains stripped |
| AC-31 | PARTIAL | Backend Sentry is env-gated and JSON logging exists; frontend Sentry is not wired and log inspection is not exhaustive |
| AC-32 | PASS | ADR/model review confirms locale prefixes remain possible without destructive migration |

**Summary:** 24 PASS, 7 PARTIAL, 1 FAIL. R1 cannot be marked passed while AC-21 fails and production deployment evidence is unexecuted.

## 4. Blocking items

1. **Production environment evidence:** build and run the Compose stack on a Linux host; verify PostgreSQL 18.7, Redis 8.4.8, Nginx TLS, health checks, security headers, memory use, and `/console` role routing.
2. **AC-21:** measure p75 mobile LCP on chapter pages with documented device/network conditions.
3. **Manual accessibility/visual QA:** keyboard, screen-reader, contrast, and screenshot review across the redesigned public, learner, and console surfaces; rerun axe after the UI changes.
4. **Live email:** verify registration, verification, reset, and contact delivery with the chosen provider.
5. **AC-24 production parity:** repeat the restore drill against PostgreSQL 18.7 and the production media volume.
6. **AC-31:** wire frontend error tracking or explicitly accept backend-only observability.
7. **Dev dependency findings:** accept the 18 dev-toolchain advisories or upgrade the affected toolchain (the suggested fix is breaking).
8. **CI follow-up:** GitHub Actions passes but emits Node 20 deprecation and `ubuntu-latest` migration warnings; upgrade action versions/pin runner versions when convenient.

## 5. What would change the gate to PASS

- AC-21 resolved with recorded p75 mobile LCP evidence.
- The seven PARTIAL criteria either completed or explicitly accepted with owner sign-off.
- Production Compose, Nginx/TLS, PostgreSQL 18.7, and Redis 8.4.8 executed successfully.
- Live email measured and verified.
- Manual accessibility/visual review completed.

## 6. Owner decision requested

Phase 7 is stopped at the gate. The next action requires an owner decision:

- **revise:** supply the missing production environment access, AC-21 evidence, or acceptance of specific partial criteria.
- **next:** proceed to R2 only if the owner explicitly accepts the R1 gate exceptions; otherwise R1 remains blocked.
- **status:** request a current evidence summary.

No production deployment has been claimed. The R1 implementation, console follow-up, and UI redesign are committed and pushed with this gate update; the latest CI rerun remains pending.
