import { describe, expect, it } from 'vitest';
import { analyzeRetentionJourney, type RetentionInput } from '@/lib/intelligence/retention';

const base: RetentionInput = {
  name: 'New user onboarding',
  businessType: 'saas',
  flowType: 'onboarding',
  promisedOutcome: 'Create a useful sales dashboard',
  steps: [
    { id: 'welcome', name: 'Welcome', content: 'Welcome to the app. Start your setup.', expectedNextStep: 'Start setup', expectedOutcome: 'Setup started' },
    { id: 'connect', name: 'Connect data', content: 'Connect your data source to see your dashboard.', expectedNextStep: 'Connect data', expectedOutcome: 'Data source connected' },
  ],
  emails: [],
  pricingText: '',
  cancellationText: '',
  metrics: { usersStarted: 100, usersCompleted: 72, activatedUsers: 60, windowLabel: 'October signup cohort' },
};

describe('retention and onboarding intelligence', () => {
  it('calculates rates only from consistent user-supplied aggregate counts', () => {
    const result = analyzeRetentionJourney(base);
    expect(result.metrics?.completionRatePercent).toBe(72);
    expect(result.metrics?.incompleteRatePercent).toBe(28);
    expect(result.metrics?.activationRatePercent).toBe(60);
    expect(result.metrics?.source).toBe('User-supplied aggregate metrics');
  });

  it('flags an unclear next step without claiming measured churn', () => {
    const result = analyzeRetentionJourney({
      ...base,
      steps: [{ id: 'one', name: 'First screen', content: 'Welcome. Your workspace is ready.', expectedNextStep: 'Create first project', expectedOutcome: '' }],
      metrics: { usersStarted: null, usersCompleted: null, activatedUsers: null, windowLabel: '' },
    });
    expect(result.findings.some(item => item.id === 'next-step-one')).toBe(true);
    expect(result.findings.every(item => !/measured churn|will increase retention|lost revenue/i.test(item.detail + item.whyItMatters))).toBe(true);
  });

  it('does not flag a next action when the supplied wording is present with harmless filler words', () => {
    const result = analyzeRetentionJourney({
      ...base,
      steps: [{ id: 'welcome', name: 'Welcome', content: 'Welcome to the app. Start your setup.', expectedNextStep: 'Start setup', expectedOutcome: 'Setup started' }],
      metrics: { usersStarted: null, usersCompleted: null, activatedUsers: null, windowLabel: '' },
    });
    expect(result.findings.some(item => item.id === 'next-step-welcome')).toBe(false);
  });

  it('checks pricing and cancellation text only for the corresponding flow', () => {
    const pricing = analyzeRetentionJourney({ ...base, flowType: 'pricing', pricingText: '', metrics: { usersStarted: null, usersCompleted: null, activatedUsers: null, windowLabel: '' } });
    expect(pricing.findings.some(item => item.id === 'pricing-billing-clarity')).toBe(true);
    const cancellation = analyzeRetentionJourney({ ...base, flowType: 'cancellation', cancellationText: '', metrics: { usersStarted: null, usersCompleted: null, activatedUsers: null, windowLabel: '' } });
    expect(cancellation.findings.some(item => item.id === 'cancellation-clarity')).toBe(true);
  });

  it('does not calculate rates for inconsistent counts', () => {
    const result = analyzeRetentionJourney({ ...base, metrics: { usersStarted: 10, usersCompleted: 11, activatedUsers: 12, windowLabel: 'Bad cohort' } });
    expect(result.metrics).toBeNull();
    expect(result.findings.some(item => item.id === 'metrics-not-calculated')).toBe(true);
  });
});
