import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { syncIntegration } from '@/lib/store-integrations/providers';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(_request: Request, context: { params: Promise<{ integrationId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const { integrationId } = await context.params;
  const integration = await db.storeIntegration.findFirst({ where: { id: integrationId, userId: user.id }, select: { id: true } });
  if (!integration) return NextResponse.json({ error: 'INTEGRATION_NOT_FOUND' }, { status: 404 });
  try {
    return NextResponse.json({ ok: true, sync: await syncIntegration(integration.id, 'manual') });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'SYNC_FAILED';
    return NextResponse.json({ error: 'SYNC_FAILED', code, message: 'Store sync failed. Review the connection status and credentials, then retry.' }, { status: 502 });
  }
}
