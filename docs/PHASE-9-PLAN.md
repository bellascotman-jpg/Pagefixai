# Phase 9 — Visual Audit Evidence, Report Readability, and AI Readiness

## Objective
Make audit reports readable and visually useful, then verify the actual AI provider and screenshot integrations before claiming the platform is fully AI-powered.

## Findings from the current implementation
- The audit engine captures image inventory and link inventory as JSON evidence.
- The report previously printed raw evidence strings, causing long JSON/URLs to dominate the report instead of showing image previews or readable link lists.
- A severity distribution chart was not present in the audit report.
- The deterministic crawler and rules can run without an AI provider key. AI interpretation is optional and skipped when neither OPENAI_API_KEY nor AI_PROVIDER_KEY is configured.
- Browser screenshots are supplemental and can fail independently of the static HTML audit; a completed audit is not proof that screenshots were successfully captured.

## Phase 9 implementation
- Add evidence-aware rendering for captured image inventory, link inventory, metadata, DOM and JSON-LD evidence.
- Display safe, responsive image previews and readable link labels instead of raw long JSON strings.
- Add a severity distribution visualization based on actual saved finding counts.
- Keep screenshot URLs authenticated and private; do not embed fabricated images or performance charts.
- Document AI and integration readiness accurately.

## Release gates
- Typecheck, lint, unit tests, production build and Playwright E2E must pass.
- Test evidence parsing for malformed JSON, relative URLs, unsafe protocols, image inventory and links.
- Confirm the preview deployment is READY and visually inspect public routes before merge.
- Never report AI as configured unless a valid provider credential is present and a real provider request succeeds.
