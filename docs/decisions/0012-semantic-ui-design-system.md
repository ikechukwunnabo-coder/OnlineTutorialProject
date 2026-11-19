# ADR-0012: Semantic, token-based UI design system

- **Status:** Accepted
- **Date:** 2026-11-19
- **Related:** ADR-0008 (TypeScript version), ADR-0011 (editorial console), N-02 (WCAG 2.1 AA), N-03 (performance)

## Context

The R1 application already had working public pages, learner flows, and a role-protected `/console`, but the interface used repeated Tailwind utility combinations with inconsistent spacing, hierarchy, form layout, table density, code presentation, and loading/error states. A redesign was needed without changing API contracts, authentication, role boundaries, content models, or server-rendered routes. Adding a component library would introduce dependencies and operational risk late in R1.

## Decision

Use a semantic design-system layer built from CSS custom properties and reusable classes in `frontend/src/app/globals.css`, plus small typed React primitives under `frontend/src/components/ui/`.

- Design tokens cover surfaces, text, borders, focus, danger, success, and console-specific colours.
- Light and dark palettes are selected by `prefers-color-scheme`; the document declares `colorScheme: "light dark"`.
- Public pages use content-first layouts with real API data; no placeholder statistics, testimonials, or R2 features are added.
- The reader experience uses semantic article, table-of-contents, code-window, video, and progress patterns.
- The console uses a distinct rail and compact data tables while preserving frontend role checks as UX only.
- Existing tested labels, links, and API behaviour are preserved; backend permission checks remain authoritative.
- No new dependencies, migrations, endpoints, or client-side fetch framework are introduced.

## Consequences

**Positive:** one consistent visual language across public, learner, and console surfaces; fewer repeated utility strings; dark-mode support; clearer hierarchy for absolute beginners; no dependency or API-contract change.

**Negative:** cross-cutting CSS changes require visual regression review; automated axe results from before the redesign do not prove the new layouts pass; p75 mobile LCP remains unmeasured. Manual keyboard, screen-reader, contrast, and visual review are still required before AC-20 can pass.

## Alternatives considered

1. **Adopt a component library** — rejected because it adds dependencies and would risk late R1 regressions.
2. **Continue page-local Tailwind combinations** — rejected because it preserves inconsistent spacing, forms, and tables.
3. **Build a separate admin frontend** — rejected by ADR-0009/ADR-0011 single-domain topology and console decision.
4. **Hard-code a single colour theme** — rejected because dark-mode support can be delivered with tokens at low cost.
