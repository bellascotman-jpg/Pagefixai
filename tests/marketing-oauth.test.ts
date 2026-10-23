import { afterEach, describe, expect, it } from 'vitest';
import { createOAuthState, verifyOAuthState } from '@/lib/integrations/marketing-oauth';

const originalSecret = process.env.AUTH_SECRET;

afterEach(() => {
  if (originalSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = originalSecret;
});

describe('marketing OAuth state', () => {
  it('signs and verifies a state tied to a user and provider', () => {
    process.env.AUTH_SECRET = 'test-secret-that-is-at-least-thirty-two-characters-long';
    const state = createOAuthState('user_test_123', 'meta_ads');
    expect(verifyOAuthState(state)).toMatchObject({ userId: 'user_test_123', provider: 'meta_ads' });
  });

  it('rejects tampered or malformed state', () => {
    process.env.AUTH_SECRET = 'test-secret-that-is-at-least-thirty-two-characters-long';
    const state = createOAuthState('user_test_123', 'google_marketing');
    expect(verifyOAuthState(state + 'x')).toBeNull();
    expect(verifyOAuthState('not-a-valid-state')).toBeNull();
  });

  it('requires a strong signing secret', () => {
    process.env.AUTH_SECRET = 'short';
    expect(() => createOAuthState('user_test_123', 'meta_ads')).toThrow();
  });
});
