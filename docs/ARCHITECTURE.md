# PageFix AI Architecture

## Core pipeline

`URL -> SSRF validation -> Playwright acquisition -> page snapshots -> deterministic extraction -> evidence -> deterministic checks -> findings -> prioritization -> AI interpretation -> AI QA -> report -> recheck`

AI does not act as the source of truth. Findings must be traceable to stored evidence or explicitly marked as user-provided.

## Tenancy

Organizations own projects and stores. Memberships determine organization access. Server-side authorization is required for every organization-scoped operation. Founder/admin cross-tenant access is explicit and audited.

## Billing

The browser selects an internal plan ID. Server-side configuration resolves the plan and expected amount. Flutterwave checkout and webhooks are treated as external events. Paid entitlements are created only after server-side verification of transaction status, amount, currency, reference, and idempotency.

## Audit jobs

Audit processing is designed as a durable state machine rather than a fake progress indicator. Each job has an audit ID, job ID, correlation ID, engine version, retry policy, timeout, and terminal state.

## Historical integrity

Every audit stores the engine version used to produce it. Rechecks create new observations rather than mutating historical evidence.
