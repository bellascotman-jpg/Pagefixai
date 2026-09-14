import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    await destroySession();
    if (request.headers.get('accept')?.includes('application/json')) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.redirect(new URL('/auth', request.url), 303);
  } catch (error) {
    console.error('logout_error', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'We could not sign you out. Please try again.' }, { status: 500 });
  }
}
