export type CoreRevenueInput = {
  url: string;
  title: string;
  bodyText: string;
  headings: Array<{ tag: string; text: string }>;
  buttons: string[];
  links: Array<{ text: string; href: string }>;
  forms: number;
  textEvidenceId: string;
  domEvidenceId: string;
  linkEvidenceId: string;
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
const PRODUCT_DETAIL_SIGNAL = /product details|product information|specifications?|dimensions|materials?|ingredients|features|what.s included|what you get|size guide|size chart|technical details|how to use/i;
const COMMERCIAL_ACTION = /add to cart|buy now|shop now|checkout|subscribe|start free|book now|request a quote|contact sales|place order|order now|sign up|get started|download now|purchase/i;
const SUPPORT_SIGNAL = /contact us|customer support|support@|mailto:|whatsapp|call us|help centre|help center|customer service|phone number/i;

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

/**
 * Conservative, deterministic checks for buyer-critical information on a public page.
 * "Not observed" means absent from the captured HTML/text only—not proven absent site-wide.
 */
export function buildCoreRevenueFindings(input: CoreRevenueInput): CoreRevenueFinding[] {
  const output: CoreRevenueFinding[] = [];
  const text = input.bodyText;
  const normalized = (input.title + ' ' + text + ' ' + input.headings.map((h) => h.text).join(' ')).toLowerCase();
  const product = isProductPage(input);
  const commercialActionFound =
    input.buttons.some((label) => COMMERCIAL_ACTION.test(label)) ||
    input.links.some((link) => COMMERCIAL_ACTION.test(link.text));

  if (product) {
    if (!PRICE_SIGNAL.test(text)) {
      output.push(createFinding(
        'Product price was not observed in the captured page',
        'HIGH',
        'The captured page text did not expose a recognizable price or explicit price-on-request statement. Prices rendered by scripts or shown only after selecting a variant may not appear in this capture.',
        'A buyer may be unable to assess affordability or compare the offer from the information retrieved in this audit.',
        'Confirm whether the product price should be public. If so, expose the current price, currency, and any required variant or quantity conditions near the purchase action. Do not add unverified prices.',
        'What is the current price, and which options does it apply to?',
        [input.textEvidenceId],
      ));
    }
    if (!SHIPPING_SIGNAL.test(normalized)) {
      output.push(createFinding(
        'Shipping or delivery information was not observed',
        'MEDIUM',
        'No shipping, delivery, dispatch, fulfilment, pickup, or collection wording was found in the captured page text.',
        'Buyers may need to know whether the item can reach them, how fulfilment works, and which conditions or costs apply before ordering.',
        'Add a clear link or concise summary of verified delivery regions, estimated timing, fees, and any eligibility conditions. Do not invent delivery promises.',
        'Can this product be delivered to me, when, and at what cost?',
        [input.textEvidenceId, input.linkEvidenceId],
      ));
    }
    if (!RETURNS_SIGNAL.test(normalized)) {
      output.push(createFinding(
        'Return, refund, or exchange terms were not observed',
        'MEDIUM',
        'The captured page text did not contain recognizable return, refund, or exchange terms.',
        'Buyers may be unsure what options apply if the item is unsuitable, damaged, or not as expected.',
        'Link to the actual return/refund policy or summarize the verified conditions, time limits, exclusions, and process. Do not imply a policy exists until confirmed.',
        'What happens if the product is unsuitable or needs to be returned?',
        [input.textEvidenceId, input.linkEvidenceId],
      ));
    }
    if (!PRODUCT_DETAIL_SIGNAL.test(normalized)) {
      output.push(createFinding(
        'Product specifications or decision-useful details were not observed',
        'MEDIUM',
        'The captured page text did not match common product-detail signals such as features, specifications, dimensions, ingredients, materials, or usage information.',
        'The available capture may not give buyers enough information to assess suitability. This rule does not establish that the product has no details in images, tabs, or dynamically loaded sections.',
        'Add accurate product-specific details appropriate to the category, such as dimensions, materials, compatibility, ingredients, included items, or usage instructions, using verified source information.',
        'Does this product meet my needs and constraints?',
        [input.textEvidenceId],
      ));
    }
  } else {
    const h1s = input.headings.filter((heading) => heading.tag.toUpperCase() === 'H1');
    if (!input.title.trim() && h1s.length === 0) {
      output.push(createFinding(
        'Primary page proposition was not observed',
        'MEDIUM',
        'Neither a document title nor an H1 heading was found in the captured page.',
        'Visitors and assistive technologies may have difficulty identifying the page’s primary offer or purpose.',
        'Add a concise, accurate page title and a clear primary heading that state what the page offers and who it is for.',
        'What is this page offering, and is it intended for me?',
        [input.textEvidenceId, input.domEvidenceId],
      ));
    }
    if (!commercialActionFound && input.forms === 0) {
      output.push(createFinding(
        'No clear conversion step was observed in the captured page',
        'MEDIUM',
        'The captured button/link labels did not match common commercial actions, and no HTML form was detected. Custom labels and script-rendered interactions may not be recognized.',
        'A visitor may not know how to proceed from interest to the intended next step.',
        'Make the intended next action explicit and functional—for example, request a demo, contact sales, book a call, start a trial, or purchase—based on the actual business goal.',
        'What should an interested visitor do next?',
        [input.domEvidenceId, input.linkEvidenceId],
      ));
    }
  }

  if (!SUPPORT_SIGNAL.test(normalized) &&
      !input.links.some((link) => /contact|support|help/i.test(link.text))) {
    output.push(createFinding(
      'Support or contact route was not observed',
      'LOW',
      'No recognizable support/contact wording or contact/support/help link was found in the captured page.',
      'Visitors with pre-purchase questions may have difficulty finding a route to clarify product, delivery, billing, or suitability details.',
      'Expose the real support or contact route where appropriate and ensure the destination works. Do not publish placeholder contact details.',
      'Where can I get an answer before making a decision?',
      [input.textEvidenceId, input.linkEvidenceId],
    ));
  }

  return output;
}
