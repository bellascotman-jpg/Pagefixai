import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Sign in required.' }, { status: 401 });
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('me_error', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'We could not load your session.' }, { status: 500 });
  }
}
