import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('INTEGRATION_ENCRYPTION_NOT_CONFIGURED');
  return createHash('sha256').update(secret).digest();
}

export function encryptCredentials(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return [iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptCredentials<T>(value: string): T {
  const [ivText, tagText, encryptedText] = value.split('.');
  if (!ivText || !tagText || !encryptedText) throw new Error('INTEGRATION_CREDENTIALS_INVALID');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedText, 'base64url')), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8')) as T;
}
