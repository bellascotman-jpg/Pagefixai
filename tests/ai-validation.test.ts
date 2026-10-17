import { describe, expect, it } from 'vitest';
import { aiOutputSchema, extractResponsesOutputText, filterEvidenceGroundedFindings } from '@/lib/ai/validation';

const validFinding = {
  title: 'Shipping details were not observed',
  observation: 'The captured page text contains no recognizable shipping or delivery information.',
  hypothesis: 'Inferred Risk',
  whyItMatters: 'Buyers may not know whether delivery is available or what conditions apply.',
  recommendation: 'Expose verified delivery regions, costs, and timing near the purchase decision.',
  implementationSteps: 'Confirm the business delivery policy, then publish the verified terms on this page.',
  buyerQuestion: 'When can this item be delivered?',
  evidenceIds: ['evidence-1'],
  severity: 'MEDIUM',
  confidence: 'MEDIUM',
  effort: 'LOW',
  priority: 'FIX_NEXT',
} as const;

describe('AI finding validation', () => {
  it('accepts supported evidence classifications', () => {
    expect(aiOutputSchema.safeParse({ findings: [validFinding] }).success).toBe(true);
  });

  it('rejects unsupported classifications and oversized outputs', () => {
    expect(aiOutputSchema.safeParse({ findings: [{ ...validFinding, hypothesis: 'Guaranteed conversion loss' }] }).success).toBe(false);
    expect(aiOutputSchema.safeParse({ findings: Array.from({ length: 21 }, (_, i) => ({ ...validFinding, title: `Finding title number ${i}` })) }).success).toBe(false);
  });

  it('rejects unknown evidence IDs', () => {
    const result = filterEvidenceGroundedFindings([validFinding as never], ['known-evidence'], []);
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected).toBe(1);
  });

  it('rejects repeated evidence IDs and duplicate titles within one response', () => {
    const duplicateEvidence = { ...validFinding, evidenceIds: ['evidence-1', 'evidence-1'] };
    const secondSameTitle = { ...validFinding, recommendation: 'Use a different verified delivery policy summary for buyers.' };
    const result = filterEvidenceGroundedFindings(
      [duplicateEvidence as never, validFinding as never, secondSameTitle as never],
      ['evidence-1'],
      [],
    );
    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toBe(2);
  });

  it('rejects findings duplicating deterministic findings', () => {
    const result = filterEvidenceGroundedFindings([validFinding as never], ['evidence-1'], ['Shipping details were not observed']);
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected).toBe(1);
  });
});

describe('Responses API text extraction', () => {
  it('accepts the raw REST output content shape', () => {
    expect(extractResponsesOutputText({ output: [{ type: 'message', content: [{ type: 'output_text', text: '{"findings":[]}' }] }] })).toBe('{"findings":[]}');
  });
  it('supports output_text and joins multiple text blocks safely', () => {
    expect(extractResponsesOutputText({ output_text: '  {"findings":[]}  ' })).toBe('{"findings":[]}');
    expect(extractResponsesOutputText({ output: [
      { content: [{ type: 'output_text', text: '{"findings":' }] },
      { content: [{ type: 'output_text', text: '[]}' }] },
    ] })).toBe('{"findings":\n[]}');
  });
  it('returns null for missing or non-text response content', () => {
    expect(extractResponsesOutputText(null)).toBeNull();
    expect(extractResponsesOutputText({ output: [{ content: [{ type: 'refusal', refusal: 'not available' }] }] })).toBeNull();
  });
});
