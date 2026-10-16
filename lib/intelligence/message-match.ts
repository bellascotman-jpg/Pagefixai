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
