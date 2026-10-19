import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { syncIntegration } from '@/lib/store-integrations/providers';

export const runtime = 'nodejs';
export const maxDuration = 60;

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || request.headers.get('x-cron-secret');
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const integrations = await db.storeIntegration.findMany({ where: { status: { in: ['CONNECTED', 'DEGRADED'] } }, select: { id: true }, take: 20, orderBy: { lastSyncedAt: 'asc' } });
  const results = [];
  for (const integration of integrations) {
    try { results.push({ integrationId: integration.id, ok: true, ...(await syncIntegration(integration.id, 'scheduled')) }); }
    catch (error) { results.push({ integrationId: integration.id, ok: false, error: error instanceof Error ? error.message : 'SYNC_FAILED' }); }
  }
  return NextResponse.json({ processed: results.length, results });
}
