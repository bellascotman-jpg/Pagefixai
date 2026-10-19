import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { FOUNDER_EMAIL } from '@/lib/plans';

/**
 * Repair the single configured founder account after successful authentication.
 * The exact email check is the security boundary; no public signup can assign
 * founder privileges to another address.
 */
export async function ensureFounderAccessForUser(userId: string) {
  const current = await db.user.findUnique({ where: { id: userId } });
  if (!current || current.email.toLowerCase() !== FOUNDER_EMAIL) return current;

  // Persist the founder role first. If an ancillary provisioning step fails,
  // the session resolver can still read the upgraded role and expose the
  // founder console and unlimited founder entitlement without stale USER data.
  const user = current.role === 'FOUNDER'
    ? current
    : await db.user.update({
        where: { id: userId },
        data: { role: 'FOUNDER', emailVerifiedAt: current.emailVerifiedAt ?? new Date() },
      });

  // Establish the workspace before plan metadata so audit creation has an owner
  // membership even if a non-essential provisioning step needs later repair.
  const membership = await db.membership.findFirst({ where: { userId }, select: { id: true } });
  if (!membership) {
    const organization = await db.organization.create({ data: { name: 'PageFix Founder Workspace' } });
    await db.membership.create({ data: { userId, organizationId: organization.id, role: 'OWNER' } });
  }

  await db.plan.upsert({
    where: { id: 'founding_lifetime' },
    create: { id: 'founding_lifetime', name: 'Founder Lifetime', monthlyUnits: 1000000, lifetime: true },
    update: { name: 'Founder Lifetime', monthlyUnits: 1000000, lifetime: true },
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

  const bootstrapEvent = await db.adminEvent.findFirst({
    where: { actorId: userId, action: 'FOUNDER_BOOTSTRAP_COMPLETED' },
    select: { id: true },
  });
  if (!bootstrapEvent) {
    await db.adminEvent.create({
      data: {
        actorId: userId,
        action: 'FOUNDER_BOOTSTRAP_COMPLETED',
        targetType: 'User',
        targetId: userId,
        metadata: { method: 'authenticated-founder-account-repair' },
      },
    });
  }

  return user;
}
