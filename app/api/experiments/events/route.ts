import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
const eventSchema = z.object({
  publicKey: z.string().min(10).max(100),
  visitorId: z.string().regex(/^[a-zA-Z0-9_-]{8,100}$/),
  variantKey: z.enum(['A', 'B']),
  eventType: z.enum(['impression', 'click', 'conversion']),
});

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_EVENT' }, { status: 400 });
  const experiment = await db.experiment.findUnique({ where: { publicKey: parsed.data.publicKey }, select: { id: true, status: true } });
  if (!experiment || experiment.status !== 'RUNNING') return NextResponse.json({ error: 'EXPERIMENT_NOT_RUNNING' }, { status: 404 });
  if (parsed.data.eventType === 'impression') {
    const existing = await db.experimentEvent.findFirst({ where: { experimentId: experiment.id, visitorId: parsed.data.visitorId, eventType: 'impression' }, select: { id: true } });
    if (existing) return NextResponse.json({ accepted: true, deduplicated: true });
  }
  await db.experimentEvent.create({ data: { experimentId: experiment.id, visitorId: parsed.data.visitorId, variantKey: parsed.data.variantKey, eventType: parsed.data.eventType } });
  return NextResponse.json({ accepted: true }, { headers: { 'Access-Control-Allow-Origin': '*' } });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
