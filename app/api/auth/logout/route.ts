import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('logout_error', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'We could not sign you out.' }, { status: 500 });
  }
}
