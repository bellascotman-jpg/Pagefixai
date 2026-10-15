import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env = process.env as Record<string, string | undefined>;
  const databaseSource = [
    ["Pagefixai_POSTGRES_URL", env.Pagefixai_POSTGRES_URL],
    ["POSTGRES_URL", env.POSTGRES_URL],
    ["Pagefixai_DATABASE_URL", env.Pagefixai_DATABASE_URL],
    ["DATABASE_URL", env.DATABASE_URL],
    ["Pagefixai_PRISMA_DATABASE_URL", env.Pagefixai_PRISMA_DATABASE_URL],
    ["POSTGRES_PRISMA_URL", env.POSTGRES_PRISMA_URL],
  ].find(([, value]) => Boolean(value))?.[0] ?? null;

  let database: "ok" | "unavailable" = "unavailable";
  try {
    await db.$queryRaw`SELECT 1`;
    database = "ok";
  } catch {
    database = "unavailable";
  }

  const configuredUrl = env.Pagefixai_POSTGRES_URL || env.POSTGRES_URL || env.Pagefixai_DATABASE_URL || env.DATABASE_URL || env.Pagefixai_PRISMA_DATABASE_URL || env.POSTGRES_PRISMA_URL;
  let databaseHost: string | null = null;
  try { if (configuredUrl) databaseHost = new URL(configuredUrl).hostname; } catch { databaseHost = "invalid-database-url"; }

  const healthy = database === "ok";
  return NextResponse.json({
    status: healthy ? "ok" : "degraded",
    service: "pagefix-ai",
    checks: {
      database,
      databaseUrlConfigured: Boolean(databaseSource),
      databaseUrlSource: databaseSource,
      databaseHost,
      authSecretConfigured: Boolean(env.AUTH_SECRET),
    },
    timestamp: new Date().toISOString(),
  }, {
    status: healthy ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
