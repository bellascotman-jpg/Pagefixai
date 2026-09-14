import { NextResponse } from 'next/server';
import { processNextAuditJob } from '@/lib/jobs/audit-worker';

function authorized(request: Request) {
  const header = request.headers.get('authorization');
  const internal = process.env.INTERNAL_JOB_SECRET;
  const cron = process.env.CRON_SECRET;
  if (internal && header === `Bearer ${internal}`) return true;
  if (cron && header === `Bearer ${cron}`) return true;
  return false;
}

async function handle(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const result = await processNextAuditJob();
  if (result.failed) return NextResponse.json(result, { status: 500 });
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
