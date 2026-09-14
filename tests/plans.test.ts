import { describe, expect, it } from "vitest";
import { getPlan, PLAN_DEFINITIONS } from "@/lib/plans";

describe("billing plans", () => {
  it("uses stable internal plan identifiers", () => {
    expect(getPlan("growth_monthly")?.amount).toBe(49);
    expect(getPlan("growth_annual")?.amount).toBe(490);
  });

  it("rejects unknown plan identifiers", () => {
    expect(getPlan("growth_monthly_fake")).toBeNull();
  });

  it("contains every public plan", () => {
    expect(Object.keys(PLAN_DEFINITIONS)).toHaveLength(7);
  });
});
