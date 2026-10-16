import { describe, expect, it } from 'vitest';
import { buildCoreRevenueFindings } from '@/lib/audit/revenue-leak-rules';

const base = {
  url: 'https://shop.example/products/linen-shirt',
  title: 'Linen Shirt',
  metaDescription: '',
  viewportMeta: 'width=device-width, initial-scale=1',
  bodyText: 'A lightweight linen shirt in natural fabric.',
  headings: [{ tag: 'H1', text: 'Linen Shirt' }],
  buttons: ['Add to cart'],
  links: [{ text: 'Home', href: '/' }],
  forms: 0,
  imageCount: 3,
  imagesWithoutAlt: 0,
  textEvidenceId: 'e-text',
  domEvidenceId: 'e-dom',
  linkEvidenceId: 'e-links',
  metadataEvidenceId: 'e-meta',
  imageEvidenceId: 'e-images',
};

describe('core revenue-leak rules', () => {
  it('flags buyer-critical product information only as not observed in the capture', () => {
    const findings = buildCoreRevenueFindings(base);
    expect(findings.map((finding) => finding.title)).toContain('Product price was not observed in the captured page');
    expect(findings.map((finding) => finding.title)).toContain('Shipping or delivery information was not observed');
    expect(findings.every((finding) => finding.hypothesis === 'Inferred Risk')).toBe(true);
    expect(findings.every((finding) => finding.evidenceIds.length > 0)).toBe(true);
    expect(findings.every((finding) => !/conversion rate|revenue loss|will increase sales/i.test(
      finding.observation + finding.whyItMatters + finding.recommendation,
    ))).toBe(true);
  });

  it('does not flag missing buyer information when recognizable signals are present', () => {
    const findings = buildCoreRevenueFindings({
      ...base,
      bodyText: 'Price $42. Shipping available. Returns accepted within 30 days. Product details include 100% linen, measurements and care instructions. Contact us for help. Secure checkout.',
    });
    const titles = findings.map((finding) => finding.title);
    expect(titles).not.toContain('Product price was not observed in the captured page');
    expect(titles).not.toContain('Shipping or delivery information was not observed');
    expect(titles).not.toContain('Return, refund, or exchange terms were not observed');
    expect(titles).not.toContain('Product specifications or decision-useful details were not observed');
    expect(titles).not.toContain('Support or contact route was not observed');
    expect(titles).not.toContain('Purchase-relevant trust or policy information was not observed');
  });

  it('flags a missing next step on a landing page without inventing conversion data', () => {
    const findings = buildCoreRevenueFindings({
      ...base,
      url: 'https://example.com/landing',
      title: 'Services',
      bodyText: 'We provide business services.',
      buttons: [],
      links: [],
    });
    expect(findings.map((finding) => finding.title)).toContain('No clear conversion step was observed in the captured page');
  });

  it('does not report missing conversion steps when a form exists', () => {
    const findings = buildCoreRevenueFindings({
      ...base,
      url: 'https://example.com/landing',
      bodyText: 'Business software for teams.',
      buttons: [],
      links: [],
      forms: 1,
    });
    expect(findings.map((finding) => finding.title)).not.toContain('No clear conversion step was observed in the captured page');
  });

  it('recognizes link-based CTAs instead of incorrectly reporting them missing', () => {
    const findings = buildCoreRevenueFindings({
      ...base,
      url: 'https://example.com/landing',
      title: 'Product',
      bodyText: 'Product information and benefits for teams.',
      buttons: [],
      links: [{ text: 'Start free', href: '/signup' }],
    });
    expect(findings.map((finding) => finding.title)).not.toContain('No clear conversion step was observed in the captured page');
  });

  it('flags missing mobile viewport metadata with a limitation statement', () => {
    const findings = buildCoreRevenueFindings({ ...base, viewportMeta: '' });
    const finding = findings.find((item) => item.title === 'Mobile viewport configuration was not detected');
    expect(finding?.severity).toBe('MEDIUM');
    expect(finding?.evidenceIds).toContain('e-meta');
    expect(finding?.observation).toMatch(/observed/i);
  });

  it('flags a single captured product image as a review cue, not a defect claim', () => {
    const findings = buildCoreRevenueFindings({ ...base, imageCount: 1 });
    expect(findings.map((finding) => finding.title)).toContain('Only one image element was observed for this product page');
  });

  it('checks generic landing-page propositions and missing benefits conservatively', () => {
    const findings = buildCoreRevenueFindings({
      ...base,
      url: 'https://example.com/',
      title: 'Welcome',
      bodyText: 'Welcome to our website. This page describes a business service with details about the company and its offerings.',
      headings: [{ tag: 'H1', text: 'Welcome' }],
      buttons: [],
      links: [],
      forms: 0,
      imageCount: 0,
      imagesWithoutAlt: 0,
    });
    const titles = findings.map((finding) => finding.title);
    expect(titles).toContain('Primary offer or value proposition is unclear in the captured heading');
    expect(titles).toContain('Explicit customer benefits were not identified by the text check');
  });
});
