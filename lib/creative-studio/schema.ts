import { z } from 'zod';

export const creativeVariantSchema = z.object({
  angle: z.string().min(1).max(200),
  headline: z.string().min(1).max(500),
  primaryText: z.string().min(1).max(3000),
  callToAction: z.string().min(1).max(200),
  rationale: z.string().min(1).max(1200),
  hypothesis: z.string().min(1).max(1200),
  claimsToVerify: z.array(z.string().min(1).max(500)).max(8),
}).strict();

export const creativeOutputSchema = z.object({
  variants: z.array(creativeVariantSchema).length(3),
  testPlan: z.object({
    primaryMetric: z.string().min(1).max(300),
    guardrailMetric: z.string().min(1).max(300),
    hypothesis: z.string().min(1).max(1200),
    testGuidance: z.string().min(1).max(2000),
    decisionCaveat: z.string().min(1).max(1200),
  }).strict(),
}).strict();
