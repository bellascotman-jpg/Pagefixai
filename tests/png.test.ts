import { describe, expect, it } from 'vitest';
import { hasPngSignature } from '@/lib/audit/png';

describe('hasPngSignature', () => {
  it('accepts the PNG signature', () => {
    expect(hasPngSignature(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]))).toBe(true);
  });

  it('rejects empty, truncated, and non-PNG payloads', () => {
    expect(hasPngSignature(null)).toBe(false);
    expect(hasPngSignature(Buffer.from([]))).toBe(false);
    expect(hasPngSignature(Buffer.from('not an image'))).toBe(false);
  });
});
