import { NextResponse } from 'next/server';
import { refreshCurrentSession } from '@/lib/auth/session';

export async function POST() {
  try {
    const user = await refreshCurrentSession();
    if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    return NextResponse.json({ ok: true, expiresInDays: 180 });
  } catch (error) {
    console.error('session_refresh_error', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'SESSION_REFRESH_UNAVAILABLE' }, { status: 503 });
  }
}
