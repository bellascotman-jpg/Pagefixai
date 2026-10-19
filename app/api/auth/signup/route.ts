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

function validFounderKey(suppliedKey: string | undefined) {
  const expectedKey = process.env.FOUNDER_SETUP_SECRET || '';
  const supplied = Buffer.from(suppliedKey || '', 'utf8');
  const expected = Buffer.from(expectedKey, 'utf8');
  return expected.length > 0 && supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

async function ensureFounderAccess(userId: string, name: string, password: string) {
  await db.plan.upsert({
    where: { id: 'founding_lifetime' },
    create: { id: 'founding_lifetime', name: 'Founder Lifetime', monthlyUnits: 1000000, lifetime: true },
    update: { name: 'Founder Lifetime', monthlyUnits: 1000000, lifetime: true },
  });

  const bootstrapUsed = await db.adminEvent.findFirst({
    where: { actorId: userId, action: 'FOUNDER_BOOTSTRAP_COMPLETED' },
    select: { id: true },
  });
  if (bootstrapUsed) return null;

  const user = await db.user.update({
    where: { id: userId },
    data: { name, passwordHash: await hashPassword(password), role: 'FOUNDER', emailVerifiedAt: new Date() },
    select: { id: true, email: true, name: true, role: true },
  });

  const lifetime = await db.subscription.findFirst({
    where: { userId, planId: 'founding_lifetime', status: 'LIFETIME' },
    select: { id: true },
  });
  if (!lifetime) {
    await db.subscription.create({
      data: { userId, planId: 'founding_lifetime', status: 'LIFETIME', provider: 'founder-bootstrap' },
    });
  }

  await db.entitlement.upsert({
    where: { userId_feature: { userId, feature: 'FOUNDING_LIFETIME' } },
    create: { userId, feature: 'FOUNDING_LIFETIME', source: 'founder-role', active: true },
    update: { source: 'founder-role', active: true, expiresAt: null },
  });

  await db.affiliateProfile.upsert({
    where: { userId },
    create: { userId, code: randomBytes(5).toString('hex').toUpperCase(), commissionRate: 25, status: 'APPROVED' },
    update: { status: 'APPROVED', commissionRate: 25 },
  });

  await db.adminEvent.create({
    data: {
      actorId: userId,
      action: 'FOUNDER_BOOTSTRAP_COMPLETED',
      targetType: 'User',
      targetId: userId,
      metadata: { method: 'private-founder-setup' },
    },
  });
  return user;
}

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
  if (isFounder && !validFounderKey(founderSetupKey)) {
    return NextResponse.json({
      error: 'FOUNDER_SETUP_REQUIRED',
      message: 'Enter the private one-time founder setup key to activate your founder account. This does not affect regular sign-ups.',
    }, { status: 403 });
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const referralCode = cookieHeader.match(/(?:^|;\s*)pagefix_ref=([A-Z0-9]+)/)?.[1]?.toUpperCase() || null;
  const referralCandidate = referralCode ? await db.affiliateProfile.findFirst({
    where: { code: referralCode, status: 'APPROVED' },
    select: { id: true, user: { select: { email: true } } },
  }).catch(() => null) : null;
  const referringAffiliate = referralCandidate && referralCandidate.user.email.toLowerCase() !== email ? referralCandidate : null;

  try {
    await db.plan.upsert({
      where: { id: 'starter_monthly' },
      create: { id: 'starter_monthly', name: 'Starter', monthlyUnits: 50, lifetime: false },
      update: { name: 'Starter', monthlyUnits: 50, lifetime: false },
    });

    if (isFounder) {
      const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
      let founder;
      if (existing) {
        founder = await ensureFounderAccess(existing.id, name, password);
        if (!founder) {
          return NextResponse.json({ error: 'FOUNDER_ALREADY_SETUP', message: 'Your founder account is already set up. Sign in with your founder email and password.' }, { status: 409 });
        }
      } else {
        await db.plan.upsert({
          where: { id: 'founding_lifetime' },
          create: { id: 'founding_lifetime', name: 'Founder Lifetime', monthlyUnits: 1000000, lifetime: true },
          update: { name: 'Founder Lifetime', monthlyUnits: 1000000, lifetime: true },
        });
        const created = await db.user.create({
          data: {
            name,
            email,
            passwordHash: await hashPassword(password),
            role: 'FOUNDER',
            emailVerifiedAt: new Date(),
            memberships: { create: { role: 'OWNER', organization: { create: { name: 'PageFix Founder Workspace' } } } },
            subscriptions: { create: { plan: { connect: { id: 'founding_lifetime' } }, status: 'LIFETIME', provider: 'founder-bootstrap' } },
            entitlements: { create: { feature: 'FOUNDING_LIFETIME', source: 'founder-role', active: true } },
          },
          select: { id: true, email: true, name: true, role: true },
        });
        await db.affiliateProfile.create({
          data: { userId: created.id, code: randomBytes(5).toString('hex').toUpperCase(), commissionRate: 25, status: 'APPROVED' },
        }).catch((error) => console.error('founder_affiliate_profile_error', { name: error instanceof Error ? error.name : 'UnknownError' }));
        await db.adminEvent.create({
          data: { actorId: created.id, action: 'FOUNDER_BOOTSTRAP_COMPLETED', targetType: 'User', targetId: created.id, metadata: { method: 'private-founder-setup' } },
        });
        founder = created;
      }
      await createSession(founder.id);
      return NextResponse.json({ user: founder, founderAccess: true }, { status: 201 });
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
        role: 'USER',
        memberships: { create: { role: 'OWNER', organization: { create: { name: `${name}'s workspace` } } } },
        subscriptions: { create: {
          plan: { connect: { id: 'starter_monthly' } },
          status: 'ACTIVE',
          provider: 'pagefix-trial',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        } },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    await db.affiliateProfile.create({
      data: { userId: user.id, code: randomBytes(5).toString('hex').toUpperCase(), commissionRate: 25, status: 'APPROVED' },
    }).catch((error) => console.error('new_user_referral_profile_error', { name: error instanceof Error ? error.name : 'UnknownError' }));
    if (referringAffiliate) {
      await db.affiliateReferral.create({ data: { affiliateId: referringAffiliate.id, referredUserId: user.id } })
        .catch((error) => console.error('referral_attribution_error', { name: error instanceof Error ? error.name : 'UnknownError' }));
    }

    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'UNKNOWN';
    console.error('signup_error', { code, name: error instanceof Error ? error.name : 'UnknownError' });
    if (code.startsWith('P10')) {
      return NextResponse.json({ error: 'DATABASE_UNAVAILABLE', message: 'Account creation is temporarily unavailable because the account database could not be reached. Please try again shortly.' }, { status: 503 });
    }
    if (code === 'P2002') {
      return NextResponse.json({ error: 'EMAIL_EXISTS', message: 'An account already exists for this email. Sign in or reset your password.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'SIGNUP_FAILED', message: 'We could not create your account right now. Please try again. If the problem continues, contact support.' }, { status: 500 });
  }
}
