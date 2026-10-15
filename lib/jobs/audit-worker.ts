import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { runAudit } from '@/lib/audit/engine';
import { interpretAudit } from '@/lib/ai/reason';

export async function processNextAuditJob() {
  const job = await db.auditJob.findFirst({
    where: { status: 'QUEUED', availableAt: { lte: new Date() } },
    orderBy: { createdAt: 'asc' },
  });

  if (!job) return { processed: false as const };

  const claimed = await db.auditJob.updateMany({
    where: { id: job.id, status: 'QUEUED' },
    data: {
      status: 'ACQUIRING_PAGE',
      attempt: { increment: 1 },
      startedAt: new Date(),
      correlationId: job.correlationId || randomUUID(),
    },
  });

  if (!claimed.count) return { processed: false as const };

  try {
    // A successful page inspection is a useful audit even if the optional AI provider
    // is unconfigured or temporarily unavailable. Keep those outcomes separate.
    const result = await runAudit(job.auditId);
    let ai: { skipped?: boolean; reason?: string; findings?: number; rejected?: number } | { skipped: true; reason: string };

    try {
      ai = await interpretAudit(job.auditId);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'AI_ANALYSIS_FAILED';
      console.error('audit_ai_analysis_failed', { auditId: job.auditId, code });
      ai = { skipped: true, reason: code };
    }

    await db.auditJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        errorCode: ai.skipped ? ai.reason ?? null : null,
        errorMessage: ai.skipped ? 'The page inspection completed, but the optional AI analysis could not be completed.' : null,
      },
    });
    return { processed: true as const, auditId: job.auditId, result, ai };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Audit worker failed.';
    await db.auditJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorCode: message,
        errorMessage: message,
      },
    }).catch(() => undefined);
    return { processed: true as const, failed: true as const, auditId: job.auditId, error: message };
  }
}
