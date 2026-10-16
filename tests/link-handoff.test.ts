import { describe, expect, it } from 'vitest';
import { isConfirmedBrokenDestination, selectInternalCommercialLinks } from '@/lib/intelligence/link-handoff';

describe('commercial link handoff checks', () => {
  it('selects only distinct same-origin commercial actions for bounded checking', () => {
    const links = selectInternalCommercialLinks([
      { text: 'Checkout', href: '/checkout' },
      { text: 'Checkout', href: 'https://shop.example/checkout' },
      { text: 'External checkout', href: 'https://payments.example/checkout' },
      { text: 'Placeholder checkout', href: '#' },
      { text: 'Unsafe checkout', href: 'javascript:void(0)' },
      { text: 'Product details', href: '/product' },
      { text: 'Place order', href: '/order' },
      { text: 'Buy now', href: '/buy' },
    ], 'https://shop.example/products/item', 2);
    expect(links).toEqual([
      { text: 'Checkout', href: 'https://shop.example/checkout' },
      { text: 'Place order', href: 'https://shop.example/order' },
    ]);
  });

  it('only treats clear not-found/gone responses as confirmed broken destinations', () => {
    expect(isConfirmedBrokenDestination(404)).toBe(true);
    expect(isConfirmedBrokenDestination(410)).toBe(true);
    expect(isConfirmedBrokenDestination(403)).toBe(false);
    expect(isConfirmedBrokenDestination(429)).toBe(false);
    expect(isConfirmedBrokenDestination(500)).toBe(false);
    expect(isConfirmedBrokenDestination(null)).toBe(false);
  });
});
