import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

const stageSchema = z.object({
  id: z.string().max(80),
  name: z.string().max(160),
  url: z.string().max(2048),
  content: z.string().max(30000),
  expectedNextStep: z.string().max(300),
});

const workspaceSchema = z.object({
  sourceType: z.enum(['ad', 'social']),
  sourceUrl: z.string().max(2048),
  source: z.string().max(30000),
  destinationUrl: z.string().max(2048),
  destination: z.string().max(30000),
  stages: z.array(stageSchema).max(12),
  checkoutStarts: z.number().int().nonnegative().nullable(),
  completedOrders: z.number().int().nonnegative().nullable(),
  windowLabel: z.string().max(300),
  hasSpend: z.boolean(),
  hasClicks: z.boolean(),
  hasSessions: z.boolean(),
  hasConversions: z.boolean(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'Sign in to access saved journey analyses.' }, { status: 401 });

  const records = await db.messageMatch.findMany({
    where: { audit: { userId: user.id } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { audit: { select: { url: true, createdAt: true } } },
  });

  return NextResponse.json({
    analyses: records.map(record => ({
      id: record.id,
      sourceType: record.sourceType,
      source: record.sourceText,
      destination: record.pagePromise,
      status: record.status,
      savedAt: record.createdAt,
      auditUrl: record.audit.url,
      payload: record.gaps,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'Sign in to save a journey analysis.' }, { status: 401 });

  const parsed = workspaceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Some fields are invalid or exceed the supported length. Review the inputs and try again.' }, { status: 400 });
  }
  if (parsed.data.completedOrders !== null && parsed.data.checkoutStarts !== null && parsed.data.completedOrders > parsed.data.checkoutStarts) {
    return NextResponse.json({ message: 'Completed orders cannot exceed checkout starts for the same cohort.' }, { status: 400 });
  }

  const latestAudit = await db.audit.findFirst({
    where: { userId: user.id, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    select: { id: true },
  });
  if (!latestAudit) {
    return NextResponse.json({ message: 'Run at least one successful PageFix inspection before saving a journey analysis.' }, { status: 409 });
  }

  const payload = {
    ...parsed.data,
    savedBy: 'user-supplied campaign and journey data',
    evidenceLimit: 'This workspace analysis is based on supplied text and aggregate counts. It does not verify live destination links, prove ad waste, or identify the cause of abandonment.',
  };

  const record = await db.messageMatch.create({
    data: {
      auditId: latestAudit.id,
      sourceType: parsed.data.sourceType,
      sourceText: parsed.data.source,
      pagePromise: parsed.data.destination,
      status: 'SAVED',
      gaps: payload as Prisma.InputJsonValue,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ saved: true, id: record.id, savedAt: record.createdAt }, { status: 201 });
}
