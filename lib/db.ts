import { PrismaClient } from '@prisma/client';

// Vercel Postgres integrations may expose provider-specific variable names. Resolve
// the first configured server-side URL before PrismaClient is initialized.
const env = process.env as Record<string, string | undefined>;
// Prefer the Vercel integration's direct PostgreSQL connection over any stale
// manually-entered DATABASE_URL. Prisma schema synchronization requires a direct
// PostgreSQL URL rather than a Prisma Accelerate URL.
const databaseUrl =
  env.Pagefixai_POSTGRES_URL ||
  env.POSTGRES_URL ||
  env.Pagefixai_DATABASE_URL ||
  env.DATABASE_URL ||
  env.Pagefixai_PRISMA_DATABASE_URL ||
  env.POSTGRES_PRISMA_URL;

if (databaseUrl && env.DATABASE_URL !== databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
