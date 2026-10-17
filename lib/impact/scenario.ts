export type ImpactScenarioInput = {
  monthlyVisits: number;
  conversionRatePercent: number;
  averageOrderValue: number;
  absoluteConversionChangePoints: number;
};

export type ImpactScenarioResult = {
  baselineOrders: number;
  scenarioOrders: number;
  baselineRevenue: number;
  scenarioRevenue: number;
  deltaOrders: number;
  deltaRevenue: number;
};

export function calculateImpactScenario(input: ImpactScenarioInput): ImpactScenarioResult | null {
  const { monthlyVisits, conversionRatePercent, averageOrderValue, absoluteConversionChangePoints } = input;
  const values = [monthlyVisits, conversionRatePercent, averageOrderValue, absoluteConversionChangePoints];
  if (!values.every(Number.isFinite)) return null;
  if (monthlyVisits < 0 || conversionRatePercent < 0 || conversionRatePercent > 100 || averageOrderValue < 0 || absoluteConversionChangePoints < 0 || conversionRatePercent + absoluteConversionChangePoints > 100) return null;
  const baselineOrders = monthlyVisits * conversionRatePercent / 100;
  const scenarioOrders = monthlyVisits * (conversionRatePercent + absoluteConversionChangePoints) / 100;
  const baselineRevenue = baselineOrders * averageOrderValue;
  const scenarioRevenue = scenarioOrders * averageOrderValue;
  return {
    baselineOrders,
    scenarioOrders,
    baselineRevenue,
    scenarioRevenue,
    deltaOrders: scenarioOrders - baselineOrders,
    deltaRevenue: scenarioRevenue - baselineRevenue,
  };
}
