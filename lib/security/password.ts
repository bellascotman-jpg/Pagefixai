import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLEL = 1;

type ScryptOptions = { N: number; r: number; p: number };

function deriveKey(password: string, salt: Buffer, length: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(password, salt, length, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 8 || password.length > 128) throw new Error('PASSWORD_POLICY');
  const salt = randomBytes(16);
  const derived = await deriveKey(password, salt, KEY_LENGTH, { N: COST, r: BLOCK_SIZE, p: PARALLEL });
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLEL}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, n, r, p, saltHex, hashHex] = encoded.split('$');
  if (algorithm !== 'scrypt' || !n || !r || !p || !saltHex || !hashHex) return false;
  try {
    const expected = Buffer.from(hashHex, 'hex');
    if (expected.length === 0 || !Number.isSafeInteger(Number(n)) || !Number.isSafeInteger(Number(r)) || !Number.isSafeInteger(Number(p))) {
      return false;
    }
    const derived = await deriveKey(password, Buffer.from(saltHex, 'hex'), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
