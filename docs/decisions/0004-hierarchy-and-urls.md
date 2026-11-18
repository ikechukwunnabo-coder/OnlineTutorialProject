# ADR-0004: Hierarchy and URL scheme — Category → Tutorial → Chapter

- **Status:** Accepted
- **Date:** 2026-11-13
- **Related:** ARCHITECTURE.md data model

## Context

The master prompt defines Category → Tutorial → Chapter and example URLs `/categories/{category}`, `/tutorials/{tutorial}`, `/tutorials/{tutorial}/{chapter}`. It also says slugs are unique within their parent scope. The tutorial URL has no category segment, so a tutorial slug scoped only by category would be ambiguous.

## Decision

Retain the three-level hierarchy and the example URL scheme:

| Entity | URL | Slug uniqueness |
|---|---|---|
| Category | `/categories/{category}` | Globally unique |
| Tutorial | `/tutorials/{tutorial}` | **Globally unique** (required by the URL shape) |
| Chapter | `/tutorials/{tutorial}/{chapter}` | Unique within its tutorial |
| Blog post (R2) | `/blog/{post}` | Globally unique |

- Slugs are lowercase ASCII, hyphen-separated, generated from the title, and editable by an administrator.
- Reserved slugs for tutorials and categories are rejected (`search`, `login`, `register`, `profile`, `bookmarks`, `progress`, `admin`, `api`, `blog`, `sitemap`, `robots`).
- A published slug change creates a `SlugRedirect` from the old public path to the new one (301). Redirects are validated to prevent loops and duplicate targets.
- Canonical URLs always use the current slug; old URLs redirect rather than render duplicate content.
- There is no separate "Series" entity. Series progress equals tutorial progress.
- Blog and other future content types reuse the same redirect mechanism by storing absolute paths.

## Consequences

**Positive:** matches the specified URLs; simple canonical rules; redirects are content-agnostic; the frontend route structure maps directly to the data model.

**Negative:** tutorial slugs must be globally unique, which is stricter than "unique within category"; administrators get a clear validation error if a duplicate is attempted.

## Alternatives considered

1. **Nested tutorial URL** (`/categories/{category}/{tutorial}`) — would allow category-scoped slugs but diverges from the specified URLs; rejected.
2. **Tutorial slugs scoped by category with non-canonical URLs** — creates ambiguity and duplicate-content risk; rejected.
3. **UUID-based URLs** — worse for SEO and memorability; rejected for public content.
