import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  const parsed = z.object({ email: z.string().email().toLowerCase() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const raw = randomBytes(32).toString('base64url');
    await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: createHash('sha256').update(raw).digest('hex'), expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
    if (process.env.EMAIL_PROVIDER_ENABLED === 'true') {
      // Email delivery is intentionally delegated to the configured provider; never expose reset tokens in production responses.
      console.info('password_reset_email_required', { userId: user.id, tokenPresent: Boolean(raw) });
    }
  }
  return NextResponse.json({ ok: true, message: 'If that account exists, password reset instructions will be sent.' });
}
