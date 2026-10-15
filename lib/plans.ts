export const PLAN_DEFINITIONS = {
  // Current public monthly plans. Audit units are monthly allowances, not a promise of business results.
  starter_monthly: { id: "starter_monthly", name: "Starter", interval: "month", amount: 49, units: 50 },
  starter_annual: { id: "starter_annual", name: "Starter", interval: "year", amount: 490, units: 50 },
  growth_monthly: { id: "growth_monthly", name: "Growth", interval: "month", amount: 149, units: 250 },
  growth_annual: { id: "growth_annual", name: "Growth", interval: "year", amount: 1490, units: 250 },
  agency_monthly: { id: "agency_monthly", name: "Agency", interval: "month", amount: 399, units: 1000 },
  agency_annual: { id: "agency_annual", name: "Agency", interval: "year", amount: 3990, units: 1000 },
  // Historical-only plan. Kept to preserve existing records; new checkout is disabled.
  founding_lifetime: { id: "founding_lifetime", name: "Founding Lifetime", interval: "one_time", amount: 799, units: 50 },
} as const;

export type PlanId = keyof typeof PLAN_DEFINITIONS;
export type PublicPlanId = "starter_monthly" | "growth_monthly" | "agency_monthly";

export const PUBLIC_PLAN_IDS: PublicPlanId[] = ["starter_monthly", "growth_monthly", "agency_monthly"];
export const FOUNDER_EMAIL = "wisdomfrankceo@gmail.com";
export const FOUNDING_LIFETIME_MAX_SLOTS = 50;

export function getPlan(planId: string) {
  if (!Object.prototype.hasOwnProperty.call(PLAN_DEFINITIONS, planId)) return null;
  return PLAN_DEFINITIONS[planId as PlanId];
}

export function getCheckoutPlan(planId: string) {
  if (!PUBLIC_PLAN_IDS.includes(planId as PublicPlanId)) return null;
  return getPlan(planId);
}
