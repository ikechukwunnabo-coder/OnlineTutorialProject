# Architecture Decision Records

This folder is the single decision log. Each significant decision gets a numbered ADR. Do not create a separate decisions file.

| ADR | Title | Status | Date |
|---|---|---|---|
| [0001](0001-authentication-sessions.md) | Authentication: Django sessions with CSRF | Accepted | 2026-11-13 |
| [0002](0002-redis-in-r1.md) | Redis as shared cache and throttle backend in R1 | Accepted | 2026-11-13 |
| [0003](0003-no-celery-in-r1.md) | No Celery in R1; introduce it in R2 | Accepted | 2026-11-13 |
| [0004](0004-hierarchy-and-urls.md) | Hierarchy and URL scheme: Category → Tutorial → Chapter | Accepted | 2026-11-13 |
| [0005](0005-rendering-and-revalidation.md) | Rendering, caching, and revalidation strategy | Accepted | 2026-11-13 |
| [0006](0006-r1-revision-strategy.md) | R1 revision strategy uses Django admin history | Accepted | 2026-11-13 |
| [0007](0007-demo-content-flag.md) | Demo content is flagged per record | Accepted | 2026-11-13 |
| [0008](0008-typescript-version.md) | TypeScript 5.9.x for R1, defer TypeScript 7 | Accepted | 2026-11-13 |
| [0009](0009-single-domain-topology.md) | Single-domain topology with `/api/` reverse proxy | Accepted | 2026-11-13 |
| [0010](0010-api-versioning-and-errors.md) | API versioning and consistent error envelope | Accepted | 2026-11-13 |

## Conventions

- One decision per file, numbered sequentially, no reuse of numbers.
- Status values: Proposed, Accepted, Superseded, Deprecated.
- An ADR that changes an earlier one links to it and marks the earlier one Superseded.
- ADRs are short: context, decision, consequences, alternatives.
