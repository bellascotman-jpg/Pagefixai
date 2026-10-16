export type CommerceCategory =
  | 'Apparel'
  | 'Electronics'
  | 'Furniture'
  | 'Beauty & Skincare'
  | 'Home Appliances'
  | 'Digital Product'
  | 'General Product'
  | 'Landing Page';

export type CommerceFinding = {
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  priority: 'FIX_NOW' | 'FIX_NEXT' | 'FIX_LATER';
  observation: string;
  hypothesis: string;
  whyItMatters: string;
  recommendation: string;
  implementationSteps: string;
  buyerQuestion: string;
  evidenceIds: string[];
};

export type CommercePageInput = {
  url: string;
  title: string;
  bodyText: string;
  headings: Array<{ tag: string; text: string }>;
  buttons: string[];
  evidenceId: string;
};

export function classifyCommercePage(url: string, title: string, bodyText: string): CommerceCategory {
  const text = `${title} ${bodyText}`.toLowerCase();
  const path = (() => {
    try { return new URL(url).pathname.toLowerCase(); } catch { return url.toLowerCase(); }
  })();
  const productLike = /\/(products?|items?)\//i.test(path) ||
    /add to cart|product details|\bsku\b|in stock|product description/i.test(text);

  if (!productLike) return 'Landing Page';
  if (/\b(skincare|skin care|serum|moisturizer|moisturiser|cleanser|sunscreen|cosmetic|beauty cream)\b/i.test(text)) return 'Beauty & Skincare';
  if (/\b(sofa|couch|wardrobe|dining table|office chair|bookshelf|mattress|bed frame|furniture)\b/i.test(text)) return 'Furniture';
  if (/\b(laptop|smartphone|mobile phone|headphones|earbuds|tablet|charger|usb-c|bluetooth|processor|graphics card|electronics)\b/i.test(text)) return 'Electronics';
  if (/\b(refrigerator|fridge|washing machine|microwave|air conditioner|dishwasher|blender|vacuum cleaner|home appliance)\b/i.test(text)) return 'Home Appliances';
  if (/\b(t-shirt|tshirt|dress|jeans|trousers|jacket|sneakers|shoes|apparel|clothing|size chart|fabric|garment)\b/i.test(text)) return 'Apparel';
  if (/\b(download|digital product|online course|ebook|e-book|template|software license|digital access|membership)\b/i.test(text)) return 'Digital Product';
  return 'General Product';
}

function finding(input: {
  title: string;
  severity?: CommerceFinding['severity'];
  confidence?: CommerceFinding['confidence'];
  observation: string;
  whyItMatters: string;
  recommendation: string;
  buyerQuestion: string;
  evidenceId: string;
  classification?: CommerceFinding['hypothesis'];
}): CommerceFinding {
  const severity = input.severity ?? 'MEDIUM';
  return {
    title: input.title,
    severity,
    confidence: input.confidence ?? 'MEDIUM',
    effort: 'LOW',
    priority: severity === 'HIGH' ? 'FIX_NOW' : severity === 'MEDIUM' ? 'FIX_NEXT' : 'FIX_LATER',
    observation: input.observation,
    hypothesis: input.classification ?? 'Inferred Risk',
    whyItMatters: input.whyItMatters,
    recommendation: input.recommendation,
    implementationSteps: input.recommendation,
    buyerQuestion: input.buyerQuestion,
    evidenceIds: [input.evidenceId],
  };
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function buildCommerceIntelligenceFindings(input: CommercePageInput): CommerceFinding[] {
  const text = input.bodyText.toLowerCase();
  const category = classifyCommercePage(input.url, input.title, input.bodyText);
  const output: CommerceFinding[] = [];

  const categoryRules: Partial<Record<CommerceCategory, {
    label: string;
    question: string;
    signals: RegExp[];
    recommendation: string;
  }>> = {
    Apparel: {
      label: 'Size and fit guidance was not observed in the captured page',
      question: 'How should a buyer choose the right size or fit?',
      signals: [/size chart|size guide|fit guide|measurements|garment measurements|true to size|fits small|fits large/i],
      recommendation: 'If sizing is relevant to this product, add a verified size chart or fit guidance with measurement instructions. Do not invent measurements or fit claims.',
    },
    Electronics: {
      label: 'Compatibility or technical requirements were not observed in the captured page',
      question: 'Will this product work with the buyer’s device or setup?',
      signals: [/compatible with|compatibility|supported devices|system requirements|voltage|wattage|power input|model number|technical specifications|specifications/i],
      recommendation: 'Add verified compatibility details, model support, power requirements, and relevant specifications where applicable. Confirm every detail against authoritative product information.',
    },
    Furniture: {
      label: 'Furniture dimensions or assembly details were not observed in the captured page',
      question: 'Will this item fit the buyer’s space and can it be assembled?',
      signals: [/dimensions|measurements|width|height|depth|assembly|assembled size|material(s)?/i],
      recommendation: 'Provide verified dimensions, material details, and assembly requirements where relevant. Use manufacturer or seller-confirmed specifications.',
    },
    'Beauty & Skincare': {
      label: 'Ingredient or usage guidance was not observed in the captured page',
      question: 'What is in this product and how should it be used?',
      signals: [/ingredients|ingredient list|how to use|directions|usage instructions|warnings|caution|patch test/i],
      recommendation: 'Add accurate ingredient information, directions, and relevant warnings based on verified product packaging or authoritative supplier information. Do not invent safety or efficacy claims.',
    },
    'Home Appliances': {
      label: 'Installation or operating requirements were not observed in the captured page',
      question: 'What space, power, or installation requirements apply?',
      signals: [/dimensions|installation|power requirements|voltage|wattage|capacity|maintenance|operating instructions/i],
      recommendation: 'Add verified dimensions, power or capacity details, installation requirements, and maintenance guidance where applicable.',
    },
    'Digital Product': {
      label: 'Digital deliverables or access conditions were not observed in the captured page',
      question: 'What exactly will the buyer receive and how will access work?',
      signals: [/what you get|what’s included|what's included|deliverables|download|access instructions|system requirements|supported platform|refund policy/i],
      recommendation: 'Explain the exact deliverables, access method, prerequisites, supported platforms, and applicable refund terms. Only state conditions the seller can confirm.',
    },
  };

  const rule = categoryRules[category];
  if (rule && !hasAny(text, rule.signals)) {
    output.push(finding({
      title: rule.label,
      observation: `The captured page was classified as ${category}, but the inspection did not observe the relevant information signal. This does not prove the information is absent elsewhere or in content that could not be captured.`,
      whyItMatters: `Buyers of some ${category.toLowerCase()} products may need this information to judge suitability and understand what they are purchasing. The inspection did not measure customer behaviour or return outcomes.`,
      recommendation: rule.recommendation,
      buyerQuestion: rule.question,
      evidenceId: input.evidenceId,
      classification: 'Inferred Risk',
    }));
  }

  // Only flag high-specificity, potentially contradictory statements. The
  // result remains a hypothesis because page context may explain the terms.
  const contradictionRules: Array<{
    title: string;
    a: RegExp;
    b: RegExp;
    observation: string;
    why: string;
    recommendation: string;
    question: string;
  }> = [
    {
      title: 'Potentially conflicting return statements',
      a: /\b(all sales final|no returns accepted|returns are not accepted|no return policy)\b/i,
      b: /\b(\d{1,3}[- ]day returns?|returns accepted|free returns?|return within \d{1,3} days?)\b/i,
      observation: 'The captured page contains language that appears to restrict returns and language that appears to allow them. These statements may apply to different products or conditions; the inspection has not established which terms control.',
      why: 'Unclear or conflicting return terms can make it harder for buyers to understand the conditions that apply to their purchase.',
      recommendation: 'Review the exact return-policy language and make the applicable conditions, exclusions, and time limits consistent and easy to find. Do not remove legitimate exclusions.',
      question: 'Which return terms apply to this product?',
    },
    {
      title: 'Potentially conflicting shipping promises',
      a: /\b(free shipping|free delivery|shipping is free|delivery is free)\b/i,
      b: /\b(shipping fee applies|delivery fee applies|shipping charge applies|delivery charge applies|shipping costs extra|delivery costs extra)\b/i,
      observation: 'The captured page contains both a free-shipping or free-delivery promise and language indicating an additional shipping or delivery charge. Eligibility conditions may explain the difference, but they were not resolved by this check.',
      why: 'Buyers may misunderstand the final delivery cost if eligibility and exceptions are not clear.',
      recommendation: 'State the conditions for free delivery and identify any regions, order values, or products where charges apply.',
      question: 'When does free shipping apply, and when are charges added?',
    },
    {
      title: 'Potentially conflicting warranty statements',
      a: /\b(no warranty|without warranty|warranty not provided)\b/i,
      b: /\b(\d{1,3}[- ]year warranty|\d{1,3}[- ]month warranty|warranty included|manufacturer warranty|warranty provided)\b/i,
      observation: 'The captured page contains language indicating that a warranty is not provided and language suggesting that a warranty is included. The statements may refer to different items or conditions and need contextual review.',
      why: 'Unclear warranty conditions can affect buyer expectations and post-purchase disputes.',
      recommendation: 'Confirm the warranty terms and state the applicable duration, provider, coverage, exclusions, and eligibility conditions using verified information.',
      question: 'What warranty, if any, applies to this product?',
    },
  ];

  for (const rule of contradictionRules) {
    if (rule.a.test(input.bodyText) && rule.b.test(input.bodyText)) {
      output.push(finding({
        title: rule.title,
        severity: 'HIGH',
        confidence: 'MEDIUM',
        observation: rule.observation,
        whyItMatters: rule.why,
        recommendation: rule.recommendation,
        buyerQuestion: rule.question,
        evidenceId: input.evidenceId,
        classification: 'Hypothesis',
      }));
    }
  }

  return output;
}
