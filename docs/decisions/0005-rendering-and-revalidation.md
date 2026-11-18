# ADR-0005: Rendering, caching, and revalidation strategy

- **Status:** Accepted
- **Date:** 2026-11-13
- **Related:** ADR-0002 (Redis), ADR-0009 (topology), ARCHITECTURE.md

## Context

Public category, tutorial, chapter, and homepage content must render in the initial HTML for SEO and fast mobile loads, while auth pages and learner state must never be cached or indexed. Editors publish, edit, and unpublish content through Django admin, and the frontend must reflect changes promptly.

## Decision

Use Next.js App Router with **server rendering plus incremental static regeneration (ISR)** for public content, and **dynamic rendering** for personalized or non-indexable routes.

### Route strategy

| Route | Rendering | Revalidate | Cache tags | Indexable |
|---|---|---|---|---|
| `/` homepage | ISR, Server Components | 60 s + on-demand | `home`, `catalog` | Yes |
| `/categories/[slug]` | ISR | 300 s + on-demand | `category:{slug}`, `catalog` | Yes |
| `/tutorials/[slug]` | ISR | 300 s + on-demand | `tutorial:{slug}`, `catalog` | Yes |
| `/tutorials/[tutorial]/[chapter]` | ISR | 300 s + on-demand | `chapter:{tutorial}/{chapter}`, `tutorial:{tutorial}`, `catalog` | Yes |
| `/blog/*` (R2) | ISR | 300 s + on-demand | `blog`, `catalog` | Yes |
| `/search` | Dynamic SSR | none | none | No (`noindex`) |
| `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | Dynamic SSR | none | none | No |
| `/profile`, `/bookmarks`, `/progress` | Dynamic SSR | none | none | No |
| `/api/revalidate` | Next route handler | none | none | No |

- Server Components fetch the Django API with `fetch(url, { next: { revalidate, tags } })`.
- Auth state is read per request from the forwarded session cookie; pages that read cookies are dynamic by construction.
- Search results are never cached publicly because they reflect arbitrary queries; the underlying search data may be cached server-side.
- The exact Next.js 16 cache API is validated in Phase 5; if `next: { revalidate, tags }` differs under Cache Components, the fallback is segment-level `export const revalidate` plus explicit tag revalidation, with this ADR updated before implementation.

### Publishing and invalidation chain

1. An administrator publishes, edits, or unpublishes a category, tutorial, chapter, or code example in Django admin.
2. A Django signal deletes the related Redis cache keys (see the cache table in `ARCHITECTURE.md`).
3. Django sends `POST /api/revalidate` to the Next.js service with the tag list and the shared `REVALIDATE_SECRET` header.
4. Next.js validates the secret, calls `revalidateTag` for each affected tag, and returns `200`.
5. If the webhook fails, Django logs the error and records it in the administrative audit log. An admin action "Republish content" re-sends the webhook; the 60–300 s TTL remains a safety net.
6. Unpublishing removes the page from the sitemap on the next sitemap revalidation and makes it return 404 after the tag is revalidated.

### Cache headers

- Public API GET responses: `Cache-Control: public, max-age=60..300, stale-while-revalidate=60` set per endpoint.
- Auth and learner endpoints: `Cache-Control: no-store`.
- Next.js static assets: immutable, fingerprinted.

## Consequences

**Positive:** fast repeat loads; content visible without JavaScript; predictable freshness; editors see changes within seconds; search/auth never leak into shared caches.

**Negative:** two cache layers (Redis and Next) must be invalidated consistently; webhook failure can delay updates up to the TTL; ISR adds build/runtime complexity.

## Alternatives considered

1. **Full SSR on every request** — simpler invalidation but more database load and slower TTFB; rejected.
2. **Static export** — cannot support sessions or dynamic learner pages; rejected.
3. **Client-side fetching** — violates the requirement for content in the initial HTML; rejected.
