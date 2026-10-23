import { describe, expect, it } from 'vitest';
import { creativeOutputSchema } from '@/lib/creative-studio/schema';

const validOutput = {
  variants: ['A', 'B', 'C'].map((angle) => ({
    angle,
    headline: 'A clear headline',
    primaryText: 'Copy grounded in the supplied product facts.',
    callToAction: 'Learn more',
    rationale: 'This tests a distinct message angle.',
    hypothesis: 'This message may improve qualified click-through.',
    claimsToVerify: [],
  })),
  testPlan: {
    primaryMetric: 'Qualified click-through rate',
    guardrailMetric: 'Landing-page bounce rate',
    hypothesis: 'A clearer value proposition may improve qualified click-through.',
    testGuidance: 'Randomize eligible traffic and keep the audience and offer constant.',
    decisionCaveat: 'Do not select a winner before sufficient data is collected.',
  },
};

describe('creativeOutputSchema', () => {
  it('accepts three valid creative variants and a test plan', () => {
    expect(creativeOutputSchema.safeParse(validOutput).success).toBe(true);
  });

  it('rejects missing variants and unexpected fields', () => {
    expect(creativeOutputSchema.safeParse({ ...validOutput, variants: validOutput.variants.slice(0, 2) }).success).toBe(false);
    expect(creativeOutputSchema.safeParse({ ...validOutput, extra: true }).success).toBe(false);
  });
});
