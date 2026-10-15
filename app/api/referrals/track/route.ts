import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = (url.searchParams.get('code') || '').trim().toUpperCase();
  const affiliate = code ? await db.affiliateProfile.findFirst({ where: { code, status: 'APPROVED' }, select: { id: true } }).catch(() => null) : null;
  const response = NextResponse.redirect(new URL('/auth?mode=signup', process.env.APP_URL || url.origin));
  if (affiliate) {
    response.cookies.set('pagefix_ref', code, { httpOnly: true, secure: url.protocol === 'https:', sameSite: 'lax', path: '/', maxAge: 30 * 24 * 60 * 60 });
    await db.affiliateProfile.update({ where: { id: affiliate.id }, data: { clicks: { increment: 1 } } }).catch(() => undefined);
  }
  return response;
}
