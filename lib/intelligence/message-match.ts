export type CommercialSignal = { label: string; text: string };
export type ComparedCommercialSignal = CommercialSignal & {
  matchingCategoryPresent: boolean;
  exactValuePresent: boolean;
  valueMismatch: boolean;
};

const promisePatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: 'Free shipping / delivery', pattern: /\bfree\s+(?:shipping|delivery|dispatch)\b/i },
  { label: 'Percentage discount', pattern: /\b\d{1,3}\s?%\s?(?:off|discount|saving|savings)?\b/i },
  { label: 'Warranty promise', pattern: /\b(?:\d{1,3}[- ](?:year|month)\s+warranty|warranty included|manufacturer warranty)\b/i },
  { label: 'Return / refund promise', pattern: /\b(?:free returns?|returns? accepted|refund(?:s)? available|money[- ]back)\b/i },
  { label: 'Delivery timing', pattern: /\b(?:same[- ]day|next[- ]day|within \d+ days?|\d+[- ]day delivery)\b/i },
  { label: 'Universal compatibility', pattern: /\b(?:compatible with all|works with every|universal compatibility|fits all)\b/i },
  { label: 'Guarantee / performance promise', pattern: /\b(?:guaranteed|guarantee|100% effective|results in \d+ days?)\b/i },
  { label: 'Currency price', pattern: /(?:\$|₦|€|£)\s?\d[\d,.]*/i },
];

export function extractCommercialSignals(text: string): CommercialSignal[] {
  return promisePatterns.flatMap(item => {
    const match = text.match(item.pattern);
    return match ? [{ label: item.label, text: match[0] }] : [];
  });
}

function numericValue(text: string): number | null {
  const match = text.match(/\d+(?:[,.]\d+)?/);
  if (!match) return null;
  const value = Number(match[0].replace(/,/g, ''));
  return Number.isFinite(value) ? value : null;
}

function currencySymbol(text: string): string | null {
  return text.match(/[$₦€£]/)?.[0] ?? null;
}

export function compareCommercialSignals(source: string, destination: string): {
  sourceSignals: CommercialSignal[];
  destinationSignals: CommercialSignal[];
  compared: ComparedCommercialSignal[];
  gaps: ComparedCommercialSignal[];
} {
  const sourceSignals = extractCommercialSignals(source);
  const destinationSignals = extractCommercialSignals(destination);
  const compared = sourceSignals.map(item => {
    const sameCategory = destinationSignals.filter(dest => dest.label === item.label);
    const valueSensitive = item.label === 'Percentage discount' || item.label === 'Currency price';
    const sourceValue = numericValue(item.text);
    const exactValuePresent = sameCategory.some(dest =>
      numericValue(dest.text) === sourceValue &&
      sourceValue !== null &&
      (item.label !== 'Currency price' || currencySymbol(dest.text) === currencySymbol(item.text))
    );
    const matchingCategoryPresent = sameCategory.length > 0;
    const valueMismatch = valueSensitive && matchingCategoryPresent && !exactValuePresent;
    return { ...item, matchingCategoryPresent, exactValuePresent, valueMismatch };
  });
  return {
    sourceSignals,
    destinationSignals,
    compared,
    gaps: compared.filter(item => !item.matchingCategoryPresent || item.valueMismatch),
  };
}

const MESSAGE_STOPWORDS = new Set([
  'about','after','again','also','and','are','best','buy','can','deal','for','from','get','has','have','how','into','its','just','more','most','new','now','off','our','out','over','save','shop','special','that','the','their','them','then','this','through','today','use','was','were','what','when','with','your','you','free','only','sale','limited','offer','offers','order','click','visit','learn','discover','exclusive','available','online','official','page','product','products'
]);

export type MessageContinuity = {
  sourceTerms: string[];
  sharedTerms: string[];
  unmatchedSourceTerms: string[];
  literalCoveragePercent: number | null;
  note: string;
};

/**
 * Measures exact, normalized keyword overlap only. It is not semantic similarity
 * and must never be interpreted as an ad relevance score or proof of mismatch.
 */
export function analyzeMessageContinuity(source: string, destination: string): MessageContinuity {
  const tokenize = (text: string) => Array.from(new Set(
    (text.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) ?? [])
      .filter(token => !MESSAGE_STOPWORDS.has(token) && !/^\\d+$/.test(token))
  )).sort();
  const sourceTerms = tokenize(source);
  const destinationTerms = new Set(tokenize(destination));
  if (sourceTerms.length === 0 || destinationTerms.size === 0) {
    return {
      sourceTerms,
      sharedTerms: [],
      unmatchedSourceTerms: sourceTerms,
      literalCoveragePercent: null,
      note: 'Not enough distinctive words were supplied to calculate literal term overlap.',
    };
  }
  const sharedTerms = sourceTerms.filter(term => destinationTerms.has(term));
  const unmatchedSourceTerms = sourceTerms.filter(term => !destinationTerms.has(term));
  return {
    sourceTerms,
    sharedTerms,
    unmatchedSourceTerms,
    literalCoveragePercent: Math.round((sharedTerms.length / sourceTerms.length) * 100),
    note: 'Literal keyword overlap only. Synonyms, context, page layout, offer conditions and meaning are not evaluated.',
  };
}
