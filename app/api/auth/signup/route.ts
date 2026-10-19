import { NextResponse } from 'next/server';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/security/password';
import { createSession } from '@/lib/auth/session';
import { FOUNDER_EMAIL } from '@/lib/plans';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(128),
  founderSetupKey: z.string().max(256).optional(),
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

  const { name, email, password, founderSetupKey } = parsed.data;
  const isFounder = email === FOUNDER_EMAIL;
  if (isFounder) {
    const expectedKey = process.env.FOUNDER_SETUP_SECRET || '';
    const supplied = Buffer.from(founderSetupKey || '', 'utf8');
    const expected = Buffer.from(expectedKey, 'utf8');
    const validKey = expected.length > 0 && supplied.length === expected.length && timingSafeEqual(supplied, expected);
    if (!validKey) {
      return NextResponse.json({ error: 'FOUNDER_SETUP_REQUIRED', message: 'Founder account setup requires the private founder setup key. Enter the setup key provided to the founder.' }, { status: 403 });
    }
  }
  const cookieHeader = request.headers.get('cookie') || '';
  const referralCode = cookieHeader.match(/(?:^|;\s*)pagefix_ref=([A-Z0-9]+)/)?.[1]?.toUpperCase() || null;
  const referralCandidate = referralCode ? await db.affiliateProfile.findFirst({ where: { code: referralCode, status: 'APPROVED' }, select: { id: true, user: { select: { email: true } } } }).catch(() => null) : null;
  const referringAffiliate = referralCandidate && referralCandidate.user.email.toLowerCase() !== email.toLowerCase() ? referralCandidate : null;
  try {
    await db.plan.upsert({ where: { id: 'starter_monthly' }, create: { id: 'starter_monthly', name: 'Starter', monthlyUnits: 50, lifetime: false }, update: { name: 'Starter', monthlyUnits: 50, lifetime: false } });
    if (isFounder) {
      await db.plan.upsert({ where: { id: 'founding_lifetime' }, create: { id: 'founding_lifetime', name: 'Founder Lifetime', monthlyUnits: 1000000, lifetime: true }, update: { name: 'Founder Lifetime', monthlyUnits: 1000000, lifetime: true } });
    }
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: 'EMAIL_EXISTS', message: 'An account already exists for this email. Sign in or reset your password.' }, { status: 409 });
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role: isFounder ? 'FOUNDER' : 'USER',
        memberships: {
          create: {
            role: 'OWNER',
            organization: { create: { name: `${name}'s workspace` } },
          },
        },
        subscriptions: {
          create: {
            plan: { connect: { id: isFounder ? 'founding_lifetime' : 'starter_monthly' } },
            status: isFounder ? 'LIFETIME' : 'ACTIVE',
            provider: isFounder ? 'founder-bootstrap' : 'pagefix-trial',
            ...(isFounder ? {} : { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }),
          },
        },
      },
    });

    // Every new user is automatically enrolled in the referral program; no application or approval queue.
    await db.affiliateProfile.create({
      data: {
        userId: user.id,
        code: randomBytes(5).toString('hex').toUpperCase(),
        commissionRate: 25,
        status: 'APPROVED',
      },
    }).catch((error) => {
      console.error('new_user_referral_profile_error', {
        name: error instanceof Error ? error.name : 'UnknownError',
      });
    });
    if (referringAffiliate) {
      await db.affiliateReferral.create({ data: { affiliateId: referringAffiliate.id, referredUserId: user.id } }).catch((error) => {
        console.error('referral_attribution_error', { name: error instanceof Error ? error.name : 'UnknownError' });
      });
    }

    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...(isFounder ? { founderAccess: true } : {}) }, { status: 201 });
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'UNKNOWN';
    console.error('signup_error', { code, name: error instanceof Error ? error.name : 'UnknownError' });
    if (code.startsWith('P10')) {
      return NextResponse.json({ error: 'DATABASE_UNAVAILABLE', message: 'Account creation is temporarily unavailable because the account database could not be reached. Please try again shortly.' }, { status: 503 });
    }
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
