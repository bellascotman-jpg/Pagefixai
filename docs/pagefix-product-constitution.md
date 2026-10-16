# PageFix AI — Product Constitution and Implementation Roadmap

Status: approved product direction; implementation must preserve this document as the source of truth.

## Agreed decisions

The founder selected option C for all three strategic decisions:

1. **Broad seller support from the beginning:** architect for independent ecommerce stores, social commerce, marketplace listings, advertising-to-page journeys, SaaS and landing pages, while releasing capabilities in stages. Marketing may focus on a narrower first customer segment, but the product must not be agency-only.
2. **Full remediation direction:** PageFix should ultimately diagnose, recommend, verify and support authorised direct changes to connected stores/pages. Implement in stages: reliable inspection and evidence first; recommendation and manual verification next; authorised write actions later with approval, least-privilege permissions, audit logs and rollback where supported.
3. **Complete end-to-end competitive advantage:** connect inspection, buyer-decision intelligence, fixing, verification and measured outcomes. Inspection accuracy is the foundation; category-aware buyer intelligence is the first major intelligence advantage.

## Product promise

**PageFix AI helps sellers find evidence-backed problems in their commercial pages, understand why they may matter, fix them, verify changes and measure outcomes when reliable data is available.**

PageFix is not just a website audit tool, generic CRO checklist, analytics dashboard, or agency reporting utility.

## Non-negotiable evidence rules

Every finding uses exactly one classification:
- Directly Observed Evidence
- Inferred Risk
- Hypothesis
- Recommendation

Never fabricate analytics, revenue loss, conversion impact, rankings, reviews, testimonials, customer behaviour, product specifications, warranty terms, shipping conditions, certifications, or business outcomes. A public URL does not reveal private analytics or actual conversion/return rates.

If an element was not observed in the captured page, say **not observed in the captured page**. If it could not be inspected, say **unable to verify**. Neither status proves the information is absent elsewhere.

Keep severity, confidence, classification, and commercial impact separate. A high severity label is not a measured financial loss. An estimated scenario must show its inputs and assumptions. Measured outcomes require reliable data; before/after correlation alone does not prove causation.

Do not bypass website access controls. Inspect only sites the operator is authorised to inspect.

## Product pillars

1. Commerce Inspection Engine — public page retrieval, content extraction, viewport evidence, screenshots where available, mobile/desktop review, inspection coverage and clear failure states.
2. Buyer Decision Intelligence — category-aware product information, buyer objection coverage, offer clarity, trust/reassurance information, decision sequence and post-purchase expectation clarity.
3. Claim and Contradiction Intelligence — compare advertising promises, product claims, specifications, prices, shipping, returns and warranty language; cite both sources and treat unresolved discrepancies as hypotheses.
4. Fix and Remediation Engine — evidence-grounded recommendations, seller-friendly implementation guidance, copy suggestions using verified inputs, Fix Center and approval-based actions.
5. Verification and Measurement — fresh reinspections, versioned findings, explicit fix lifecycle, optional business metrics, scenario analysis and statistically responsible experiments.
6. Seller and Store Intelligence — individual seller workspaces, products, recurring issues, historical audits and prioritised work queues.
7. Agency, Team and Enterprise Workspaces — multi-client separation, permissions, secure reports, audit logs and organisation controls without making the core product agency-dependent.
8. Commerce Integrations — authorised read-only data first; carefully approved write actions only after reliability and security controls exist.
9. Reports and Governance — evidence-linked reports, secure revocable share links, visibility controls, data retention and audit trails.

## Required finding structure

A finding should include title, classification, severity, category, evidence/location, why it may matter, confidence, known information, unknown/unverified information, recommended fix, implementation instructions, objective, and verification method.

Suggested fix lifecycle:
`Detected → Reviewed → Fix proposed → Fix applied → Reinspection pending → Verified resolved`

Additional states: `Fix rejected`, `Verification failed`, `Unable to verify`, `Issue reappeared`, `Superseded`.

Mark a fix as applied separately from marking an issue verified. A button click alone is not verification.

## Commerce Clarity Scorecard

Use an explainable multidimensional scorecard rather than an unexplained universal score or conversion predictor. Dimensions may include product information completeness, objection coverage, offer clarity, trust/reassurance, conversion usability, message consistency and post-purchase expectation clarity. Each dimension needs a documented rubric, applicability, evidence, confidence and inspection coverage. Show critical issues separately so an aggregate score cannot conceal a contradiction.

## Claim and Contradiction Intelligence

Compare the actual source statements and destination statements. Record exact claim, source, context, capture date, relevant product/offer, related statements, contradiction candidate, status and resolution history. Wording differences alone are not proof of contradiction; context may explain them.

## Promise Ledger and Commerce Knowledge Graph

Build incrementally. Start with relational relationships between organisations, products/pages, audits, page versions, evidence, claims, findings, fixes, verification records and optional metrics. Do not introduce graph infrastructure until a validated use case justifies it. The Promise Ledger should record seller promises with provenance and link them to checks and fixes.

## Commercial impact

- Level 1: describe an identified risk without inventing dollars.
- Level 2: show scenarios from seller-provided metrics and explicit assumptions; label as estimates/scenarios, not forecasts or recovered revenue.
- Level 3: report measured outcomes from reliable analytics/transaction data and disclose uncertainty and confounders.

## No free tier and pricing protection

There is no permanent free tier. Do not introduce one. Do not change agreed pricing, trials, credits, or plan entitlements as part of feature work without explicit discussion. Sample reports or demos may be used for acquisition, but must not fabricate results.

## Staged implementation plan

0. Baseline audit of the existing repository and deployed product; label capabilities implemented/verified, implemented/unverified, partial, planned or broken.
1. Reliability: audit jobs must complete with a usable report or a clear failure; fix stuck/queued jobs, retries, error handling, evidence creation and screenshot persistence.
2. Evidence standard: exact finding labels, evidence references, inspection coverage, confidence/severity distinction and evaluation tests.
3. Buyer Decision Intelligence: category classification and category-specific checks.
4. Claim and Contradiction Intelligence: source-linked comparison and conservative hypotheses.
5. Fix Center: prioritisation, implementation instructions, copy suggestions, status lifecycle and verification.
6. Store-level intelligence: multiple products, recurring findings, history and work queues.
7. Commercial Impact Engine: scenario assumptions first, measured outcomes only with reliable data.
8. Seller-first UX, then team/agency and enterprise controls.
9. Read-only integrations first, write actions only with explicit approval, least privilege, logging and rollback where supported.
10. Experimentation and advanced learning after measurement is reliable.

## Deferred until evidence justifies the cost

- Dedicated graph database.
- Autonomous live-store editing.
- Full advertising analytics platform.
- Full A/B testing platform.
- Template marketplace.
- Broad integrations with no validated user demand.
- Revenue/conversion predictions derived from arbitrary AI scores.

## Success metrics

Establish baselines before setting targets:
- Audit completion, failure and timeout rates.
- Evidence coverage and screenshot success.
- Human-reviewed finding precision and unsupported-claim rate.
- Time to a usable report.
- Fix attempts, reinspection completion and verification results.
- Repeat usage, retention and paid conversion.
- Measured outcomes only where reliable data is available.

## Implementation discipline

Preserve existing working features and pricing. Inspect the current code before changing it. Make incremental, testable changes on a feature branch. Do not claim a feature is shipped until code, tests, and production behavior are verified. Production deployment is a separate step from committing code.