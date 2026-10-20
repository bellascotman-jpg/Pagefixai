import { getCheckoutPlan, type PublicPlanId } from '@/lib/plans';

const LIVE_API = 'https://api.paddle.com';
const SANDBOX_API = 'https://sandbox-api.paddle.com';

function apiBase() {
  return process.env.PADDLE_ENVIRONMENT === 'sandbox' ? SANDBOX_API : LIVE_API;
}

function apiKey() {
  const value = process.env.PADDLE_API_KEY;
  if (!value) throw new Error('PADDLE_NOT_CONFIGURED');
  return value;
}

export function getPaddlePriceId(planId: PublicPlanId) {
  const key = {
    starter_monthly: 'PADDLE_PRICE_STARTER_MONTHLY',
    growth_monthly: 'PADDLE_PRICE_GROWTH_MONTHLY',
    agency_monthly: 'PADDLE_PRICE_AGENCY_MONTHLY',
  }[planId];
  return process.env[key] || '';
}

export function isPaddleConfigured() {
  return Boolean(
    process.env.PADDLE_API_KEY &&
    process.env.PADDLE_CLIENT_TOKEN &&
    process.env.PADDLE_WEBHOOK_SECRET &&
    process.env.PADDLE_PRICE_STARTER_MONTHLY &&
    process.env.PADDLE_PRICE_GROWTH_MONTHLY &&
    process.env.PADDLE_PRICE_AGENCY_MONTHLY
  );
}

async function paddle<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
      'Paddle-Version': '1',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    console.error('paddle_api_error', response.status, body?.error?.code || body?.error?.type || 'unknown');
    throw new Error('PADDLE_CHECKOUT_FAILED');
  }
  return body as T;
}

export async function createPaddleCheckout(input: {
  userId: string;
  email: string;
  name?: string | null;
  planId: PublicPlanId;
}) {
  const plan = getCheckoutPlan(input.planId);
  const priceId = getPaddlePriceId(input.planId);
  if (!plan || !priceId) throw new Error('PADDLE_PLAN_NOT_CONFIGURED');

  const appUrl = (process.env.APP_URL || 'https://pagefixai.vercel.app').replace(/\/$/, '');
  const response = await paddle<{
    data?: { id?: string; checkout?: { url?: string | null } | null };
  }>('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ price_id: priceId, quantity: 1 }],
      collection_mode: 'automatic',
      custom_data: {
        userId: input.userId,
        planId: input.planId,
      },
      checkout: { url: `${appUrl}/billing/checkout` },
    }),
  });

  const url = response.data?.checkout?.url;
  if (!response.data?.id || !url) throw new Error('PADDLE_CHECKOUT_URL_MISSING');
  return { reference: response.data.id, url, provider: 'paddle' as const };
}
