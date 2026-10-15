import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/security/password';

const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Submit a valid reset request.' }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Use a reset link and a password between 8 and 128 characters.' }, { status: 400 });

  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
  const token = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!token || token.usedAt || token.expiresAt <= new Date()) {
    return NextResponse.json({ error: 'RESET_LINK_INVALID', message: 'This reset link is invalid or expired. Request a new one.' }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const usedAt = new Date();
  try {
    await db.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: usedAt } },
        data: { usedAt },
      });
      if (claimed.count !== 1) throw new Error('RESET_LINK_INVALID');
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash } });
      await tx.passwordResetToken.updateMany({
        where: { userId: token.userId, id: { not: token.id }, usedAt: null },
        data: { usedAt },
      });
      await tx.session.deleteMany({ where: { userId: token.userId } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'RESET_LINK_INVALID') {
      return NextResponse.json({ error: 'RESET_LINK_INVALID', message: 'This reset link is invalid or expired. Request a new one.' }, { status: 400 });
    }
    console.error('password_reset_failed');
    return NextResponse.json({ error: 'RESET_FAILED', message: 'The password could not be reset. Request a new link.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'Password updated. Sign in with your new password.' });
}
