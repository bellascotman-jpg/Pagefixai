import { z } from 'zod';

export const aiFindingSchema = z.object({
  title: z.string().trim().min(8).max(160),
  observation: z.string().trim().min(12).max(1200),
  hypothesis: z.enum(['Directly Observed Evidence', 'Inferred Risk', 'Hypothesis', 'Recommendation']),
  whyItMatters: z.string().trim().min(12).max(1200),
  recommendation: z.string().trim().min(12).max(1600),
  implementationSteps: z.string().trim().min(12).max(2400),
  buyerQuestion: z.string().trim().min(8).max(300),
  evidenceIds: z.array(z.string().trim().min(1).max(200)).min(1).max(8),
  severity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  effort: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  priority: z.enum(['FIX_NOW', 'FIX_NEXT', 'FIX_LATER']),
}).strict();

export const aiOutputSchema = z.object({
  findings: z.array(aiFindingSchema).max(20),
}).strict();

export type AiFinding = z.infer<typeof aiFindingSchema>;

export function filterEvidenceGroundedFindings(
  findings: AiFinding[],
  availableEvidenceIds: Iterable<string>,
  existingTitles: Iterable<string>,
) {
  const evidenceIds = new Set(availableEvidenceIds);
  const titles = new Set([...existingTitles].map((title) => title.trim().toLowerCase()));
  const accepted: AiFinding[] = [];
  let rejected = 0;

  for (const finding of findings) {
    const title = finding.title.trim().toLowerCase();
    const uniqueEvidenceIds = new Set(finding.evidenceIds);
    const evidenceIsValid = uniqueEvidenceIds.size === finding.evidenceIds.length &&
      finding.evidenceIds.every((id) => evidenceIds.has(id));
    if (!evidenceIsValid || titles.has(title)) {
      rejected += 1;
      continue;
    }
    accepted.push(finding);
    titles.add(title);
  }

  return { accepted, rejected };
}

/** Extract text from raw Responses REST payloads and SDK-shaped test payloads. */
export function extractResponsesOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { output_text?: unknown; output?: unknown };
  if (typeof record.output_text === 'string' && record.output_text.trim()) return record.output_text.trim();
  if (!Array.isArray(record.output)) return null;
  const parts: string[] = [];
  for (const item of record.output) {
    if (!item || typeof item !== 'object') continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (!block || typeof block !== 'object') continue;
      const entry = block as { type?: unknown; text?: unknown };
      if ((entry.type === 'output_text' || entry.type === 'text') && typeof entry.text === 'string' && entry.text.trim()) parts.push(entry.text.trim());
    }
  }
  return parts.length ? parts.join('\n') : null;
}
