import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/security/password';
import { createSession } from '@/lib/auth/session';

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(128) });

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'INVALID_JSON', message: 'Please check your email and password and try again.' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Enter a valid email and password.' }, { status: 400 });
  try {
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (!user?.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' }, { status: 401 });
    }
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'UNKNOWN';
    console.error('login_error', { code, name: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ error: 'LOGIN_UNAVAILABLE', message: 'Sign-in is temporarily unavailable because the service could not reach its account database. Please try again shortly.' }, { status: 503 });
  }
}
