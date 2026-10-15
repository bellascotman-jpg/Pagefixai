import { PrismaClient } from '@prisma/client';

// Vercel Postgres integrations may expose provider-specific variable names. Resolve
// the first configured server-side URL before PrismaClient is initialized.
const env = process.env as Record<string, string | undefined>;
const databaseUrl =
  env.DATABASE_URL ||
  env.POSTGRES_PRISMA_URL ||
  env.POSTGRES_URL ||
  env.Pagefixai_PRISMA_DATABASE_URL ||
  env.Pagefixai_POSTGRES_URL ||
  env.Pagefixai_DATABASE_URL;

if (databaseUrl && !env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
