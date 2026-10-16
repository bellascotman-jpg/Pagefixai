import { describe, expect, it } from 'vitest';
import { compareCommercialSignals } from '@/lib/intelligence/message-match';

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
