import { test, expect } from '@playwright/test';

test('a signed-in user can create an audit and receive persisted evidence', async ({ request }) => {
  test.setTimeout(150_000);

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const signup = await request.post('/api/auth/signup', {
    data: {
      name: 'PageFix Audit Smoke Test',
      email: `pagefix-smoke-${suffix}@example.com`,
      password: 'SmokeTest-Only-2026!',
    },
  });
  expect(signup.status(), await signup.text()).toBe(201);

  const created = await request.post('/api/audits', {
    data: {
      url: 'https://example.com/',
      projectName: 'Audit engine smoke test',
    },
  });
  expect(created.status(), await created.text()).toBe(202);

  const createdPayload = await created.json() as { audit?: { id?: string; status?: string } };
  const auditId = createdPayload.audit?.id;
  expect(auditId).toBeTruthy();

  const deadline = Date.now() + 120_000;
  let lastStatus: { audit?: { status?: string; errorCode?: string | null; errorMessage?: string | null }; job?: { status?: string; errorCode?: string | null; errorMessage?: string | null } } = {};

  while (Date.now() < deadline) {
    const response = await request.get(`/api/audits/${auditId}/status`);
    expect(response.status(), await response.text()).toBe(200);
    lastStatus = await response.json();

    const status = lastStatus.audit?.status;
    if (status === 'COMPLETED') break;
    if (status === 'FAILED') {
      throw new Error(
        `Audit failed: ${lastStatus.audit?.errorCode ?? lastStatus.job?.errorCode ?? 'UNKNOWN'} — ${lastStatus.audit?.errorMessage ?? lastStatus.job?.errorMessage ?? 'No error detail'}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  expect(lastStatus.audit?.status, 'Audit did not reach a terminal successful state before the deadline').toBe('COMPLETED');

  const reportResponse = await request.get(`/api/audits/${auditId}`);
  expect(reportResponse.status(), await reportResponse.text()).toBe(200);
  const reportPayload = await reportResponse.json() as {
    audit?: {
      status?: string;
      evidence?: Array<{ id: string; content: string }>;
      jobs?: Array<{ status: string }>;
      findings?: Array<{ id: string; title: string }>;
    };
  };

  expect(reportPayload.audit?.status).toBe('COMPLETED');
  expect(reportPayload.audit?.evidence?.length ?? 0, 'Completed audit must persist browser evidence').toBeGreaterThanOrEqual(5);
  expect(reportPayload.audit?.jobs?.[0]?.status).toBe('COMPLETED');
  expect(reportPayload.audit?.findings?.length ?? 0, 'Completed audit should persist actionable findings').toBeGreaterThan(0);

  // Exercise a real fresh recheck through the authenticated API, not just the
  // pure verification helper. Recheck results must be explicit and persisted.
  const recheckResponse = await request.post(`/api/audits/${auditId}/recheck`);
  expect(recheckResponse.status(), await recheckResponse.text()).toBe(200);
  const recheckPayload = await recheckResponse.json() as {
    auditId?: string;
    result?: string;
    verifiedCount?: number;
    stillDetectedCount?: number;
    unableToVerifyCount?: number;
  };
  expect(recheckPayload.auditId).toBeTruthy();
  expect(['RESOLVED', 'IMPROVED', 'STILL_DETECTED', 'UNABLE_TO_VERIFY']).toContain(recheckPayload.result);

  const savedJourney = await request.post('/api/intelligence/journey', {
    data: {
      sourceType: 'ad',
      sourceUrl: 'https://example.com/campaign',
      source: 'Free delivery on selected items',
      destinationUrl: 'https://example.com/',
      destination: 'Example Domain. Learn more.',
      stages: [
        { id: 'product', name: 'Product / landing page', url: 'https://example.com/', content: 'Example Domain. Learn more.', expectedNextStep: 'Learn more' },
        { id: 'cart', name: 'Cart / basket', url: '', content: '', expectedNextStep: 'Proceed to checkout' },
      ],
      checkoutStarts: 100,
      completedOrders: 63,
      windowLabel: 'Test cohort, same date range',
      hasSpend: true,
      hasClicks: true,
      hasSessions: false,
      hasConversions: true,
    },
  });
  expect(savedJourney.status(), await savedJourney.text()).toBe(201);
  const savedJourneyPayload = await savedJourney.json() as { id?: string; saved?: boolean };
  expect(savedJourneyPayload.saved).toBe(true);
  expect(savedJourneyPayload.id).toBeTruthy();

  const journeyHistory = await request.get('/api/intelligence/journey');
  expect(journeyHistory.status(), await journeyHistory.text()).toBe(200);
  const journeyHistoryPayload = await journeyHistory.json() as { analyses?: Array<{ id: string; sourceType: string; payload?: { windowLabel?: string } }> };
  expect(journeyHistoryPayload.analyses?.some(item => item.id === savedJourneyPayload.id && item.sourceType === 'ad' && item.payload?.windowLabel === 'Test cohort, same date range')).toBe(true);
});
