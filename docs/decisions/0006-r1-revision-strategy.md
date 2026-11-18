# ADR-0006: R1 revision strategy uses Django admin history

- **Status:** Accepted
- **Date:** 2026-11-13
- **Related:** R2 ContentRevision, review workflow

## Context

R1 requires content editing through Django admin but defers full revision history and review workflow to R2. The master prompt requires R1 to document an initial revision strategy.

## Decision

R1 relies on **Django admin history** (`LogEntry`) as the revision record:

- Every create, change, and delete made through Django admin is recorded with actor, timestamp, and changed fields.
- Markdown content is visible in the change history for recovery.
- Administrators must not perform destructive edits outside admin; direct database edits are an operational procedure with a backup taken first.
- Chapter content is additionally recoverable from the nightly database backup.
- `ContentRevision` with explicit snapshots, review states, and rollback UI is implemented in R2 (Phase 8a).

R1 does not implement a custom revision table, diff UI, or review state beyond draft/published/archived.

## Consequences

**Positive:** no extra schema or UI in R1; auditable changes for a solo editor; aligns with the release boundary.

**Negative:** no one-click restore in R1; history is less readable than a dedicated revision diff; large Markdown edits are stored as field changes rather than full snapshots. Acceptable for a single trusted editor.

## Alternatives considered

1. **Build ContentRevision in R1** — scope creep into R2; rejected.
2. **Git-backed content store** — conflicts with database-driven admin content; rejected.
3. **No history** — violates auditability; rejected.
