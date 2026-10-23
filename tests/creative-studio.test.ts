import { describe, expect, it } from 'vitest';
import { creativeOutputSchema } from '@/lib/creative-studio/schema';

const variant = {
  angle: 'Outcome clarity',
  headline: 'A clear headline based on supplied facts',
  primaryText: 'A concise description that uses only the verified facts in the brief.',
  callToAction: 'Learn more',
  rationale: 'This angle makes the offer easier to understand without adding unsupported claims.',
  hypothesis: 'This message may improve qualified engagement if the audience values clarity.',
  claimsToVerify: [],
};

const testPlan = {
  primaryMetric: 'Qualified conversion rate',
  guardrailMetric: 'Cost per qualified visit',
  hypothesis: 'A clearer value proposition may increase qualified conversions.',
  testGuidance: 'Run variants concurrently with comparable audiences and sufficient sample size.',
  decisionCaveat: 'Do not select a winner until the experiment has adequate data and the result is sufficiently reliable.',
};

describe('creativeOutputSchema', () => {
  it('accepts exactly three structurally valid variants and a test plan', () => {
    const result = creativeOutputSchema.safeParse({ variants: [variant, { ...variant, angle: 'Problem framing' }, { ...variant, angle: 'Product demonstration' }], testPlan });
    expect(result.success).toBe(true);
  });

  it('rejects fewer than three variants', () => {
    expect(creativeOutputSchema.safeParse({ variants: [variant, variant], testPlan }).success).toBe(false);
  });

  it('rejects unexpected fields to avoid silently accepting malformed model output', () => {
    expect(creativeOutputSchema.safeParse({ variants: [{ ...variant, inventedRevenueLift: '200%' }, variant, variant], testPlan }).success).toBe(false);
  });
});
