import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/security/password';
import { createSession } from '@/lib/auth/session';

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(128) });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Enter a valid email and password.' }, { status: 400 });
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (!user?.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' }, { status: 401 });
    }
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('login_error', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'We could not sign you in. Please try again.' }, { status: 500 });
  }
}
