import { describe, expect, it } from 'vitest';
import { calculateImpactScenario } from '@/lib/impact/scenario';

describe('calculateImpactScenario', () => {
  it('calculates baseline and hypothetical scenario without claiming causation', () => {
    const result = calculateImpactScenario({
      monthlyVisits: 10000,
      conversionRatePercent: 2,
      averageOrderValue: 50,
      absoluteConversionChangePoints: 0.2,
    });
    expect(result).not.toBeNull();
    expect(result?.baselineOrders).toBe(200);
    expect(result?.baselineRevenue).toBe(10000);
    expect(result?.scenarioOrders).toBeCloseTo(220);
    expect(result?.scenarioRevenue).toBeCloseTo(11000);
    expect(result?.deltaRevenue).toBeCloseTo(1000);
  });

  it('rejects invalid or impossible input values', () => {
    expect(calculateImpactScenario({ monthlyVisits: -1, conversionRatePercent: 2, averageOrderValue: 50, absoluteConversionChangePoints: 0.2 })).toBeNull();
    expect(calculateImpactScenario({ monthlyVisits: 10, conversionRatePercent: 99, averageOrderValue: 50, absoluteConversionChangePoints: 2 })).toBeNull();
    expect(calculateImpactScenario({ monthlyVisits: 10, conversionRatePercent: 2, averageOrderValue: Number.NaN, absoluteConversionChangePoints: 0.2 })).toBeNull();
  });

  it('allows a zero change and a zero traffic scenario', () => {
    const result = calculateImpactScenario({ monthlyVisits: 0, conversionRatePercent: 0, averageOrderValue: 0, absoluteConversionChangePoints: 0 });
    expect(result?.baselineRevenue).toBe(0);
    expect(result?.deltaRevenue).toBe(0);
  });
});
