import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/security/password';
import { createSession } from '@/lib/auth/session';
import { FOUNDER_EMAIL } from '@/lib/plans';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON', message: 'Please check the form and try again.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Enter your name, a valid email and a password with at least 8 characters.' }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  if (email === FOUNDER_EMAIL) {
    return NextResponse.json({ error: 'EMAIL_RESERVED', message: 'This founder account is provisioned separately and cannot be created through public signup.' }, { status: 403 });
  }

  try {
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: 'EMAIL_EXISTS', message: 'An account already exists for this email. Sign in or reset your password.' }, { status: 409 });
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role: 'USER',
        memberships: {
          create: {
            role: 'OWNER',
            organization: { create: { name: `${name}'s workspace` } },
          },
        },
      },
    });

    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } }, { status: 201 });
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'UNKNOWN';
    console.error('signup_error', { code, name: error instanceof Error ? error.name : 'UnknownError' });
    if (code === 'P2002') {
      return NextResponse.json({ error: 'EMAIL_EXISTS', message: 'An account already exists for this email. Sign in or reset your password.' }, { status: 409 });
    }
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_PRISMA_URL && !process.env.POSTGRES_URL &&
        !process.env.Pagefixai_PRISMA_DATABASE_URL && !process.env.Pagefixai_POSTGRES_URL && !process.env.Pagefixai_DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_NOT_CONFIGURED', message: 'Account creation is temporarily unavailable because the database connection is not configured. Please try again later.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'SIGNUP_FAILED', message: 'We could not create your account right now. Please try again. If the problem continues, contact support.' }, { status: 500 });
  }
}
