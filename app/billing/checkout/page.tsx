import PaddleCheckoutBoot from '@/components/paddle-checkout-boot';

export const metadata = {
  title: 'Secure checkout | PageFix AI',
  robots: { index: false, follow: false },
};

export default function BillingCheckoutPage() {
  return (
    <PaddleCheckoutBoot
      token={process.env.PADDLE_CLIENT_TOKEN || ''}
      environment={process.env.PADDLE_ENVIRONMENT || 'live'}
    />
  );
}
