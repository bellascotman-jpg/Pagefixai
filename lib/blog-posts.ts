export type BlogSection = { heading: string; paragraphs: string[]; bullets?: string[] };
export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  readTime: string;
  intro: string;
  sections: BlogSection[];
  takeaway: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'ecommerce-product-page-audit-checklist',
    title: 'The E-commerce Product Page Audit Checklist: 12 Things to Inspect Before You Redesign',
    description: 'A practical, evidence-first checklist for finding product-page gaps in product clarity, buyer confidence, offer details, mobile usability and the path to purchase.',
    category: 'PRODUCT PAGE OPTIMIZATION',
    publishedAt: '2026-10-17',
    readTime: '9 min read',
    intro: 'A product page can look polished and still leave a buyer with unanswered questions. Before commissioning a redesign or changing copy, inspect the decisions the page must support—and record what is actually visible.',
    sections: [
      { heading: 'Start with the buying decision, not the design trend', paragraphs: [
        'A product page needs to help a visitor understand what the product is, whether it fits their needs, what it costs, what happens after purchase and how to proceed. A fashionable layout is not a substitute for those answers.',
        'Review the page at the URL a customer would actually visit. Record the device or viewport, the page state and any access limitations. If a variant selector, delivery estimate or purchase action cannot be inspected, report that as unverified rather than treating it as a confirmed defect.'
      ]},
      { heading: 'The 12-point product-page checklist', paragraphs: ['Work through these checks in order. Mark each item as observed, unclear, not found in the captured page, or not applicable. “Not found” describes the inspection—not proof that the information is absent everywhere on the site.'], bullets: [
        '1. Product identity: Is the exact product and its main use immediately clear?',
        '2. Differentiation: Does the page explain what makes this option relevant without relying on vague superlatives?',
        '3. Price and total cost: Is the displayed price easy to find, and are known additional costs explained before checkout?',
        '4. Variants and availability: Are size, colour, configuration, stock or compatibility choices understandable where relevant?',
        '5. Images and media: Do the visuals show the product, important details, scale or use context accurately?',
        '6. Specifications: Are dimensions, materials, ingredients, technical requirements or what is included available when buyers need them?',
        '7. Delivery information: Can a buyer find shipping regions, expected timing and any relevant restrictions?',
        '8. Returns and warranty: Are return conditions, guarantees and warranty terms easy to locate and understand?',
        '9. Trust and proof: Are claims specific and supportable? Do reviews or certifications, if displayed, have clear context?',
        '10. Primary action: Is the next step visually identifiable, clearly labelled and available in the captured state?',
        '11. Mobile usability: At a narrow viewport, are key details readable and important controls reachable without avoidable obstruction?',
        '12. Journey consistency: If a campaign or referring page is supplied, does the destination preserve the same product, offer, conditions and promise?'
      ]},
      { heading: 'Separate a visible fact from an interpretation', paragraphs: [
        '“The delivery policy link is not visible in this capture” is an observation about the captured page. “Buyers will abandon because delivery is unclear” is a hypothesis about behaviour. The second statement needs behavioural evidence or research; the first does not.',
        'For each issue, preserve the page location or evidence, explain why it may matter, state confidence and list what remains unknown. This makes the audit useful to a designer, developer or store owner without turning a plausible concern into a false metric.'
      ]},
      { heading: 'Prioritize fixes by evidence, risk and effort', paragraphs: [
        'Start with clearly observable defects that block or misdirect the next action. Then review missing decision-critical information, confusing offer terms and issues affecting multiple key page elements. A large redesign is not automatically the best first move.',
        'Do not attach a revenue-loss estimate to a public-page observation unless the estimate is supported by appropriate business data and a defensible method. Page inspection can identify opportunities to investigate; it cannot reveal private conversion rates or margins on its own.'
      ]},
      { heading: 'Recheck the page after changes', paragraphs: [
        'After publishing a fix, capture the same page again under comparable conditions. Check whether the specific issue changed, whether the intended information is now visible and whether a new problem appeared. Keep the original and new evidence so the decision is traceable.',
        'A recheck can verify a visible change. To determine whether sales or conversion changed, use authorized analytics, customer research or a suitable controlled experiment.'
      ]}
    ],
    takeaway: 'A useful product-page audit is a repeatable decision process: inspect the real page, document the evidence, prioritize the next fix and recheck the result—without guessing at customer behaviour.'
  },
  {
    slug: 'ad-to-landing-page-message-match',
    title: 'Ad-to-Landing-Page Message Match: A Practical Framework for Finding Broken Promises',
    description: 'Learn how to compare an ad, social post, email or campaign promise with its landing page without assuming performance problems you cannot measure.',
    category: 'LANDING PAGE & CAMPAIGN FIT',
    publishedAt: '2026-10-17',
    readTime: '8 min read',
    intro: 'A campaign creates an expectation before someone reaches a website. If the destination changes the offer, product, price, conditions or next step, the visitor has to reconcile two different messages. A disciplined message-match review makes those differences visible.',
    sections: [
      { heading: 'What message match means', paragraphs: [
        'Message match is the consistency between the promise that earns a click and the destination page that receives it. It is not simply repeating the same headline. The product, intended audience, offer, eligibility, important conditions and next action should make sense as one continuous journey.',
        'A page can be persuasive on its own and still be a poor destination for a particular campaign. That is why the reviewer needs both sides: the exact campaign creative or copy and the actual destination page. If only one is available, the comparison is incomplete.'
      ]},
      { heading: 'The six parts of a campaign-to-page comparison', paragraphs: ['Create a simple promise ledger. Quote or capture the relevant campaign wording, then record where the corresponding information appears on the destination page.'], bullets: [
        '1. Product or service: Does the destination feature the same item, plan, category or audience-specific solution?',
        '2. Headline promise: Does the page acknowledge the primary reason the campaign invited the click?',
        '3. Offer and price: Do discounts, trial terms, bundles, pricing and eligibility conditions agree?',
        '4. Proof and qualification: Are claims, limitations, delivery areas, requirements or exclusions represented accurately?',
        '5. Visual continuity: Do product images, names and recognizable campaign cues help the visitor confirm they are in the right place?',
        '6. Next step: Does the call to action continue the journey implied by the campaign, rather than unexpectedly changing the commitment?'
      ]},
      { heading: 'How to document a mismatch without overclaiming', paragraphs: [
        'Use a side-by-side record: campaign evidence, destination evidence, the specific difference, why the difference may matter and what needs review. For example, if a campaign advertises a particular bundle but the destination page shows a different configuration, that difference is directly observable when both pieces of content are captured.',
        'Do not automatically label a mismatch as the cause of weak conversion. The page inspection does not reveal click quality, audience intent, auction dynamics, tracking integrity or what visitors did next. Those questions require campaign and analytics data.'
      ]},
      { heading: 'Prioritize the differences that change the decision', paragraphs: [
        'Review discrepancies in the offer, price, product identity, eligibility and promised outcome before minor stylistic differences. A visitor should be able to confirm quickly that the destination matches the reason they clicked and understand the conditions attached to the offer.',
        'A practical fix may be to align the headline, make a condition more visible, clarify the offer, use the correct product image or send the campaign to a more relevant destination. Choose the smallest change that resolves the documented difference.'
      ]},
      { heading: 'Verify the journey, then measure performance separately', paragraphs: [
        'After publishing the change, compare the campaign and destination again. Confirm that the intended promise is represented, important terms are visible and the next step remains coherent. Keep dated captures so a team can trace what changed.',
        'To establish whether performance improved, combine this review with properly configured campaign analytics and a suitable measurement plan. Message match identifies a content relationship worth fixing; it does not, by itself, prove incremental revenue or conversion lift.'
      ]}
    ],
    takeaway: 'A message-match audit needs both the campaign promise and the destination. Compare them directly, document the exact difference, fix the decision-critical gap and use analytics to assess business impact.'
  },
  {
    slug: 'prioritize-website-fixes-without-guessing',
    title: 'How to Prioritize Website Fixes Without Guessing at Lost Revenue',
    description: 'A practical framework for ranking website audit findings by evidence quality, user impact, confidence, implementation effort and verification—not invented revenue scores.',
    category: 'EVIDENCE-LED OPTIMIZATION',
    publishedAt: '2026-10-17',
    readTime: '7 min read',
    intro: 'A website audit is only valuable if it helps a team decide what to do next. Long issue lists, arbitrary scores and unsupported revenue estimates can create the appearance of precision without making the decision more reliable.',
    sections: [
      { heading: 'Why every finding should not become a task', paragraphs: [
        'Some findings are confirmed technical or content defects. Others are risks inferred from a visible page, hypotheses that need user research, or recommendations based on best practice. Treating all of them as equally certain makes prioritization noisy.',
        'Start by naming the type of finding and the evidence behind it. A visible broken link and a hypothesis about why visitors hesitate are different kinds of information and should not be assigned the same certainty.'
      ]},
      { heading: 'Use five decision criteria', paragraphs: ['A lightweight prioritization model can help a team discuss work without pretending that public-page evidence contains private business metrics. Score or describe each criterion consistently, and keep the underlying evidence visible.'], bullets: [
        'Evidence strength: Is the issue directly observable, inferred from several signals or only a hypothesis?',
        'Decision importance: Does it affect product understanding, price and conditions, trust information or the next action?',
        'Potential reach: Which pages, devices or user journeys appear to be affected? State the scope you actually inspected.',
        'Implementation effort: Is this a small content correction, a template change, a technical fix or a larger product decision?',
        'Verification clarity: Can the team define an observable condition that will show whether the issue itself was resolved?'
      ]},
      { heading: 'Separate issue severity from business impact', paragraphs: [
        'A finding can be severe because it blocks a task, but that does not automatically tell you how much revenue it costs. Revenue impact depends on factors such as exposure, visitor intent, conversion behaviour, order value, margins and other causes that a public-page audit cannot establish alone.',
        'Avoid statements like “this issue costs $12,000 per month” unless there is real supporting data, an explicit method and clear uncertainty. If the inputs are unavailable, say so and describe what data would be needed to estimate the impact.'
      ]},
      { heading: 'Build a useful action queue', paragraphs: ['A practical queue often separates work into three groups:'], bullets: [
        'Fix now: Confirmed issues with a clear correction and a low or manageable implementation cost.',
        'Investigate next: High-importance risks where evidence is incomplete or the underlying cause is uncertain.',
        'Test deliberately: Competing explanations or design alternatives that require user research, analytics or an experiment.'
      ]},
      { heading: 'Write each finding so someone can act on it', paragraphs: [
        'A strong finding names the issue, shows where it appears, quotes or references the evidence, explains the possible consequence, states confidence and unknowns, and gives a concrete implementation step. It should also define the objective of the fix and what a recheck can verify.',
        'This structure reduces vague tasks such as “improve trust” or “optimize conversion.” Instead, a teammate can see the specific gap, understand the reasoning and decide whether the proposed change is appropriate.'
      ]},
      { heading: 'Close the loop with verification', paragraphs: [
        'After a change ships, re-inspect the relevant URL and compare the new capture with the original. Mark the issue as resolved, still present, changed but unresolved or unable to verify. Do not quietly erase the original evidence.',
        'Use analytics and experiments to assess commercial outcomes separately. A recheck confirms the visible fix; outcome measurement determines whether the business result changed.'
      ]}
    ],
    takeaway: 'Prioritize with evidence, decision importance, scope, effort and a clear verification plan. When business data is missing, be explicit about the unknowns instead of manufacturing a revenue estimate.'
  }
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
