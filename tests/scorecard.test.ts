import { describe, expect, it } from 'vitest';
import { buildCommerceClarityScorecard } from '@/lib/audit/scorecard';

describe('buildCommerceClarityScorecard', () => {
  it('does not emit a universal numeric score', () => {
    const result = buildCommerceClarityScorecard({ category: 'Product', buyerQuestions: [], findings: [] });
    expect(result).toHaveLength(7);
    expect(result.every(item => typeof item.state === 'string' && !('score' in item))).toBe(true);
  });

  it('keeps missing captured signals distinct from measured business outcomes', () => {
    const result = buildCommerceClarityScorecard({
      category: 'Product',
      buyerQuestions: [
        { question: 'What does this product or offer cost?', status: 'OBSERVED_IN_CAPTURED_PAGE' },
        { question: 'How is shipping or delivery handled?', status: 'NOT_OBSERVED_IN_CAPTURED_PAGE' },
        { question: 'What are the return, refund or exchange terms?', status: 'OBSERVED_IN_CAPTURED_PAGE' },
        { question: 'What product details or specifications are provided?', status: 'OBSERVED_IN_CAPTURED_PAGE' },
        { question: 'How can a visitor contact the business?', status: 'OBSERVED_IN_CAPTURED_PAGE' },
        { question: 'Is a clear commercial next action exposed?', status: 'OBSERVED_IN_CAPTURED_PAGE' },
        { question: 'Are visible images available?', status: 'OBSERVED_IN_CAPTURED_PAGE' },
      ],
      findings: [{ title: 'Potentially conflicting shipping promises', hypothesis: 'Hypothesis', observation: 'Both phrases were observed.' }],
    });
    expect(result).toHaveLength(7);
    expect(result.find(item => item.key === 'message-consistency')?.state).toBe('Needs review');
    expect(result.every(item => !item.explanation.toLowerCase().includes('will increase conversion'))).toBe(true);
  });

  it('returns unable-to-assess when a dimension has no relevant recorded signals', () => {
    const result = buildCommerceClarityScorecard({ category: 'Landing Page', buyerQuestions: [], findings: [] });
    expect(result.find(item => item.key === 'product-information')?.state).toBe('Unable to assess');
  });
});
