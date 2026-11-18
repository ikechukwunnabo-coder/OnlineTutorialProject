# ADR-0009: Single-domain topology with `/api/` reverse proxy

- **Status:** Accepted
- **Date:** 2026-11-13
- **Related:** ADR-0001 (auth), ADR-0005 (rendering), ADR-0011 (editorial console), ARCHITECTURE.md deployment

## Context

The master prompt defaults to one primary domain with Django served under `/api/` through a reverse proxy. A split origin (for example `api.example.com`) would require cross-origin credentials, a precise CORS allowlist, and cookie `Domain`/`SameSite=None` decisions. R1 has no cross-origin client requirement.

## Decision

Deploy with a **single origin**: `https://example.com`.

Nginx routes:

| Path | Upstream |
|---|---|
| `/api/v1/*` | Django (Gunicorn) |
| `/admin/*` | Django (Gunicorn) |
| `/console/*` | Next.js (editorial console) |
| `/static/*` | Nginx static volume (Django admin/DRF assets) |
| `/media/*` | Nginx media volume (uploads) |
| `/_next/static/*` | Next.js with immutable caching |
| `/*` | Next.js server |

- No CORS in production; `django-cors-headers` is not installed.
- Cookies are host-only (`Domain` unset), `SameSite=Lax`, `Secure` in production.
- `DJANGO_CSRF_TRUSTED_ORIGINS` contains only the canonical origin in production.
- Local development uses the Next.js rewrite `/api/:path*` → `http://localhost:8000/api/:path*`, keeping the browser origin at `http://localhost:3000` and avoiding CORS.
- The Next.js server calls `API_INTERNAL_URL=http://backend:8000/api/v1` inside the Docker network.
- TLS terminates at Nginx via Let's Encrypt; HTTP redirects to HTTPS.
- Only Nginx publishes ports 80/443. PostgreSQL, Redis, Django, and Next.js ports stay on the internal network.

Any future split-origin topology requires a new ADR specifying cookies, CSRF, CORS, and credential handling before implementation.

## Consequences

**Positive:** simplest auth and CSRF model; no CORS surface; one certificate; one SEO origin; internal service names stay private.

**Negative:** Nginx is a mandatory component in every environment; the Next.js and Django release cycles must be coordinated on the same host; scaling the frontend and backend independently requires revisiting the topology.

## Alternatives considered

1. **`api.example.com` subdomain** — adds CORS/cookie complexity for no R1 benefit; rejected.
2. **Separate frontend/backend hosts** — more moving parts and cost; rejected for R1.
3. **Django serving the frontend** — abandons Next.js; rejected by the stack requirement.
