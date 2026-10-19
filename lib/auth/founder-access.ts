import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { FOUNDER_EMAIL } from '@/lib/plans';

/**
 * Provision the one explicitly configured founder account after it has
 * authenticated with its existing password/session. This is idempotent and
 * does not grant founder access to any other email address.
 */
export async function ensureFounderAccessForUser(userId: string) {
  const current = await db.user.findUnique({ where: { id: userId } });
  if (!current || current.email.toLowerCase() !== FOUNDER_EMAIL) return current;
  if (current.role === 'FOUNDER') return current;

  await db.plan.upsert({
    where: { id: 'founding_lifetime' },
    create: { id: 'founding_lifetime', name: 'Founder Lifetime', monthlyUnits: 1000000, lifetime: true },
    update: { name: 'Founder Lifetime', monthlyUnits: 1000000, lifetime: true },
  });

  const user = current.role === 'FOUNDER'
    ? current
    : await db.user.update({ where: { id: userId }, data: { role: 'FOUNDER', emailVerifiedAt: new Date() } });

  const membership = await db.membership.findFirst({ where: { userId }, select: { id: true } });
  if (!membership) {
    await db.membership.create({
      data: { userId, role: 'OWNER', organization: { create: { name: 'PageFix Founder Workspace' } } },
    });
  }

  const lifetime = await db.subscription.findFirst({ where: { userId, planId: 'founding_lifetime', status: 'LIFETIME' }, select: { id: true } });
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

  const bootstrapEvent = await db.adminEvent.findFirst({ where: { actorId: userId, action: 'FOUNDER_BOOTSTRAP_COMPLETED' }, select: { id: true } });
  if (!bootstrapEvent) {
    await db.adminEvent.create({
      data: { actorId: userId, action: 'FOUNDER_BOOTSTRAP_COMPLETED', targetType: 'User', targetId: userId, metadata: { method: 'authenticated-founder-account-repair' } },
    });
  }

  return user;
}
