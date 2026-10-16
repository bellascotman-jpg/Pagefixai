import { describe, expect, it } from 'vitest';
import { buildCommerceIntelligenceFindings, classifyCommercePage } from '@/lib/audit/commerce-intelligence';

const base = {
  url: 'https://shop.example/products/linen-dress',
  title: 'Linen Dress',
  bodyText: 'A lightweight linen dress. Add to cart. Price $45. Contact us for support.',
  headings: [{ tag: 'H1', text: 'Linen Dress' }],
  buttons: ['Add to cart'],
  evidenceId: 'evidence-123',
};

describe('commerce intelligence', () => {
  it('classifies a product page by category cues', () => {
    expect(classifyCommercePage(base.url, base.title, base.bodyText)).toBe('Apparel');
  });

  it('labels unobserved category-specific information as an inferred risk', () => {
    const findings = buildCommerceIntelligenceFindings(base);
    const sizeFinding = findings.find((item) => item.title.includes('Size and fit'));
    expect(sizeFinding).toBeDefined();
    expect(sizeFinding?.hypothesis).toBe('Inferred Risk');
    expect(sizeFinding?.evidenceIds).toEqual(['evidence-123']);
    expect(sizeFinding?.observation).toContain('does not prove the information is absent');
  });

  it('flags potentially contradictory return terms as a hypothesis, not a confirmed fact', () => {
    const findings = buildCommerceIntelligenceFindings({
      ...base,
      bodyText: 'Linen dress. All sales final. 30-day returns apply to eligible orders.',
    });
    const contradiction = findings.find((item) => item.title === 'Potentially conflicting return statements');
    expect(contradiction).toBeDefined();
    expect(contradiction?.hypothesis).toBe('Hypothesis');
    expect(contradiction?.severity).toBe('HIGH');
  });

  it('does not infer a return contradiction when only one return statement is present', () => {
    const findings = buildCommerceIntelligenceFindings({
      ...base,
      bodyText: 'Linen dress. 30-day returns apply to eligible orders.',
    });
    expect(findings.some((item) => item.title === 'Potentially conflicting return statements')).toBe(false);
  });

  it('does not classify an ordinary landing page as a product page without product signals', () => {
    expect(classifyCommercePage('https://shop.example/about', 'About us', 'Our story and mission')).toBe('Landing Page');
  });
});