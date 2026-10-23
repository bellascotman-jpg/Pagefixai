import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type MarketingProvider = 'meta_ads' | 'google_marketing';
type OAuthState = { userId: string; provider: MarketingProvider; expiresAt: number; nonce: string };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error('AUTH_SECRET must contain at least 32 characters for OAuth state signing.');
  return value;
}
function sign(value: string) { return createHmac('sha256', secret()).update(value).digest('base64url'); }

export function createOAuthState(userId: string, provider: MarketingProvider) {
  const payload: OAuthState = { userId, provider, expiresAt: Date.now() + 10 * 60 * 1000, nonce: randomBytes(18).toString('base64url') };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return encoded + '.' + sign(encoded);
}

export function verifyOAuthState(value: string): OAuthState | null {
  const [encoded, signature, extra] = value.split('.');
  if (!encoded || !signature || extra) return null;
  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as OAuthState;
    if (!parsed.userId || !parsed.provider || !parsed.nonce || parsed.expiresAt < Date.now()) return null;
    if (!['meta_ads', 'google_marketing'].includes(parsed.provider)) return null;
    return parsed;
  } catch { return null; }
}

export function appBaseUrl(requestUrl: string) {
  const requestOrigin = new URL(requestUrl).origin;
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  const base = process.env.VERCEL_ENV === 'preview' ? requestOrigin : configured || requestOrigin;
  const url = new URL(base);
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') throw new Error('APP_URL must use HTTPS in production.');
  return url.origin;
}

export function oauthConfig(provider: MarketingProvider) {
  if (provider === 'meta_ads') {
    const clientId = process.env.META_APP_ID;
    const clientSecret = process.env.META_APP_SECRET;
    if (!clientId || !clientSecret) throw new Error('Configure META_APP_ID and META_APP_SECRET in the deployment environment.');
    return { clientId, clientSecret, authorizeUrl: 'https://www.facebook.com/v22.0/dialog/oauth', tokenUrl: 'https://graph.facebook.com/v22.0/oauth/access_token', scopes: ['ads_read', 'ads_management', 'business_management'] };
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the deployment environment.');
  return { clientId, clientSecret, authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth', tokenUrl: 'https://oauth2.googleapis.com/token', scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/adwords', 'https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/webmasters.readonly'] };
}
