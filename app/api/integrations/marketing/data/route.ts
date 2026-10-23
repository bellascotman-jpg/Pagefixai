import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { decryptCredentials, encryptCredentials } from '@/lib/store-integrations/crypto';

export const runtime = 'nodejs';
export const maxDuration = 45;
export const dynamic = 'force-dynamic';

type Tokens = { access_token: string; refresh_token?: string; expires_in?: number; token_type?: string };
async function googleToken(userId: string, encryptedTokens: string, expiresAt: Date | null) {
  let tokens = decryptCredentials<Tokens>(encryptedTokens);
  if (expiresAt && expiresAt.getTime() > Date.now() + 120_000) return tokens.access_token;
  if (!tokens.refresh_token) return tokens.access_token;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Google OAuth client credentials are not configured.');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: tokens.refresh_token, grant_type: 'refresh_token' }),
    signal: AbortSignal.timeout(12000),
  });
  const refreshed = await response.json() as { access_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !refreshed.access_token) throw new Error('Google token refresh failed: ' + (refreshed.error || 'reauthorize this account.'));
  tokens = { ...tokens, access_token: refreshed.access_token, expires_in: refreshed.expires_in };
  await db.marketingConnection.update({ where: { userId_provider: { userId, provider: 'google_marketing' } }, data: { encryptedTokens: encryptCredentials(tokens), expiresAt: refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000) : null, lastError: null } });
  return tokens.access_token;
}

async function getJson(url: string, token: string, timeout = 12000) {
  const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(timeout) });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(String((data.error as { message?: string } | undefined)?.message || 'Provider API request failed (' + response.status + ').'));
  return data;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const connections = await db.marketingConnection.findMany({ where: { userId: user.id, status: 'CONNECTED' } });
  const output: Record<string, unknown> = { metaAds: null, googleAds: null, analytics: null, searchConsole: null, errors: [] as string[] };
  const errors = output.errors as string[];

  for (const connection of connections) {
    try {
      if (connection.provider === 'meta_ads') {
        const tokens = decryptCredentials<Tokens>(connection.encryptedTokens);
        const accountsResponse = await getJson('https://graph.facebook.com/v22.0/me/adaccounts?fields=id,name,account_status,currency,amount_spent,spend_cap&limit=100', tokens.access_token);
        const accounts = (accountsResponse.data as Array<Record<string, unknown>> | undefined) || [];
        const enriched = [];
        for (const account of accounts.slice(0, 20)) {
          const id = String(account.id || '');
          if (!id) continue;
          try {
            const campaignResponse = await getJson('https://graph.facebook.com/v22.0/' + encodeURIComponent(id) + '/campaigns?fields=id,name,status,objective,insights.date_preset(last_30d){impressions,clicks,spend,ctr,cpc,actions}&limit=50', tokens.access_token);
            enriched.push({ ...account, campaigns: campaignResponse.data || [] });
          } catch (error) {
            enriched.push({ ...account, campaigns: [], campaignError: error instanceof Error ? error.message : 'Campaign data unavailable.' });
          }
        }
        output.metaAds = { accounts: enriched, source: 'Meta Marketing API', range: 'Last 30 days for campaign insights' };
        await db.marketingConnection.update({ where: { id: connection.id }, data: { lastSyncedAt: new Date(), lastError: null } });
      }
      if (connection.provider === 'google_marketing') {
        const token = await googleToken(user.id, connection.encryptedTokens, connection.expiresAt);
        const version = process.env.GOOGLE_ADS_API_VERSION || 'v23';
        const googleAds: Record<string, unknown> = { customers: [], setupRequired: !process.env.GOOGLE_ADS_DEVELOPER_TOKEN };
        if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
          const response = await fetch('https://googleads.googleapis.com/' + version + '/customers:listAccessibleCustomers', {
            headers: { Authorization: 'Bearer ' + token, 'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN },
            signal: AbortSignal.timeout(12000),
          });
          const data = await response.json() as { resourceNames?: string[]; error?: { message?: string } };
          if (!response.ok) throw new Error('Google Ads API: ' + (data.error?.message || 'request failed'));
          const customerIds = (data.resourceNames || []).map(name => name.split('/').pop() || '').filter(Boolean).slice(0, 10);
          const customers = [];
          for (const customerId of customerIds) {
            try {
              const query = 'SELECT customer.id, customer.descriptive_name, campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE segments.date DURING LAST_30_DAYS AND campaign.status != \'REMOVED\' LIMIT 50';
              const campaignsResponse = await fetch('https://googleads.googleapis.com/' + version + '/customers/' + customerId + '/googleAds:searchStream', {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + token, 'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!, 'content-type': 'application/json' },
                body: JSON.stringify({ query }),
                signal: AbortSignal.timeout(12000),
              });
              const rows = await campaignsResponse.json() as Array<{ results?: unknown[]; error?: { message?: string } }>;
              if (!campaignsResponse.ok) throw new Error(rows?.[0]?.error?.message || 'Campaign query failed');
              customers.push({ customerId, rows });
            } catch (error) { customers.push({ customerId, error: error instanceof Error ? error.message : 'Campaign data unavailable.' }); }
          }
          googleAds.customers = customers;
        }
        output.googleAds = googleAds;
        try {
          const summary = await getJson('https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=100', token);
          output.analytics = summary.accountSummaries || [];
        } catch (error) { errors.push('Google Analytics: ' + (error instanceof Error ? error.message : 'unavailable')); }
        try {
          const sites = await getJson('https://www.googleapis.com/webmasters/v3/sites', token);
          output.searchConsole = sites.siteEntry || [];
        } catch (error) { errors.push('Search Console: ' + (error instanceof Error ? error.message : 'unavailable')); }
        await db.marketingConnection.update({ where: { id: connection.id }, data: { lastSyncedAt: new Date(), lastError: null } });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Provider sync failed.';
      errors.push(connection.provider + ': ' + message);
      await db.marketingConnection.update({ where: { id: connection.id }, data: { lastError: message } }).catch(() => undefined);
    }
  }
  return NextResponse.json({ data: output, connectedProviders: connections.map(c => c.provider), errors });
}
