import { describe, expect, it } from 'vitest';
import { analyzeMessageContinuity, compareCommercialSignals } from '@/lib/intelligence/message-match';

describe('literal message matching', () => {
  it('flags discount and price value mismatches', () => {
    const result = compareCommercialSignals('50% off and only $50.00', '10% off and only £50.00');
    expect(result.gaps).toHaveLength(2);
    expect(result.compared.filter(item => item.valueMismatch)).toHaveLength(2);
  });
  it('keeps missing signals as candidate gaps, not proof of deception', () => {
    const result = compareCommercialSignals('Free delivery and a 2-year warranty', 'Delivery conditions apply.');
    expect(result.gaps.length).toBe(2);
  });
});

import { analyzeMessageContinuity } from '@/lib/intelligence/message-match';

describe('literal message continuity', () => {
  it('shows exact campaign terms missing from destination copy without claiming semantic mismatch', () => {
    const result = analyzeMessageContinuity('Lightweight linen trousers for travel comfort', 'Shop our cotton shirt collection');
    expect(result.unmatchedSourceTerms).toContain('lightweight');
    expect(result.unmatchedSourceTerms).toContain('linen');
    expect(result.literalCoveragePercent).not.toBeNull();
    expect(result.note).toContain('Literal keyword overlap only');
  });

  it('does not invent a percentage when either side has no distinctive terms', () => {
    const result = analyzeMessageContinuity('Buy now and shop today', '');
    expect(result.literalCoveragePercent).toBeNull();
  });
});
