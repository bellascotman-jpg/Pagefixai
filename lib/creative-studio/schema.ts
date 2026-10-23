import { z } from 'zod';

export const creativeVariantSchema = z.object({
  angle: z.string().min(2).max(80),
  headline: z.string().min(2).max(180),
  primaryText: z.string().min(2).max(1200),
  callToAction: z.string().min(2).max(100),
  rationale: z.string().min(10).max(500),
  hypothesis: z.string().min(10).max(500),
  claimsToVerify: z.array(z.string().max(240)).max(8),
}).strict();

export const creativeOutputSchema = z.object({
  variants: z.array(creativeVariantSchema).length(3),
  testPlan: z.object({
    primaryMetric: z.string().min(2).max(160),
    guardrailMetric: z.string().min(2).max(160),
    hypothesis: z.string().min(10).max(500),
    testGuidance: z.string().min(10).max(800),
    decisionCaveat: z.string().min(10).max(500),
  }).strict(),
}).strict();
