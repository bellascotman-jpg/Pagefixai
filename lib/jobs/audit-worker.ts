import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { runAudit } from '@/lib/audit/engine';
import { interpretAudit } from '@/lib/ai/reason';

export async function processNextAuditJob(auditId?: string) {
  const job = await db.auditJob.findFirst({
    where: { status: 'QUEUED', availableAt: { lte: new Date() }, ...(auditId ? { auditId } : {}) },
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
    // A successful page inspection remains a successful audit even if the optional
    // AI provider is unavailable, misconfigured, rate-limited, or returns bad output.
    const result = await runAudit(job.auditId);
    // Publish the evidence-backed report before optional AI enrichment finishes.
    await db.auditJob.update({ where: { id: job.id }, data: { status: 'COMPLETED', completedAt: new Date(), errorCode: null, errorMessage: null } });
    let ai: unknown = { skipped: true, reason: 'AI_NOT_RUN' };
    let aiWarning: string | null = null;

    try {
      ai = await interpretAudit(job.auditId);
      if (ai && typeof ai === 'object' && 'skipped' in ai && ai.skipped) {
        aiWarning = 'AI reasoning was skipped; evidence-based checks are available.';
      }
    } catch (error) {
      aiWarning = error instanceof Error ? error.message : 'AI reasoning failed.';
      console.error('pagefix_ai_reasoning_failed', { auditId: job.auditId, message: aiWarning });
    }

    await db.auditJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        errorCode: aiWarning ? 'AI_REASONING_UNAVAILABLE' : null,
        errorMessage: aiWarning,
      },
    });
    return { processed: true as const, auditId: job.auditId, result, ai, aiWarning };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Audit worker failed.';
    await db.audit.update({
      where: { id: job.auditId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorCode: message,
        errorMessage: message,
      },
    }).catch(() => undefined);
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
