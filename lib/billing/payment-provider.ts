export type PaymentPlan = {
  planId: string;
  amount: number;
  currency: string;
  billingInterval: "month" | "year" | "one_time";
};

export type VerifiedPayment = {
  providerReference: string;
  status: "successful" | "failed";
  amount: number;
  currency: string;
  planId: string;
  customerEmail: string;
};

export interface PaymentProvider {
  createCheckout(plan: PaymentPlan, customerEmail: string): Promise<{ paymentUrl: string; reference: string }>;
  verifyTransaction(reference: string): Promise<VerifiedPayment>;
  verifyWebhook(rawBody: string, signature: string | null): boolean;
}
