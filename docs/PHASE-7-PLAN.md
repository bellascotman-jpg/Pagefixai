# Phase 7 — Competitor Intelligence and AI Search Readiness

Updated: 2026-10-17

## Scope
Phase 7 adds evidence-based workspaces using only the signed-in user's saved, completed public-page inspections. It must never infer competitor revenue, conversion rate, traffic, market share, ad spend, rankings or AI citation performance from public page captures.

## Initial implementation
- Competitor Intelligence workspace: shows captured page title, meta description, canonical URL, visible text, finding themes, capture time, source URL and link to the full report for each saved inspection. The comparison is a set of observable page signals, not a competitor-performance ranking.
- AI Search Readiness workspace: checks whether saved captures include a successful HTTP response, page title, meta description, canonical URL and substantive visible text. Each result is tied to the capture and missing data is labelled missing/not observed.
- Capability registry includes the maturity and limits for both modules; both are marked foundation/needs validation until further route, capture, and regression checks are completed.

## Next acceptance checks
- Verify both routes render on mobile and desktop and are linked from the Intelligence Hub.
- Validate empty state, missing page capture, multiple audits, owner-scoped query and source-report navigation.
- Extend readiness checks only when capture data exists for the field (for example robots directives, sitemap discovery, structured-data validity and FAQ content).
- Build a dedicated competitor URL registration and paired-capture workflow before describing the workspace as a full competitive monitoring product.
- Never generate a numeric universal AI visibility score or promise rankings/citations.
- CI and latest preview deployment must pass before merge. Avoid authenticated preview writes until database isolation is verified.
