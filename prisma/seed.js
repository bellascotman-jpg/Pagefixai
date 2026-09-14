const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const plans = [
  ['starter_monthly', 'Starter', 20, false],
  ['starter_annual', 'Starter', 20, false],
  ['growth_monthly', 'Growth', 100, false],
  ['growth_annual', 'Growth', 100, false],
  ['agency_monthly', 'Agency', 300, false],
  ['agency_annual', 'Agency', 300, false],
  ['founding_lifetime', 'Founding Lifetime', 50, true],
];

async function main() {
  for (const [id, name, monthlyUnits, lifetime] of plans) await prisma.plan.upsert({ where: { id }, create: { id, name, monthlyUnits, lifetime }, update: { name, monthlyUnits, lifetime } });
  await prisma.engineVersion.upsert({ where: { version: '1.0.0' }, create: { version: '1.0.0', active: true }, update: { active: true } });
}
main().finally(() => prisma.$disconnect());
