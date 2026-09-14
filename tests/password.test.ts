import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/security/password';

describe('password security', () => {
  it('hashes and verifies a valid password', async () => {
    const hash = await hashPassword('CorrectHorseBatteryStaple!');
    expect(hash.startsWith('scrypt$')).toBe(true);
    await expect(verifyPassword('CorrectHorseBatteryStaple!', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('rejects passwords outside the policy', async () => {
    await expect(hashPassword('short')).rejects.toThrow('PASSWORD_POLICY');
  });
});
