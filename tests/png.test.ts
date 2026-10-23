import { describe, expect, it } from 'vitest';
import { isPngBuffer } from '@/lib/audit/png';

describe('isPngBuffer', () => {
  it('accepts the PNG signature', () => {
    expect(isPngBuffer(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]))).toBe(true);
  });

  it('rejects empty, truncated, and non-PNG payloads', () => {
    expect(isPngBuffer(null)).toBe(false);
    expect(isPngBuffer(Buffer.from([]))).toBe(false);
    expect(isPngBuffer(Buffer.from('not an image'))).toBe(false);
  });
});
