# ADR-0008: TypeScript 5.9.x for R1, defer TypeScript 7

- **Status:** Accepted
- **Date:** 2026-11-13
- **Related:** Frontend toolchain, Phase 5

## Context

As of 2026-11-13, the npm registry reports TypeScript 7.0.2 as current. TypeScript 7 is a major compiler change. Next.js 16.4.6 does not list TypeScript as a peer dependency and its compatibility with TypeScript 7 has not been verified. Phase 1 must pin versions without inventing compatibility.

## Decision

- R1 uses **TypeScript 5.9.x** (exact patch pinned in Phase 5 when the frontend is scaffolded).
- TypeScript 7 is not adopted until:
  1. the exact patch is confirmed compatible with Next.js 16.4.x in a disposable branch;
  2. lint, typecheck, build, and Playwright tests pass;
  3. the change is recorded in an ADR superseding this one.
- `npm view`/registry results are recorded in the Phase 5 report.

## Consequences

**Positive:** stays on the proven compiler line; avoids unverified tooling behaviour; no impact on runtime performance (types are erased).

**Negative:** misses TypeScript 7 performance/tooling improvements during R1; a later upgrade will require a dedicated change.

## Alternatives considered

1. **TypeScript 7.0.2 immediately** — unverified with Next.js 16; rejected by version discipline.
2. **No TypeScript** — violates the stack requirement; rejected.
