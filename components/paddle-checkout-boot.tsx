'use client';

import { useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (environment: 'sandbox') => void };
      Initialize: (settings: { token: string }) => void;
    };
  }
}

export default function PaddleCheckoutBoot({
  token,
  environment,
}: {
  token: string;
  environment: string;
}) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  function initialize() {
    if (!token || !window.Paddle) {
      setState('error');
      return;
    }
    try {
      if (environment === 'sandbox') window.Paddle.Environment.set('sandbox');
      window.Paddle.Initialize({ token });
      setState('ready');
    } catch {
      setState('error');
    }
  }

  return (
    <main className="payment-bridge">
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onLoad={initialize}
        onError={() => setState('error')}
      />
      <div className="payment-bridge-card">
        <div className="payment-bridge-mark">P</div>
        <div className="eyebrow">SECURE SUBSCRIPTION CHECKOUT</div>
        <h1>{state === 'error' ? 'Checkout could not be opened' : state === 'ready' ? 'Opening secure checkout…' : 'Preparing your checkout…'}</h1>
        <p>
          {state === 'error'
            ? 'The payment window could not be initialized. No payment has been taken. Return to pricing and try again later.'
            : 'Your selected PageFix plan is being prepared. Card details are handled by the payment processor, not stored by PageFix.'}
        </p>
        <div className="payment-bridge-status" role="status">
          <span className={state === 'error' ? 'payment-bridge-dot payment-bridge-dot-error' : 'payment-bridge-dot'} />
          {state === 'error' ? 'Checkout unavailable' : state === 'ready' ? 'Secure checkout initialized' : 'Connecting securely'}
        </div>
        <Link href="/pricing" className="button button-secondary">Back to pricing</Link>
      </div>
    </main>
  );
}
