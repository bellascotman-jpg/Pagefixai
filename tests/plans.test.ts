import { describe, expect, it } from "vitest";
import { getCheckoutPlan, getPlan, PLAN_DEFINITIONS, PUBLIC_PLAN_IDS } from "@/lib/plans";

describe("billing plans", () => {
  it("keeps stable internal prices for current plans", () => {
    expect(getPlan("starter_monthly")?.amount).toBe(49);
    expect(getPlan("growth_monthly")?.amount).toBe(149);
    expect(getPlan("agency_monthly")?.amount).toBe(399);
    expect(getPlan("growth_annual")?.amount).toBe(1490);
  });

  it("rejects unknown plan identifiers", () => {
    expect(getPlan("growth_monthly_fake")).toBeNull();
  });

  it("publishes three requested monthly subscription choices and does not sell lifetime access", () => {
    expect(PUBLIC_PLAN_IDS).toHaveLength(3);
    expect(PUBLIC_PLAN_IDS).toEqual(["starter_monthly", "growth_monthly", "agency_monthly"]);
    expect(PUBLIC_PLAN_IDS).not.toContain("founding_lifetime");
    expect(getCheckoutPlan("founding_lifetime")).toBeNull();
    expect(getCheckoutPlan("growth_monthly")?.amount).toBe(149);
  });

  it("retains historical lifetime plan data for existing entitlements", () => {
    expect(PLAN_DEFINITIONS.founding_lifetime.amount).toBe(799);
    expect(getPlan("founding_lifetime")?.units).toBe(50);
  });
});
