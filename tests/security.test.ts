import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/security/password';

describe('password security', () => {
  it('hashes and verifies passwords without storing plaintext', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).not.toContain('correct horse');
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
    expect(await verifyPassword('wrong password', hash)).toBe(false);
  });
});
