import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(nodeScrypt);
const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLEL = 1;

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 8 || password.length > 128) throw new Error('PASSWORD_POLICY');
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, KEY_LENGTH, { N: COST, r: BLOCK_SIZE, p: PARALLEL })) as Buffer;
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLEL}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, n, r, p, saltHex, hashHex] = encoded.split('$');
  if (algorithm !== 'scrypt' || !n || !r || !p || !saltHex || !hashHex) return false;
  try {
    const derived = (await scrypt(password, Buffer.from(saltHex, 'hex'), hashHex.length / 2, {
      N: Number(n), r: Number(r), p: Number(p),
    })) as Buffer;
    const expected = Buffer.from(hashHex, 'hex');
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
