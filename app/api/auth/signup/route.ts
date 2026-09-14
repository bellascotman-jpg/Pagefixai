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
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Enter a valid name, email and password of at least 8 characters.' }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    if (email === FOUNDER_EMAIL) {
      return NextResponse.json({ error: 'EMAIL_RESERVED', message: 'This account is provisioned by PageFix and cannot be created through public signup.' }, { status: 403 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'EMAIL_EXISTS', message: 'An account already exists for this email.' }, { status: 409 });

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
    console.error('signup_error', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'We could not create your account. Please try again.' }, { status: 500 });
  }
}
