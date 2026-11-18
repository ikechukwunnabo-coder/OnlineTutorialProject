# ADR-0003: No Celery in R1; introduce it in R2

- **Status:** Accepted
- **Date:** 2026-11-13
- **Related:** ADR-0002 (Redis), R2 certificate PDF work

## Context

R1 sends only low-volume transactional email (verification, password reset, contact notification). The master prompt requires a simple, failure-tolerant mechanism in R1 and defaults Celery to R2, where certificate PDF generation and scheduled jobs justify a worker.

## Decision

Do **not** run Celery, a scheduler, or a worker in R1.

### R1 email mechanism

- A single `send_transactional_email()` service wraps Django's email backend.
- `EMAIL_TIMEOUT` is set (default 10 seconds).
- One send attempt is made per request; failures are caught, logged with the message kind (never the token or password), and reported to error tracking when enabled.
- The request does not roll back the primary action because email failed:
  - registration succeeds and the user can request a new verification email;
  - password reset returns the same generic response and can be retried;
  - contact messages are stored before the admin notification is sent.
- No automatic background retry queue in R1. Resend endpoints are the retry mechanism.
- Tests use Django's locmem email backend and assert message content and failure handling.

### R2 transition

Celery is introduced when certificate PDF generation and scheduled maintenance arrive. Redis is already present and serves as the broker. The ADR for R2 will define queues, retries, idempotency, and worker health checks.

## Consequences

**Positive:** fewer services on a small VPS; simpler deployment; no broker configuration; no task-result backend to operate.

**Negative:** auth requests can wait up to the email timeout when the provider is slow; no automatic retry; a failed email is only fixed by the user or admin triggering a resend. Acceptable for low R1 volume.

## Alternatives considered

1. **Celery in R1** — rejected: operational cost without asynchronous work.
2. **`threading` background send** — rejected: unreliable process lifecycle in Gunicorn; failures can be lost silently.
3. **Database outbox with a cron sender** — more reliable but effectively a scheduler; deferred until R2 if email volume grows.
