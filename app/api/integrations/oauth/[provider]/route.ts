import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { appBaseUrl, createOAuthState, oauthConfig, type MarketingProvider } from '@/lib/integrations/marketing-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ provider: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/auth?mode=login', request.url));
  const { provider: rawProvider } = await context.params;
  if (rawProvider !== 'meta_ads' && rawProvider !== 'google_marketing') return NextResponse.json({ error: 'UNSUPPORTED_PROVIDER' }, { status: 404 });
  const provider = rawProvider as MarketingProvider;
  try {
    const config = oauthConfig(provider);
    const base = appBaseUrl(request.url);
    const redirectUri = base + '/api/integrations/oauth/' + provider + '/callback';
    const state = createOAuthState(user.id, provider);
    const authorize = new URL(config.authorizeUrl);
    authorize.searchParams.set('client_id', config.clientId);
    authorize.searchParams.set('redirect_uri', redirectUri);
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('scope', config.scopes.join(provider === 'meta_ads' ? ',' : ' '));
    authorize.searchParams.set('state', state);
    if (provider === 'google_marketing') {
      authorize.searchParams.set('access_type', 'offline');
      authorize.searchParams.set('prompt', 'consent');
      authorize.searchParams.set('include_granted_scopes', 'true');
    }
    const response = NextResponse.redirect(authorize);
    response.cookies.set('pagefix_oauth_' + provider, state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/integrations/oauth/' + provider, maxAge: 600 });
    return response;
  } catch (error) {
    const url = new URL('/dashboard/intelligence/integrations', request.url);
    url.searchParams.set('oauth_error', error instanceof Error ? error.message : 'OAuth is not configured.');
    return NextResponse.redirect(url);
  }
}
