# ADR-0010: API versioning and consistent error envelope

- **Status:** Accepted
- **Date:** 2026-11-13
- **Related:** API_CONTRACT.md, drf-spectacular

## Context

The API must have one consistent error format, live under `/api/v1/`, and publish a validated OpenAPI schema. Multiple endpoint groups (auth, catalog, search, learning, contact, system) need predictable client handling.

## Decision

### Versioning

- All routes live under `/api/v1/`.
- `v1` is supported until at least six months after `v2` is announced.
- Breaking changes require a new version; additive fields are allowed within a version.
- Deprecation is announced in the OpenAPI description and the project status document.
- API versioning is independent of content slugs; URLs rendered to users remain unversioned.

### Success responses

- Single resources return the object directly.
- Collections return DRF pagination: `{ "count", "next", "previous", "results" }` when pagination applies.
- Small fixed collections (categories, tags, redirects, progress summaries) may return arrays; this is documented per endpoint.
- Delete endpoints return `204` with no body unless a body is documented.
- Creation returns `201` with the created resource or a documented representation.

### Error envelope

All errors use:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed.",
    "details": {
      "email": ["Enter a valid email address."]
    },
    "request_id": "01J8Z8Y6V6K3J9Q2W7N4T1B0XA"
  }
}
```

- `code` is a stable machine-readable string.
- `message` is safe to display and never leaks internals.
- `details` is an object for field errors or an empty object.
- `request_id` matches the `X-Request-ID` response header for log correlation.
- Unexpected 500 responses never include exception text or stack traces.

### Error codes

| HTTP | Code | Typical cause |
|---|---|---|
| 400 | `validation_error` | Invalid body, query, or filter |
| 401 | `authentication_required` | Missing/expired session on a protected route |
| 403 | `permission_denied` | Authenticated but not allowed |
| 403 | `csrf_failed` | Missing/invalid CSRF token |
| 404 | `not_found` | Unknown slug or unpublished content |
| 405 | `method_not_allowed` | Unsupported method |
| 409 | `conflict` | Uniqueness or state conflict |
| 429 | `throttled` | Rate limit exceeded; `Retry-After` is set |
| 503 | `service_unavailable` | Readiness failure (database/Redis) |
| 500 | `server_error` | Unhandled server error |

### OpenAPI

- `drf-spectacular` generates the schema from serializers and views.
- The schema endpoint is staff-only in production.
- CI validates schema generation and fails on warnings in Phase 3.

## Consequences

**Positive:** one client error path; predictable version lifecycle; request IDs make support and log correlation practical.

**Negative:** DRF's default error shape is replaced by a custom exception handler; every new endpoint must use the documented pagination and error conventions.

## Alternatives considered

1. **No versioning** — risks breaking clients; rejected.
2. **Header-based versioning** — less visible and harder to cache; rejected.
3. **Problem Details (RFC 9457)** — compatible in spirit, but the custom envelope is simpler for this single client; not adopted.
