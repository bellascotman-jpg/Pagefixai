# PageFix AI — Product Build Roadmap (Source of Truth)

This document is the durable product and engineering reference for all PageFix AI work. Build in phase order. Do not mark a phase complete because code exists: its acceptance criteria must pass. Keep production unchanged until the relevant release checks pass. Preserve existing working features and pricing unless a deliberate, explicit product decision authorizes a change.

## Product definition

PageFix AI is an evidence-based revenue-leak detection and remediation system for e-commerce, SaaS, landing pages, and funnels—not merely a website auditor or dashboard. The end-to-end workflow is:

**Inspect → Detect → Explain → Prioritise → Recommend → Implement → Verify → Track improvements.**

Never fabricate analytics, reviews, conversion rates, revenue losses, customer data, testimonials, certifications, capabilities, or outcomes. Distinguish public observations from private metrics that require integrations or user-supplied data. Every finding must use exactly one evidence label: **Directly Observed Evidence**, **Inferred Risk**, **Hypothesis**, or **Recommendation**. State limitations and inconclusive verification honestly.

## Phase 1 — Audit Engine and Processing Reliability
**Status: CI-VERIFIED COMPLETE on commit `39d7340` (quality + end-to-end workflow passed).**

- Validate supported public URLs; reject invalid/unsupported targets; defend against SSRF, unsafe redirects, and unsafe browser requests; give clear errors.
- Create persistent audit jobs and expose QUEUED, processing, COMPLETED, and FAILED states; prevent duplicate claims; handle timeouts, retries, interrupted jobs, and stale-job recovery; show progress rather than endless loading.
- Retrieve accessible page content; extract headings, metadata, links, images, buttons, forms, and relevant elements; use browser rendering where supported; honestly distinguish access challenges and crawler limitations from actual page defects.
- Capture desktop and mobile screenshots where supported; store persistently; associate with the correct audit; serve only to authorized users; never fabricate screenshots; report capture failures honestly.
- Persist findings/evidence, show completed reports in the dashboard, survive refreshes, preserve history, and make failed audits diagnosable.
- Rechecks must perform a fresh inspection, compare evidence with the previous audit, preserve history, and mark a finding resolved only when the evidence supports it; otherwise state that it remains detectable or is inconclusive.
- **Acceptance:** a real user can submit a URL, the job finishes, findings/evidence persist, screenshots are retrievable when available, the report loads, recheck works, and failure/recovery paths are exercised.

## Phase 2 — Core Revenue Leak Detection Engine
**Status: CI-VERIFIED COMPLETE on commit `2fb4b5a`; preview deployment ready.**

- Product page: title, product details, description, value proposition, price, benefits/specifications, image coverage, buying information, CTA, shipping/delivery/returns, and purchase-relevant trust information.
- Landing page: above-fold value, headline, audience/offer clarity, benefits/proof, CTA, hierarchy, message consistency, and missing/unclear conversion steps.
- Experience: observable mobile layout/usability, navigation, button/link labels, interactive elements, image/content presentation, and purchase-journey friction.
- Technical/SEO: HTTP status, title/meta description, canonical, headings, image alt text, accessible link names, structured-data parsing, and other supported observable checks.
- Attach evidence and location whenever available; use the four mandatory finding labels; make diagnostics repeatable and evidence-grounded.
- Evidence includes page-text and DOM checks plus browser-measured desktop/mobile first-viewport signals where screenshot capture succeeds; capture limitations remain explicit.
- **Acceptance:** product/landing-page findings are category-aware, evidence-linked, repeatable, and tested; CTA links/forms are handled; mobile overflow/above-fold checks are evidence-backed; no invented analytics, reviews, conversion rates, or financial losses.

## Phase 3 — Customer Buying Decision Intelligence
**Status: CI-VERIFIED COMPLETE on commit `053d9e38a90780b49f810136bd47ea39e95de234` (full quality and end-to-end CI passed).**

- Objection Coverage: answered/unanswered questions across benefits, price, delivery, returns, trust, and suitability, with evidence and unknowns.
- Pre-Purchase Questions: structured likely buyer questions, explicitly hypotheses rather than claims of actual customer quotes.
- Decision Sequence: information order, late/missing details, confusing sequences, and recommended order for value, proof, benefits, and CTA.
- Trust Signal Mapper: visible trust signals, accessible policies/supporting information, unsupported claims, and inferred risks.
- Above-the-Fold Value: visible offer/audience/value proposition/CTA before scrolling.
- Promise Ledger: page promises, supporting evidence, unsupported/unclear/contradictory promises, and historical tracking.
- Contradiction Detection: conflicting price, delivery, return, product, and offer information; show both sides and do not guess which is correct.
- Friction Debt: group and prioritise related confusion/effort using evidence, severity, and journey relevance—never invented financial costs.
- **Acceptance:** users see what appears wrong and which purchase questions remain unanswered.

## Phase 4 — Traffic, Advertising and Customer Journey Intelligence
**Status: CI-VERIFIED COMPLETE on commit `0c47e78c`; preview deployment is READY on commit `0b72d747`.**

- Ad-to-Page: compare supplied ad copy to destination, offer, details, promises, and message consistency.
- Social-to-Page: compare supplied social messaging with destination content and highlight discontinuities.
- Customer Journey: map supplied pages, transitions, missing information, and confusing handoffs.
- Traffic Waste Risk: flag observable message/destination mismatch and state what data is needed to confirm actual ad waste.
- Checkout Handoff: inspect product-to-cart/checkout transitions, visible buying-action issues, broken links, and accessible steps.
- Cart Abandonment Forensics: inspect visible checkout friction and analyse supplied/integrated abandonment data only when available; never infer actual abandonment reasons from a public page alone.
- **Acceptance:** evidence-based recommendations for supplied marketing messages and their destination pages.

## Phase 5 — Retention, SaaS Onboarding and Churn Intelligence
**Status: CI-VERIFIED COMPLETE on commit `154bf4f77a1030825342263cd30c8862230feea8` (run `39016770935`); preview deployment READY.**

- Inspect signup/onboarding, next-step clarity, instructions, onboarding sequence, and path to first meaningful outcome.
- Diagnose possible adoption/churn obstacles from supplied flows; distinguish inferred risk from measured churn; compare signup expectations with later experience.
- Review supplied emails, onboarding messages, and retention journeys for gaps in promised value and next steps.
- Review plan comparisons, pricing/billing clarity, and cancellation information.
- Analyse completion/retention metrics only from supported integrations or supplied data.
- **Acceptance:** clearly distinguish public observations from private business metrics.

## Phase 6 — Fix Center and Implementation Guidance
**Status: PARTIAL DIRECTION; full workflow to implement/verify.**

- Central Fix Center grouped by category/severity, prioritised work order, and proposed/in-progress/completed statuses.
- Each finding explains title, severity/category, evidence/location, why it matters, plausible consequence, confidence, known/unknown, fix, implementation steps, objective, and verification method.
- Safe copy/content suggestions for headlines, descriptions, CTAs, benefits, trust/policy explanations, FAQs, offers, and pricing language—no invented claims or credentials.
- Platform-specific guidance when the platform is known.
- Reinspect changed pages; compare evidence; record resolved/still-detected/inconclusive honestly; retain history.
- Prioritise by severity, confidence, relevance, and effort where estimable; never fabricate ROI or conversion lift.
- **Acceptance:** users can act on findings, track fixes, and verify observable corrections.

## Phase 7 — Competitor Intelligence and AI Search Readiness
**Status: PLANNED.**

- Compare supplied accessible competitor pages for product information, offers, benefits, trust, structure, and missing/present content.
- Compare visible price/offer details, differentiation, and information gaps; do not assume more content means a competitor is better.
- Assess observable technical SEO, content quality, structured data, and clear product/company information.
- Assess AI search/GEO readiness through clear product context and accessible structured/supporting content; no ranking, citation, or recommendation guarantees.
- Compare successive audits while preserving which findings appeared, persisted, or became unobservable.
- **Acceptance:** evidence-backed comparisons without invented competitor data or ranking promises.

## Phase 8 — Reporting, Dashboard and Agency Workflows
**Status: FOUNDATIONS EXIST; verify and complete.**

- Dashboard: active/completed/failed audits, status, severity/category, historical reports, screenshots, rechecks, and useful errors.
- Detailed report: executive summary, highest-priority findings, evidence/page locations, screenshots when available, buying-decision analysis, fixes, verification, limitations, and evidence-versus-inference distinctions.
- Export/share (PDF where implemented), readability checks, complete content, and correct access controls.
- Organise projects/clients, isolate client data, track client findings/progress, and support repeat audits/history.
- White-label agency reports/branding where supported; never misrepresent completed work or results.
- Deduplicate findings where possible and maintain mobile/desktop readability.
- **Acceptance:** businesses/agencies can organise audits and deliver professional evidence-grounded reports.

## Phase 9 — Accounts, Billing, Usage Limits and Administration
**Status: FOUNDATIONS EXIST; production verification required.**

- Registration/login, sessions, logout, password recovery/reset, protected routes, and expired/invalid session handling.
- Server-side founder/admin roles, secure founder provisioning, privileged-operation logging, and protection from ordinary-user access.
- Server-side plan definitions, subscription status, trial management, entitlements, usage allowances, and enforcement.
- Flutterwave: correct amount, server-side transaction verification, currency/reference checks, idempotent webhooks, and safe handling of failed/duplicate/delayed events; never grant paid access from an unverified redirect.
- Ensure plan features/limits match server-side entitlements; handle trial expiry and plan changes.
- Admin visibility into appropriate user/subscription records, audit failures, processing issues, usage, and errors.
- Supported email notifications for password recovery, accounts, audits, and billing, including delivery failure handling.
- **Pricing constraint:** preserve the current repository's documented Starter $49, Growth $149, Agency $399 monthly choices and existing plan configuration during engineering fixes. Any pricing change is a separate deliberate decision.
- **Acceptance:** secure registration/trial/payment/access, with no client-side entitlement bypass.

## Phase 10 — Security, Performance and Production Readiness
**Status: NOT FULLY VERIFIED.**

- Security: URL/redirect and browser-request validation, tenant isolation, server-side authorization, secure sessions/password reset, rate limits, input validation, secrets, and private screenshots/reports.
- Reliability: queue/retry/timeout behaviour, duplicate prevention, persistence, recovery, and useful logs.
- Performance: bounded browser resources, cost/time limits, large reports/screenshots, and responsive mobile/desktop UI.
- Integration tests for database, optional AI, screenshot storage, Flutterwave, email, authentication, and audit processing.
- End-to-end journey: landing page → register/login → start audit → submit URL → see progress → results → findings/screenshots → report → implement fix → recheck → review verification → test entitlements.
- Exercise failures: inaccessible pages, failed audits, missing screenshots, payment failures, and unauthorized access.
- Verify production environment variables, database/schema compatibility without destructive production schema sync, browser runtime, payment/email configuration, and rollback. Deploy only after checks pass; smoke-test the actual production domain.
- **Acceptance:** agreed checks pass and the customer journey is demonstrated with evidence.

## Working rules for every phase

1. Build in phase order. Phase 1 passed the repository's latest CI quality and end-to-end workflow; continue hardening if real production/preview evidence exposes a regression.
2. A successful TypeScript check or production build does not mean the phase is complete.
3. Keep production stable. Use the development branch and preview until validated; do not merge/deploy unfinished work.
4. Preserve existing features, audit history, entitlements, and pricing unless a change is necessary and explicitly documented.
5. Prefer real implementation and reproducible tests over status-only updates. Do not repeatedly ask the user to confirm internal engineering steps.
6. Report only verified results; state what is blocked and why without claiming success.
