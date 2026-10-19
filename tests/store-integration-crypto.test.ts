import { afterEach, describe, expect, it } from 'vitest';
import { decryptCredentials, encryptCredentials } from '@/lib/store-integrations/crypto';

const previousSecret = process.env.AUTH_SECRET;

afterEach(() => {
  if (previousSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = previousSecret;
});

describe('store integration credential encryption', () => {
  it('encrypts credentials and decrypts the exact object', () => {
    process.env.AUTH_SECRET = 'test-secret-with-at-least-32-characters';
    const credentials = { accessToken: 'secret-token-value', webhookSecret: 'secret-signature-value' };
    const encrypted = encryptCredentials(credentials);
    expect(encrypted).not.toContain(credentials.accessToken);
    expect(encrypted).not.toContain(credentials.webhookSecret);
    expect(decryptCredentials<typeof credentials>(encrypted)).toEqual(credentials);
  });

  it('rejects a modified encrypted credential blob', () => {
    process.env.AUTH_SECRET = 'test-secret-with-at-least-32-characters';
    const encrypted = encryptCredentials({ consumerSecret: 'top-secret' });
    const [iv, tag, ciphertext] = encrypted.split('.');
    const changed = ciphertext.slice(0, -1) + (ciphertext.endsWith('A') ? 'B' : 'A');
    expect(() => decryptCredentials(`${iv}.${tag}.${changed}`)).toThrow();
  });

  it('requires a server encryption secret', () => {
    delete process.env.AUTH_SECRET;
    expect(() => encryptCredentials({ accessToken: 'x' })).toThrow('INTEGRATION_ENCRYPTION_NOT_CONFIGURED');
  });
});
