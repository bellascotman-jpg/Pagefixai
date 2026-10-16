export type CoreRevenueInput = {
  url: string;
  title: string;
  metaDescription?: string;
  viewportMeta?: string;
  bodyText: string;
  headings: Array<{ tag: string; text: string }>;
  buttons: string[];
  links: Array<{ text: string; href: string }>;
  forms: number;
  imageCount?: number;
  imagesWithoutAlt?: number;
  textEvidenceId: string;
  domEvidenceId: string;
  linkEvidenceId: string;
  metadataEvidenceId?: string;
  imageEvidenceId?: string;
};

export type CoreRevenueFinding = {
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  priority: 'FIX_NOW' | 'FIX_NEXT' | 'FIX_LATER';
  observation: string;
  hypothesis: 'Inferred Risk' | 'Recommendation';
  whyItMatters: string;
  recommendation: string;
  implementationSteps: string;
  buyerQuestion: string;
  evidenceIds: string[];
};

const PRICE_SIGNAL = /(?:[$₦€£]\s?\d[\d,.]*|\b(?:USD|NGN|GBP|EUR)\s?\d[\d,.]*|\bprice\s+(?:on request|upon request|available on request)|\bcontact (?:us|sales) for (?:pricing|price)\b|\bfrom\s+(?:[$₦€£]\s?\d|\d[\d,.]*\s?(?:USD|NGN|GBP|EUR)))/i;
const SHIPPING_SIGNAL = /shipping|delivery|dispatch|fulfilment|fulfillment|pickup|pick-up|collection point/i;
const RETURNS_SIGNAL = /return policy|returns?|refunds?|exchanges?|money.back guarantee/i;
const PRODUCT_DETAIL_SIGNAL = /product details|product information|specifications?|dimensions|materials?|ingredients|features|what.s included|what you get|size guide|size chart|technical details|how to use|benefits/i;
const COMMERCIAL_ACTION = /add to cart|buy now|shop now|checkout|subscribe|start free|book now|request a quote|contact sales|place order|order now|sign up|get started|download now|purchase|try (?:it )?free|schedule a demo/i;
const SUPPORT_SIGNAL = /contact us|customer support|support@|mailto:|whatsapp|call us|help centre|help center|customer service|phone number/i;
const TRUST_SIGNAL = /secure checkout|secure payment|payment methods|warranty|guarantee|verified|certified|privacy policy|terms and conditions|terms of service|return policy|money.back/i;
const BENEFIT_SIGNAL = /benefit|why choose|designed to|helps you|built for|made for|save time|save money|improve|reduce|faster|easier|durable|lightweight|long.lasting|features include|key features/i;
const GENERIC_PROPOSITION = /^(home|welcome|welcome to our website|homepage|landing page|untitled|website|official website|main page)$/i;

function createFinding(
  title: string,
  severity: CoreRevenueFinding['severity'],
  observation: string,
  whyItMatters: string,
  recommendation: string,
  buyerQuestion: string,
  evidenceIds: string[],
): CoreRevenueFinding {
  return {
    title,
    severity,
    confidence: 'MEDIUM',
    effort: 'LOW',
    priority: severity === 'HIGH' ? 'FIX_NOW' : severity === 'MEDIUM' ? 'FIX_NEXT' : 'FIX_LATER',
    observation,
    hypothesis: 'Inferred Risk',
    whyItMatters,
    recommendation,
    implementationSteps: recommendation,
    buyerQuestion,
    evidenceIds,
  };
}

function isProductPage(input: CoreRevenueInput): boolean {
  let path = '';
  try { path = new URL(input.url).pathname; } catch { path = input.url; }
  return /\/(products?|items?)\//i.test(path) ||
    /add to cart|product details|\bsku\b|in stock|product description/i.test(input.title + ' ' + input.bodyText);
}

function hasAction(input: CoreRevenueInput): boolean {
  return input.buttons.some((label) => COMMERCIAL_ACTION.test(label)) ||
    input.links.some((link) => COMMERCIAL_ACTION.test(link.text));
}

/**
 * Conservative, deterministic checks for buyer-critical information on a public page.
 * "Not observed" means absent from the captured HTML/text—not proven absent site-wide.
 * No private analytics or revenue outcomes are inferred by these rules.
 */
export function buildCoreRevenueFindings(input: CoreRevenueInput): CoreRevenueFinding[] {
  const output: CoreRevenueFinding[] = [];
  const text = input.bodyText;
  const normalized = (input.title + ' ' + (input.metaDescription ?? '') + ' ' + text + ' ' + input.headings.map((h) => h.text).join(' ')).toLowerCase();
  const product = isProductPage(input);
  const actionFound = hasAction(input);
  const h1s = input.headings.filter((heading) => heading.tag.toUpperCase() === 'H1');
  const proposition = (h1s[0]?.text ?? input.title).trim();

  if (product) {
    if (!PRICE_SIGNAL.test(text)) {
      output.push(createFinding(
        'Product price was not observed in the captured page', 'HIGH',
        'The captured page text did not expose a recognizable price or explicit price-on-request statement. Prices rendered by scripts or shown only after selecting a variant may not appear in this capture.',
        'A buyer may be unable to assess affordability or compare the offer from the information retrieved in this audit.',
        'Confirm whether the product price should be public. If so, expose the current price, currency, and any required variant or quantity conditions near the purchase action. Do not add unverified prices.',
        'What is the current price, and which options does it apply to?', [input.textEvidenceId],
      ));
    }
    if (!SHIPPING_SIGNAL.test(normalized)) {
      output.push(createFinding(
        'Shipping or delivery information was not observed', 'MEDIUM',
        'No shipping, delivery, dispatch, fulfilment, pickup, or collection wording was found in the captured page text.',
        'Buyers may need to know whether the item can reach them, how fulfilment works, and which conditions or costs apply before ordering.',
        'Add a clear link or concise summary of verified delivery regions, estimated timing, fees, and any eligibility conditions. Do not invent delivery promises.',
        'Can this product be delivered to me, when, and at what cost?', [input.textEvidenceId, input.linkEvidenceId],
      ));
    }
    if (!RETURNS_SIGNAL.test(normalized)) {
      output.push(createFinding(
        'Return, refund, or exchange terms were not observed', 'MEDIUM',
        'The captured page text did not contain recognizable return, refund, or exchange terms.',
        'Buyers may be unsure what options apply if the item is unsuitable, damaged, or not as expected.',
        'Link to the actual return/refund policy or summarize the verified conditions, time limits, exclusions, and process. Do not imply a policy exists until confirmed.',
        'What happens if the product is unsuitable or needs to be returned?', [input.textEvidenceId, input.linkEvidenceId],
      ));
    }
    if (!PRODUCT_DETAIL_SIGNAL.test(normalized)) {
      output.push(createFinding(
        'Product specifications or decision-useful details were not observed', 'MEDIUM',
        'The captured page text did not match common product-detail signals such as features, specifications, dimensions, ingredients, materials, benefits, or usage information.',
        'The available capture may not give buyers enough information to assess suitability. This does not establish that details are absent from images, tabs, or dynamically loaded sections.',
        'Add accurate product-specific details appropriate to the category, using verified source information. Avoid unsupported performance, health, compatibility, or quality claims.',
        'Does this product meet my needs and constraints?', [input.textEvidenceId],
      ));
    }
    if (!actionFound) {
      output.push(createFinding(
        'Primary purchase action was not observed', 'MEDIUM',
        'No common purchase or order action was detected among captured button and link labels. Custom labels and script-rendered controls may not be recognized.',
        'A buyer may have difficulty identifying the next step from the available capture.',
        'Ensure the actual purchase path is visible, accessible, and labelled with a specific action such as Add to cart or Buy now. Verify that the control works on the live page.',
        'How do I purchase this product?', [input.domEvidenceId, input.linkEvidenceId],
      ));
    }
    const imageCount = input.imageCount ?? 0;
    if (imageCount === 1 && input.imageEvidenceId) {
      output.push(createFinding(
        'Only one image element was observed for this product page', 'LOW',
        'The captured HTML contained one image element. CSS backgrounds, galleries, lazy-loaded images, and variant-specific images may not be included in this count.',
        'For products that require visual evaluation, one captured image may provide limited visible detail about appearance, scale, or variants.',
        'Review the actual product gallery and add additional accurate views where useful, such as alternate angles, scale, details, or variants. Do not add imagery that misrepresents the item.',
        'Can I see enough accurate views to evaluate this product?', [input.imageEvidenceId],
      ));
    }
  } else {
    if (!proposition || GENERIC_PROPOSITION.test(proposition)) {
      output.push(createFinding(
        'Primary offer or value proposition is unclear in the captured heading', 'MEDIUM',
        proposition ? 'The captured primary heading/title is generic and does not identify the specific offer.' : 'No page title or H1 heading was available to identify the primary offer.',
        'Visitors may need additional effort to understand what is offered and whether the page is relevant to them.',
        'Use a specific, accurate headline that names the offer and its intended audience or primary use. Keep it aligned with the actual page content.',
        'What is being offered, and who is it for?', [input.domEvidenceId, input.textEvidenceId],
      ));
    }
    if (!BENEFIT_SIGNAL.test(normalized) && text.trim().length > 80) {
      output.push(createFinding(
        'Explicit customer benefits were not identified by the text check', 'LOW',
        'The captured title, description, headings, and body text did not match the current benefit-language patterns. Benefits may be expressed in other language or imagery.',
        'Visitors may need clearer explanation of the practical value or outcome of the offer.',
        'Explain concrete, verifiable benefits in plain language and connect them to the audience’s needs. Avoid guarantees or unsupported superlatives.',
        'What practical value would I get from this offer?', [input.textEvidenceId, input.domEvidenceId],
      ));
    }
    if (!actionFound && input.forms === 0) {
      output.push(createFinding(
        'No clear conversion step was observed in the captured page', 'MEDIUM',
        'The captured button/link labels did not match common commercial actions, and no HTML form was detected. Custom labels and script-rendered interactions may not be recognized.',
        'A visitor may not know how to proceed from interest to the intended next step.',
        'Make the intended next action explicit and functional—for example, request a demo, contact sales, book a call, start a trial, or purchase—based on the actual business goal.',
        'What should an interested visitor do next?', [input.domEvidenceId, input.linkEvidenceId],
      ));
    }
  }

  if (!SUPPORT_SIGNAL.test(normalized) && !input.links.some((link) => /contact|support|help/i.test(link.text))) {
    output.push(createFinding(
      'Support or contact route was not observed', 'LOW',
      'No recognizable support/contact wording or contact/support/help link was found in the captured page.',
      'Visitors with pre-purchase questions may have difficulty finding a route to clarify product, delivery, billing, or suitability details.',
      'Expose the real support or contact route where appropriate and ensure the destination works. Do not publish placeholder contact details.',
      'Where can I get an answer before making a decision?', [input.textEvidenceId, input.linkEvidenceId],
    ));
  }

  if (!TRUST_SIGNAL.test(normalized) && !input.links.some((link) => /privacy|terms|security|warranty|guarantee|returns?/i.test(link.text))) {
    output.push(createFinding(
      'Purchase-relevant trust or policy information was not observed', 'LOW',
      'The captured text and link labels did not reveal common trust/policy signals such as payment security, warranty, privacy terms, or a returns policy. This pattern check cannot assess the legitimacy of trust claims.',
      'Buyers may need clearer access to the actual policies and conditions relevant to payment, privacy, warranties, or returns.',
      'Link to the real, current policies and explain only trust assurances that can be substantiated. Do not add fake badges, certifications, or guarantees.',
      'Where can I review the policies and protections that apply to this purchase?', [input.textEvidenceId, input.linkEvidenceId],
    ));
  }

  if (input.viewportMeta !== undefined && !/width\s*=\s*device-width/i.test(input.viewportMeta)) {
    output.push(createFinding(
      'Mobile viewport configuration was not detected', 'MEDIUM',
      input.viewportMeta.trim() ? 'A viewport meta tag was present, but it did not include width=device-width.' : 'No viewport meta value containing width=device-width was observed in the document metadata.',
      'Without an appropriate viewport configuration, the page may not render at the intended device width on mobile browsers. This static check does not measure actual responsive layout.',
      'Review the page’s viewport meta tag and test the actual page at mobile widths. A common configuration uses width=device-width and an appropriate initial scale.',
      'Does the page render at the intended width on a mobile device?', [input.metadataEvidenceId ?? input.textEvidenceId],
    ));
  }

  if (input.imagesWithoutAlt !== undefined && input.imagesWithoutAlt > 0 && input.imageEvidenceId) {
    output.push(createFinding(
      'Image alternative-text review needed', input.imagesWithoutAlt > 5 ? 'MEDIUM' : 'LOW',
      `${input.imagesWithoutAlt} of ${input.imageCount ?? 'an unknown number of'} captured image elements had empty alt attributes. Empty alt is appropriate for decorative images, so this is a review cue rather than proof of an accessibility defect.`,
      'Informative images need meaningful text alternatives for people using assistive technology.',
      'Review each image in context. Add concise alt text to informative images and retain empty alt attributes for decorative images.',
      'Do informative images communicate their relevant meaning to someone who cannot see them?', [input.imageEvidenceId],
    ));
  }

  return output;
}
