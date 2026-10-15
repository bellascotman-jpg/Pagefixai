import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';

const genericResponse = {
  ok: true,
  message: 'If that account exists and email delivery is configured, password reset instructions will be sent.',
};

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 }); }
  const parsed = z.object({ email: z.string().trim().email().toLowerCase().max(320) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });

  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (process.env.EMAIL_PROVIDER_ENABLED !== 'true' || !apiKey || !from) {
    return NextResponse.json(genericResponse);
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return NextResponse.json(genericResponse);

  const recentRequest = await db.passwordResetToken.findFirst({
    where: { userId: user.id, usedAt: null, createdAt: { gt: new Date(Date.now() - 5 * 60 * 1000) } },
    select: { id: true },
  });
  if (recentRequest) return NextResponse.json(genericResponse);

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const resetToken = await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
  });
  const baseUrl = process.env.APP_URL || 'https://pagefixai.vercel.app';
  const resetUrl = new URL('/auth/reset-password', baseUrl);
  resetUrl.searchParams.set('token', rawToken);
  const html = '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#102a2a;max-width:560px;margin:0 auto">' +
    '<h1>Reset your password</h1><p>We received a request to reset the password for your PageFix AI account.</p>' +
    '<p><a href="' + resetUrl.toString() + '" style="display:inline-block;padding:12px 18px;background:#087f73;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Choose a new password</a></p>' +
    '<p>This link expires in 30 minutes and can only be used once. If you did not request a reset, ignore this email.</p></div>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [user.email],
        subject: 'Reset your PageFix AI password',
        html,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      await db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }).catch(() => undefined);
      console.error('password_reset_delivery_failed', { status: response.status });
    }
  } catch {
    await db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }).catch(() => undefined);
    console.error('password_reset_delivery_failed');
  }

  return NextResponse.json(genericResponse);
}
