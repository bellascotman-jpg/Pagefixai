# Phase 10 — AI Intelligence and Integration Reliability

## Implementation
- Strictly validate AI findings and supported classifications; cap output size and text lengths.
- Reject unknown or duplicate evidence references and duplicate finding titles.
- Handle provider HTTP errors, invalid JSON, empty output, and bounded request timeouts.
- Preserve deterministic audit completion when optional AI enrichment is unavailable.
- Record screenshot evidence IDs and optionally pass actual stored desktop/mobile first-viewport images to a vision-capable OpenAI Responses model.
- Visual findings are constrained to screenshots actually captured, cite screenshot evidence IDs, and cannot claim tested interactions, below-the-fold content, analytics, conversions, or revenue.
- If screenshot storage, image retrieval, provider configuration, or the vision request fails, keep deterministic findings and report the limitation.
- Keep SEO and commerce findings grounded in captured public-page evidence.

## Release gates
- Exact-commit Prisma validation/generation, typecheck, lint, unit tests, production build, and Playwright E2E must pass.
- A real provider-backed production test requires a valid deployment credential; CI cannot prove that a production secret is valid.
- Payment remains deferred to Phase 11.
