import { describe, expect, it } from 'vitest';
import { parseJson, safeHttpUrl, shortUrlLabel } from '@/components/audit-evidence-viewer';

describe('audit evidence presentation helpers', () => {
  it('parses valid JSON and safely handles malformed JSON', () => {
    expect(parseJson('{"images":[]}')).toEqual({ images: [] });
    expect(parseJson('{not-json')).toBeNull();
  });

  it('resolves relative image and link URLs against the audited page', () => {
    expect(safeHttpUrl('/assets/product.webp', 'https://shop.example/products/one')).toBe('https://shop.example/assets/product.webp');
  });

  it('rejects unsafe protocols and malformed URLs', () => {
    expect(safeHttpUrl('javascript:alert(1)', 'https://shop.example')).toBeNull();
    expect(safeHttpUrl('data:image/png;base64,abc', 'https://shop.example')).toBeNull();
    expect(safeHttpUrl('not a url')).toBeNull();
  });

  it('shortens long URLs for readable evidence lists', () => {
    expect(shortUrlLabel('https://shop.example/products/long-product-name')).toBe('shop.example/products/long-product-name');
    expect(shortUrlLabel('https://shop.example/' + 'very-long-path/'.repeat(12)).length).toBeLessThanOrEqual(79);
  });
});
