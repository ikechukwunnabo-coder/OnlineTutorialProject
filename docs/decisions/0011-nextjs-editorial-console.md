# ADR-0011: Next.js editorial console for content CRUD

- **Status:** Accepted
- **Date:** 2026-11-18
- **Related:** ADR-0006 (revision strategy), ADR-0009 (single-domain topology), ADR-0010 (API versioning and errors)

## Context

Release 1 requires editors and administrators to create, edit, publish, unpublish, and archive categories, tutorials, and chapters. Django admin already enforces these rules, but it uses a separate URL and interface from the public Next.js application. A single-domain deployment routes `/admin/*` to Django, so a Django-admin-only workflow is valid but gives authors a context switch and does not provide a branded editorial surface.

The project already uses session cookies and one origin, so a protected Next.js route can call the same authenticated API without CORS or a second credential model.

## Decision

Add a role-protected `/console` area in the Next.js application for the editorial workflow.

- Console access is limited to `editor`, `moderator`, and `admin` roles.
- `GET` on console APIs is allowed for all console roles.
- Create and update require `editor` or `admin`; delete requires `admin`.
- `status`, `published_at`, and `is_demo` are editable only by `admin`; other console users cannot change publication state.
- Slugs are generated from the source name/title; publication rules and model constraints remain enforced by Django model validation.
- Publishing a tutorial requires at least one published chapter.
- Every create, update, and delete writes an `AdministrativeAuditLog` entry.
- The console uses `/api/v1/admin/overview/` and `/api/v1/admin/content/*`; Django admin remains available for users, settings, media, audit history, and recovery.
- Frontend role checks are UX only; DRF permission classes authorise every request again on the backend.

## Consequences

**Positive:** authors get a consistent branded workspace; publication and delete rights remain explicit; existing session/CSRF and audit infrastructure are reused; no second origin or token system is introduced.

**Negative:** the console adds API routes and frontend pages that must stay aligned with catalog model changes; Django admin remains necessary for non-content administration; production Nginx routing for `/console` still needs a live smoke test.

## Alternatives considered

1. **Django admin only** — already implemented and auditable, but does not provide the required branded editorial surface; rejected as the only author workflow.
2. **Separate admin subdomain** — adds CORS, cookie-domain, and certificate complexity; rejected by ADR-0009.
3. **Client-only console with direct database access** — bypasses API permissions and audit logging; rejected.
