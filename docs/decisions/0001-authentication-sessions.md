# ADR-0001: Authentication — Django sessions with CSRF

- **Status:** Accepted
- **Date:** 2026-11-13
- **Deciders:** Owner
- **Related:** ADR-0009 (topology), ADR-0010 (API conventions)

## Context

The platform is browser-only in R1, served from one primary domain. The Next.js frontend renders public pages on the server and calls Django REST Framework under `/api/v1/`. Accounts need registration, email verification, login, logout, session restoration, password reset and change, profile management, deactivation, and deletion. The master prompt defaults to Django session authentication unless a concrete need for JWT exists.

There is no native client and no cross-origin requirement in production. JWT would add token storage decisions, refresh rotation, revocation bookkeeping, and a second security surface without a corresponding benefit.

## Decision

Use **Django session authentication with CSRF protection**.

### Session settings

| Setting | Value |
|---|---|
| `SESSION_ENGINE` | `django.contrib.sessions.backends.cached_db` (PostgreSQL is the source of truth; Redis accelerates reads) |
| `SESSION_COOKIE_NAME` | `bds_sessionid` |
| `SESSION_COOKIE_HTTPONLY` | `True` |
| `SESSION_COOKIE_SECURE` | `True` in production, `False` only for local HTTP development |
| `SESSION_COOKIE_SAMESITE` | `Lax` |
| `SESSION_COOKIE_PATH` | `/` |
| `SESSION_COOKIE_DOMAIN` | unset (host-only cookie) |
| `SESSION_COOKIE_AGE` | 14 days |
| `SESSION_SAVE_EVERY_REQUEST` | `False` |
| `CSRF_COOKIE_NAME` | `csrftoken` |
| `CSRF_COOKIE_HTTPONLY` | `False` (the browser client must read it to send `X-CSRFToken`) |
| `CSRF_COOKIE_SECURE` | `True` in production |
| `CSRF_COOKIE_SAMESITE` | `Lax` |
| `CSRF_TRUSTED_ORIGINS` | From environment; production value is the single site origin |

DRF uses `SessionAuthentication`, which enforces CSRF on unsafe methods. Anonymous unsafe requests (register, login, password reset, contact) are also CSRF-protected.

### Flow

1. The frontend calls `GET /api/v1/auth/csrf/` once per browser session; Django sets the `csrftoken` cookie.
2. Login `POST /api/v1/auth/login/` requires the `X-CSRFToken` header. On success Django rotates the session key, sets the session cookie, updates `last_login`, and records `auth_time` in the session.
3. Server Components forward the incoming session cookie when calling the internal API.
4. Client-side mutations use same-origin `fetch` with `credentials: "include"` and the CSRF header.
5. Logout `POST /api/v1/auth/logout/` flushes the server session and expires the cookie.
6. Session restoration is a `GET /api/v1/auth/me/` call on page load; `401` means anonymous.

### Session invalidation

- **Password change or reset:** update `password_changed_at`; middleware compares it with `session["auth_time"]` and logs out sessions created before the change. The current session is re-issued via `update_session_auth_hash` on change, and re-created on reset login.
- **Deactivation:** set `is_active = False`; Django's authentication backend refuses the user, so existing session lookups resolve to anonymous.
- **Deletion:** deleting the user cascades profile, bookmarks, and progress; session lookups fail and resolve to anonymous.
- **Multi-tab:** all tabs share one cookie. Logout in one tab invalidates the server session, so other tabs receive `401` on their next request. The frontend treats `401` as logged out and redirects to login; an optional `BroadcastChannel("auth")` event in Phase 6 syncs tabs without polling.

### Account enumeration limits

- Login always returns the same `Invalid email or password.` message for unknown email, wrong password, and unverified-email cases that must not reveal account existence.
- Password reset always returns the same generic acknowledgement.
- Registration does not reveal whether an email already exists beyond a validation response; the response for an existing verified email is handled by a generic "check your email" message and an email to the owner of the address.
- All auth endpoints are throttled by scope and IP; additional per-email limits guard reset and verification resend.

## Consequences

**Positive:** no tokens in browser storage; logout is server-side; CSRF protection is native; smaller attack surface; session data can be revoked centrally; simple SSR cookie forwarding.

**Negative:** all authenticated requests depend on the session store; Redis outage affects sessions despite the DB fallback; CSRF token acquisition adds one request; a future native client would require a documented auth extension.

## Alternatives considered

1. **JWT with SimpleJWT** — rejected: token storage, refresh rotation, revocation lists, and XSS/CSRF trade-offs add complexity with no R1 need.
2. **Database session backend only** — viable but slower; cached_db already keeps PostgreSQL authoritative.
3. **Token in localStorage/sessionStorage** — explicitly forbidden by the master prompt and rejected.
