# API Contract — Ben Digital Solution v1

**Version:** 1.0 (Phase 1)
**Date:** 2026-11-13
**Base URL:** `/api/v1`
**Status:** Contract for Phase 2–4 implementation. No endpoint is implemented in Phase 1.

Conventions in [ADR-0010](decisions/0010-api-versioning-and-errors.md) and [ARCHITECTURE.md](ARCHITECTURE.md) §9 apply to every endpoint.

---

## 1. General rules

- JSON only (`Content-Type: application/json`) for request bodies; UTF-8.
- Authenticated requests use the `bds_sessionid` cookie. Unsafe methods require `X-CSRFToken` matching the `csrftoken` cookie.
- All successful writes return the resource or a documented message; all errors use the standard envelope.
- Public catalog GETs may be cached (`Cache-Control: public, max-age=60..300`); auth, learner, search, contact, and health responses use `no-store` or are uncached.
- Draft, archived, and demo content is never returned to anonymous or learner clients; inaccessible content returns `404`, not `403`.
- `X-Request-ID` is accepted from the edge or generated; it is echoed in the response and in error envelopes.

## 2. Error envelope and codes

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed.",
    "details": { "email": ["Enter a valid email address."] },
    "request_id": "01J8Z8Y6V6K3J9Q2W7N4T1B0XA"
  }
}
```

| HTTP | Code | When |
|---|---|---|
| 400 | `validation_error` | Invalid body/query/filter; unknown ordering |
| 400 | `token_invalid_or_expired` | Verification/reset token invalid, used, or expired |
| 400 | `search_query_invalid` | Missing/too-short search query |
| 401 | `authentication_required` | No valid session on a protected route |
| 401 | `invalid_credentials` | Login failed (generic; never reveals whether email exists) |
| 403 | `email_not_verified` | Verified-only action attempted |
| 403 | `permission_denied` | Authenticated but role/ownership not allowed |
| 403 | `csrf_failed` | Missing/invalid CSRF token |
| 404 | `not_found` | Unknown slug, unpublished content, or non-owned object |
| 405 | `method_not_allowed` | Unsupported method |
| 409 | `conflict` | State conflict (duplicate bookmark handled idempotently instead) |
| 429 | `throttled` | Rate limit exceeded; `Retry-After` set |
| 500 | `server_error` | Unhandled error; no internals |
| 503 | `service_unavailable` | Readiness failure |

Validation `details` maps field names to arrays of human-readable messages. Non-field errors use the key `non_field_errors`. Messages are safe to display.

## 3. Pagination, filtering, ordering

Paginated collections: `tutorials`, `search`, `bookmarks`.

Query parameters: `page` (default 1), `page_size` (default 12, max 24; search default 10, max 20; bookmarks default 20, max 50).

Response:

```json
{ "count": 42, "next": "…?page=2", "previous": null, "results": [] }
```

Fixed collections returned as arrays: `categories`, `tags`, `redirects`, progress per-tutorial summaries. Progress is returned as one bounded object (see §5.4), not a paginated list.

Filtering and ordering per endpoint are listed below. Invalid filter/ordering values return `400 validation_error`. Ordering is an allowlist, never raw field names.

## 4. Throttle scopes

| Scope | Default rate | Applies to |
|---|---|---|
| `anon` | 60/min | Anonymous general API |
| `user` | 120/min | Authenticated general API |
| `auth` | 20/hour per IP | Login, register, verification, resend, reset request |
| `password_reset` | 5/hour per IP + 3/hour per email | Reset request/confirm |
| `contact` | 3/hour per IP | Contact form |
| `search` | 60/min anon, 120/min verified | Search results |
| `search_suggest` | 30/min anon, 60/min verified | Suggestions |

- Counters live in Redis; identifiers are hashed IPs/emails.
- `429` includes `Retry-After` and the standard envelope.
- Login also tracks failed attempts per account in Phase 3 (temporary lockout); the API response stays `invalid_credentials` to avoid enumeration.
- Production overrides come from `THROTTLE_*` env vars.

## 5. Endpoints

### 5.1 Authentication — `/api/v1/auth/`

| Method | Path | Auth | Throttle | Purpose |
|---|---|---|---|---|
| GET | `/auth/csrf/` | Any | anon | Ensure `csrftoken` cookie; `204` |
| POST | `/auth/register/` | Any | auth | Create account, send verification |
| POST | `/auth/verify-email/` | Any | auth | Consume verification token |
| POST | `/auth/resend-verification/` | Any | auth | Resend verification, enumeration-safe |
| POST | `/auth/login/` | Any | auth | Create session |
| POST | `/auth/logout/` | Session | user | Flush session |
| GET | `/auth/me/` | Any | anon/user | Session/user payload |
| PATCH | `/auth/profile/` | Session | user | Update display name/bio |
| POST | `/auth/password/reset/` | Any | password_reset | Request reset email |
| POST | `/auth/password/reset/confirm/` | Any | password_reset | Set new password, revoke sessions |
| POST | `/auth/password/change/` | Verified session | user | Change password, re-issue session |
| POST | `/auth/account/deactivate/` | Verified session | user | Deactivate account |
| DELETE | `/auth/account/` | Verified session | user | Delete account |

#### GET /auth/csrf/

- `204 No Content`, sets `csrftoken` (and a session cookie if absent).
- Called by the frontend before the first unsafe request.

#### POST /auth/register/

Request:

```json
{ "email": "learner@example.com", "password": "correct-horse-battery", "display_name": "Alex" }
```

Validation: email format/length; password ≥ 12 characters and not in the common-password list (custom validator, Phase 3); `display_name` 1–80 characters.

Response `201`:

```json
{ "message": "Check your email to verify your account." }
```

Enumeration-safe: an existing email receives the same `201` message; the system sends either a verification email or a "registration attempted" notice. Rate limits prevent mass probing. Password rules are returned on validation failure.

#### POST /auth/verify-email/

Request: `{ "token": "<token>" }` (single-use, expires after 24 hours).

- `200`: `{ "message": "Email verified.", "user": { … } }`; logs the user in by rotating the session.
- `400 token_invalid_or_expired` for invalid/used/expired tokens.
- Already verified with a valid token → `200` idempotent message.

#### POST /auth/resend-verification/

Request: `{ "email": "learner@example.com" }` (optional when authenticated; own account is used).

- Always `202 { "message": "If the account needs verification, an email has been sent." }`.
- Verified accounts and unknown emails receive the same response.

#### POST /auth/login/

Request: `{ "email": "…", "password": "…" }`

Response `200`:

```json
{
  "user": {
    "id": 12,
    "email": "learner@example.com",
    "role": "learner",
    "display_name": "Alex",
    "email_verified": true,
    "date_joined": "2026-11-13T10:00:00Z"
  },
  "message": "Logged in."
}
```

- Wrong password, unknown email, or inactive account → `401 invalid_credentials`.
- Success rotates the session key and sets `bds_sessionid` (HttpOnly, Secure in production, SameSite=Lax) plus a fresh CSRF cookie.
- Unverified users may log in; learner-only actions return `403 email_not_verified`.

#### POST /auth/logout/

- `204`; flushes the server session and expires the cookie. Safe to call twice.

#### GET /auth/me/

- Authenticated `200`:

```json
{
  "authenticated": true,
  "user": {
    "id": 12, "email": "…", "role": "learner", "display_name": "Alex",
    "bio": "", "email_verified": true, "date_joined": "…"
  }
}
```

- Anonymous `200`: `{ "authenticated": false, "user": null }`.
- `no-store`. Used by server-side rendering on every protected layout.

#### PATCH /auth/profile/

Request (any subset): `{ "display_name": "Alex", "bio": "Learning Python." }`

- `200` with updated user/profile object.
- Allowed for unverified users.

#### POST /auth/password/reset/

Request: `{ "email": "…" }` → always `202 { "message": "If an account exists, a reset email has been sent." }`.

#### POST /auth/password/reset/confirm/

Request: `{ "uid": "…", "token": "…", "new_password": "…" }`

- `200 { "message": "Password updated. Please log in." }`.
- Invalid/expired token → `400 token_invalid_or_expired`.
- On success all sessions are invalidated (`password_changed_at`).

#### POST /auth/password/change/

Request: `{ "current_password": "…", "new_password": "…" }`

- `200 { "message": "Password updated." }`; current session is re-issued, others invalidated.
- Wrong current password → `400 validation_error` with `current_password`.
- Unverified → `403 email_not_verified`.

#### POST /auth/account/deactivate/

Request: `{ "password": "…" }`

- `204`; sets `is_active=False`, flushes sessions, sends a confirmation email if configured.
- Wrong password → `400 validation_error`.

#### DELETE /auth/account/

Request: `{ "password": "…", "confirm": "DELETE" }`

- `204`; deletes the user and cascaded learner data; contact messages are anonymised if they match the account email.
- Irreversible; frontend shows a confirmation dialog.

### 5.2 Catalog — public

All catalog endpoints exclude drafts, archived content, and `is_demo` records. Cached per ARCHITECTURE.md §13.

#### GET /home/

`200`:

```json
{
  "site_name": "Ben Digital Solution",
  "featured_categories": [{ "name": "Web Development", "slug": "web-development", "icon": "globe", "description": "…" }],
  "latest_tutorials": [{ "title": "…", "slug": "…", "summary": "…", "category": { "name": "…", "slug": "…" }, "difficulty": "beginner", "estimated_reading_time": 45, "published_at": "…" }],
  "stats": { "published_tutorials": 5, "published_chapters": 20, "published_categories": 4 }
}
```

- `latest_tutorials` limited to 6; `featured_categories` limited to 4 (by `display_order`).
- Stats are live counts of published, non-demo content. Counts are real; no fabricated learner numbers.

#### GET /categories/

`200`: array of `{ "id", "name", "slug", "description", "icon", "display_order", "tutorial_count" }`.

`tutorial_count` counts published, non-demo tutorials.

#### GET /categories/{slug}/

`200`:

```json
{
  "id": 1, "name": "Web Development", "slug": "web-development",
  "description": "…", "icon": "globe",
  "tutorials": [
    { "title": "HTML for Absolute Beginners", "slug": "html-for-absolute-beginners", "summary": "…", "difficulty": "beginner", "estimated_reading_time": 40, "chapter_count": 4, "published_at": "…" }
  ]
}
```

- Tutorials ordered by `published_at` desc.
- Unknown/unpublished category → `404`.

#### GET /tutorials/

Query: `category` (slug), `difficulty` (`beginner|intermediate|advanced`), `tag` (slug), `ordering` (`-published_at` default, `published_at`, `title`, `estimated_reading_time`), `page`, `page_size`.

`200` paginated items:

```json
{
  "id": 3, "title": "HTML for Absolute Beginners", "slug": "html-for-absolute-beginners",
  "summary": "…", "category": { "name": "Web Development", "slug": "web-development" },
  "difficulty": "beginner", "estimated_reading_time": 40, "chapter_count": 4,
  "tags": [{ "name": "HTML", "slug": "html" }], "published_at": "…", "updated_at": "…"
}
```

#### GET /tutorials/{slug}/

`200`:

```json
{
  "id": 3, "title": "…", "slug": "…", "summary": "…",
  "category": { "id": 1, "name": "Web Development", "slug": "web-development" },
  "author": { "display_name": "Ben" },
  "difficulty": "beginner", "estimated_reading_time": 40,
  "tags": [{ "name": "HTML", "slug": "html" }],
  "published_at": "…", "updated_at": "…",
  "chapters": [
    { "title": "Introduction", "slug": "introduction", "order": 1, "estimated_reading_time": 8, "summary": "…" }
  ],
  "progress": null
}
```

- `progress` is present only for an authenticated verified learner: `{ "completed_chapters": 2, "total_chapters": 4, "percent": 50 }`.
- Draft/unknown slug → `404`.

#### GET /tutorials/{tutorial_slug}/chapters/{chapter_slug}/

`200`:

```json
{
  "id": 11, "title": "Your First HTML Page", "slug": "your-first-html-page", "order": 2,
  "summary": "…", "content_html": "<h2>…</h2>",
  "estimated_reading_time": 9, "published_at": "…", "updated_at": "…",
  "tutorial": { "title": "…", "slug": "…", "chapter_count": 4 },
  "code_examples": [
    { "language": "html", "title": "Minimal page", "source": "<!doctype html>…", "expected_output": "…", "order": 1 }
  ],
  "images": [
    { "url": "/media/chapter-images/diagram.png", "alt_text": "A labelled diagram", "decorative": false, "caption": "…", "order": 1 }
  ],
  "video_embeds": [
    { "provider": "youtube", "title": "Lesson video", "embed_url": "https://www.youtube.com/embed/dQw4w9WgXcQ", "order": 1 }
  ],
  "toc": [{ "id": "what-is-html", "text": "What is HTML?", "level": 2 }],
  "navigation": {
    "previous": { "title": "…", "url": "/tutorials/html-for-absolute-beginners/introduction" },
    "next": { "title": "…", "url": "/tutorials/html-for-absolute-beginners/text-and-links" }
  },
  "bookmark": { "saved": false },
  "progress": { "completed": false, "reading_position": 0 }
}
```

- `content_html` is sanitised server-side from Markdown; raw script/iframe/style is stripped. Markdown source is not exposed by the public API.
- `images` contains admin-uploaded media only; `alt_text` is empty only when `decorative` is `true`. There is no public upload endpoint.
- `video_embeds` contains only parsed YouTube/Vimeo IDs and a derived `embed_url`; arbitrary iframe HTML is never accepted or returned.
- `bookmark` and `progress` reflect the authenticated user; otherwise `{"saved": false}` and `null`.
- Navigation contains only published chapters.
- Unknown chapter/tutorial mismatch or unpublished content → `404`.

#### GET /tags/

`200`: array of `{ "id", "name", "slug", "tutorial_count" }`, published non-demo counts only.

#### GET /redirects/?path=/old-path

- `200 { "redirect": { "old_path": "/old-path", "new_path": "/new-path", "status_code": 301 } }`
- `404 not_found` if no active redirect.
- Used by Next.js middleware/route handling; cached 300 s.

### 5.3 Search — public

#### GET /search/?q=html&type=all&page=1

- `q`: required, trimmed, 2–100 characters; `websearch_to_tsquery`.
- `type`: `all` (default), `tutorials`, `chapters`, `categories`.
- `200` paginated:

```json
{
  "count": 7,
  "next": null, "previous": null,
  "results": [
    {
      "type": "chapter",
      "title": "Your First HTML Page",
      "excerpt": "…<mark>HTML</mark>…",
      "url": "/tutorials/html-for-absolute-beginners/your-first-html-page",
      "tutorial": { "title": "…", "slug": "…" },
      "score": 0.87
    }
  ]
}
```

- Ranking: relevance desc, then `published_at` desc.
- Excerpts are server-generated, plain text with `<mark>` only; sanitised.
- Only published, non-demo content. `Cache-Control: no-store`.
- `400 search_query_invalid` for empty/1-character queries.

#### GET /search/suggestions/?q=htm

- `200`: `{ "suggestions": [{ "title": "HTML for Absolute Beginners", "url": "/tutorials/html-for-absolute-beginners", "type": "tutorial" }] }`
- Limit 8; prefix match on titles; published non-demo only.
- Throttle `search_suggest`; `no-store`.

### 5.4 Learning — verified learners

All require a verified session. Unverified → `403 email_not_verified`; anonymous → `401 authentication_required`.

#### GET /bookmarks/

- Paginated, ordered `-created_at`.
- Item: `{ "id", "chapter": { "id", "title", "slug", "tutorial": { "title", "slug" }, "estimated_reading_time" }, "created_at" }`.

#### POST /bookmarks/

Request: `{ "chapter": 11 }` (chapter ID from a chapter payload).

- `201` with the bookmark. Duplicate → `200` with the existing bookmark (idempotent).
- Unpublished/unknown chapter → `404 not_found`.

#### DELETE /bookmarks/{chapter_id}/

- `204`; idempotent (already absent → `204`).

#### GET /progress/

- `200`:

```json
{
  "overall": { "completed_chapters": 3, "started_tutorials": 2, "percent_complete": 15 },
  "tutorials": [
    { "tutorial": { "title": "…", "slug": "…" }, "completed_chapters": 2, "total_chapters": 4, "percent": 50, "last_activity_at": "…" }
  ]
}
```

- `tutorials` only includes tutorials with progress; ordered by `last_activity_at` desc.
- Bounded by published chapters; revisit pagination if a learner exceeds 100 tutorials.

#### PUT /progress/{chapter_id}/

Request: `{ "completed": true, "reading_position": 80 }` (both optional; at least one required).

- Upsert; `200` with `{ "chapter": 11, "completed": true, "completed_at": "…", "reading_position": 80, "updated_at": "…" }`.
- `reading_position` 0–100; setting `completed=true` sets `completed_at` once.
- Unknown/unpublished chapter → `404`.

### 5.5 Contact — public

#### POST /contact/

Request:

```json
{ "name": "Alex", "email": "alex@example.com", "subject": "Typo in chapter 2", "message": "…", "website": "" }
```

- `website` is a honeypot; non-empty → `201` with the generic message and no storage/email.
- Validation: name 1–100, email valid, subject 1–160, message 10–5000 characters.
- `201 { "message": "Thanks — your message has been received." }` for normal submissions and for honeypot hits (no distinction).
- Stores the message with `status=new` and hashed IP, sends an email to `CONTACT_RECIPIENT_EMAIL` with `EMAIL_TIMEOUT=10`; a send failure is logged and does not change the response.
- Throttle `contact` (3/hour/IP).

### 5.6 System

#### GET /health/

- `200 { "status": "ok" }`; no database or Redis access. Used by the frontend/edge liveness check.

#### GET /ready/

- Checks PostgreSQL `SELECT 1` and Redis `PING`.
- `200 { "status": "ready", "checks": { "database": "ok", "redis": "ok" } }`
- `503 { "status": "unavailable", … }` with the standard envelope and `service_unavailable`.
- Never cached.

#### GET /schema/

- OpenAPI 3.1 document from drf-spectacular.
- Public in development; staff-only in production (`403 permission_denied` otherwise).
- `no-store`.

## 6. Query budgets

Maximum queries per request, enforced by tests in Phase 3:

| Endpoint | Budget |
|---|---|
| `/home/` | 6 |
| `/categories/` | 3 |
| `/categories/{slug}/` | 4 |
| `/tutorials/` | 4 |
| `/tutorials/{slug}/` | 6 |
| `/tutorials/{t}/chapters/{c}/` | 7 |
| `/tags/` | 3 |
| `/search/` | 5 |
| `/search/suggestions/` | 3 |
| `/bookmarks/` | 3 |
| `/progress/` | 4 |
| `/auth/me/` | 2 |
| `/contact/` (write) | 2 |
| `/import`-style admin actions | not applicable |

- Use `select_related` for category/author and `prefetch_related` for tags, chapters, and code examples.
- Budgets are asserted with `django_assert_num_queries` on seeded fixtures.

## 7. Caching headers

| Endpoint group | Header |
|---|---|
| `/home/`, `/categories/*`, `/tutorials/*`, `/tags/`, `/redirects/` | `public, max-age=60` (home) or `300`, `stale-while-revalidate=60` |
| `/search/*`, `/auth/*`, `/bookmarks/*`, `/progress/*`, `/contact/`, `/health/`, `/ready/`, `/schema/` | `no-store` |
| Verified learner fields inside otherwise public payloads (`progress`, `bookmark`) | response is `private, no-store` when the user is authenticated |

## 8. Versioning and deprecation

- All routes are versioned under `/api/v1`.
- Additive fields are allowed within v1; clients must ignore unknown fields.
- Removing/renaming fields, changing types, or changing semantics requires `/api/v2`.
- Deprecations are announced in the OpenAPI description, `PROJECT_STATUS.md`, and at least 90 days before removal; v1 remains for at least six months after v2 ships.
- Public page URLs are not versioned.

## 9. OpenAPI and validation

- `drf-spectacular` generates the schema from serializers/views; no hand-written schema.
- CI (Phase 3) runs `manage.py spectacular --file schema.yml --validate` and fails on errors.
- A contract test compares the generated schema to the endpoint list in this document; new endpoints must update both.
- Response examples in this document are normative for field names; exact ordering of JSON keys is not.

## 10. Frontend usage notes

- Server Components call `API_INTERNAL_URL` and forward cookies; browser code calls same-origin `/api/v1`.
- CSRF token is fetched once via `/auth/csrf/` and read from the `csrftoken` cookie for unsafe requests.
- `401` from a protected call triggers a redirect to `/login?next=…`; `403 email_not_verified` shows the verification banner.
- TanStack Query is used only for bookmark/progress mutations and search suggestions; initial data is server-rendered.
- The client maps `error.code` to UI states; it never renders raw server messages for 500s.
