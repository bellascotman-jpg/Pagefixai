# Phase 10 — AI Intelligence and Integration Reliability

## Objective
Make optional AI enrichment bounded, evidence-grounded, and observable without making a deterministic audit depend on a third-party model.

## Implementation scope
- Strictly validate AI output shape and supported finding classifications.
- Bound output size and text fields; reject unknown or repeated evidence IDs and duplicate titles.
- Handle provider HTTP errors before parsing responses; distinguish invalid JSON and empty output.
- Align provider request timeout with the audit worker's optional enrichment budget.
- Test classification validation, output limits, evidence validation, and duplicate suppression.
- Do not claim screenshot-pixel visual reasoning until screenshots are actually passed to a vision-capable provider and tested end-to-end.
- Keep SEO and commercial findings grounded in captured public-page evidence; do not claim private analytics, traffic, conversion, or revenue measurements.

## Release gates
- Exact-commit Prisma validation/generation, typecheck, lint, unit tests, production build, and Playwright E2E must pass.
- Verify provider-backed AI only with a successful real request; environment-variable presence alone does not prove valid credentials.
- Confirm audits complete when AI is not configured, times out, or returns invalid output.
- Payment work remains deferred to Phase 11.
