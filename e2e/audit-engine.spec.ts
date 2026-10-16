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
    };
  };

  expect(reportPayload.audit?.status).toBe('COMPLETED');
  expect(reportPayload.audit?.evidence?.length ?? 0, 'Completed audit must persist browser evidence').toBeGreaterThanOrEqual(5);
  expect(reportPayload.audit?.jobs?.[0]?.status).toBe('COMPLETED');
});
