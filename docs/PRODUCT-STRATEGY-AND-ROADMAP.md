# PageFix AI — Product Strategy, Defensibility, and Implementation Roadmap

Status: Approved strategic direction; implementation must proceed in gated phases.
Last confirmed: 2026-10-16.
Repository: bellascotman-jpg/Pagefixai.

## 1. Decisions confirmed by the founder

The founder selected option C for all three strategic decisions:

1. **Broad seller support:** Design PageFix to support independent websites, social commerce, marketplace listings, and advertising-to-page journeys. Keep the product architecture broad, but focus initial customer acquisition on a narrower, validated segment. PageFix must be seller-first, not agency-only; agency and enterprise workflows extend the core seller experience.
2. **Full remediation as the long-term direction:** Evolve from diagnosis and recommendations to verification and eventually authorised direct changes to stores/pages. Build in stages, beginning with reliable diagnosis, recommendations, fix tracking, and verification. Direct actions require explicit authorisation, least-privilege permissions, audit logging, clear approval, and rollback where supported.
3. **End-to-end system:** Build the complete loop connecting inspection, diagnosis, fixing, verification, monitoring, and measured outcomes. Reliable evidence-based inspection is the foundation; Buyer Decision Intelligence is the first major intelligence advantage.

## 2. Product definition

PageFix AI is an evidence-based Commerce Intelligence and Remediation Platform. It inspects product pages, landing pages, commercial claims, and customer buying journeys; identifies supported issues and potential risks; explains why they may matter; gives practical fixes; records implementation; reinspects changes; and measures outcomes only when reliable data is available.

Core promise:
**Inspect the commercial experience. Find evidence-backed problems. Explain why they matter. Help the seller fix them. Verify the changes. Measure outcomes when reliable data is available.**

It is not merely a generic AI website auditor, a CRO report generator, or an agency-only tool.

## 3. Non-negotiable evidence and trust rules

Every finding must use exactly one classification:
- Directly Observed Evidence
- Inferred Risk
- Hypothesis
- Recommendation

Never fabricate analytics, traffic, revenue, conversion rates, rankings, customer data, reviews, testimonials, product attributes, warranties, delivery times, certifications, guarantees, competitor performance, or measured outcomes.

Separate:
- observed facts,
- inferred risks,
- hypotheses,
- recommendations,
- seller-provided data,
- scenario estimates,
- measured outcomes.

If a page element was not found in the inspected content, say it was **not observed**. If it could not be inspected, say **unable to verify**. Do not assert that information is absent or a feature is broken when inspection did not establish that.

A public URL alone does not establish revenue loss, return rates, conversion impact, traffic quality, or checkout abandonment. Never turn arbitrary scores or impact weights into invented dollar losses. Scenario estimates must disclose their inputs and assumptions. Before-and-after changes do not, by themselves, prove causation.

A screenshot is evidence of the captured state, not proof of all dynamic or hidden behaviour. Preserve historical audit results: a recheck is a new inspection, not a silent overwrite.

## 4. Core product pillars

1. **Commerce Inspection Engine:** reliable page acquisition, deterministic extraction, page and mobile/desktop inspection where supported, screenshots, inspection coverage, source references, and explicit failure states.
2. **Buyer Decision Intelligence:** category-aware buyer questions, objection coverage, product information completeness, offer clarity, trust/reassurance, and post-purchase expectation clarity.
3. **Claim and Contradiction Intelligence:** compare ads, social posts, landing pages, product details, specifications, offers, and policies; show both sides of a potential discrepancy with source evidence.
4. **Fix and Remediation Engine:** evidence-grounded recommendations, seller-friendly instructions, copy suggestions using verified inputs, Fix Center, approvals, assignments where applicable, and action history.
5. **Verification and Measurement Engine:** reinspection, versioned results, verified resolution status, optional analytics/commerce metrics, transparent scenarios, and measured outcomes where justified.
6. **Seller, Agency, and Enterprise Workspaces:** useful standalone seller experience; store/product-level workflows; agency multi-client separation; larger-organisation roles, approvals, logs, and governance when needed.
7. **Commerce Distribution and Integrations:** authorised read-only integrations first; controlled write actions only after inspection and verification are reliable.

## 5. Defensible capabilities

### A. Evidence-linked inspection
Every actionable finding should link to the actual text, DOM, metadata, screenshot, URL, or other source evidence; include inspection time and coverage; and explain limitations. Use reproducible rules and quality tests rather than relying on unconstrained model output.

### B. Category-aware Buyer Decision Intelligence
Create category-specific evaluation rules for relevant product classes (for example apparel, electronics, furniture, skincare, appliances, digital products, and B2B offers). Treat category rules as applicable criteria, not universal requirements. Buyer Objection Intelligence should assess whether questions are answered clearly, partially, ambiguously, not observed, contradictory, or unable to verify.

### C. Explainable Commerce Clarity Scorecard
Assess separate dimensions such as product information completeness, objection coverage, offer clarity, trust/reassurance, conversion usability, message consistency, and post-purchase expectation clarity. Define a rubric for each dimension, show evidence and coverage, and do not imply the score predicts conversion. Show critical contradictions separately so a strong dimension cannot hide a serious issue.

### D. Claim and Contradiction Intelligence
Extract claims, preserve context and source, compare scope/conditions/specificity across pages and campaigns, validate candidate discrepancies, show both sides, and recommend clarification. A wording difference is not automatically a contradiction.

### E. Promise Ledger
After contradiction detection is proven useful, maintain a traceable ledger of commercial promises: exact claim, source, date observed, related product/offer, supporting statements, potential conflicts, verification state, and corrective actions.

### F. Commerce Knowledge Graph (later)
Start with a relational model connecting organisations, products, pages, audits, page versions, evidence, claims, findings, fixes, rechecks, and optional metrics. Add specialised graph infrastructure only if demonstrated use cases justify it.

### G. Historical fix and verification intelligence
Accumulate the lifecycle and history of findings, fixes, rechecks, and outcomes. Any cross-customer learning must follow clear permissions, privacy, retention, confidentiality, and data-use terms; do not assume customer data can be reused for training.

## 6. Finding and remediation model

A structured finding should include:
- title, exact classification, severity, category, evidence, location, why it matters, confidence, known/unknown information, recommendation, implementation guidance, intended objective, and verification method.

Severity and confidence are different. Priority should be explainable using severity, evidence confidence, buyer relevance, and effort—not arbitrary financial impact.

Recommended lifecycle:
Detected → Reviewed → Fix proposed → Fix applied → Reinspection pending → Verified resolved.

Additional states: Fix rejected, Verification failed, Unable to verify, Issue reappeared, and Superseded.

A user marking a fix as applied must not automatically mark it verified. Direct publishing requires explicit authorisation, least privilege, approval, logging, and rollback where supported.

Seller instruction levels should support nontechnical sellers, store operators, and developers. Never invent missing product specifications or claims in generated copy.

## 7. Commercial Impact Engine

Implement three distinct levels:
1. **Identified risk:** explain why a page issue may matter without claiming a measured financial loss.
2. **Estimated exposure/scenario:** optionally use seller-provided traffic, conversion rate, average order value, margin, returns, or other relevant inputs. Show formulas, assumptions, and sensitivity. Label as a scenario, not a forecast or guaranteed result.
3. **Measured outcomes:** use reliable authorised analytics or transaction data. Distinguish correlation from causation; controlled experiments may provide stronger evidence.

Do not label estimates as “revenue recovered.” Use “estimated exposure,” “illustrative opportunity,” “scenario analysis,” or “measured outcome” as appropriate.

## 8. Advertising, funnel, and return-risk intelligence

Message Match Intelligence compares source content (ad/social post) with the destination page: promise, product, audience, price/offer conditions, benefits, limits, and call to action. Funnel inspection may cover ad → landing page → product → cart → checkout → confirmation/onboarding where accessible. Do not claim checkout abandonment or advertising waste without relevant data.

Position return-related capability as **Pre-Purchase Clarity & Return Risk Intelligence**. Identify information gaps and ambiguities that may contribute to confusion; do not predict a return rate from a public page alone.

## 9. Reports and security

Provide inspection reports, fix plans, verification reports, and store-level reports. Include URL, inspection time, viewport/device where relevant, evidence, coverage, classifications, limitations, changes, and verification results.

Share links should use unguessable tokens, revocation, optional expiration, visibility controls, shared-content preview, and strict separation of client-facing material from internal notes, private integrations, and merchant metrics.

## 10. No-free-tier and pricing constraint

**Do not add a permanent free tier.** Do not introduce recurring free audits or change pricing as part of this product roadmap without explicit founder approval. Preserve the currently approved pricing and entitlements; verify the current source of truth before making any billing change. Acquisition can use a clearly labelled sample report, product demonstration, useful commercial content, secure customer-shared reports, or a paid evaluation only if approved. Never fabricate customer results or use unsupported revenue claims to pressure prospects.

## 11. Implementation phases and acceptance gates

### Phase 0 — Baseline and source-of-truth review
Inspect the current repository, production state, schema, routes, job lifecycle, report/evidence storage, billing/credits, authentication, workspace tenancy, integrations, tests, and known issues. Classify each capability as implemented and verified, implemented but unverified, partial, planned, or broken. Do not rebuild working features blindly.

### Phase 1 — Reliable inspection
Prioritise the existing audit pipeline, especially stuck QUEUED jobs and clear terminal states. Verify browser execution, deterministic extraction, screenshots/evidence persistence, retries/timeouts, duplicate-work prevention, usage accounting, and report retrieval. A supported request must produce a usable report or a clear actionable failure; it must never stay queued indefinitely without explanation.

### Phase 2 — Evidence and classification standard
Enforce the four finding labels, evidence references, known/unknown fields, confidence versus severity, timestamps, scope/coverage, and regression/evaluation tests. Reviewers must be able to trace a finding to its support and uncertainty.

### Phase 3 — Buyer Decision Intelligence
Add/strengthen category identification, category-specific rules, objection coverage, product information completeness, offer clarity, trust/reassurance, and expectation clarity. Evaluate against a curated, human-reviewed test set.

### Phase 4 — Claim and Contradiction Intelligence
Build claim extraction, source references, comparison, candidate validation, evidence-linked findings, and test cases. Add the Promise Ledger after basic discrepancy detection demonstrates quality.

### Phase 5 — Fix Center and verification
Build structured recommendations, seller-friendly instructions, copy suggestions, lifecycle tracking, reinspection, versioned outcomes, and audit trail. A fix is complete only after its verification state is recorded.

### Phase 6 — Store-level intelligence
Support product collections, recurring issue detection, store-level queues, history, multi-product reports, and progress summaries.

### Phase 7 — Transparent commercial impact
Add optional seller metrics, input validation, scenarios, assumptions, sensitivity analysis, and clear separation of estimates from measured outcomes.

### Phase 8 — Seller-first workspaces and agency/enterprise workflows
Make core workflows understandable without CRO expertise. Add multi-client agency separation, report sharing, permissions, and enterprise controls as requirements justify them.

### Phase 9 — Integrations
Prioritise authorised read-only commerce and analytics connections based on customer demand. Add controlled write actions only after approval, security, logs, and rollback are designed and tested.

### Phase 10 — Experimentation and advanced learning
Add statistical experiment planning, stable assignment, event tracking, appropriate sample-size planning, stopping rules, uncertainty reporting, and evaluation datasets only when the foundation is reliable.

Progress between phases requires functional acceptance criteria and test evidence, not merely a finished UI.

## 12. What not to build prematurely

- No permanent free tier.
- No arbitrary revenue-loss calculator.
- No unrestricted AI publishing to live stores.
- No full advertising analytics platform before reliable data access.
- No A/B testing engine before trustworthy measurement.
- No dedicated graph database without demonstrated need.
- No template marketplace before core workflows work.
- No integrations just to accumulate logos.
- No decorative dashboard widgets without an operational decision they improve.
- No destructive rewrites of existing features unless required and justified.

## 13. Quality and success metrics

Establish baselines before targets. Measure:
- Inspection completion, failure, timeout, screenshot success, and time to usable report.
- Evidence coverage, human-reviewed finding precision, unsupported-claim rate, and category-specific accuracy.
- Findings reviewed, fixes attempted, reinspection completion, and verification outcomes.
- Time to first useful finding, repeat use, seller retention, and paid-plan retention.
- Integration adoption and measured outcomes where reliable data exists.

Audit count alone is not product quality. The core measures are finding trustworthiness and whether sellers can act on the results.

## 14. Current technical approach

Do not change the stack without inspecting actual constraints. Current repository documentation identifies Next.js App Router, React, TypeScript, PostgreSQL/Prisma, Playwright, Zod, optional private S3-compatible screenshot storage, Flutterwave verification, Vitest, Playwright tests, and GitHub Actions. Logical services need not become microservices prematurely.

Prioritise audit job reliability, network/SSRF safety, tenant isolation, permissions, rate limits, usage idempotency, database synchronization, secure screenshot retrieval, and mobile/desktop end-to-end tests.

## 15. First build task

Start with Phase 0, then immediately resolve any verified production blockers in the existing audit pipeline before adding feature breadth. Review source code and production deployment separately. Never state that a feature is fixed, built, tested, or deployed unless there is evidence for that exact claim. Keep work on a dedicated branch, preserve working features, run available checks, and review changes before production deployment.
