# ADR-0002: Redis as shared cache and throttle backend in R1

- **Status:** Accepted
- **Date:** 2026-11-13
- **Related:** ADR-0001 (sessions), ARCHITECTURE.md cache table

## Context

Gunicorn runs multiple worker processes. Throttle counters and cached catalog data must be shared across workers. Django's database cache would work but adds read/write load to the primary database and complicates session read performance. The master prompt defaults to Redis in R1 with a Phase 1 decision gate.

## Decision

Include **Redis 8.4.x** in R1 as:

1. the Django cache backend (`django.core.cache.backends.redis.RedisCache`) for catalog, homepage, search, redirects, sitemap, and throttle counters;
2. the cache layer for `cached_db` sessions (PostgreSQL remains authoritative);
3. the backing store for DRF throttle state.

### Configuration

| Item | Value |
|---|---|
| Image | `redis:8.4.8-alpine` (exact digest pinned in Phase 2) |
| Exposure | Internal Docker network only; never published on the host or internet |
| Persistence | Disabled for cache use; sessions are recoverable from PostgreSQL |
| Memory policy | `maxmemory 128mb` (production baseline), `allkeys-lru`; measured and adjusted in Phase 7 |
| Auth | No public exposure; optional password from environment if the host is shared |
| Key namespace | `bds:v1:<area>:<identifier>` (versioned so a cache schema change can be flushed cleanly) |
| Health | `redis-cli ping` in readiness checks and container health check |

### Failure behaviour

Redis is a required service in R1. If it is unavailable:

- `/api/v1/ready/` returns `503` with `redis: down`;
- the container restart policy and monitoring alert the operator;
- cached pages and throttles fail rather than silently degrade;
- sessions can still be read from PostgreSQL only if the cache error does not abort the request; the system is not considered healthy until Redis returns.

No silent fail-open for throttles: auth endpoints must not accept unlimited traffic when the cache is down. A 503 is safer than unthrottled authentication.

## Consequences

**Positive:** shared throttles across workers; fast session and catalog reads; small operational footprint; simple local Docker service.

**Negative:** one more stateful service to operate and back up (no data to back up); Redis outage degrades the site; a small VPS must reserve memory for it (measured in Phase 7).

## Alternatives considered

1. **Database cache** — workable for R1 but slower and adds DB load; rejected because Redis is already needed for shared throttles.
2. **LocMem cache** — not shared across Gunicorn workers; incorrect throttle behaviour; rejected.
3. **No throttling infrastructure** — violates the security requirement; rejected.
4. **Valkey** — a valid BSD-licensed alternative; Redis 8.4 is chosen for team familiarity and image availability. Revisit only if licensing or operations require it.
