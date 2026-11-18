# ADR-0007: Demo content is flagged per record

- **Status:** Accepted
- **Date:** 2026-11-13
- **Related:** Content plan, seed command, sitemap and homepage rules

## Context

The project needs seed content for development and staging without contaminating production launch metrics, the sitemap, or the homepage. The master prompt requires clearly marked demo content and forbids fake testimonials or fake users.

## Decision

Add `is_demo` (boolean, default `False`, indexed where used for filtering) to `Category`, `Tutorial`, and `Chapter`.

Rules:

- The seed command sets `is_demo = True` and prefixes demo titles with `Demo:`.
- Demo content may be publicly viewable on staging but is **excluded** from the homepage featured/recent sections, sitemap, search results, and launch content counts.
- Demo users, testimonials, ratings, and learner counts are never created.
- The public API never exposes the flag; filtering happens server-side.
- A management command `purge_demo_content` deletes flagged records in dependency order.
- The production launch checklist requires `purge_demo_content` to have run and all counts to be verified from real content.

## Consequences

**Positive:** safe development data; clean production metrics; simple per-record control; no global flag that can accidentally hide real content.

**Negative:** three extra boolean columns; every public query must respect the demo filter; seed logic must set the flag consistently.

## Alternatives considered

1. **Global `SiteSetting.demo_mode`** — hides or shows content by environment; rejected because individual records need selective exclusion and production may legitimately hold demo drafts.
2. **Separate database for demos** — heavier operations; rejected.
3. **No demo content** — slows development and testing; rejected.
