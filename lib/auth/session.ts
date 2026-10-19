import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { ensureFounderAccessForUser } from '@/lib/auth/founder-access';
import { FOUNDER_EMAIL } from '@/lib/plans';

const COOKIE = 'pagefix_session';
const SESSION_DAYS = 180;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  const store = await cookies();
  store.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: expiresAt, maxAge: SESSION_DAYS * 24 * 60 * 60 });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (session.user.email.toLowerCase() === FOUNDER_EMAIL) {
    try {
      const founder = await ensureFounderAccessForUser(session.user.id);
      if (founder) return founder;
    } catch (error) {
      console.error('founder_access_repair_error', error instanceof Error ? error.name : 'UnknownError');
    }
  }
  return session.user;
}

/**
 * Refresh the persistent cookie and database expiry from a route handler.
 * Kept separate from getCurrentUser because Server Components cannot mutate cookies.
 */
export async function refreshCurrentSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await db.session.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    store.delete(COOKIE);
    return null;
  }
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.session.update({ where: { id: session.id }, data: { expiresAt } });
  store.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: expiresAt, maxAge: SESSION_DAYS * 24 * 60 * 60 });
  return session.user;
}
