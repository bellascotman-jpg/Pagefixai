# Phase 8 — Reporting, Client Delivery, and Agency Workflows

## Objective
Turn stored PageFix findings into useful, shareable deliverables for sellers and agencies while preserving user-level data isolation and the evidence-first contract.

## Initial implementation on this branch
- Reports workspace with completed-report totals, finding totals, high-severity finding totals, and search by URL/category.
- Report list remains scoped to the authenticated user and is capped at 100 matching reports per page view.
- Added a per-audit CSV export alongside JSON. CSV fields preserve observations, hypotheses, recommendations, implementation guidance, workflow status and linked evidence source/location.
- CSV serialization handles commas, quotes, line breaks, UTF-8 BOM and spreadsheet formula injection.
- Export API confirms the audit belongs to the signed-in user and returns private, non-cacheable downloads.
- No schema migration and no production database writes were introduced.

## Guardrails
- No fabricated ROI, conversion lifts, revenue loss, or client outcomes.
- CSV/JSON exports include only stored audit evidence and explicitly retain limitations.
- Keep organization/project/competitor data restricted by membership checks; do not use an audit ID alone as authorization.
- Do not introduce schema migrations or broad auth rewrites without isolated-database tests and a rollback plan.

## Release gates
- Fresh CI: Prisma validation/generation, typecheck, lint, unit tests, database sync, production build and Playwright E2E.
- Verify search results, empty states, counts and both export links on desktop/mobile.
- Test unauthenticated export (401), nonexistent/foreign audit export (404), and CSV formula escaping against an isolated test database.
- Preview deployment must reach READY before merge; production is not modified by this feature branch.
- Follow-up agency scope: client/project selection, report branding, PDF/print output, share-link permission review, organization-level membership isolation and paired competitor capture.
