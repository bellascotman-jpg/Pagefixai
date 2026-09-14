import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'node:crypto';

const prisma = new PrismaClient();

const FOUNDER_EMAIL = 'wisdomchin658@gmail.com';
const plans = [
  ['starter_monthly', 'Starter', 20, false],
  ['starter_annual', 'Starter', 20, false],
  ['growth_monthly', 'Growth', 100, false],
  ['growth_annual', 'Growth', 100, false],
  ['agency_monthly', 'Agency', 300, false],
  ['agency_annual', 'Agency', 300, false],
  ['founding_lifetime', 'Founding Lifetime', 50, true],
];

function hashPassword(password) {
  const salt = randomBytes(16);
  const cost = 16384;
  const blockSize = 8;
  const parallel = 1;
  const derived = scryptSync(password, salt, 64, { N: cost, r: blockSize, p: parallel });
  return `scrypt$${cost}$${blockSize}$${parallel}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

async function main() {
  for (const [id, name, monthlyUnits, lifetime] of plans) {
    await prisma.plan.upsert({
      where: { id },
      create: { id, name, monthlyUnits, lifetime },
      update: { name, monthlyUnits, lifetime },
    });
  }

  await prisma.engineVersion.upsert({
    where: { version: '1.0.0' },
    create: { version: '1.0.0', active: true },
    update: { active: true },
  });

  const founderPassword = process.env.FOUNDER_INITIAL_PASSWORD;
  if (founderPassword) {
    const existing = await prisma.user.findUnique({ where: { email: FOUNDER_EMAIL } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: FOUNDER_EMAIL,
          name: 'PageFix Founder',
          passwordHash: hashPassword(founderPassword),
          role: 'FOUNDER',
          emailVerifiedAt: new Date(),
          memberships: {
            create: {
              role: 'OWNER',
              organization: { create: { name: 'PageFix Founder Workspace' } },
            },
          },
          entitlements: {
            create: {
              feature: 'FOUNDING_LIFETIME',
              source: 'founder-role',
              active: true,
            },
          },
        },
      });
    } else if (existing.role !== 'FOUNDER') {
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'FOUNDER' } });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
