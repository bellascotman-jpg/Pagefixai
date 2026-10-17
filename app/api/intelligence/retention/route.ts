import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { analyzeRetentionJourney, type RetentionInput } from '@/lib/intelligence/retention';

export const runtime = 'nodejs';

const stepSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().max(160),
  content: z.string().max(12000),
  expectedNextStep: z.string().max(300),
  expectedOutcome: z.string().max(500),
});
const emailSchema = z.object({
  subject: z.string().max(300),
  body: z.string().max(6000),
  callToAction: z.string().max(300),
});
const schema = z.object({
  name: z.string().min(1).max(120),
  businessType: z.enum(['saas', 'ecommerce']),
  flowType: z.enum(['signup', 'onboarding', 'activation', 'retention', 'pricing', 'cancellation']),
  promisedOutcome: z.string().max(1200),
  steps: z.array(stepSchema).min(1).max(12),
  emails: z.array(emailSchema).max(10),
  pricingText: z.string().max(12000),
  cancellationText: z.string().max(12000),
  metrics: z.object({
    usersStarted: z.number().int().nonnegative().nullable(),
    usersCompleted: z.number().int().nonnegative().nullable(),
    activatedUsers: z.number().int().nonnegative().nullable(),
    windowLabel: z.string().max(300),
  }),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'Sign in to view saved retention analyses.' }, { status: 401 });
  const records = await db.retentionAnalysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, name: true, flowType: true, input: true, findings: true, metrics: true, createdAt: true },
  });
  return NextResponse.json({ analyses: records });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'Sign in to analyse and save a retention journey.' }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Send a valid JSON request body.' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Review required fields, counts, and input lengths before saving.' }, { status: 400 });
  }
  const input = parsed.data as RetentionInput;
  const metrics = input.metrics;
  const counts = [metrics.usersStarted, metrics.usersCompleted, metrics.activatedUsers].filter((value): value is number => value !== null);
  if (counts.some(value => !Number.isSafeInteger(value))) {
    return NextResponse.json({ message: 'Metric counts must be safe whole numbers.' }, { status: 400 });
  }
  if (metrics.usersStarted !== null &&
      ((metrics.usersCompleted !== null && metrics.usersCompleted > metrics.usersStarted) ||
       (metrics.activatedUsers !== null && metrics.activatedUsers > metrics.usersStarted))) {
    return NextResponse.json({ message: 'Completed and activated users cannot exceed users started in the same cohort.' }, { status: 400 });
  }

  const result = analyzeRetentionJourney(input);
  const record = await db.retentionAnalysis.create({
    data: {
      userId: user.id,
      name: input.name,
      flowType: input.flowType,
      input: input as unknown as Prisma.InputJsonValue,
      findings: result.findings as unknown as Prisma.InputJsonValue,
      metrics: result.metrics as unknown as Prisma.InputJsonValue,
    },
    select: { id: true, name: true, flowType: true, createdAt: true },
  });
  return NextResponse.json({ saved: true, analysis: { ...record, findings: result.findings, metrics: result.metrics } }, { status: 201 });
}
