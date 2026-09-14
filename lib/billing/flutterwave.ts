import { randomUUID } from 'node:crypto';
import { getPlan, type PlanId } from '@/lib/plans';

const BASE = 'https://api.flutterwave.com/v3';

function secret() {
  const value = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!value) throw new Error('CONFIGURATION_ERROR');
  return value;
}

async function flw<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { ...init, headers: { Authorization: `Bearer ${secret()}`, 'Content-Type': 'application/json', ...(init.headers || {}) }, cache: 'no-store' });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`FLUTTERWAVE_${response.status}`);
  return data as T;
}

export async function createCheckout(input: { userId: string; email: string; name?: string | null; planId: PlanId }) {
  const plan = getPlan(input.planId);
  if (!plan) throw new Error('INVALID_PLAN');
  const currency = process.env.BILLING_CURRENCY || 'USD';
  const reference = `pagefix_${input.userId}_${input.planId}_${randomUUID()}`;
  const data = await flw<{ status: string; data?: { link?: string } }>('/payments', { method: 'POST', body: JSON.stringify({ amount: plan.amount, currency, tx_ref: reference, redirect_url: `${process.env.APP_URL}/billing/return`, customer: { email: input.email, name: input.name || input.email }, customizations: { title: 'PageFix AI', description: `${plan.name} plan` }, meta: { userId: input.userId, planId: input.planId } }) });
  if (data.status !== 'success' || !data.data?.link) throw new Error('FLUTTERWAVE_CHECKOUT_FAILED');
  return { reference, url: data.data.link, amount: plan.amount, currency };
}

export type VerifiedTransaction = { id: number; tx_ref: string; status: string; amount: number; currency: string; customer?: { email?: string }; meta?: Record<string, unknown> };

export async function verifyTransaction(id: string | number) {
  const response = await flw<{ status: string; data?: VerifiedTransaction }>(`/transactions/${encodeURIComponent(String(id))}/verify`);
  if (response.status !== 'success' || !response.data) throw new Error('FLUTTERWAVE_VERIFICATION_FAILED');
  return response.data;
}
