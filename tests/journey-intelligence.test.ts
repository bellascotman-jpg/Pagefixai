import { describe, expect, it } from 'vitest';
import { analyzeJourneyStages, calculateCheckoutMetrics, summarizeTrafficWasteRequirements } from '@/lib/intelligence/journey-intelligence';

describe('journey intelligence', () => {
  it('marks a missing step as unverified instead of claiming it is broken', () => {
    const observations = analyzeJourneyStages([
      { id: 'product', name: 'Product page', url: 'https://shop.example/p/1', content: 'Product details. Add to cart.', expectedNextStep: 'Add to cart' },
      { id: 'checkout', name: 'Checkout', url: '', content: '', expectedNextStep: '' },
    ]);
    expect(observations).toHaveLength(1);
    expect(observations[0].kind).toBe('DESTINATION_UNVERIFIED');
    expect(observations[0].label).toBe('Recommendation');
    expect(observations[0].detail).toContain('has not been inspected');
  });

  it('flags expected handoff text not found in the supplied content', () => {
    const observations = analyzeJourneyStages([
      { id: 'cart', name: 'Cart', url: '', content: 'Your basket is ready.', expectedNextStep: 'Proceed to checkout' },
    ]);
    expect(observations[0].kind).toBe('HANDOFF_UNCLEAR');
    expect(observations[0].label).toBe('Inferred Risk');
  });

  it('calculates checkout rates only for a valid same-cohort input', () => {
    const result = calculateCheckoutMetrics({ checkoutStarts: 100, completedOrders: 63, windowLabel: 'Oct 1–7, same checkout cohort' });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.incompleteCheckouts).toBe(37);
      expect(result.abandonmentRatePercent).toBe(37);
      expect(result.completionRatePercent).toBe(63);
    }
  });

  it('rejects inconsistent checkout counts', () => {
    expect(calculateCheckoutMetrics({ checkoutStarts: 10, completedOrders: 11, windowLabel: 'last week' }).valid).toBe(false);
    expect(calculateCheckoutMetrics({ checkoutStarts: 0, completedOrders: 0, windowLabel: 'last week' }).valid).toBe(false);
  });

  it('lists missing evidence needed before estimating traffic waste', () => {
    const requirements = summarizeTrafficWasteRequirements(false, false, true, false);
    expect(requirements.some(item => item.includes('Ad spend is missing'))).toBe(true);
    expect(requirements.some(item => item.includes('Landing sessions are missing'))).toBe(false);
    expect(requirements.some(item => item.includes('Conversion events are missing'))).toBe(true);
  });
});
