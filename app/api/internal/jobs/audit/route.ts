import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runAudit } from '@/lib/audit/engine';

export async function POST(request: Request) {
  const secret = process.env.INTERNAL_JOB_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const job = await db.auditJob.findFirst({ where: { status: 'QUEUED', availableAt: { lte: new Date() } }, orderBy: { createdAt: 'asc' } });
  if (!job) return NextResponse.json({ processed: false });
  const claimed = await db.auditJob.updateMany({ where: { id: job.id, status: 'QUEUED' }, data: { status: 'ACQUIRING_PAGE', attempt: { increment: 1 }, startedAt: new Date() } });
  if (!claimed.count) return NextResponse.json({ processed: false });
  try {
    await runAudit(job.auditId);
    await db.auditJob.update({ where: { id: job.id }, data: { status: 'COMPLETED', completedAt: new Date() } });
    return NextResponse.json({ processed: true, auditId: job.auditId });
  } catch (error) {
    await db.auditJob.update({ where: { id: job.id }, data: { status: 'FAILED', completedAt: new Date(), errorCode: error instanceof Error ? error.message : 'UNKNOWN_ERROR', errorMessage: error instanceof Error ? error.message : 'Audit worker failed.' } });
    return NextResponse.json({ processed: true, failed: true }, { status: 500 });
  }
}
