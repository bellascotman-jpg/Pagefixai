import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { decryptCredentials } from '@/lib/store-integrations/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  let connections;
  try { connections = await db.marketingConnection.findMany({
    where: { userId: user.id },
    select: { id: true, provider: true, externalAccountId: true, accountName: true, scopes: true, status: true, expiresAt: true, lastSyncedAt: true, lastError: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  }); } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2021') return NextResponse.json({ connections: [], schemaReady: false, message: 'Marketing connection storage is not provisioned in this preview database. OAuth connections are disabled until the schema is applied.' });
    return NextResponse.json({ error: 'MARKETING_CONNECTIONS_UNAVAILABLE', message: 'Could not load marketing connections.' }, { status: 503 });
  }
  return NextResponse.json({ connections, schemaReady: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const body = await request.json().catch(() => null) as { provider?: string } | null;
  if (!body?.provider || !['meta_ads', 'google_marketing'].includes(body.provider)) return NextResponse.json({ error: 'INVALID_PROVIDER' }, { status: 400 });
  const connection = await db.marketingConnection.findUnique({ where: { userId_provider: { userId: user.id, provider: body.provider } }, select: { id: true, encryptedTokens: true, provider: true } });
  if (!connection) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  try {
    const tokens = decryptCredentials<{ access_token?: string }>(connection.encryptedTokens);
    if (tokens.access_token && connection.provider === 'google_marketing') {
      await fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(tokens.access_token), { method: 'POST', signal: AbortSignal.timeout(8000) }).catch(() => undefined);
    } else if (tokens.access_token && connection.provider === 'meta_ads') {
      await fetch('https://graph.facebook.com/v22.0/me/permissions?access_token=' + encodeURIComponent(tokens.access_token), { method: 'DELETE', signal: AbortSignal.timeout(8000) }).catch(() => undefined);
    }
  } catch { /* Always remove local credentials even if provider revocation is unavailable. */ }
  await db.marketingConnection.delete({ where: { id: connection.id } });
  return NextResponse.json({ disconnected: true });
}
