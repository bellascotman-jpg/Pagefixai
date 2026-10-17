export type BuyerDecisionInput = {
  url: string; title: string; bodyText: string;
  headings: Array<{ tag: string; text: string }>;
  buttons: string[]; links: Array<{ text: string; href: string }>; forms: number;
  textEvidenceId: string; domEvidenceId: string; linkEvidenceId: string;
  viewportSignals?: Array<{ viewport: 'desktop' | 'mobile'; viewportWidth: number; documentWidth: number; horizontalOverflow: boolean; primaryHeadingVisible: boolean; commercialActionVisible: boolean; visibleTextLength: number }>;
  viewportEvidenceId?: string;
};
export type BuyerDecisionFinding = {
  title: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  effort: 'LOW' | 'MEDIUM' | 'HIGH'; priority: 'FIX_NOW' | 'FIX_NEXT' | 'FIX_LATER';
  observation: string; hypothesis: 'Inferred Risk' | 'Hypothesis' | 'Recommendation';
  whyItMatters: string; recommendation: string; implementationSteps: string; buyerQuestion: string; evidenceIds: string[];
};
export type BuyerQuestionCheck = { question: string; observed: boolean; evidenceIds: string[] };

const ACTION = /add to cart|buy now|shop now|checkout|subscribe|start free|book now|request a quote|contact sales|place order|order now|sign up|get started|download now|purchase|try (?:it )?free|schedule a demo/i;
const BENEFIT = /benefit|why choose|designed to|helps you|built for|made for|save time|save money|improve|reduce|faster|easier|durable|lightweight|long.lasting|features include|key features|you can|enables you to/i;
const PROOF = /reviews?|testimonials?|case studies|customer stories|ratings?|verified buyers?|certified|independently tested|clinical study|research shows|award|accredited/i;
const TRUST = /secure checkout|secure payment|payment methods|warranty|guarantee|privacy policy|terms and conditions|terms of service|returns?|refunds?|shipping|delivery|contact us|customer support|support@|whatsapp|phone number/i;
function isProduct(input: BuyerDecisionInput): boolean {
  let path = input.url; try { path = new URL(input.url).pathname; } catch {}
  return /\/(products?|items?)\//i.test(path) || /add to cart|product details|\bsku\b|in stock/i.test(input.title + ' ' + input.bodyText);
}
function finding(title: string, severity: BuyerDecisionFinding['severity'], observation: string, whyItMatters: string, recommendation: string, buyerQuestion: string, evidenceIds: string[], hypothesis: BuyerDecisionFinding['hypothesis'] = 'Inferred Risk'): BuyerDecisionFinding {
  return { title, severity, confidence: 'MEDIUM', effort: 'LOW', priority: severity === 'HIGH' ? 'FIX_NOW' : severity === 'MEDIUM' ? 'FIX_NEXT' : 'FIX_LATER', observation, hypothesis, whyItMatters, recommendation, implementationSteps: recommendation, buyerQuestion, evidenceIds };
}
/** Evidence-grounded buyer decision rules. No customer behaviour or conversion impact is inferred. */
export function buildBuyerDecisionFindings(input: BuyerDecisionInput): BuyerDecisionFinding[] {
  const output: BuyerDecisionFinding[] = [];
  const text = input.bodyText;
  const headingsText = input.headings.map(item => item.text).join(' ');
  const combined = input.title + ' ' + headingsText + ' ' + text;
  const product = isProduct(input);
  const benefitMatch = BENEFIT.test(combined);
  const proofMatch = PROOF.test(combined);
  const trustMatch = TRUST.test(combined);
  if (!benefitMatch && /^(home|welcome|welcome to our website|homepage|landing page|untitled|website|main page)$/i.test((input.headings.find(h => h.tag.toUpperCase() === 'H1')?.text ?? input.title).trim())) {
    output.push(finding('The primary value proposition is unclear in the captured page', 'MEDIUM', 'The primary heading/title uses a generic label and the captured content did not match common benefit or audience language.', 'A visitor may need more context to understand the offer and decide whether to continue.', 'Replace generic page language with a specific, accurate statement of the offer, intended audience, and most important verified benefit.', 'What is this offer, and why is it relevant to me?', [input.textEvidenceId, input.domEvidenceId]));
  }
  if (product && !proofMatch) {
    output.push(finding('Independent or customer proof was not observed in the captured product content', 'LOW', 'The captured text did not match common proof signals such as reviews, ratings, case studies, certifications, or independent testing. Visual widgets and content loaded after capture may be missed.', 'Some buyers may look for corroboration before trusting product or seller claims; this check does not establish that proof is absent elsewhere or that the offer is untrustworthy.', 'If authentic and permissioned evidence exists, present relevant reviews, ratings, certifications, test results, or case studies with accurate attribution. Never fabricate testimonials or credentials.', 'What evidence supports the product or seller claims?', [input.textEvidenceId, input.linkEvidenceId]));
  }
  if (!trustMatch) {
    output.push(finding('Purchase reassurance signals were not observed in the captured content', 'LOW', 'The captured page text did not match common reassurance signals for support, delivery, returns, refunds, warranty, payment security, or policy access.', 'A buyer may have unresolved questions about support or the conditions that apply before and after purchase.', 'Make the applicable, verified support route and policy information easy to find. Only publish guarantees, security statements, or policies that are accurate and in force.', 'What support and purchase protections apply to this offer?', [input.textEvidenceId, input.linkEvidenceId]));
  }
  const desktop = input.viewportSignals?.find(signal => signal.viewport === 'desktop');
  const mobile = input.viewportSignals?.find(signal => signal.viewport === 'mobile');
  const affected = [desktop && (!desktop.primaryHeadingVisible || !desktop.commercialActionVisible) ? 'desktop' : '', mobile && (!mobile.primaryHeadingVisible || !mobile.commercialActionVisible) ? 'mobile' : ''].filter(Boolean).join(' and ');
  if (affected) {
    output.push(finding('The initial viewport does not expose the primary proposition and action together', 'MEDIUM', 'Browser-measured first-viewport signals indicate that the primary heading or a common commercial action was not visible in the initial ' + affected + ' view. A custom or script-rendered action may not be detected by current label rules.', 'Visitors may need to scroll or infer the next step before understanding the offer or acting on it.', 'Review the first viewport at the affected size. Put an accurate primary proposition and the intended next action in a clear visual hierarchy without hiding necessary conditions or trust information.', 'Can I understand the offer and identify the next step without searching?', [input.viewportEvidenceId ?? input.domEvidenceId]));
  }
  const highRiskClaim = /\b(best[- ]selling|number one|#1|guaranteed (?:results|success|outcomes)|100% satisfaction|clinically proven|proven to cure|risk[- ]free)\b/i.exec(text);
  if (highRiskClaim && !/independent(?:ly)? tested|study|evidence|certified|accredited|terms apply/i.test(text)) {
    output.push(finding('A strong commercial claim may need supporting evidence or conditions', 'MEDIUM', 'The captured page contains the phrase "' + highRiskClaim[0] + '". This rule cannot determine whether the claim is true, appropriately qualified, or supported outside the captured page.', 'Strong performance, health, guarantee, or comparative claims can affect buyer expectations and may require substantiation or visible conditions.', 'Verify the claim against reliable evidence and applicable requirements. Add source, scope, dates, eligibility and limitations where relevant, or revise wording if it cannot be substantiated.', 'What evidence and conditions support this claim?', [input.textEvidenceId], 'Hypothesis'));
  }
  const actionInBody = ACTION.exec(text);
  const deliveryIndex = /shipping|delivery|dispatch/i.exec(text)?.index ?? -1;
  const returnIndex = /return policy|returns?|refunds?|exchanges?/i.exec(text)?.index ?? -1;
  const detailIndex = /specifications?|dimensions|materials?|ingredients|size guide|size chart|product details/i.exec(text)?.index ?? -1;
  if (product && actionInBody && [deliveryIndex, returnIndex, detailIndex].some(index => index >= 0 && actionInBody.index < index)) {
    output.push(finding('Some purchase-critical details appear after a purchase action in captured text order', 'LOW', 'The extracted text order places a common purchase action before at least one delivery, return, or product-detail signal. Text order does not reliably establish visual layout or whether details are accessible before checkout.', 'Buyers may benefit from seeing relevant suitability and post-purchase conditions before committing to the next step.', 'Review the rendered page and keep the purchase action available while making relevant product details and policy conditions easy to find before commitment.', 'Can I confirm the important conditions before I act?', [input.textEvidenceId, input.domEvidenceId]));
  }
  return output;
}
export function buildBuyerQuestionChecks(input: BuyerDecisionInput): BuyerQuestionCheck[] {
  const text = input.bodyText.toLowerCase();
  const all = (input.title + ' ' + input.headings.map(item => item.text).join(' ') + ' ' + text).toLowerCase();
  const actionFound = input.buttons.some(label => ACTION.test(label)) || input.links.some(link => ACTION.test(link.text)) || input.forms > 0;
  const product = isProduct(input);
  const proofFound = PROOF.test(all);
  const trustFound = TRUST.test(all);
  const benefitFound = BENEFIT.test(all);
  const checks: BuyerQuestionCheck[] = [
    { question: 'Who is this offer or product intended for?', observed: /for (?:businesses|teams|students|professionals|beginners|families|men|women|children|you)|designed for|built for|made for|ideal for|suitable for/i.test(all), evidenceIds: [input.textEvidenceId] },
    { question: 'What main benefit or value is described?', observed: benefitFound, evidenceIds: [input.textEvidenceId, input.domEvidenceId] },
    { question: 'What evidence supports key product or seller claims?', observed: proofFound, evidenceIds: [input.textEvidenceId, input.linkEvidenceId] },
    { question: 'What reassurance, policy or support information is available?', observed: trustFound, evidenceIds: [input.textEvidenceId, input.linkEvidenceId] },
    { question: 'Is a clear next step visible to the visitor?', observed: actionFound, evidenceIds: [input.domEvidenceId, input.linkEvidenceId] },
  ];
  if (product) checks.push(
    { question: 'Can I assess whether the product suits my needs?', observed: /specifications?|dimensions|materials?|ingredients|compatibility|size guide|size chart|product details|features|how to use/i.test(all), evidenceIds: [input.textEvidenceId] },
    { question: 'What are the delivery and post-purchase conditions?', observed: /shipping|delivery|dispatch|returns?|refunds?|exchanges?/i.test(all), evidenceIds: [input.textEvidenceId, input.linkEvidenceId] },
  );
  return checks;
}
export function summarizeTrustSignals(input: { title: string; bodyText: string; links: Array<{text:string;href:string}> }) {
  const text = input.title + ' ' + input.bodyText + ' ' + input.links.map(link => link.text).join(' ');
  const signals = [
    { key: 'delivery', label: 'Delivery information', pattern: /shipping|delivery|dispatch|fulfilment|fulfillment/i },
    { key: 'returns', label: 'Returns and refunds', pattern: /return policy|returns?|refunds?|exchanges?/i },
    { key: 'support', label: 'Support/contact route', pattern: /contact us|customer support|support@|mailto:|whatsapp|call us|phone number|help center|help centre/i },
    { key: 'payment', label: 'Payment/security language', pattern: /secure checkout|secure payment|payment methods|payment options/i },
    { key: 'warranty', label: 'Warranty or guarantee', pattern: /warranty|guarantee/i },
    { key: 'proof', label: 'Reviews, ratings or independent proof', pattern: /reviews?|testimonials?|case studies|ratings?|verified buyers?|certified|independently tested|award|accredited/i },
  ];
  return signals.map(signal => ({ key: signal.key, label: signal.label, status: signal.pattern.test(text) ? 'Observed in capture' as const : 'Not observed in capture' as const }));
}
