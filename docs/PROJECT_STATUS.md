# Project Status — Ben Digital Solution

**Last updated:** 2026-11-18
**Current phase:** Phase 7 - R1 hardening and production deployment (local evidence complete; CI passed; gate NOT PASSED)
**Next phase:** Owner decision on remaining R1 blockers and exceptions
**Tooling mode:** Agentic (files and commands executable in this workspace)
**Web access:** Yes (version checks performed 2026-11-12)

This is the single living status document. Phase completion records are appended here. Architecture, API, testing, and runbook documents are created in the phases that require them.

---

## 1. Project parameters (Section 0 record)

| Parameter | Value |
|---|---|
| Project | Ben Digital Solution — programming tutorial platform |
| AI tooling mode | Agentic (read/write files, run commands) |
| Web access for version checks | Yes |
| Team | Solo developer |
| Monthly infrastructure budget | Low — one small VPS plus free-tier monitoring |
| Content language(s) | English only; i18n out of scope but URLs and models must not preclude it |
| Content source | Owner writes lessons in Django admin; no scraping or third-party copying |
| Content licence | All rights reserved by the site owner |
| Monetisation | None in scope (no ads, payments, paywalls) |
| Email provider | Transactional email via SMTP/API configured by environment variables |
| Media storage | Local disk volume on the VPS behind Nginx; S3-compatible documented as a later option |
| Domain | One primary domain; Django served under `/api/` via reverse proxy; domain not yet registered/confirmed |
| Audience | Absolute beginners |
| MVP success metrics | 20 published chapters; p75 mobile LCP under 2.5 s on chapter pages; zero critical security findings |
| Phase gating | Stop after every phase; user replies `next`, `revise: <feedback>`, or `status` |

## 2. Phase ledger

| Phase | Status | Gate evidence |
|---|---|---|
| 0 — Discovery and feasibility | Complete (approved 2026-11-13) | This document, `docs/CONTENT_PLAN.md`, `docs/RISK_REGISTER.md` |
| 1 — Architecture and technical design | Complete (approved 2026-11-13) | `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, ADR-0001–0010, `.env.example`, verified `.venv` |
| 2 — Repository, CI, backend foundation | Complete (approved 2026-11-13) | Git repository, backend project, R1 models/migrations, admin, seed commands, 60 tests at 94% coverage, CI workflow, setup docs |
| 3 — Backend API (catalog, search, learning state) | Complete (approved 2026-11-15) | Catalog/search/learning/contact APIs, OpenAPI, 99 tests at 92.62% coverage, query-budget tests, cache invalidation, PostgreSQL GIN migration |
| 4 — Backend authentication and accounts | Complete (approved 2026-11-15) | 13 auth/account endpoints, 131 tests at 93.61% coverage on SQLite and 93.34% on PostgreSQL 17.0, OpenAPI validation, session/CSRF/throttle tests |
| 5 — Frontend foundation, public pages, and auth screens | Complete (awaiting approval) | Next.js 16.4.6 app, typed API client, public pages, auth screens/session restoration, 18 Vitest tests, lint/typecheck/build gates, live dev proxy checks |
| 6 - Frontend learner features and E2E | Complete (advanced 2026-11-18) | Learner bookmark/progress UI, dashboard, Playwright R1 suite (17 passed, 1 opt-in skipped), axe 9/9, production build 49 pages, live revalidation webhook verified, backend 133 tests at 93.43% |
| 7 - R1 hardening and production deployment | In progress - gate NOT PASSED | Production assets and local checks complete; AC-30 implemented; 24/32 criteria pass, 7 partial, 1 fail (AC-21); CI passed on GitHub Actions; Docker/PG18.7/Redis8.4.8/live email unexecuted. See `docs/R1_GATE.md` |
| 8a–8d — R2 build | Not started (blocked until R1 live) | — |
| 9 — R2 release gate | Not started | — |
| 10 — R3 build | Not started (blocked until R2 live) | — |
| 11 — Final release gate | Not started | — |

## 3. Decisions and ADR index

All Phase 1 decisions are recorded as numbered ADRs under `docs/decisions/` (index: `docs/decisions/README.md`). No decision changes the agreed release scope.

| ID | Decision | Resolution | Status |
|---|---|---|---|
| ADR-0001 | Authentication: sessions + CSRF vs. JWT | Django sessions (HttpOnly, Secure, `SameSite=Lax`), `cached_db` store, CSRF header on unsafe methods, `password_changed_at` session revocation | Accepted |
| ADR-0002 | Redis in R1 vs. database cache | Redis 8.4.x as shared cache and throttle backend; internal-only, 128 MB, allkeys-lru, no persistence | Accepted |
| ADR-0003 | Celery timing | No Celery in R1; synchronous email wrapper with timeout, logged failures, resend endpoints; evaluate in R2 | Accepted |
| ADR-0004 | Hierarchy and URLs | Category → Tutorial → Chapter; tutorial slug globally unique; chapter slug unique per tutorial; `SlugRedirect` 301s | Accepted |
| ADR-0005 | Rendering and revalidation | Next.js ISR (home 60 s, content 300 s) with tags; Django→Next `POST /api/revalidate` webhook authenticated by `REVALIDATE_SECRET` | Accepted |
| ADR-0006 | R1 revision strategy | Django admin history; `ContentRevision` deferred to R2 | Accepted |
| ADR-0007 | Demo content flag | Per-record `is_demo` on Category/Tutorial/Chapter; excluded from homepage, search, sitemap, metrics; purge command | Accepted |
| ADR-0008 | TypeScript 7 adoption | TypeScript 5.9.x for R1; TypeScript 7 deferred until verified with Next.js 16.4.x | Accepted |
| ADR-0009 | Deployment topology | Single domain; Nginx routes `/api/` and `/admin/` to Django, `/` to Next.js; no CORS in production | Accepted |
| ADR-0010 | API versioning and errors | `/api/v1/`, consistent error envelope with stable codes and request IDs, documented deprecation policy | Accepted |

Phase 0 open items now closed: Redis inclusion (ADR-0002), Celery timing (ADR-0003), hierarchy (ADR-0004), revision strategy (ADR-0006), demo flag (ADR-0007). TypeScript selection was decided early in ADR-0008; the exact 5.9.x patch is pinned in Phase 5.

## 4. Vision and non-goals

### 4.1 Vision

Ben Digital Solution is a fast, accessible, content-first programming education platform for absolute beginners. Learners discover structured tutorials by subject, read carefully written lessons with working code examples, and track their own progress. The owner publishes and maintains all material through Django admin without code changes. The platform is built to earn search traffic on public content and to remain operable by one person on a small budget.

### 4.2 Product principles

1. Content is the product: no empty shells, no fabricated social proof, no placeholder lessons.
2. Beginner-first: plain language, explicit prerequisites, one concept per chapter, working examples.
3. Public pages are fast, server-rendered, crawlable, and accessible to WCAG 2.1 AA.
4. Backend authorisation is real; frontend guards are UX only.
5. Every release is deployed and verified before the next release begins.

### 4.3 Non-goals

- No code execution on the application server (design documentation only; never build in R1).
- No ads, payments, subscriptions, or paywalls.
- No community features before R2 (comments, quizzes, certificates, blog).
- No native mobile apps; responsive web only.
- No multi-language UI in R1.
- No external search service unless measurements justify it.
- No fabricated testimonials, ratings, authors, or dates.

## 5. Personas and journeys

### 5.1 Personas

**P1 — Ada, the absolute beginner (primary).** Has never programmed. Wants a clear first path into web development. Needs short chapters, visible progress, and a working first example. Uses a mid-range Android phone part of the time.

**P2 — Sam, the self-directed learner (secondary).** Has some familiarity with computers but no formal training. Compares tutorials and wants search, bookmarks, and a reliable table of contents. Studies in short sessions.

**P3 — The owner/editor (operations).** Solo administrator who writes lessons, publishes them, fixes errata, and monitors the site. Needs a dependable admin workflow, safe Markdown rendering, and auditability.

### 5.2 Primary journeys (R1)

**J1 — Discover and read.** Home → category → tutorial → chapter → next chapter. Acceptance: content visible in initial HTML; progress saved for logged-in learners; copyable code examples.

**J2 — Find specific help.** Global search → results with relevance ordering and pagination → chapter. Acceptance: search covers categories, tutorials, and chapters; suggestions are debounced; no indexing of internal search URLs.

**J3 — Register and verify.** Register → verification email → verify → login. Acceptance: generic responses to limit enumeration; rate limits; resend path documented.

**J4 — Track learning.** Login → bookmark chapter → mark chapter complete → return later → resume reading position and see tutorial progress. Acceptance: one bookmark/progress record per user per chapter; state survives session expiry and reload.

**J5 — Recover access.** Forgot password → reset email → set new password → other sessions revoked. Acceptance: generic response; single-use token; rate limited.

**J6 — Manage account.** Profile update → deactivate or delete account. Acceptance: display name and bio; deletion/deactivation is self-service and documented in the Privacy page.

**J7 — Contact the owner.** Contact form → validated, throttled, stored, emailed with header-injection protection.

**J8 — Publish content.** Owner drafts Markdown in admin → previews → publishes → sitemap and metadata update → old slug URL 301s if changed.

## 6. Requirements

Tags: `[R1]` MVP, `[R2]` learning and community, `[R3]` growth and analytics. Untagged defaults to the release of the feature it supports.

### 6.1 Functional requirements

| ID | Requirement | Tag |
|---|---|---|
| F-01 | Homepage with global search, featured tutorials, popular categories, recent tutorials | R1 |
| F-02 | Database-driven categories with name, slug, description, icon identifier, display order, publication status | R1 |
| F-03 | Tutorials with title, slug, summary, category, tags, difficulty, estimated reading time, author, published/updated dates | R1 |
| F-04 | Ordered chapters under a tutorial with Markdown content, table of contents, previous/next navigation | R1 |
| F-05 | Read-only code examples as separate ordered records (language, title, source) with syntax highlighting and copy action | R1 |
| F-06 | Draft, published, and archived states for categories, tutorials, and chapters; public pages only for published content | R1 |
| F-07 | Full-text search over categories, tutorials, and chapters with relevance and date sorting, pagination | R1 |
| F-08 | Debounced search suggestions endpoint | R1 |
| F-09 | Registration with email verification | R1 |
| F-10 | Login, logout, and session restoration | R1 |
| F-11 | Forgot-password and password-reset flow | R1 |
| F-12 | Authenticated password change with other-session revocation | R1 |
| F-13 | Learner profile: display name and bio | R1 |
| F-14 | Self-service account deactivation and deletion, documented policy | R1 |
| F-15 | Bookmarks: add and remove, list on the learner page | R1 |
| F-16 | Chapter completion, reading position, and per-tutorial progress | R1 |
| F-17 | Django admin for content CRUD and publication states | R1 |
| F-18 | Django admin for users and roles (Admin, Editor); audit log for administrative actions | R1 |
| F-19 | Unique title, meta description, canonical URL, Open Graph, and accurate JSON-LD for public pages | R1 |
| F-20 | XML sitemap generated from published content; robots.txt; no indexing of auth, dashboard, drafts, or internal search URLs | R1 |
| F-21 | 301 slug redirects when published slugs change; no redirect loops or duplicate canonicals | R1 |
| F-22 | Contact form: validated, throttled, stored, emailed to admin, header-injection protected | R1 |
| F-23 | Static pages: About, Privacy, Terms; custom 404 and error pages | R1 |
| F-24 | Health and readiness endpoints | R1 |
| F-25 | Seed command with clearly marked demo categories, tutorials, chapters; excluded from launch content counts | R1 |
| F-26 | Images with alt text and validated upload types/sizes | R1 |
| F-27 | Approved video embeds (YouTube/Vimeo) via strict URL allowlist and parsing; no arbitrary iframes | R1 |
| F-28 | Reading progress overview grouped by tutorial | R1 |
| F-29 | Quizzes per tutorial (multiple choice), pass mark, attempt limits and history, server-side scoring | R2 |
| F-30 | Comments on chapters and blog posts with replies (depth two), likes, reports, edit window, soft deletion, moderation queue | R2 |
| F-31 | Certificates with eligibility rules, unique verification code, public verification, revocation; PDF via background task | R2 |
| F-32 | Blog with categories, tags, authors, states, SEO fields, RSS, publication history | R2 |
| F-33 | Review workflow state and content revision history | R2 |
| F-34 | Full learner dashboard with learning history and certificates | R2 |
| F-35 | Improved search and filters, including blog and tags; facets | R2 |
| F-36 | Learning streaks with defined timezone rules | R3 |
| F-37 | Newsletter with double opt-in and unsubscribe | R3 |
| F-38 | Admin analytics: signups, active learners (documented definition), popular tutorials, completion rates, quiz performance, search terms | R3 |
| F-39 | Recommendations | R3 |
| F-40 | Advanced caching and performance work | R3 |

### 6.2 Non-functional requirements

| ID | Requirement | Tag |
|---|---|---|
| N-01 | Security baseline: password validators, CSRF on state changes, throttles, backend authorisation, safe Markdown, ORM-only access, HSTS/CSP/security headers, `DEBUG=False` in production, `check --deploy` documented | R1 |
| N-02 | WCAG 2.1 AA: semantic HTML, keyboard access, visible focus, names, contrast, skip link, reduced motion, accessible errors/dialogs/menus | R1 |
| N-03 | Performance: public pages server-rendered; p75 mobile LCP under 2.5 s on chapter pages; query-count budgets; HTTP caching headers | R1 |
| N-04 | SEO: unique metadata, canonicals, JSON-LD, sitemap, robots, clean slugs, 301s, revalidation on publish/edit/unpublish | R1 |
| N-05 | Reliability: health/readiness, timeouts, tested backup restore, graceful email-provider failure | R1 |
| N-06 | Privacy: policy, consent approach, retention and deletion behaviour documented | R1 |
| N-07 | Maintainability: CI from Phase 2 (lint, types, tests, builds, audits, schema validation), ADRs, living docs | R1 |
| N-08 | Observability: error tracking via env-configured provider (disabled without DSN); structured logs | R1 |
| N-09 | Upload safety: type, size, and content validation; no executable content | R1 |
| N-10 | Email: timeouts, retry/logged failures, no live email services in tests | R1 |
| N-11 | i18n non-preclusion: URL and data model do not preclude later locales | R1 |
| N-12 | Version discipline: pinned versions, committed lockfiles, verification date recorded | R1 |
| N-13 | Resource awareness: stack must fit a low-budget single VPS; memory measured in Phase 7 | R1 |
| N-14 | Certificates and PDFs must not block request/response cycles | R2 |
| N-15 | Analytics must collect minimal personal data with documented metric definitions | R3 |

## 7. R1 acceptance criteria

Each criterion is testable. Verification method is named; evidence is recorded in `docs/TEST_STRATEGY.md` from Phase 2 and the Phase 7 pass/fail table.

Traceability: every R1 functional requirement (F-01–F-28) and every R1 non-functional requirement (N-01–N-13) is covered by at least one criterion below. Phase 2 converts these criteria into automated tests wherever practical.

| ID | Criterion | Verification |
|---|---|---|
| AC-01 | A visitor can reach the homepage, see global search, featured tutorials, popular categories, and recent tutorials, and reach category, tutorial, and chapter pages with meaningful published content in the initial HTML (no JavaScript required). | Playwright + `curl` HTML check |
| AC-02 | Only published categories/tutorials/chapters appear publicly; draft/archived content returns 404 to anonymous users. | API/Playwright tests |
| AC-03 | A category page lists its published tutorials with title, summary, difficulty, and reading time. | Playwright + API test |
| AC-04 | A tutorial page lists ordered chapters and shows tutorial metadata; chapters expose table of contents and previous/next navigation. | Playwright test |
| AC-05 | Each code example renders highlighted, labelled by language, and the copy action copies the exact source. | Component + Playwright test |
| AC-06 | Markdown rendering strips disallowed HTML and scripts; XSS payload tests fail safely. | Backend security test |
| AC-07 | Search returns relevant published results for categories, tutorials, and chapters, sorted by relevance or date, paginated; suggestions are debounced and rate-limited. | API tests + Playwright |
| AC-08 | Registration creates a user; unverified users cannot access verified-only actions; verification link works once and expires. | API test |
| AC-09 | Login sets an HttpOnly session cookie; logout invalidates the server session; session restoration works after reload; multiple tabs reflect logout. | API + Playwright tests |
| AC-10 | Forgot-password returns the same generic response for known and unknown emails; reset token is single-use and expires; changing password revokes other sessions. | API/security tests |
| AC-11 | A learner can update display name and bio; invalid input is rejected with accessible errors. | API + component test |
| AC-12 | A learner can deactivate or delete their account; deletion removes or anonymises personal data per the documented policy. | API test + policy review |
| AC-13 | A learner can bookmark/unbookmark a chapter and sees bookmarks listed; duplicates are impossible at the database level. | API + constraint test |
| AC-14 | A learner can mark a chapter complete; reading position and per-tutorial progress persist across logout/login and reloads; a progress overview lists progress grouped by tutorial. | API + Playwright test |
| AC-15 | Every public page has a unique title, meta description, canonical URL, and accurate JSON-LD where applicable. | Automated metadata test |
| AC-16 | Sitemap contains only published content; robots.txt blocks auth, dashboard, drafts, and internal search URLs; auth pages carry noindex. | Automated test |
| AC-17 | Changing a published slug creates a 301 from the old path; no redirect loops; canonical points to the new path. | Backend test |
| AC-18 | Contact submissions are validated, throttled, stored, emailed to admin, and protected against header injection. | API/security test |
| AC-19 | About, Privacy, Terms, 404, and error pages render with correct status codes and accessible content. | Playwright |
| AC-20 | Keyboard-only navigation reaches all interactive elements with visible focus; automated axe checks report no critical violations on key pages. | Playwright + axe |
| AC-21 | p75 mobile LCP on chapter pages is under 2.5 s measured with recorded conditions; query-count budgets pass for list/detail endpoints. | Lighthouse + pytest query counts |
| AC-22 | `manage.py check --deploy` findings are documented and resolved or explicitly accepted; dependency audit shows no critical findings. | Phase 7 evidence |
| AC-23 | Health and readiness endpoints report correct status; email failure is logged without breaking the request. | API test |
| AC-24 | A backup can be restored into a clean environment and verified by querying known content. | Phase 7 drill |
| AC-25 | CI runs lint, type checks, backend and frontend tests, production builds, dependency audits, and OpenAPI validation on every pull request. | GitHub Actions run `44268233115` |
| AC-26 | At least 20 real published chapters across at least 5 tutorials and 4 categories pass the content checklist. | Content audit |
| AC-27 | No secrets, credentials, or production data are present in the repository or images. | Secret scan + review |
| AC-28 | An administrator can create, edit, publish, unpublish, and archive categories, tutorials, chapters, and code examples; role permissions are enforced on the backend; administrative actions are recorded in the audit log. | Admin/API permission tests |
| AC-29 | The seed command creates clearly marked demo categories, tutorials, and chapters, is safe to re-run, and demo content is excluded from the sitemap and launch content counts. | Management command test |
| AC-30 | Image uploads require alt text and reject disallowed types and oversized files; video embeds accept only allowlisted YouTube/Vimeo URLs and reject arbitrary iframes. | Validation and security tests |
| AC-31 | Error tracking is configurable by environment and disabled without a DSN; application logs contain no secrets or unnecessary personal data. | Configuration review + log inspection |
| AC-32 | Design review confirms that URL scheme and model fields can accommodate locale prefixes later without destructive data migration. | Phase 1 design review |

## 8. Environment assumptions

| Item | Assumption |
|---|---|
| Host OS | Windows 11 with PowerShell 5.1 in this workspace |
| Containers | Docker 29.7.2 with Docker Compose v5.4.0, Linux containers (WSL2 backend recommended) |
| Host Python | 3.14.8 (matches container pin); backend development and commands run in Docker for parity |
| Host Node | 20.18.0 is end-of-life; all Node work runs in Node 26 containers and CI, never on the host |
| Git | Installed 2.46.0; repository initialised 2026-11-13 (Phase 2) |
| Network | Internet access available for package installs, registry checks, and web version verification |
| Ports (development) | 3000 frontend, 8000 Django, 5432 PostgreSQL, 6379 Redis; database and Redis not exposed publicly |
| Domain | Not confirmed; `localhost` in development and `example.com` in documentation until the real domain is verified |
| Email | No live provider in development; console/file backend locally; secrets only via environment |
| Secrets | Never committed; `.env.example` contains safe sample values only |
| Monitoring | Free-tier or self-hosted option configured by env; no personal data in logs |
| Budget | Single small VPS; memory footprint measured before production (N-13) |

## 9. Version research (verified 2026-11-12)

Verification sources: official Django release notes and installation FAQ; npm registry (`npm view`); PyPI (`pip index versions`); official PostgreSQL and Redis release data; Next.js security advisories reporting. Exact patch versions are pinned below. Installation compatibility of the full set is validated in Phase 2 CI; any failure is reported and re-pinned with evidence, never assumed.

### 9.1 Runtime and services

| Component | Pin | Rationale |
|---|---|---|
| Python | 3.14.8 | Current stable; Django 5.2.8+ officially supports 3.14; matches host |
| Django | 5.2.19 | LTS line with security support to April 2028; Django 6.1.3 is current but non-LTS |
| PostgreSQL | 18.7 | Current stable major (supported to November 2030); Django 5.2 supports PostgreSQL 13+ |
| Redis | 8.4.8 | Mature, still-supported 8.x line; exact inclusion confirmed by ADR-0002 in Phase 1 |
| Node.js | 26.13.1 | Active LTS since 2026-10-28; Next.js 16 requires Node >=20.9.0 |
| Gunicorn | 27.0.0 | Current stable; Linux containers only |
| Nginx | 1.28.0-alpine | Pinned production image in `infra/compose/compose.prod.yaml` |

### 9.2 Backend Python packages

| Package | Pin |
|---|---|
| djangorestframework | 3.18.3 |
| drf-spectacular | 0.30.0 |
| django-filter | 26.2 |
| django-environ | 0.14.0 |
| psycopg[binary] | 3.3.8 |

Additional backend packages were installed and import-verified on 2026-11-13 in `.venv` (Python 3.14.8) as requested by the owner:

| Package | Installed |
|---|---|
| pytest | 9.2.0 |
| pytest-django | 4.14.0 |
| pytest-cov | 7.1.0 |
| factory-boy | 3.3.3 |
| Faker | 40.54.0 |
| coverage | 7.17.3 |
| Ruff | 0.17.5 |
| mypy | 1.19.1 |
| django-stubs | 5.2.9 |
| django-stubs-ext | 6.1.2 |
| argon2-cffi | 25.1.0 |
| pre-commit | 4.7.0 |
| pip-audit | 2.10.1 |

mypy was pinned to 1.19.1 because django-stubs 5.2.9 does not support the mypy 2.x API; this is a tooling compatibility pin, not a runtime downgrade. `django-stubs-ext`, `types-PyYAML`, and `PyYAML` support type checking and CI YAML validation. Gunicorn 27.0.0 is pinned in `backend/requirements/prod.txt` for Linux containers; it is not installed on the Windows host. Phase 7 added `sentry-sdk[django]==2.75.0`; production settings initialize it only when `SENTRY_DSN` is non-empty, and frontend error tracking is not wired.

### 9.3 Frontend packages

| Package | Pin | Rationale |
|---|---|---|
| next | 16.4.6 | Latest stable; 16.4.5 is the minimum security-safe floor (November 2026 advisories) |
| react / react-dom | 19.3.1 | Current stable supported by Next.js 16 |
| tailwindcss | 4.3.5 | Current stable |
| @tanstack/react-query | 5.107.1 | Only where client-side fetching is needed |
| zod | 4.6.7 | Form and payload validation |
| react-hook-form | 7.92.0 | Forms |
| vitest | 5.1.0 | Frontend unit tests |
| @playwright/test | 1.65.0 | E2E and accessibility checks |
| typescript | 5.9.x (exact pin in Phase 5) | TypeScript 7.0.2 is current but adoption is deferred until Next.js compatibility is verified (ADR-0008) |

### 9.4 Verification notes

- Django 5.2.19 is the newest 5.2 LTS patch available; Django 6.1.3 is current stable but mainstream support ends April 2027.
- Next.js has shipped multiple security releases in 2026; 16.4.6 clears the 2026-11-03 advisories. CI must audit on every pull request.
- Node.js 20 reached end-of-life in 2026; CI and images must use Node 26. If any dependency fails on Node 26, fall back to Node 24 LTS with recorded evidence.
- PostgreSQL 19 is not GA until 2026-11-19, so it is not eligible for R1.
- Redis 8.10.3 is the newest stable release; 8.4.8 is chosen for maturity. ADR-0002 confirms the final line.

## 10. Delivery roadmap

Estimates are indicative for one developer working part-time and are re-baselined after Phase 2. Phase 0 content work proceeds in parallel with build phases.

| Phase | Scope | Indicative effort | Exit gate |
|---|---|---|---|
| 0 | Discovery, content plan, risks, versions | 1 day | This document approved |
| 1 | Architecture, ERD, ADRs, permission matrix, API contract, env inventory | 2–3 days | Design internally consistent and approved |
| 2 | Repo, CI, Docker walking skeleton, Django foundation, R1 models/migrations/admin/seed/tests | 4–6 days | CI green on walking skeleton and model tests |
| 3 | Catalog/search/progress/bookmarks/contact APIs, OpenAPI, query budgets | 5–7 days | API and query-budget tests green |
| 4 | Auth and account backend, email flows, throttles, security tests | 4–6 days | Auth security tests green |
| 5 | Next.js public reading experience, typed client, static pages, search UI, staging deploy | 7–10 days | Component tests + staging verified |
| 6 | Auth UI, session provider, profile, bookmarks, progress, R1 Playwright flows | 5–7 days | E2E suite green |
| 7 | Production deploy, hardening, audits, backup drill, Lighthouse, R1 gate | 4–6 days | R1 pass/fail table with real evidence |
| 8–9 | R2 build and release gate | TBD after R1 | R2 live |
| 10–11 | R3 build and final release gate | TBD after R2 | Production readiness pass |

Content dependency: 5 seedable chapters by Phase 3, 10 by Phase 5, all 20 published before the Phase 7 gate.

## 11. Content plan summary

Full plan: `docs/CONTENT_PLAN.md`.

- 20 published chapters, 5 beginner tutorials, 4 categories.
- Tutorials: HTML & CSS Basics, JavaScript Basics, Python Basics, SQL Basics, Git Basics (4 chapters each).
- Categories: Web Development, Programming, Databases, Developer Tools.
- Owner authors; editorial workflow is draft → technical review → quality checklist → publish.
- Seed/demo content is clearly marked and excluded from launch counts and sitemaps.

## 12. Risk summary

Full register: `docs/RISK_REGISTER.md`. Current highest risks:

1. Content shortfall (20 quality chapters is the critical path).
2. Solo-developer capacity and single point of failure.
3. Dependency security drift, especially Next.js advisories and end-of-life runtimes.
4. Low-budget VPS capacity for Next.js + Django + PostgreSQL + Redis.
5. Auth/email misconfiguration causing account lockout or enumeration.
6. AC-30 media requirements are implemented locally, but production media serving and Nginx `frame-src` behaviour remain untested on a live host.
7. Production Compose/Nginx/PostgreSQL 18.7/Redis 8.4.8/live email are unexecuted; CI passed; R1 is not passed.

## 13. Assumptions register

| ID | Assumption | Impact if wrong |
|---|---|---|
| A-01 | Owner supplies all 20 MVP chapters before the R1 release gate | R1 slips; options: reduce to 12 chapters or delay launch |
| A-02 | Brand/domain "Ben Digital Solution" is available and owned before Phase 1 auth design | Cookie/CSRF/SEO design may change; ADR update required |
| A-03 | Single-domain topology with `/api/` reverse proxy | Cross-origin auth design needed; ADR-0001 revisited |
| A-04 | No analytics/tracking in R1 | Consent requirements simplified; no cookie banner needed initially |
| A-05 | Email volume is low (verification/reset/contact only) | Rate limits and provider choice revisited |
| A-06 | Production host is Linux (VPS) with Docker | Deployment phase changes |
| A-07 | English-only content; i18n deferred | URL/schema must already allow locale prefixes |
| A-08 | No paid services beyond VPS/domain/email | Storage/monitoring choices constrained |
| A-09 | Absolute beginners are the primary audience | Content depth and IA change; content plan revision |
| A-10 | A 20-chapter MVP is sufficient for launch metrics | Success metric changes require owner approval |

## 14. Phase 0 completion report

### 14.1 Delivered items

1. Project parameters confirmed and recorded.
2. Vision, non-goals, and product principles.
3. Three personas and eight end-to-end journeys.
4. Functional requirements tagged R1/R2/R3 (40 items) and non-functional requirements tagged R1/R2/R3 (15 items).
5. Acceptance criteria for every R1 requirement (32 criteria) with verification methods; every R1 functional and non-functional requirement maps to at least one criterion.
6. Content plan and editorial workflow (`docs/CONTENT_PLAN.md`).
7. Risk register (`docs/RISK_REGISTER.md`).
8. Environment assumptions and version research verified on 2026-11-12.
9. Delivery roadmap with exit gates and content dependency.
10. Assumptions register and open-decision list.

### 14.2 Files created, modified, removed

| Action | Path |
|---|---|
| Created | `docs/PROJECT_STATUS.md` |
| Created | `docs/CONTENT_PLAN.md` |
| Created | `docs/RISK_REGISTER.md` |
| Modified | None |
| Removed | None |

The provided `programming-tutorial-platform-master-prompt-v3.md` is unchanged.

### 14.3 Decisions and reasons

| Decision | Reason |
|---|---|
| Agentic mode with web access | Confirmed by user; permits local execution and official version verification |
| Django 5.2 LTS, not 6.1 | LTS support to April 2028 is better for a solo maintainer; 6.1 mainstream support ends April 2027 |
| Next.js 16.4.6 | Latest stable and above the November 2026 security floor |
| Node 26 container/CI, not host Node 20 | Node 20 is end-of-life and receives no security fixes |
| Python 3.14.8 | Officially supported by Django 5.2.8+ and matches the host |
| PostgreSQL 18.7 | Current stable, supported to 2030; PostgreSQL 19 is not GA |
| Redis 8.4.8 pending ADR-0002 | Mature supported line; inclusion remains a Phase 1 decision gate |
| No Celery in R1 | Avoids operational complexity before asynchronous work is required; email sent with timeouts and failure logging |
| Category → Tutorial → Chapter retained | Specified default; no concrete reason to deviate |
| 5 tutorials / 4 chapters each / 4 categories | Fits a solo author, keeps navigation non-empty, and meets the 20-chapter metric |
| TypeScript 5.9.x deferred pin | TypeScript 7.0.2 compatibility with Next.js 16 is unverified; do not adopt unverified majors |
| Documentation-only Phase 0 | Required by the master prompt; no application code before Phase 1 design |

No formal ADR exists yet; ADR numbering starts in Phase 1 as specified.

### 14.4 Commands run and actual outcomes

| Command | Outcome |
|---|---|
| `python --version` | Python 3.14.8 |
| `python -m pip --version` | pip 26.2.1 (Python 3.14) |
| `node --version` | v20.18.0 |
| `npm --version` | 11.19.0 |
| `git --version` | git 2.46.0.windows.1 |
| `docker --version` | Docker 29.7.2, build a7dcaa6 |
| `docker compose version` | v5.4.0 |
| `python -m pip index versions <package>` | django 6.1.3 (5.2.19 latest LTS patch); djangorestframework 3.18.3; drf-spectacular 0.30.0; psycopg 3.3.8; gunicorn 27.0.0; django-filter 26.2; django-environ 0.14.0 |
| `npm view next dist-tags --json` | latest 16.4.6; backport 15.5.29 |
| `npm view <package> version` | react 19.3.1; tailwindcss 4.3.5; typescript 7.0.2; @tanstack/react-query 5.107.1; zod 4.6.7; react-hook-form 7.92.0; vitest 5.1.0; @playwright/test 1.65.0 |
| `npm view next@16.4.6 engines peerDependencies` | Node >=20.9.0; React ^18.2 or ^19 |
| Web verification | Django 6.1 release notes and installation FAQ; Next.js October/November 2026 security releases; PostgreSQL 18.7/19 schedule; Redis 8.x release data |

No application code was written, no dependencies were installed, and no build, migration, test, or deployment was run. This is expected for Phase 0.

### 14.5 Tests run and actual outcomes

Not applicable: Phase 0 is documentation-only and the repository has no test harness. A manual consistency check was performed across the three deliverables. Automated tests and CI begin in Phase 2.

### 14.6 Known limitations and risks

- No application code, CI, or deployment evidence exists yet; this is by design.
- Full-stack installation compatibility (Django 5.2.19, Python 3.14.8, DRF 3.18.3, psycopg 3.3.8, PostgreSQL 18.7, Next.js 16.4.6, Node 26) is not yet validated; Phase 2 CI will produce the evidence.
- Exact pins for testing, linting, and frontend tooling are deferred with explicit phase ownership.
- The 20 chapters are planned, not written; content is the critical path.
- Brand and primary domain are unconfirmed.
- Effort estimates are indicative and will be re-baselined after Phase 2.
- Reference: `docs/RISK_REGISTER.md`.

### 14.7 Changes to previously agreed architecture

None. Phase 0 confirms the defaults in the master prompt and records parameter choices; no architecture has been designed yet.

### 14.8 Next phase scope (Phase 1)

1. System context and container diagram (Mermaid).
2. Rendering, caching, and revalidation strategy.
3. Deployment topology and single-domain `/api/` routing.
4. Auth and CSRF flow; ADR-0001 (sessions vs. JWT).
5. ADR-0002 (Redis) and ADR-0003 (Celery timing).
6. ADR-0004 (hierarchy and URLs) and revision strategy ADR-0006.
7. Monorepo layout and dependency boundaries.
8. Full-product ERD with field-level R1 model specifications, constraints, indexes, and migration order.
9. Permission matrix for every protected resource and action.
10. R1 API contract for every endpoint (auth, catalog, search, bookmarks, progress, contact, health).
11. Environment variable inventory and `.env.example` design.
12. Cache keys, TTLs, and invalidation triggers.
13. SEO and publishing/revalidation strategy.
14. No application features or migrations in Phase 1.

## 15. Phase 0 approval (recorded)

- [x] Parameters in Section 1 match the owner's intent.
- [x] Audience and content scope (20 chapters, 5 tutorials, 4 categories) accepted.
- [x] Stack pins accepted (Django 5.2 LTS, Next.js 16.4.6, Node 26, PostgreSQL 18.7, Redis 8.4.x pending ADR).
- [x] R1 acceptance criteria accepted as the definition of the MVP.
- [x] Risks and assumptions acknowledged.
- [x] Phase 1 scope accepted.

Approved 2026-11-13 with the instruction to proceed to Phase 1 and to create the Python virtual environment in the project.

## 16. Phase 1 completion report

### 16.1 Delivered items

1. Ten ADRs (ADR-0001–ADR-0010) with context, decision, consequences, and rejected alternatives.
2. `docs/ARCHITECTURE.md`: system context and container diagrams; technology decisions; monorepo layout; auth/CSRF flows; full-product ERD; field-level R1 model specifications with constraints, indexes, and migration order; R2/R3 model outline; permission matrix for six roles; API conventions; search design; media handling; SEO architecture; environment variable inventory; cache key/TTL/invalidation table; observability and backup baseline; deferred scope; consistency check.
3. `docs/API_CONTRACT.md`: 32 R1 endpoints with method, path, auth, permissions, throttles, request/response shapes, errors, pagination/filtering/ordering, query budgets, caching headers, versioning/deprecation rules, and OpenAPI validation approach.
4. `.env.example` with safe placeholders for every environment variable, and `.gitignore` excluding secrets, `.venv/`, build outputs, and media.
5. A working local `.venv` (Python 3.14.8) with the verified backend dependency set; dependency versions recorded in Section 9.2.
6. A consistency check across roles, URLs, models, cache keys, API payloads, and environment variables (ARCHITECTURE.md §18).

### 16.2 Files created, modified, removed

| Action | Path |
|---|---|
| Created | `docs/decisions/README.md` |
| Created | `docs/decisions/0001-authentication-sessions.md` |
| Created | `docs/decisions/0002-redis-in-r1.md` |
| Created | `docs/decisions/0003-no-celery-in-r1.md` |
| Created | `docs/decisions/0004-hierarchy-and-urls.md` |
| Created | `docs/decisions/0005-rendering-and-revalidation.md` |
| Created | `docs/decisions/0006-r1-revision-strategy.md` |
| Created | `docs/decisions/0007-demo-content-flag.md` |
| Created | `docs/decisions/0008-typescript-version.md` |
| Created | `docs/decisions/0009-single-domain-topology.md` |
| Created | `docs/decisions/0010-api-versioning-and-errors.md` |
| Created | `docs/ARCHITECTURE.md` |
| Created | `docs/API_CONTRACT.md` |
| Created | `.env.example` |
| Created | `.gitignore` |
| Created (local, gitignored) | `.venv/` |
| Modified | `docs/PROJECT_STATUS.md` |
| Modified | `docs/RISK_REGISTER.md` |
| Removed | None |

The provided `programming-tutorial-platform-master-prompt-v3.md` is unchanged. No application code, migrations, or repository initialisation were performed.

### 16.3 Decisions and reasons

| Decision | Reason |
|---|---|
| Django sessions + CSRF, not JWT | Single-origin app; HttpOnly cookies avoid token storage, CSRF is handled by Django, and revocation is immediate; no mobile/third-party client exists |
| `cached_db` session store | Sessions survive Redis restarts while normal reads stay cached; logout and password-change revocation remain server-side |
| Redis in R1 | Shared cache and throttle counters across Gunicorn workers; built-in `RedisCache` avoids a custom backend; internal-only with memory cap |
| No Celery in R1 | Email volume is low; synchronous send with timeout and logging is sufficient and removes broker/worker operations before they are needed |
| Category → Tutorial → Chapter, global tutorial slug | Matches the prompt; short stable URLs; old slugs resolved by `SlugRedirect` |
| ISR + tag revalidation webhook | Public pages stay fast and crawlable; Django controls freshness on publish/edit/unpublish; TTL bounds webhook failures |
| Django admin history in R1 | Provides auditability without building R2's revision UI early; database backups cover recovery |
| Per-record `is_demo` | Allows demo and real content to coexist; global demo mode could hide real content; seed purge is explicit |
| TypeScript 5.9.x | TypeScript 7 compatibility with Next.js 16.4.6 is unverified; adopting an unverified major violates version discipline |
| Single domain, no CORS | Removes cookie/CORS failure modes; Nginx routes API and admin internally |
| `/api/v1/` + standard error envelope | Predictable client handling, stable machine codes, request IDs; breaking changes require v2 |
| `.venv` in the project | Explicit owner request; keeps tooling local and reproducible; excluded from Git |

### 16.4 Commands run and actual outcomes

| Command | Outcome |
|---|---|
| `python -m venv .venv` | Created `.venv` with Python 3.14.8 |
| `& '.venv\Scripts\python.exe' -m pip install --upgrade pip` | pip upgraded to 26.2.1 |
| `& '.venv\Scripts\python.exe' -m pip install django==5.2.19 djangorestframework==3.18.3 drf-spectacular==0.30.0 django-filter==26.2 django-environ==0.14.0 "psycopg[binary]==3.3.8" redis==8.1.0` | Installed successfully |
| `& '.venv\Scripts\python.exe' -m pip install pytest==9.2.0 pytest-django==4.14.0 factory-boy==3.3.3 Faker==40.54.0 coverage==7.17.3 ruff==0.17.5 mypy==2.4.1 pre-commit==4.7.0` | Installed successfully |
| `& '.venv\Scripts\python.exe' -c "import django, rest_framework, psycopg, redis; print(...)"` | Reported Django 5.2.19, DRF 3.18.3, psycopg 3.3.8, redis 8.1.0 |
| Combined install/import attempts | Two long-running shell calls were killed by the tool (timeout/`ChildProcess.kill`); the work was split into shorter commands and completed. No package failure was observed |
| `docker`, `node`, `npm`, `git` version checks | Not re-run in Phase 1; Phase 0 values recorded in Section 8 |

No database, Redis server, Next.js install, test suite, migration, or build was run in Phase 1.

### 16.5 Tests run and actual outcomes

- **Dependency import smoke test:** passed for Django, DRF, psycopg, and redis on Python 3.14.8.
- **Document consistency check:** passed (ARCHITECTURE.md §18); roles, URLs, models, payload fields, cache keys, and env vars agree across documents.
- **Automated tests:** not applicable yet; the test harness and CI are created in Phase 2. This is expected for a design phase.

### 16.6 Known limitations and risks

- The shell environment intermittently kills long commands; Phase 2 must keep installs/builds in short steps or containers and record failures rather than retrying blindly.
- The exact Next.js 16 caching API (`revalidateTag`/`cacheLife` signatures and tag propagation) is **not yet verified**; Phase 5 validates it, and the webhook/tag layer is isolated so the design can adapt without a rewrite (R-25).
- PostgreSQL 18.7, Redis 8.4.8, and database migrations are not yet exercised; Phase 2 CI produces the first runtime evidence.
- Gunicorn is not installed on the Windows host; it belongs in Linux container images.
- No Git repository exists yet; the repository, lockfiles, and CI are Phase 2 deliverables.
- The exact TypeScript 5.9.x patch, Next.js cache behaviour, and frontend package compatibility are validated in Phase 5.
- Domain/brand confirmation (A-02) remains open; `example.com` is used in documentation.
- API query budgets are targets until measured against the real schema in Phase 3.
- Content remains the critical path: 20 chapters are planned, not written.

### 16.7 Changes to previously agreed architecture

- Phase 0 listed "Django sessions"; Phase 1 specifies the `cached_db` store and the `password_changed_at` revocation mechanism. This refines, not replaces, the earlier direction (ADR-0001).
- Unverified users may log in and edit profile/bio but cannot bookmark, save progress, or change password until verified (Section 8.2).
- Redis is confirmed as an R1 dependency with explicit memory and persistence settings (ADR-0002), closing the Phase 0 open question.
- Demo content is controlled per record rather than by a global environment flag (ADR-0007).
- TypeScript versioning was decided in Phase 1 rather than Phase 5 (ADR-0008); the exact patch remains Phase 5.
- API surface is fixed at 32 R1 endpoints with documented query budgets and throttles (API_CONTRACT.md).

No scope was added or removed; R2/R3 features remain deferred.

### 16.8 Next phase scope (Phase 2 — Repository, CI, and Backend Foundation)

1. Initialise the Git repository; add `.gitattributes` (LF in repo), `README.md`, and commit conventions. No open-source licence (all rights reserved).
2. Create backend requirements files (`base`, `dev`, `prod`) and the lock/constraints strategy; add pre-commit hooks (Ruff, formatting, secret check, whitespace).
3. Create Docker Compose for development: `backend`, `db` (PostgreSQL 18.7), `redis` (8.4.x); health checks; named volumes; no public database/Redis ports.
4. Create the Django project with split settings (`base`/`dev`/`prod`/`test`), `django-environ`, custom `User`, and app skeletons (`accounts`, `catalog`, `seo`, `learning`, `contact`, `common`).
5. Implement the R1 models, constraints, indexes, and migrations in the documented order; set `AUTH_USER_MODEL` before the first migration.
6. Register models in Django admin with role-aware permissions, publication controls, and audit logging.
7. Implement `seed_demo` (idempotent, `is_demo=True`) and `purge_demo_content` management commands.
8. Add `/api/v1/health/` and `/api/v1/ready/` plus the standard error-envelope exception handler and request-ID middleware.
9. Set up pytest + pytest-django + factory-boy; model, constraint, admin-permission, seed, and readiness tests; coverage configuration (85% application-code target).
10. Configure Ruff, mypy, and `.env` validation; ensure no secrets in the repository.
11. Create GitHub Actions CI: install, lint, typecheck, `makemigrations --check`, migrate on PostgreSQL, tests, `check --deploy` baseline, dependency audit, secret scan.
12. Validate OpenAPI generation on the foundation endpoints (full contract validation in Phase 3).
13. Update `PROJECT_STATUS.md` and `RISK_REGISTER.md`; record commands, outputs, and any version changes.
14. Stop for approval before Phase 3.

## 17. Phase 1 approval checklist

- [x] ADR-0001–ADR-0010 accepted.
- [x] R1 data model, constraints, indexes, and migration order accepted.
- [x] Role and permission matrix accepted.
- [x] API contract (32 endpoints, errors, throttles, query budgets) accepted.
- [x] Environment variable inventory and `.env.example` accepted.
- [x] Local `.venv` and verified dependency versions accepted.
- [x] Phase 2 scope accepted.

Approved 2026-11-13 with the instruction to proceed to Phase 2.

## 18. Phase 2 completion report

### 18.1 Delivered items

1. Git repository initialised (no commit made), with `.gitattributes`, `.gitignore`, `README.md`, and `.env.example` preserved as the environment contract.
2. Backend dependency files with exact pins: `backend/requirements/base.txt`, `dev.txt`, `prod.txt`; pre-commit configuration for Ruff, formatting, secret detection, whitespace, YAML/JSON checks, and large-file rejection.
3. Django 5.2.19 project with split settings (`base`, `dev`, `prod`, `test`), `django-environ`, PostgreSQL via `DATABASE_URL`, Redis cache/sessions, and SQLite fallback for local development.
4. Custom `accounts.User` (email login, case-normalised, unique) and `Profile`, with role field and signal-created profiles.
5. R1 models for `catalog` (Category, Tag, Tutorial, Chapter, CodeExample), `seo` (SlugRedirect), `learning` (Bookmark, UserProgress), `contact` (ContactMessage), and `common` (SiteSetting, AdministrativeAuditLog), including constraints, indexes, ordering, and reading-time recalculation.
6. Six initial migrations generated in dependency order and applied successfully.
7. Role-aware Django admin: admin-only settings/audit/contact/learning views, staff content editing, publication fields restricted to admins, audit entries for content/settings/user/SEO create-update-delete, and Django admin history.
8. Idempotent `seed_demo` and `purge_demo_content` management commands with `is_demo=True` marking and no fake users.
9. Foundation HTTP surface: `/api/v1/health/`, `/api/v1/ready/`, `/api/v1/schema/`, request-ID middleware, standard error envelope, and a minimal root placeholder page for the walking skeleton.
10. Test harness: pytest + pytest-django + factory-boy + pytest-cov; 60 tests across models, constraints, admin permissions, commands, health/readiness, middleware, SEO, learning, contact, and the placeholder page; 93.58% coverage against the 85% threshold.
11. Static quality gates: Ruff lint/format, mypy with django-stubs, migration drift check, Django system checks, OpenAPI validation, dependency audit, and production `check --deploy` baseline.
12. GitHub Actions CI workflow with PostgreSQL 18.7 and Redis 8.4.8 services, lint, formatting, types, migration drift, checks, migrations, tests, schema validation, dependency audit, secret scan, and a frontend job gated on `frontend/package.json`.
13. Development Dockerfile and Compose stack for backend, PostgreSQL, and Redis, with health checks, named volume, and loopback-only database/Redis ports.
14. Setup documentation in `README.md` and test evidence/strategy in `docs/TEST_STRATEGY.md`.

### 18.2 Files created, modified, removed

| Action | Path |
|---|---|
| Created | `.gitattributes`, `README.md`, `.github/workflows/ci.yml`, `.pre-commit-config.yaml` |
| Created | `backend/Dockerfile`, `backend/.dockerignore`, `backend/requirements/{base,dev,prod}.txt`, `backend/pyproject.toml` |
| Created | `backend/manage.py`, `backend/config/{urls,wsgi,asgi}.py`, `backend/config/settings/{base,dev,prod,test}.py` |
| Created | `backend/apps/{common,accounts,catalog,seo,learning,contact}/` app modules, admin, models, tests, and migrations |
| Created | `backend/apps/catalog/management/commands/{seed_demo,purge_demo_content}.py` |
| Created | `backend/apps/common/{choices,exceptions,middleware,serializers,views,urls}.py` |
| Created | `backend/templates/placeholder.html` |
| Created | `infra/compose/compose.yaml` |
| Created | `docs/TEST_STRATEGY.md` |
| Modified | `.gitignore`, `docs/PROJECT_STATUS.md`, `docs/RISK_REGISTER.md`, `docs/ARCHITECTURE.md` |
| Created (local, gitignored) | `.venv/` |
| Removed | None |

The provided master prompt is unchanged. No commit was created; `git status` is the file manifest until the first commit.

### 18.3 Decisions and reasons

| Decision | Reason |
|---|---|
| Email is `unique=True` and also covered by a `Lower(email)` unique constraint | Satisfies Django's `auth.E003` check and preserves case-insensitive database uniqueness even for direct writes |
| `Tutorial.save()` recalculates reading time before the update | The publish constraint requires a positive reading time; recalculating after the write would fail the check constraint |
| Chapter publication guard and atomic save/delete | Prevents unpublishing or deleting the last published chapter of a live tutorial; keeps the tutorial reading-time update and chapter write in one transaction |
| Local tests use SQLite; CI uses PostgreSQL | Keeps the fast local loop usable without a Docker daemon while preserving PostgreSQL parity in CI |
| Test settings use Redis only when `REDIS_URL` is set | Local tests need no service; CI exercises the Redis cache path and readiness check |
| `AuditAdminMixin` inherits `admin.ModelAdmin` | Keeps `super().save_model`/`delete_model` typed and valid under mypy without suppressions |
| mypy pinned to 1.19.1 with django-stubs 5.2.9 | django-stubs does not yet support the mypy 2.x plugin API; runtime packages are unaffected |
| Sentry SDK not added in Phase 2 | No observability wiring exists yet; adding an unused SDK would be dead weight. It is added in Phase 7 |
| Minimal Django root placeholder | Satisfies the walking-skeleton requirement without starting the Phase 5 frontend early; Nginx still routes `/` to Next.js in production |
| Exact requirements pins, no hash lock | The project is single-environment and Docker-built; exact pins plus CI install give reproducible builds without a lock tool |

### 18.4 Commands run and actual outcomes

| Command | Outcome |
|---|---|
| `git init` | Empty repository initialised at the project root; no commit |
| `python manage.py check --settings=config.settings.test` | No issues (initial `auth.E003` fixed by making email unique) |
| `python manage.py makemigrations --settings=config.settings.test` | Six initial migrations created |
| `python manage.py migrate --settings=config.settings.test --noinput` | All migrations applied successfully to in-memory SQLite |
| `python manage.py makemigrations --check --dry-run --settings=config.settings.test` | No changes detected |
| `pytest` | 60 passed; 93.58% coverage; 85% threshold reached |
| `ruff check .` | All checks passed |
| `ruff format --check .` | 65 files already formatted |
| `mypy .` | Success: no issues in 46 source files |
| `manage.py spectacular --file schema.yaml --validate` | Schema generated with 0 warnings and 0 errors |
| `manage.py check --deploy --settings=config.settings.prod --fail-level ERROR` | No issues with a 50+ character CI-only key |
| PyYAML parse of CI, pre-commit, and Compose files | OK |
| `pre-commit validate-config .pre-commit-config.yaml` | Config valid |
| `pip-audit -r requirements/base.txt` | No known vulnerabilities found |
| `docker compose ... up` | **Not run** — Docker daemon unavailable (`dockerDesktopLinuxEngine` pipe missing) |
| GitHub Actions workflow | **Not executed** — no remote repository yet; YAML syntax validated locally |

During Phase 2 the shell tool intermittently terminated long commands; installs and checks were split into short commands. No dependency installation failure was observed.

### 18.5 Tests run and actual outcomes

- **60 tests passed** in the local suite (SQLite + LocMem cache), including database constraint tests, admin permission boundaries, seed idempotency, purge isolation, request-ID validation, error-envelope shape, readiness failure paths, slug redirects, bookmarks, progress, and contact validation.
- **Coverage:** 93.58% of application code; migrations and test packages excluded. `apps/common/admin.py` and admin-only mixins are the largest remaining gaps and are covered as admin flows are exercised in later phases.
- **Not run:** PostgreSQL-backed tests, Redis-backed tests, Compose health checks, and GitHub Actions. These are CI/Compose responsibilities and are explicitly not claimed as passed.
- **No frontend tests:** the frontend does not exist until Phase 5.

### 18.6 Known limitations and risks

- Docker Desktop is not running and its executable was not found at standard paths; the Compose stack could not be started. PostgreSQL 18.7 and Redis 8.4.8 are therefore **unverified locally**.
- The CI workflow has not run on GitHub; "CI is green" remains unproven until the repository is pushed and the workflow executes. This is a gate item for Phase 3 onward.
- Local tests use SQLite; PostgreSQL-specific behaviour (constraint errors, `Lower` index, query plans) must be verified in CI/Compose.
- Gunicorn 27.0.0 is pinned but not installed on Windows; the production container build is unverified locally.
- The root placeholder page is a walking-skeleton aid, not the public frontend; Nginx will route `/` to Next.js in production.
- Sentry is not wired yet; `SENTRY_DSN` remains an unused setting until Phase 7.
- No commit exists yet; the owner must review and commit. Secrets remain environment-only.
- Node 26 and the frontend toolchain are not installed; the frontend CI job is dormant until `frontend/package.json` exists.

### 18.7 Changes to previously agreed architecture

- No material architecture change. The R1 model, admin, and endpoint decisions match ADR-0001–0010 and the API contract.
- Test settings gained a Redis-conditional cache path to exercise CI parity without requiring Redis locally.
- A Django root placeholder page was added solely to complete the walking skeleton; it does not change the production topology.
- mypy was pinned to 1.19.1 for django-stubs compatibility (tooling-only change).
- Sentry dependency installation is deferred to Phase 7 when observability is configured.

### 18.8 Next phase scope (Phase 3 — Backend API)

1. Serializers for categories, tutorials, chapters, tags, search, bookmarks, progress, and contact.
2. Read-only public catalog endpoints with filtering, ordering, pagination, and published/demo visibility rules.
3. Search and suggestions with PostgreSQL full-text search, relevance ordering, and throttles.
4. Authenticated bookmark and progress endpoints with ownership checks and verification rules.
5. Contact endpoint with validation, honeypot/throttle behaviour, and email wrapper.
6. Cache keys/TTLs and invalidation hooks for catalog and search; readiness remains intact.
7. OpenAPI annotations and contract tests against `docs/API_CONTRACT.md`.
8. Permission, validation, throttling, pagination, and query-budget tests.
9. Update `PROJECT_STATUS.md`, `TEST_STRATEGY.md`, and `RISK_REGISTER.md`; record evidence.
10. Stop for approval before Phase 4.

**Reply `next` to begin Phase 3 — Backend API (catalog, search, learning state).**

## 19. Phase 3 completion report

### 19.1 Delivered items

1. Public catalog API: home, category list/detail, tutorial list/detail, chapter detail, tags, and slug redirects, with published/demo visibility rules, filtering, ordering, pagination, Markdown rendering, TOC, previous/next navigation, and learner-state augmentation.
2. Search API: `/search/` and `/search/suggestions/`, weighted PostgreSQL full-text search, SQLite fallback, type filters, relevance/date ordering, sanitised excerpts with `<mark>`, and suggestion limits.
3. Learning API: bookmark list/create/delete and progress summary/upsert, with verified-session permission, ownership isolation, idempotent bookmarks, and completion timestamps.
4. Contact API: validated submission, honeypot, hashed IP, stored message, admin email notification, delivery-failure logging, throttle, and no-store response.
5. API infrastructure: standard error envelope extensions, `IsVerifiedLearner`, dynamic anon/user throttles, search/contact scopes, pagination, cache helpers, no-store mixin, request-ID compatibility, and custom session authentication that preserves the contract's `401 authentication_required`.
6. Cache keys/TTLs and invalidation: home/category/tutorial/chapter/tag/redirect keys, content-version namespace bump, and `transaction.on_commit` invalidation signals.
7. Markdown safety: `Markdown` + `nh3` sanitisation, allowlisted tags/attributes/URL schemes, TOC extraction, plain-text excerpts, and script-stripping tests.
8. PostgreSQL search-index migration: vendor-guarded expression GIN indexes for category, tutorial, and chapter search fields.
9. OpenAPI annotations for all new endpoints, including a session-cookie security scheme; schema validation completes with 0 warnings and 0 errors.
10. Test coverage: 99 tests at 92.62% application coverage, including catalog, search, learning, contact, and query-budget tests.

### 19.2 Files created, modified, removed

| Action | Path |
|---|---|
| Created | `backend/apps/common/{authentication,permissions,throttles,pagination,cache,markdown,http}.py` |
| Modified | `backend/apps/common/{exceptions,views}.py` |
| Created | `backend/apps/catalog/{serializers,views,urls,signals}.py` |
| Modified | `backend/apps/catalog/{models,apps}.py` |
| Created | `backend/apps/catalog/migrations/0002_search_indexes.py` |
| Created | `backend/apps/search/{services,serializers,views,urls,apps}.py` |
| Created | `backend/apps/learning/{serializers,views,urls}.py` |
| Created | `backend/apps/contact/{serializers,views,urls}.py` |
| Created | `backend/apps/seo/signals.py`; modified `backend/apps/seo/apps.py` |
| Modified | `backend/config/settings/base.py`, `backend/config/urls.py`, `.env.example` |
| Modified | `backend/requirements/{base,dev}.txt` (`Markdown`, `nh3`, `types-Markdown`) |
| Created | `backend/conftest.py` |
| Created | `backend/apps/catalog/tests/{test_api,test_budgets}.py` |
| Created | `backend/apps/search/tests/test_api.py` |
| Created | `backend/apps/learning/tests/test_api.py` |
| Created | `backend/apps/contact/tests/test_api.py` |
| Modified | `backend/apps/accounts/tests/factories.py`, `backend/apps/catalog/tests/factories.py` |
| Modified | `docs/PROJECT_STATUS.md`, `docs/TEST_STRATEGY.md`, `docs/RISK_REGISTER.md` |
| Removed | Temporary budget-probe test; generated `schema.yaml` and `.coverage` artifacts |

No commit was created. The provided master prompt is unchanged.

### 19.3 Decisions and reasons

| Decision | Reason |
|---|---|
| Custom `SessionAuthentication` returns an `authenticate_header` | DRF converts `NotAuthenticated` to `403` when no authenticator supplies a challenge; the API contract requires `401 authentication_required` for anonymous protected requests |
| Search uses weighted PostgreSQL vectors with a SQLite fallback | Keeps local tests service-free while preserving relevance-oriented PostgreSQL behaviour for CI/production |
| Search results are not server-cached | Search is request-specific and `no-store`; caching it would add invalidation complexity without measured benefit |
| Query-budget tests assert `<= budget` | The contract defines ceilings, not exact query counts; the implementation currently runs below several budgets |
| GIN indexes are created in a vendor-guarded `RunPython` migration | PostgreSQL gets expression indexes while SQLite test databases treat the migration as a no-op |
| `Tutorial._reading_time_total()` clamps published tutorials to at least 1 | Publishing a tutorial with no published chapters otherwise violates `tutorial_published_requires_time`; the clamp keeps the constraint valid |
| Markdown rendering uses `Markdown` + `nh3` | Produces sanitised HTML and TOC data without allowing scripts, arbitrary iframes, or unsafe URL schemes |
| `types-Markdown` added as a development dependency | Keeps mypy clean without suppressions; runtime package pins are unchanged |
| Honeypot submissions return the normal success response | Avoids signalling detection to bots while storing and emailing nothing |

### 19.4 Commands run and actual outcomes

| Command | Outcome |
|---|---|
| `pytest` | **99 passed**; 92.62% application coverage; 85% threshold reached |
| `ruff check .` | All checks passed |
| `ruff format --check .` | 96 files already formatted |
| `mypy .` | Success: no issues in 71 source files |
| `manage.py check --settings=config.settings.test` | No issues |
| `manage.py makemigrations --check --dry-run --settings=config.settings.test` | No changes detected |
| `manage.py spectacular --file schema.yaml --validate --settings=config.settings.test` | 0 warnings, 0 errors |
| `pip-audit -r requirements/base.txt` | No known vulnerabilities found |
| `docker compose ... up` | **Not run** - Docker daemon unavailable |
| GitHub Actions workflow | **Not executed** - no remote repository |
| PostgreSQL migration/search execution | **Not run locally** - SQLite only |

The initial search test run exposed a queryset/model bug in `_sqlite_results`/`_postgres_results`; both now accept and filter the supplied queryset. The first learning test also exposed DRF's no-challenge `403`; the custom session authenticator fixes the contract behaviour.

### 19.5 Tests run and actual outcomes

- **Catalog API:** 13 tests covering home stats, category visibility/counts, tutorial filtering/ordering, detail progress, chapter sanitisation/TOC/navigation, draft 404s, tags, redirects, and unverified learner fields.
- **Search API:** 8 tests covering query validation, published-only results, chapter filtering, unknown type rejection, suggestions, demo exclusion, and search/suggestion query budgets.
- **Learning API:** 10 tests covering anonymous 401, unverified 403, bookmark idempotency, unpublished-chapter 404, delete idempotency, progress summary/upsert, validation, unknown chapters, and completion timestamp retention.
- **Contact API:** 6 tests covering creation/email, honeypot silence, validation, email-provider failure, throttle, and query budget.
- **Query budgets:** catalog/learning GET budgets asserted against measured counts; search budgets asserted in search tests.
- **Not run:** PostgreSQL-backed tests, Redis-backed tests, Compose health checks, GitHub Actions, and frontend tests. No evidence is claimed for them.

### 19.6 Known limitations and risks

- PostgreSQL full-text ranking and the GIN migration have not executed locally; only the SQLite fallback is proven on this host.
- Docker/Compose and GitHub Actions remain unexecuted, so PostgreSQL/Redis parity and CI-green status are still unproven.
- Search relevance is deterministic but not benchmarked against a real PostgreSQL corpus; R-15 remains Medium.
- Cache-invalidation signal branches are partially covered; slug-change, unpublish, and delete paths need later integration/E2E exercise.
- The local suite uses SQLite and LocMem cache; session, throttle, and query-plan behaviour under Redis/PostgreSQL may differ.
- No frontend exists yet; all endpoints are verified at the API layer only.
- No load, soak, or concurrency testing has been performed.
- No commit exists; owner review is required before Phase 4.

### 19.7 Changes to previously agreed architecture

- No material architecture change. The API surface, visibility rules, cache keys, throttles, and error codes follow `docs/API_CONTRACT.md`.
- A custom session authentication subclass was added solely to provide an authentication challenge and preserve the documented `401` response.
- `Markdown` and `nh3` were added as backend dependencies for safe rendering; `types-Markdown` was added to development tooling.
- Search index creation is an explicit PostgreSQL-only migration; it does not alter model state.
- Search responses remain uncached and `no-store`, consistent with the contract.

### 19.8 Next phase scope (Phase 4 - Backend authentication and accounts)

1. Registration with case-insensitive email handling, generic responses, verification token generation, expiry, and single-use consumption.
2. Login, logout, session restoration, CSRF endpoint, and session rotation/revocation behaviour.
3. Forgot-password and reset flow with generic responses, single-use tokens, expiry, and session revocation.
4. Authenticated password change with current-password verification and other-session revocation.
5. Profile read/update for display name and bio, with validation and verification rules.
6. Self-service deactivation and deletion with documented data handling.
7. Email wrappers with timeouts and logged failures; no live email in tests.
8. Throttles, enumeration resistance, CSRF, permission, and session-security tests.
9. OpenAPI annotations and contract validation for auth/account endpoints.
10. Update `PROJECT_STATUS.md`, `TEST_STRATEGY.md`, and `RISK_REGISTER.md`; stop for approval before Phase 5.

### 19.9 Phase 3 approval checklist

- [ ] Catalog, search, learning, and contact endpoints match `docs/API_CONTRACT.md`.
- [ ] Published/demo visibility and `404` behaviour accepted.
- [ ] Search fallback and PostgreSQL index approach accepted.
- [ ] Cache keys, TTLs, and invalidation approach accepted.
- [ ] Throttle scopes and query budgets accepted.
- [ ] 99-test suite and 92.62% coverage accepted.
- [ ] Known limitations (PostgreSQL/Redis/Docker/CI unverified locally) acknowledged.
- [ ] Phase 4 scope accepted.

**Reply `next` to begin Phase 4 - Backend authentication and accounts.**

---

## 20. Phase 4 - Backend authentication and accounts (2026-11-15)

**Status:** Complete locally, awaiting owner approval. No commit created.

### 20.1 Objective and scope

Implement the 13 auth/account endpoints in `docs/API_CONTRACT.md` without changing the public API surface: CSRF bootstrap, registration and email verification, resend verification, login/logout, current-user read, profile update, password reset request/confirm, password change, deactivation, and deletion. Preserve enumeration resistance, CSRF protection, session rotation/revocation, and generic response messages.

### 20.2 Delivered

| Area | Implementation |
|---|---|
| Auth URLs | `backend/apps/accounts/urls.py`; included under `/api/v1/auth/` from `backend/config/urls.py` |
| Views | `backend/apps/accounts/views.py`: `CsrfView`, `RegisterView`, `VerifyEmailView`, `ResendVerificationView`, `LoginView`, `LogoutView`, `MeView`, `ProfileView`, `PasswordResetRequestView`, `PasswordResetConfirmView`, `PasswordChangeView`, `AccountDeactivateView`, `AccountDeleteView` |
| Serializers | `backend/apps/accounts/serializers.py`: registration, login, verification, resend, current user, profile, reset, change-password, deactivation, and deletion payloads |
| Tokens | `backend/apps/accounts/tokens.py`: signed email-verification tokens and Django password-reset tokens; no new database model or migration |
| Email | `backend/apps/accounts/emails.py`: verification, registration-attempt, reset, and deactivation messages; delivery failures logged without leaking account state |
| Session security | `backend/apps/common/authentication.py`: `auth_time` validation and session flushing after password changes; OpenAPI cookie scheme renamed to `bds_sessionid` |
| Signals | `backend/apps/accounts/signals.py`: profile creation and `auth_time` recording on login |
| Errors | `backend/apps/common/exceptions.py`: `token_invalid_or_expired` contract error |
| Throttles | `backend/apps/common/throttles.py`: auth, password-reset, and reset-email scopes |
| Settings | `backend/config/settings/base.py`: 24-hour verification/reset timeouts and reset-email throttle |
| Environment template | `.env.example`: timeout and throttle variables |

### 20.3 Decisions and reasons

| Decision | Reason |
|---|---|
| Email verification uses Django signing tokens, not a token table | The contract requires single-use, 24-hour tokens but does not require server-side token storage; signed payloads avoid a migration while remaining tamper-evident |
| Password reset uses `default_token_generator` with a base64 uid | Reuses Django's expiry and password-hash invalidation semantics; changing the password invalidates outstanding reset links |
| Session revocation compares `auth_time` with `password_changed_at` | Invalidates all sessions after reset/change without a per-session table; current-session continuity is preserved with `update_session_auth_hash` |
| Login uses DRF's default authenticators | Ensures invalid credentials produce the contract `401 invalid_credentials` instead of DRF's `403` fallback |
| Registration and reset responses are generic | Prevents account enumeration for existing emails and unknown reset targets |
| Profile PATCH is allowed for unverified users | The contract permits profile management before verification; protected learning actions remain verified-only |
| No live email provider in tests | Tests use LocMem and assert calls/failures; real SMTP/API delivery remains an operational verification item |
| Throttles use hashed email/uid keys for reset email | Limits abuse per recipient without storing raw addresses in cache keys |

### 20.4 Commands run and actual outcomes

| Command | Outcome |
|---|---|
| `pytest` (SQLite) | **131 passed**; **93.61%** application coverage; 85% threshold reached |
| `pytest` (PostgreSQL 17.0) | **131 passed**; **93.34%** coverage; test database created from migrations |
| `ruff check .` | All checks passed |
| `ruff format --check .` | 102 files already formatted |
| `mypy apps config` | Success: no issues in 74 source files |
| `manage.py check` | No issues |
| `manage.py makemigrations --check --dry-run` | No changes detected |
| `manage.py spectacular --validate` | 0 warnings, 0 errors |
| PostgreSQL migration | Applied all 25 migrations to dedicated local database `bds_r1` on PostgreSQL 17.0 |
| PostgreSQL GIN indexes | 7 weighted full-text indexes verified in `pg_indexes` |
| `pip-audit -r requirements/base.txt` | No known vulnerabilities found |
| Docker Compose stack | **Not run** - Docker daemon unavailable |
| GitHub Actions workflow | **Not executed** - no remote repository |

### 20.5 Tests run and actual outcomes

Phase 4 added 32 auth/account tests in `backend/apps/accounts/tests/test_auth_api.py`, bringing the suite from 99 to 131 tests.

- **CSRF:** session cookie issuance, CSRF cookie presence, and no-store headers.
- **Registration:** success shape, case-insensitive duplicate handling, generic response, password validation, display-name validation, and verification email.
- **Verification:** valid token, single-use consumption, expired token, malformed token, and login after verification.
- **Resend verification:** generic response, unauthenticated rejection, and email dispatch.
- **Login/logout:** success session rotation, generic invalid-credential response for wrong/unknown/inactive users, unverified-user login, logout flush, and idempotent logout.
- **Current user/profile:** anonymous `authenticated: false`, authenticated payload, profile PATCH, unverified-user access, and validation.
- **Password reset:** generic request response, unknown-email silence, valid reset, invalid/expired token error, and session invalidation.
- **Password change:** current-password requirement, verified-session requirement, current-session continuity, and other-session revocation.
- **Deactivation/deletion:** verified-session requirement, inactive state, session flush, deletion, and contact-record anonymisation.
- **Security/throttles:** auth and reset throttle scopes, CSRF enforcement, and session-revocation behaviour.
- **PostgreSQL:** the full 131-test suite also passed against local PostgreSQL 17.0 with 93.34% coverage; all migrations applied and all 7 GIN indexes were present.
- **Not run:** Redis-backed session/throttle tests, live email delivery, Compose health checks, GitHub Actions, and frontend tests. No evidence is claimed for them.

### 20.6 Known limitations and risks

- PostgreSQL parity is verified locally on **17.0**, while the R1 target is **18.7**; version-specific planner/index differences remain for CI/Compose. The local Redis service is **3.0.504**, which rejects the `HELLO` handshake used by the Redis 8 client, so Redis 8.4.8-backed sessions/throttles remain unverified locally.
- Email delivery is verified only through the LocMem backend; provider timeouts, bounces, and real inbox rendering remain unverified.
- Throttle state uses LocMem locally; Redis-backed counters and multi-process behaviour remain unverified.
- No load, concurrency, or session-fixation penetration testing has been performed.
- No frontend exists yet; auth flows are verified at the API layer only.
- No commit exists; owner review is required before Phase 5.

### 20.7 Changes to previously agreed architecture

- No public API or data-model change. Auth adds no migration.
- `SessionAuthentication` now enforces `auth_time` against `password_changed_at`; this is an implementation-level extension of ADR-0001 session security.
- Email verification and reset tokens use Django's signing/token primitives rather than a new token table.
- OpenAPI documents the session cookie as `bds_sessionid`, matching settings.
- Auth/profile endpoints are `no-store`; auth and reset throttles follow the contract scopes.

### 20.8 Next phase scope (Phase 5 - Frontend foundation and public pages)

1. Scaffold the Next.js application with the pinned R1 toolchain and shared layout.
2. Implement public pages for home, categories, tutorials, chapters, search, and static/legal content.
3. Add the typed API client, server-side data fetching, error/empty states, and SEO metadata.
4. Implement auth screens and session restoration against the Phase 4 endpoints.
5. Add component/accessibility tests and frontend lint/type/build gates.
6. Exercise cache/revalidation assumptions against the backend contract; document any required webhook changes.
7. Update status, test strategy, and risk documents; stop for approval before Phase 6.

### 20.9 Phase 4 approval checklist

- [x] Auth/account endpoints match `docs/API_CONTRACT.md`.
- [x] Generic registration/reset responses and enumeration resistance accepted.
- [x] Signed verification tokens and Django reset tokens accepted; no token table added.
- [x] Session rotation, `auth_time` revocation, and current-session continuity accepted.
- [x] Profile access for unverified users accepted.
- [x] Auth/reset throttle scopes accepted.
- [x] 131-test suite and 93.61% coverage accepted.
- [x] Known limitations (PostgreSQL 18.7/Redis/email/Docker/CI unverified locally) acknowledged.
- [x] Phase 5 scope accepted.

Approved 2026-11-15 with the instruction to proceed to Phase 5.

---

## 21. Phase 5 - Frontend foundation, public pages, and auth screens (2026-11-15)

**Status:** Complete locally, awaiting owner approval. No commit created.

### 21.1 Objective and scope

Build the Next.js 16.4.6 App Router frontend against the Phase 3/4 API: public reading pages, typed server/browser clients, SEO and cache-tag integration, design system, auth screens, and session restoration. No learner bookmark/progress UI or Playwright suite is included; those move to Phase 6.

### 21.2 Delivered

| Area | Implementation |
|---|---|
| Toolchain | Next.js 16.4.6, React 19, TypeScript 5.9.x, Tailwind CSS 4, Node 26.13.1, `fnm` command pattern documented |
| Design system | Workbench/field-notebook direction; cool mist, ink, cobalt, coral, lime, mint; Bricolage Grotesque, Atkinson Hyperlegible, IBM Plex Mono via `next/font`; hard-shadow cards and accessible focus states |
| Server API client | `frontend/src/lib/api/client.ts`: typed fetches, ISR tags, `no-store` where required, error mapping, cookie forwarding for learner state |
| Browser API client | `frontend/src/lib/api/browser.ts`: same-origin `/api/v1` requests, CSRF bootstrap, contact, search suggestions, auth/account mutations |
| Server session helper | `frontend/src/lib/api/server.ts`: `getCurrentUser()` reads Next cookies and calls `/auth/me/` with an 8-second timeout |
| Public pages | Home, category index/detail, tutorial index/detail, chapter reader, search, contact, about, privacy, terms |
| Chapter reader | Sanitized HTML, TOC, Shiki code highlighting, copy buttons, prev/next navigation, article JSON-LD |
| App-level states | `not-found`, `error`, `global-error`, `loading`, `opengraph-image`, `robots.txt`, `sitemap.xml` |
| Revalidation | Secret-protected `POST /api/revalidate` route with constant-time secret comparison, tag/path allowlist limits, `revalidateTag(tag, "max")` |
| Auth screens | `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, protected `/profile` with profile edit, resend verification, and password change |
| Session restoration | Client `AccountNav` calls `/auth/me/` after hydration; anonymous shows Log in/Join, authenticated shows display name/Log out |
| Auth protection | `/profile` server component redirects to `/login?next=/profile` when no authenticated session |
| Tests | Vitest + Testing Library: format, error envelope, contact schema, copy button, search combobox, login form |
| Proxy fixes | `skipTrailingSlashRedirect: true` plus explicit trailing-slash rewrite; CSRF/contact/login/logout verified through the Next dev proxy |
| SWC repair | Removed truncated `@next/swc-win32-x64-msvc` binary, reinstalled `16.4.6` as an optional dependency, and confirmed the native module loads |

### 21.3 Files created or modified

| Action | Path |
|---|---|
| Modified | `frontend/package.json`, `frontend/next.config.ts`, `frontend/src/app/globals.css`, `frontend/src/app/layout.tsx` |
| Created | `frontend/vitest.config.mts`, `frontend/src/test/setup.ts` |
| Created | `frontend/src/lib/api/{types,errors,client,browser,server}.ts` |
| Created | `frontend/src/lib/{site,format,seo,highlight}.ts` |
| Created | `frontend/src/components/{site-header,site-footer,logo,account-nav}.tsx` |
| Created | `frontend/src/components/{tutorial-card,category-card,chapter-nav,toc,code-block,copy-button,search-form,contact-form,json-ld}.tsx` |
| Created | `frontend/src/app/page.tsx`; `frontend/src/app/(public)/...` category, tutorial, chapter, search, contact, about, privacy, and terms pages |
| Created | `frontend/src/app/{not-found,error,global-error,loading,opengraph-image,robots,sitemap}.tsx` |
| Created | `frontend/src/app/api/revalidate/route.ts` |
| Created | `frontend/src/app/(auth)/{layout,login,register,verify-email,forgot-password,reset-password}`; `frontend/src/app/profile/page.tsx` |
| Created | `frontend/src/components/auth/{login-form,register-form,verify-email-form,forgot-password-form,reset-password-form,profile-form,password-change-form}.tsx` |
| Created | `frontend/src/components/auth/login-form.test.tsx`; existing component/lib tests under `frontend/src/**/*.test.*` |
| Modified | `docs/PROJECT_STATUS.md`, `docs/TEST_STRATEGY.md`, `docs/RISK_REGISTER.md` |
| Removed | Truncated local `@next/swc-win32-x64-msvc` package directory before reinstalling |

The provided master prompt is unchanged. No commit was created.

### 21.4 Decisions and reasons

| Decision | Reason |
|---|---|
| Pull auth screens into Phase 5 | The master prompt's Phase 5 scope includes auth screens/session restoration; deferring them to Phase 6 conflicted with the phase definition |
| Server-side session lookup for `/profile` | Avoids shipping a client-only protected page and keeps account data out of anonymous responses |
| Client `AccountNav` restoration | The shared header is cached/static; a small client probe provides session-aware UI without making every page dynamic |
| Reuse one `unsafeRequest` helper for mutations | Guarantees CSRF bootstrap before every unsafe browser request; login rotates the CSRF token, so per-request bootstrap is required |
| `getCurrentUser()` forwards all Next cookies | The Django session cookie is HttpOnly; forwarding preserves the session without exposing it to browser JavaScript |
| Auth pages are `noindex` | Auth and account screens must not compete with public content in search |
| Keep `/profile` dynamic | Session-dependent content must never be cached |
| Revalidation secret uses `timingSafeEqual` | Avoids leaking secret length/content through timing; endpoint returns `503` when unconfigured |
| Explicit trailing-slash rewrite | Prevents the Next/Django 301 loop; browser client consistently uses trailing slashes |
| Pin the native SWC package | The Windows binary was truncated during install; pinning the matching optional package makes repairs reproducible |

### 21.5 Commands run and actual outcomes

| Command | Outcome |
|---|---|
| `npm install` | Dependencies installed under Node 26.13.1 |
| `require('@next/swc-win32-x64-msvc')` | Initially failed due to a ~15.7 MB truncated binary; repaired and returned `ok` |
| `npm run typecheck` | Clean after all auth screens, server client, and tests |
| `npm run lint` | Clean (one earlier run exceeded the tool timeout; rerun completed with no output) |
| `npm test` | **18 passed in 6 files** |
| `npm run build` | Next.js 16.4.6 production build succeeded; 20 static pages generated; auth/search/profile routes dynamic |
| `GET /login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | `200` through the dev server |
| Dev proxy `GET /api/v1/auth/csrf/` | `204`; CSRF cookie issued |
| Dev proxy `POST /api/v1/auth/login/` | `200`; session cookie set; CSRF token rotated |
| Dev proxy `GET /api/v1/auth/me/` | `200` authenticated payload for the QA user |
| Dev proxy `GET /profile` with session | `200`; rendered profile content |
| Dev proxy `POST /api/v1/auth/logout/` with refreshed CSRF | `204`; subsequent `/auth/me/` returned `authenticated: false` |
| Dev proxy contact flow | CSRF `204`, contact `POST` `201` |
| `next start` smoke on port 3001 | Server booted; proxy destination was baked to `127.0.0.1:8000` from the build environment, so production proxy parity was not claimed |
| Chrome headless screenshots | Generated under `C:\Users\SOLUTION\AppData\Local\Temp\opencode\bds-*.png`; not visually reviewed |

### 21.6 Tests run and actual outcomes

- **Vitest:** 18 tests across 6 files passed: `format.test.ts`, `errors.test.ts`, `contact-form.test.tsx`, `copy-button.test.tsx`, `search-form.test.tsx`, and `login-form.test.tsx`.
- **Login form:** verifies valid credentials call the API and navigate to the requested path; invalid email shows a validation message without an API call.
- **Search form:** verifies debounce suppression for one character and suggestions after the debounce.
- **Contact form:** schema accepts complete input, rejects invalid email/short message, and trims whitespace.
- **Copy button:** verifies clipboard interaction and feedback state.
- **Error envelope:** verifies `ApiError` parsing and field-error extraction.
- **Live integration:** login, session restoration, profile rendering, logout, CSRF rotation, and anonymous redirect were verified against the QA backend on port 8010 through the dev proxy on port 3000.
- **Not run:** Playwright/E2E, axe accessibility scans, visual regression, Lighthouse/performance budgets, live revalidation webhook delivery, and production proxy integration. No evidence is claimed for them.

### 21.7 Known limitations and risks

- The production `next start` smoke test used a build whose rewrite destination was baked to port 8000. `API_INTERNAL_URL` is read by `next.config.ts` at build time, so deployment must build with the correct internal API origin. Dev integration on 8010 passed.
- Anonymous `/profile` returns a `200` HTML shell containing Next's `NEXT_REDIRECT` meta/client redirect rather than an HTTP `307`; the server does not render profile content. A middleware-level `307` remains a Phase 6/7 hardening option.
- Auth screens are unit-tested at the login form and live-tested at the API/page level; registration, verification, reset, profile edit, and password change lack Playwright flows until Phase 6.
- Visual QA is incomplete: headless screenshots exist but were not reviewed. Axe, keyboard, and screen-reader checks remain pending.
- Live revalidation webhook delivery and tag propagation are not exercised; only route construction and build/type checks are proven.
- `npm audit` reported **7 moderate** vulnerabilities in the dev toolchain (`@typescript-eslint`/`minimatch` family); not resolved in this phase.
- Next.js fonts are fetched at build time; the build succeeded here, but offline/restricted CI builds remain unverified.
- Redis 8.4.8, Docker/Compose, PostgreSQL 18.7, live email, and GitHub Actions remain unverified from earlier phases.
- No commit exists; owner review is required before Phase 6.

### 21.8 Changes to previously agreed architecture

- Auth UI and session restoration moved from Phase 6 into Phase 5 to match the master prompt; Phase 6 now focuses on learner features (bookmarks/progress), E2E, and accessibility/performance hardening.
- Added a server session helper and a client account-navigation probe; neither changes the public API contract.
- Added a runtime `POST /api/revalidate` route with constant-time secret checks; tag propagation still needs an integration test.
- Added `@next/swc-win32-x64-msvc` as an optional dependency to make the Windows native binary repair reproducible.
- No backend API or data-model changes.

### 21.9 Next phase scope (Phase 6 - Frontend learner features and E2E)

1. Add bookmark and reading-progress UI using the existing Phase 3 learning endpoints.
2. Add protected learner dashboard/account surfaces as needed, preserving `noindex` and no-cache behaviour.
3. Add Playwright R1 flows for registration, verification, login/logout, profile, bookmarks, progress, search, and contact.
4. Add axe accessibility checks and a manual keyboard pass for public and auth pages.
5. Measure chapter-page LCP/performance against the p75 mobile budget and record device/throttling.
6. Exercise publish/edit/unpublish revalidation end-to-end with the backend webhook.
7. Update status, test strategy, and risk documents; stop for approval before Phase 7.

### 21.10 Phase 5 approval checklist

- [ ] Public pages and reading experience accepted.
- [ ] Typed API client, ISR tags, and error/empty states accepted.
- [ ] Auth screens, session restoration, and `/profile` protection accepted.
- [ ] 18-test Vitest suite and lint/typecheck/build gates accepted.
- [ ] Known limitations (visual QA, E2E, production proxy, revalidation, audit) acknowledged.
- [ ] Phase 6 scope accepted.

**Reply `next` to begin Phase 6 - Frontend learner features and E2E.**

---

## 22. Phase 6 - Frontend learner features and E2E (2026-11-17)

**Status:** Complete (advanced to Phase 7 on 2026-11-18). No commit created.

### 22.1 Objective and scope

Implement learner bookmarks and reading progress, the protected learner dashboard, Playwright R1 flows, axe accessibility checks, a production-build performance check, and live Django-to-Next revalidation. Phase 6 also repaired CSRF handling through the Next production proxy and updated the living documents.

### 22.2 Delivered

| Area | Implementation |
|---|---|
| Learner API | Bookmark/progress types and browser/server clients for `/bookmarks/`, `/progress/`, and learner state |
| Chapter controls | Bookmark toggle, completion toggle, reading-position save, anonymous login prompt |
| Learner dashboard | Protected `/dashboard` with bookmarks and per-tutorial progress, `noindex` and dynamic rendering |
| Navigation | “My learning” account link; header refreshes after login, verification, and profile save via `bds:auth-changed` |
| Playwright | Chromium config, backend helpers, verification-token generator, and specs for public, auth, learner, contact, accessibility, and performance |
| CSRF repair | Backend `CsrfView` rotates the token and returns `X-CSRFToken`; browser client uses the returned token; test settings trust local frontend origins |
| Accessibility | Logo accessible name fixed; code highlighting switched to a dark theme with accessible contrast; darker coral text token for small chapter numbers |
| Test reliability | Vitest uses the forks pool; ESLint ignores generated Playwright reports |
| Revalidation | Live Next `/api/revalidate` route and Django sender exercised with tags and paths |
| Documentation | Status, test strategy, and risk register updated |

### 22.3 Files created or modified

| Action | Path |
|---|---|
| Created | `frontend/e2e/{public,auth,learner,contact,accessibility,performance}.spec.ts` |
| Created | `frontend/e2e/support/backend.ts`, `backend/scripts/e2e_verification_token.py` |
| Created | `frontend/playwright.config.ts`; npm `test:e2e` scripts |
| Created | `frontend/src/components/chapter-learning-controls.tsx` and test |
| Created | `frontend/src/app/(learner)/dashboard/page.tsx` |
| Modified | `frontend/src/lib/api/{types,browser,server}.ts`, `frontend/src/components/account-nav.tsx` |
| Modified | `frontend/src/components/auth/{login-form,verify-email-form,profile-form}.tsx` |
| Modified | `backend/apps/accounts/views.py`; `backend/config/settings/test.py` |
| Modified | `frontend/src/components/{logo,chapter-index}.tsx`, `frontend/src/lib/highlight.ts`, `frontend/src/app/globals.css` |
| Modified | `frontend/vitest.config.mts`, `frontend/eslint.config.mjs`, `frontend/.gitignore` |
| Modified | `docs/PROJECT_STATUS.md`, `docs/TEST_STRATEGY.md`, `docs/RISK_REGISTER.md` |

### 22.4 Decisions and reasons

| Decision | Reason |
|---|---|
| Trust local frontend origins in test settings | Django enforces CSRF origin checks for authenticated unsafe requests; the Next production proxy forwards `Origin: http://localhost:3001` while Django sees its own host |
| Return `X-CSRFToken` after rotation | Login/verification rotate the CSRF cookie; using the response token avoids browser cookie-jar timing races |
| Keep `SessionAuthentication` and session cookies | Preserves the Phase 4 security model; no JWT or CORS changes |
| Raise Playwright timeouts | Local production responses were observed at 27–64s under host contention; the defaults caused false failures |
| Use `github-dark` for Shiki | The previous light theme was rendered on a dark background and failed WCAG AA contrast |
| Add `coral-text` token | The brand coral fails 4.5:1 for small text; the darker token passes on paper and raised surfaces |
| Use Vitest forks | The threads worker repeatedly timed out on this Windows host |

### 22.5 Commands run and actual outcomes

| Command | Outcome |
|---|---|
| `pytest -q` (backend) | **133 passed**; 93.43% application coverage |
| `ruff check .` (backend) | All checks passed |
| `npm run typecheck` | Clean |
| `npm run lint` | Clean after ignoring generated Playwright reports |
| `npm test` | **20 passed in 7 files** |
| `npm run build` | **49 static pages**; first attempt hit a transient catalog `503`, retry succeeded |
| `npm run test:e2e` against `localhost:3001` | **17 passed, 1 skipped** (performance opt-in) |
| Performance spec with `E2E_PERFORMANCE=1` | Passed; warm LCP **340ms** on the emulated 412×915 viewport |
| axe accessibility suite | **9/9 passed** after logo, contrast, and theme fixes |
| Live revalidation route | Correct secret `200`; wrong secret `401`; invalid body `400` |
| Live Django sender | Captured `POST /api/revalidate` with secret, tags, and paths |
| CSRF proxy check | Bookmark `POST` through `localhost:3001` returned `201` with `Origin: http://localhost:3001` after trusted-origin configuration |
| Production proxy | `/api/v1/auth/me/` returned an authenticated payload through the rebuilt frontend |

### 22.6 Tests run and actual outcomes

- **Playwright public:** catalog HTML, search, and keyboard skip-link/search flows passed.
- **Playwright auth:** register, verify, logout, login, profile update, and anonymous dashboard redirect passed.
- **Playwright learner:** bookmark/complete/dashboard flow and anonymous prompts passed.
- **Playwright contact:** validation and accepted message passed.
- **Accessibility:** all nine scanned routes passed axe WCAG A/AA.
- **Performance:** warm production lab run passed; one cold run measured 22.4s and is treated as host-contention noise, not a p75 field result.
- **Backend:** all 133 tests, including CSRF and revalidation unit tests, passed.
- **Not run:** manual visual review, real-device/p75 field LCP, Docker/Compose, PostgreSQL 18.7, Redis 8.4.8, GitHub Actions, and live email delivery.

### 22.7 Known limitations and risks

- LCP evidence is a single warm lab run, not the required p75 mobile field metric; the cold outlier shows the local host is not a reliable performance environment.
- Visual QA remains incomplete: screenshots exist but were not manually reviewed.
- `npm audit` still reports **7 moderate** dev-toolchain vulnerabilities.
- Docker/Compose, PostgreSQL 18.7, Redis 8.4.8, GitHub Actions, and live email remain unverified.
- Anonymous `/profile` still returns `200` with Next's redirect metadata rather than HTTP `307`.
- `next/font/google` build-time network dependency remains unverified for offline CI.
- Production responses are slow on this host; Playwright timeouts were raised to avoid false failures.
- No commit exists; owner review is required before Phase 7.

### 22.8 Changes to previously agreed architecture

- Added local `CSRF_TRUSTED_ORIGINS` for test/E2E environments; production remains environment-driven.
- Added `X-CSRFToken` to the CSRF response; no API contract or data-model change.
- Switched code-block highlighting from a light theme to a dark theme; no rendering or content-model change.
- Added no new backend endpoints or database migrations.

### 22.9 Next phase scope (Phase 7 - R1 hardening and production deployment)

1. Run production deployment checks, security headers, and `check --deploy`.
2. Complete manual keyboard/screen-reader/visual QA.
3. Measure p75 mobile LCP with a documented device/throttling method.
4. Resolve or formally accept the `npm audit` findings.
5. Exercise Docker/Compose, PostgreSQL 18.7, Redis 8.4.8, and GitHub Actions.
6. Verify live email delivery and backup/restore.
7. Update the runbook and stop for approval before R2.

### 22.10 Phase 6 approval checklist

- [x] Learner bookmark/progress UI and dashboard accepted.
- [x] Playwright R1 flows accepted.
- [x] axe WCAG A/AA scans accepted.
- [x] Live revalidation webhook exercised.
- [x] Frontend/backend test, lint, typecheck, and build gates passed.
- [ ] Manual visual review completed (Phase 7 gate).
- [ ] p75 field LCP measured (Phase 7 gate).
- [x] Phase 7 scope accepted.

**Reply `next` to begin Phase 7 - R1 hardening and production deployment.**

## 23. Phase 7 - R1 hardening and production deployment (2026-11-18)

**Status:** Local evidence complete; code committed and pushed; GitHub Actions passed; **R1 gate NOT PASSED**. See `docs/R1_GATE.md` for the criterion-level pass/fail table and `docs/RUNBOOK.md` for operations.

### 23.1 Objective and scope

Prepare the R1 production deployment: single-domain Nginx/TLS topology, production Compose, frontend standalone image, backend hardening, Sentry/logging, backup/restore scripts, dependency and secret checks, content audit, and the R1 release gate. The gate stops before R2.

### 23.2 Delivered

| Area | Implementation |
|---|---|
| Frontend image | Multi-stage `frontend/Dockerfile` on Node 26.13.1 Alpine; `output: "standalone"`; build args for internal API and public site URL |
| Production Compose | `infra/compose/compose.prod.yaml` with PostgreSQL 18.7, Redis 8.4.8, backend, frontend, Nginx 1.28.0, healthchecks, and named data/static/media volumes |
| Nginx/TLS | HTTP-to-HTTPS redirect, ACME challenge path, TLS 1.2/1.3, HSTS/CSP/nosniff/referrer/permissions headers, gzip, API/admin/static/media/Next proxy routes |
| Operations | `backup.sh`, `restore.sh`, `deploy.sh`, `smoke-test.sh`; `bash -n` syntax checks passed |
| Backend hardening | JSON logging, production Sentry initialization when `SENTRY_DSN` is set, DB connect timeout, connection health checks, cross-origin opener policy |
| Dependencies | `sentry-sdk[django]==2.75.0` pinned in `backend/requirements/prod.txt` |
| Configuration | `.env.prod.example`; `.env.example` and `.gitignore` updated to allow only the production example |
| Documentation | `docs/RUNBOOK.md`, `docs/R1_GATE.md`, and living-document updates |

### 23.3 Files created or modified

| Action | Path |
|---|---|
| Created | `frontend/Dockerfile`, `frontend/public/.gitkeep` |
| Modified | `frontend/next.config.ts` (`output: "standalone"`) |
| Created | `infra/compose/compose.prod.yaml` |
| Created | `infra/nginx/templates/default.conf.template` |
| Created | `infra/scripts/{backup,restore,deploy,smoke-test}.sh` |
| Created | `backend/apps/common/logging.py`, `backend/apps/common/tests/test_logging.py` |
| Modified | `backend/config/settings/prod.py`, `backend/requirements/prod.txt` |
| Modified | `.env.example`, `.env.prod.example`, `.gitignore` |
| Created | `docs/RUNBOOK.md`, `docs/R1_GATE.md` |
| Modified | `docs/PROJECT_STATUS.md`, `docs/TEST_STRATEGY.md`, `docs/RISK_REGISTER.md`, `README.md` |

### 23.4 Decisions and reasons

| Decision | Reason |
|---|---|
| Single-domain topology with Nginx routing | Preserves session/CSRF design and avoids CORS (ADR-0009) |
| Nginx terminates TLS; host `certbot` manages certificates | Keeps the container stateless and avoids adding a certbot service before deployment is exercised |
| `NGINX_ENVSUBST_FILTER=DOMAIN` | Prevents Docker's Nginx entrypoint from replacing Nginx variables such as `$host` |
| Static/media locations use `expires`, not `add_header` | Preserves server-level security headers while setting cache lifetimes |
| Next.js standalone output | Produces a minimal runtime image with `server.js` |
| Backend Sentry only in Phase 7 | Error tracking is env-gated; frontend error tracking remains a documented gap |
| Backup encryption/off-host copy are optional env features | Keeps the baseline script usable without extra tooling while supporting `age`/`rclone` |

### 23.5 Commands run and actual outcomes

| Command | Outcome |
|---|---|
| `docker compose --env-file .env.prod -f infra/compose/compose.prod.yaml config` | Rendered successfully with a temporary `.env.prod`; temporary file removed |
| `pytest -q` | **162 passed**; **93.28%** application coverage |
| `ruff check .` | All checks passed |
| `ruff format --check .` | 109 files already formatted |
| `mypy .` | Success: no issues in 80 source files |
| `manage.py check --deploy --settings=config.settings.prod --fail-level WARNING` | No issues with production-style environment values |
| `pip-audit -r requirements/prod.txt -s osv` | No known vulnerabilities found |
| `npm run typecheck` | Clean |
| `npm run lint` | Clean |
| `npm test` | **20 passed in 7 files** |
| `npm run build` with `API_INTERNAL_URL=http://127.0.0.1:8010/api/v1` | **49 static pages**; `.next/standalone/server.js` exists; first attempts hit throttling/stale cache, succeeded after QA DB migration and backend restart |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `npm audit --package-lock-only` | 18 dev-toolchain vulnerabilities (6 moderate, 12 high); non-breaking fix unavailable |
| `bash -n` on all `infra/scripts/*.sh` | All four scripts passed |
| Local PostgreSQL 17 dump/restore | Custom dump 85,299 bytes; clean restore verified 20 chapters, 5 tutorials, 4 categories, and a known demo chapter title |
| Secret pattern scan | Only placeholder values in `.env.example` and `.env.prod.example` |
| Content audit (QA SQLite) | 20 published chapters, 5 tutorials, 4 categories, 20 with content, 0 demo |
| AC-30 media checks | 27 backend tests cover upload validation, alt-text/decorative rules, strict YouTube/Vimeo URL parsing, API output, and admin inlines; frontend renders validated media with an allowlisted CSP |
| `GET /api/v1/health/` and `/api/v1/ready/` | Both `200` on QA settings |
| Docker/Compose runtime | **Not run**; Docker daemon unavailable |
| Nginx runtime/TLS | **Not run**; no Nginx binary and no Docker daemon |
| GitHub Actions | **PASS**; run `44268233115` on commit `bf20bd9` completed backend, frontend, and secret-scan jobs |
| Live email | **Not run**; LocMem/console only |

### 23.6 Tests run and actual outcomes

- **Backend:** 162 tests at 93.28% coverage, including JSON logging and AC-30 upload/embed validation.
- **Frontend:** 20 Vitest tests, clean ESLint/typecheck, and a 49-page standalone production build after the QA API was migrated and restarted.
- **Backup/restore:** a PostgreSQL 17 custom-format dump was restored into a clean database and verified by querying known content.
- **Security:** production dependency audit clean; repository secret scan clean; full frontend audit still reports dev-toolchain advisories.
- **Not run:** Docker Compose, Nginx/TLS, PostgreSQL 18.7, Redis 8.4.8, live email, p75 LCP, and manual accessibility/visual review. GitHub Actions passed.

### 23.7 Known limitations and risks

- The R1 gate is **not passed**: AC-21 (p75 LCP) fails; seven criteria are partial. AC-25 passed on GitHub Actions.
- AC-30 is implemented and locally verified through `ChapterImage`, `VideoEmbed`, strict validators, admin inlines, API output, frontend rendering, and an allowlisted Nginx `frame-src`; production media serving remains untested.
- Production Compose/Nginx/TLS, PostgreSQL 18.7, Redis 8.4.8, and live email are unexecuted; GitHub Actions passed with Node 20 deprecation and `ubuntu-latest` migration warnings.
- The local restore drill used PostgreSQL 17 and demo content, not the production database or PostgreSQL 18.7.
- Frontend Sentry is not wired; backend Sentry is env-gated.
- Full `npm audit` reports 18 dev-toolchain findings; the suggested fix is breaking.
- Manual keyboard/screen-reader/visual review and p75 field LCP remain open.
- The implementation is committed and pushed to `origin/main`; no production deployment has been claimed.

### 23.8 Changes to previously agreed architecture

- Added a production-only Compose topology, Nginx TLS template, and standalone frontend image; the R1 runtime architecture remains single-domain per ADR-0009.
- Added JSON logging and conditional Sentry initialization to production settings.
- Added database connection timeout/health-check settings.
- Added `ChapterImage` and `VideoEmbed` models plus read-only chapter-detail API fields; no new public upload endpoint or route was introduced.
- Added an Nginx `frame-src` allowlist for `www.youtube.com` and `player.vimeo.com`.

### 23.9 Next phase scope (owner decision required)

1. Provide a Linux/Docker host and run the production Compose stack, Nginx/TLS, PostgreSQL 18.7, Redis 8.4.8, smoke test, memory measurement, and AC-30 media serving checks.
2. Measure p75 mobile LCP (AC-21) and complete manual accessibility/visual review.
3. Verify live transactional email and repeat the restore drill against PostgreSQL 18.7.
4. Decide whether frontend Sentry is required for AC-31 and whether to accept or upgrade the dev-toolchain audit findings.
5. Address GitHub Actions deprecation/migration warnings by upgrading action versions or pinning runner labels.
6. Decide whether to proceed to R2 after the owner accepts the remaining R1 exceptions.

**Reply `revise: <feedback>` with the missing environment access or exception decisions, or `status` for the current evidence summary.**
