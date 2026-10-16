import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV === "preview") {
  console.log("[prepare-db] Skipping schema sync for preview deployment.");
  process.exit(0);
}

const candidates = [
  ["Pagefixai_POSTGRES_URL", process.env.Pagefixai_POSTGRES_URL],
  ["POSTGRES_URL", process.env.POSTGRES_URL],
  ["Pagefixai_DATABASE_URL", process.env.Pagefixai_DATABASE_URL],
  ["DATABASE_URL", process.env.DATABASE_URL],
];

const selected = candidates.find(([, value]) => typeof value === "string" && value.trim().length > 0);

if (!selected) {
  console.error(
    "[prepare-db] No non-empty direct PostgreSQL URL is available to the build. " +
      "Configure the Vercel PostgreSQL integration URL before deploying."
  );
  process.exit(1);
}

const [source, value] = selected;
let parsed;
try {
  parsed = new URL(value);
} catch {
  console.error(`[prepare-db] ${source} is not a valid database URL.`);
  process.exit(1);
}

if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
  console.error(
    `[prepare-db] ${source} is not a direct PostgreSQL URL (protocol ${parsed.protocol}). ` +
      "Use the direct PostgreSQL connection string, not an Accelerate or pooled URL."
  );
  process.exit(1);
}

process.env.DATABASE_URL = value;
console.log(`[prepare-db] Syncing Prisma schema using ${source} (host: ${parsed.hostname}).`);

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["prisma", "db", "push", "--skip-generate"],
  { stdio: "inherit", env: process.env }
);

if (result.error) {
  console.error("[prepare-db] Could not start Prisma schema synchronization:", result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
