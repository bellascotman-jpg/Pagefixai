# Phase 9 — Status

Status: implementation branch created; release validation pending.

## Implemented on this branch
- Evidence-aware rendering for captured image inventory, link inventory, metadata, DOM and JSON-LD.
- Image inventory now renders safe image previews and concise captions instead of raw JSON.
- Link inventory now renders readable labels and shortened destinations rather than long JSON blobs.
- Added an issue-severity bar chart based on actual saved finding counts; it does not estimate revenue or conversion impact.
- Increased the bounded screenshot capture window so desktop and mobile capture have a realistic chance to complete within the audit route's function budget.
- Added unit tests for evidence JSON parsing, relative URL resolution and rejection of unsafe URL schemes.
- Corrected the sample OPENAI_MODEL to match the implemented fallback model.

## AI and integrations reality
- Deterministic HTTP/HTML inspection and rules are the core audit engine.
- Optional text AI enrichment calls the OpenAI Responses API only when OPENAI_API_KEY or AI_PROVIDER_KEY is populated.
- The current AI enrichment uses captured text/metadata/evidence. It does not yet send screenshot pixels to a vision model.
- AI_VISION_KEY is currently an unused configuration placeholder; no claim of AI visual inspection should be made.
- Screenshot capture uses Playwright Chromium and private/database-backed storage; it does not require an AI API key.
- Vercel contains environment-variable records for OpenAI/provider/storage configuration, but the available metadata does not confirm whether the secrets are populated or valid. Never paste secret values into chat.

## Release gates
- Fresh CI: Prisma validate/generate, typecheck, lint, unit tests, schema sync, production build and Playwright E2E.
- Vercel preview reaches READY.
- Production deployment only after these gates pass.
