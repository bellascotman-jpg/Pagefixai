export const PLAN_DEFINITIONS = {
  starter_monthly: { id: "starter_monthly", name: "Starter", interval: "month", amount: 19, units: 20 },
  starter_annual: { id: "starter_annual", name: "Starter", interval: "year", amount: 190, units: 20 },
  growth_monthly: { id: "growth_monthly", name: "Growth", interval: "month", amount: 49, units: 100 },
  growth_annual: { id: "growth_annual", name: "Growth", interval: "year", amount: 490, units: 100 },
  agency_monthly: { id: "agency_monthly", name: "Agency", interval: "month", amount: 99, units: 300 },
  agency_annual: { id: "agency_annual", name: "Agency", interval: "year", amount: 990, units: 300 },
  founding_lifetime: { id: "founding_lifetime", name: "Founding Lifetime", interval: "one_time", amount: 799, units: 50 },
} as const;

export type PlanId = keyof typeof PLAN_DEFINITIONS;

export const FOUNDER_EMAIL = "wisdomchin658@gmail.com";
export const FOUNDING_LIFETIME_MAX_SLOTS = 50;

export function getPlan(planId: string) {
  if (!(planId in PLAN_DEFINITIONS)) return null;
  return PLAN_DEFINITIONS[planId as PlanId];
}
