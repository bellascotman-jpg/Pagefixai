import { z } from 'zod';
import { db } from '@/lib/db';

const outputSchema = z.object({ findings: z.array(z.object({ title: z.string(), observation: z.string(), hypothesis: z.string(), whyItMatters: z.string(), recommendation: z.string(), implementationSteps: z.string(), buyerQuestion: z.string(), evidenceIds: z.array(z.string()).min(1), severity: z.enum(['HIGH','MEDIUM','LOW']), confidence: z.enum(['HIGH','MEDIUM','LOW']), effort: z.enum(['LOW','MEDIUM','HIGH']), priority: z.enum(['FIX_NOW','FIX_NEXT','FIX_LATER']) })) });

export async function interpretAudit(auditId: string) {
  const key = process.env.OPENAI_API_KEY || process.env.AI_PROVIDER_KEY;
  if (!key) return { skipped: true, reason: 'AI_PROVIDER_NOT_CONFIGURED' };
  const audit = await db.audit.findUnique({ where: { id: auditId }, include: { evidence: true, findings: true } });
  if (!audit) throw new Error('AUDIT_NOT_FOUND');
  const evidence = audit.evidence.map(e => ({ id: e.id, type: e.type, source: e.source, location: e.location, content: e.content.slice(0, 5000) }));
  const schema = { type: 'object', additionalProperties: false, properties: { findings: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { title: { type: 'string' }, observation: { type: 'string' }, hypothesis: { type: 'string' }, whyItMatters: { type: 'string' }, recommendation: { type: 'string' }, implementationSteps: { type: 'string' }, buyerQuestion: { type: 'string' }, evidenceIds: { type: 'array', items: { type: 'string' }, minItems: 1 }, severity: { type: 'string', enum: ['HIGH','MEDIUM','LOW'] }, confidence: { type: 'string', enum: ['HIGH','MEDIUM','LOW'] }, effort: { type: 'string', enum: ['LOW','MEDIUM','HIGH'] }, priority: { type: 'string', enum: ['FIX_NOW','FIX_NEXT','FIX_LATER'] } }, required: ['title','observation','hypothesis','whyItMatters','recommendation','implementationSteps','buyerQuestion','evidenceIds','severity','confidence','effort','priority'] } } }, required: ['findings'] } };
  const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-5.6-luna', store: false, instructions: 'You are PageFix AI. Browser evidence is the source of truth. Do not invent facts, metrics, conversion rates, customer behavior, or product claims. Only produce findings supported by supplied evidence IDs. If evidence is insufficient, omit the finding.', input: JSON.stringify({ url: audit.url, evidence }), text: { format: { type: 'json_schema', name: 'pagefix_findings', description: 'Evidence-grounded ecommerce purchase-friction findings.', strict: true, schema } } }) });
  const payload: any = await response.json();
  if (!response.ok) throw new Error(`AI_PROVIDER_${response.status}`);
  const raw = payload.output_text;
  if (!raw) throw new Error('AI_EMPTY_OUTPUT');
  const parsed = outputSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) throw new Error('AI_SCHEMA_INVALID');
  const evidenceIds = new Set(audit.evidence.map(e => e.id));
  const valid = parsed.data.findings.filter(f => f.evidenceIds.every(id => evidenceIds.has(id)));
  await db.$transaction(async tx => {
    for (const f of valid) await tx.finding.create({ data: { auditId, title: f.title, severity: f.severity, confidence: f.confidence, effort: f.effort, priority: f.priority, buyerQuestion: f.buyerQuestion, observation: f.observation, hypothesis: f.hypothesis, whyItMatters: f.whyItMatters, recommendation: f.recommendation, implementationSteps: f.implementationSteps, evidence: { create: f.evidenceIds.map(evidenceId => ({ evidenceId })) } } });
    await tx.usageEvent.create({ data: { userId: audit.userId, auditId, operation: 'ai_reasoning', provider: 'openai', model: process.env.OPENAI_MODEL || 'gpt-5.6-luna', estimatedCost: null, units: 0 } });
  });
  return { skipped: false, findings: valid.length, rejected: parsed.data.findings.length - valid.length };
}
