import { test, expect } from '@playwright/test';

test('a signed-in user can analyse, save and reload retention intelligence', async ({ request }) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const signup = await request.post('/api/auth/signup', {
    data: {
      name: 'PageFix Retention Smoke Test',
      email: `pagefix-retention-${suffix}@example.com`,
      password: 'RetentionSmoke-Only-2026!',
    },
  });
  expect(signup.status(), await signup.text()).toBe(201);

  const analysis = await request.post('/api/intelligence/retention', {
    data: {
      name: 'Signup activation smoke test',
      businessType: 'saas',
      flowType: 'onboarding',
      promisedOutcome: 'Create a useful sales dashboard',
      steps: [
        { id: 'welcome', name: 'Welcome', content: 'Welcome to the app. Start your setup.', expectedNextStep: 'Start setup', expectedOutcome: 'Setup started' },
        { id: 'connect', name: 'Connect data', content: 'Connect your data source to see your dashboard.', expectedNextStep: 'Connect data', expectedOutcome: 'Data source connected' },
      ],
      emails: [{ subject: 'Finish setup', body: 'Connect your data source to see your dashboard.', callToAction: 'Connect your data' }],
      pricingText: '',
      cancellationText: '',
      metrics: { usersStarted: 100, usersCompleted: 72, activatedUsers: 60, windowLabel: 'Smoke test cohort' },
    },
  });
  expect(analysis.status(), await analysis.text()).toBe(201);
  const saved = await analysis.json() as { saved?: boolean; analysis?: { id?: string; findings?: Array<{ label: string }>; metrics?: { completionRatePercent?: number } } };
  expect(saved.saved).toBe(true);
  expect(saved.analysis?.id).toBeTruthy();
  expect(saved.analysis?.metrics?.completionRatePercent).toBe(72);
  expect(saved.analysis?.findings?.every(item => ['Directly Observed Evidence', 'Inferred Risk', 'Hypothesis', 'Recommendation'].includes(item.label))).toBe(true);

  const historyResponse = await request.get('/api/intelligence/retention');
  expect(historyResponse.status(), await historyResponse.text()).toBe(200);
  const history = await historyResponse.json() as { analyses?: Array<{ id: string; name: string; flowType: string; metrics?: { completionRatePercent?: number } }> };
  expect(history.analyses?.some(item => item.id === saved.analysis?.id && item.name === 'Signup activation smoke test' && item.flowType === 'onboarding' && item.metrics?.completionRatePercent === 72)).toBe(true);
});
