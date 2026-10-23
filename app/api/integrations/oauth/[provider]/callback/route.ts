import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { encryptCredentials, decryptCredentials } from '@/lib/store-integrations/crypto';
import { appBaseUrl, oauthConfig, verifyOAuthState, type MarketingProvider } from '@/lib/integrations/marketing-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TokenResponse = { access_token: string; refresh_token?: string; token_type?: string; expires_in?: number; scope?: string; error?: string; error_description?: string };

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const url = new URL(request.url);
  const { provider: rawProvider } = await context.params;
  const provider = rawProvider as MarketingProvider;
  const user = await getCurrentUser();
  const cookieName = 'pagefix_oauth_' + rawProvider;
  const cookieState = request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  const stateParam = url.searchParams.get('state') || '';
  const state = cookieState ? decodeURIComponent(cookieState) : '';
  const verified = state && state === stateParam ? verifyOAuthState(state) : null;
  const destination = new URL('/dashboard/intelligence/integrations', request.url);
  const clearCookie = (response: NextResponse) => { response.cookies.set(cookieName, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/integrations/oauth/' + rawProvider, maxAge: 0 }); return response; };

  if (url.searchParams.has('error')) {
    destination.searchParams.set('oauth_error', 'Authorization was cancelled or denied by the provider.');
    return clearCookie(NextResponse.redirect(destination));
  }
  if (!user || !verified || verified.provider !== provider || verified.userId !== user.id || (provider !== 'meta_ads' && provider !== 'google_marketing')) {
    destination.searchParams.set('oauth_error', 'OAuth state validation failed. Start the connection again.');
    return clearCookie(NextResponse.redirect(destination));
  }
  const code = url.searchParams.get('code');
  if (!code) {
    destination.searchParams.set('oauth_error', 'The provider did not return an authorization code.');
    return clearCookie(NextResponse.redirect(destination));
  }

  try {
    const config = oauthConfig(provider);
    const redirectUri = appBaseUrl(request.url) + '/api/integrations/oauth/' + provider + '/callback';
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
      signal: AbortSignal.timeout(15000),
    });
    const token = await tokenResponse.json() as TokenResponse;
    if (!tokenResponse.ok || !token.access_token) throw new Error(token.error_description || token.error || 'The provider token exchange failed.');

    let externalAccountId: string | null = null;
    let accountName: string | null = null;
    if (provider === 'meta_ads') {
      const profileResponse = await fetch('https://graph.facebook.com/v22.0/me?fields=id,name&access_token=' + encodeURIComponent(token.access_token), { signal: AbortSignal.timeout(10000) });
      if (profileResponse.ok) {
        const profile = await profileResponse.json() as { id?: string; name?: string };
        externalAccountId = profile.id || null; accountName = profile.name || null;
      }
    } else {
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: 'Bearer ' + token.access_token }, signal: AbortSignal.timeout(10000) });
      if (profileResponse.ok) {
        const profile = await profileResponse.json() as { id?: string; email?: string; name?: string };
        externalAccountId = profile.id || null; accountName = profile.email || profile.name || null;
      }
    }

    let previousRefreshToken: string | undefined;
    const existing = await db.marketingConnection.findUnique({ where: { userId_provider: { userId: user.id, provider } }, select: { encryptedTokens: true } });
    if (existing && !token.refresh_token && provider === 'google_marketing') {
      try { previousRefreshToken = decryptCredentials<{ refresh_token?: string }>(existing.encryptedTokens).refresh_token; } catch { /* replace only with tokens returned by the provider */ }
    }
    const encryptedTokens = encryptCredentials({ ...token, ...(previousRefreshToken && !token.refresh_token ? { refresh_token: previousRefreshToken } : {}) });
    await db.marketingConnection.upsert({
      where: { userId_provider: { userId: user.id, provider } },
      create: { userId: user.id, provider, externalAccountId, accountName, encryptedTokens, scopes: config.scopes, expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null, status: 'CONNECTED', lastError: null },
      update: { externalAccountId, accountName, encryptedTokens, scopes: config.scopes, expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null, status: 'CONNECTED', lastError: null },
    });
    destination.searchParams.set('oauth_connected', provider);
    return clearCookie(NextResponse.redirect(destination));
  } catch (error) {
    destination.searchParams.set('oauth_error', error instanceof Error ? error.message : 'Connection failed.');
    return clearCookie(NextResponse.redirect(destination));
  }
}
