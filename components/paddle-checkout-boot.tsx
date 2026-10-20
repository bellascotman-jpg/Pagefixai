'use client';

import { useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (environment: 'sandbox') => void };
      Initialize: (settings: {
        token: string;
        eventCallback?: (event: { name?: string; data?: { transaction_id?: string } }) => void;
      }) => void;
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
  const [state, setState] = useState<'loading' | 'ready' | 'complete' | 'error'>('loading');

  function initialize() {
    if (!token || !window.Paddle) {
      setState('error');
      return;
    }
    try {
      if (environment === 'sandbox') window.Paddle.Environment.set('sandbox');
      window.Paddle.Initialize({
        token,
        eventCallback: (event) => {
          if (event.name === 'checkout.completed') setState('complete');
          if (event.name === 'checkout.error') setState('error');
        },
      });
      // Paddle.js automatically opens the transaction attached to the
      // _ptxn query parameter on this approved payment-link page.
      setState('ready');
    } catch {
      setState('error');
    }
  }

  const complete = state === 'complete';
  const failed = state === 'error';

  return (
    <main className="payment-bridge">
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onLoad={initialize}
        onError={() => setState('error')}
      />
      <div className="payment-bridge-card">
        <div className="payment-bridge-mark" aria-hidden="true">P</div>
        <div className="eyebrow">{complete ? 'CHECKOUT COMPLETE' : 'SECURE SUBSCRIPTION CHECKOUT'}</div>
        <h1>
          {complete
            ? 'Payment submitted successfully'
            : failed
              ? 'Checkout could not be opened'
              : state === 'ready'
                ? 'Secure checkout is ready'
                : 'Preparing your checkout…'}
        </h1>
        <p>
          {complete
            ? 'Paddle has reported checkout completion. PageFix activates paid features only after the signed payment webhook is verified; this may take a short moment.'
            : failed
              ? 'The payment window could not be initialized. No payment has been confirmed. Return to pricing and try again, or contact support if the problem continues.'
              : 'Your selected PageFix plan is being prepared. Card details are handled by Paddle and are never stored by PageFix.'}
        </p>
        <div className="payment-bridge-status" role="status" aria-live="polite">
          <span className={failed ? 'payment-bridge-dot payment-bridge-dot-error' : 'payment-bridge-dot'} />
          {complete ? 'Awaiting verified subscription activation' : failed ? 'Checkout unavailable' : state === 'ready' ? 'Connected to Paddle securely' : 'Connecting securely'}
        </div>
        <Link href={complete ? '/dashboard' : '/pricing'} className="button button-secondary">
          {complete ? 'Continue to PageFix dashboard' : 'Back to pricing'}
        </Link>
      </div>
    </main>
  );
}
