import { describe, expect, it } from 'vitest';
import { evaluateRecheckVerification } from '@/lib/audit/recheck-verification';

const validInput = {
  previousEngineVersion: '1.3.1',
  currentEngineVersion: '1.3.1',
  auditStatus: 'COMPLETED',
  pages: [{ statusCode: 200, visibleText: 'A product page with enough captured content to support a cautious comparison of its evidence.' }],
  findings: [] as Array<{ title: string }>,
};

describe('evaluateRecheckVerification', () => {
  it('allows a comparison only when the same engine has a successful substantive capture', () => {
    expect(evaluateRecheckVerification(validInput)).toEqual({ canVerify: true, reason: 'READY' });
  });

  it('does not compare findings across engine versions', () => {
    expect(evaluateRecheckVerification({ ...validInput, currentEngineVersion: '2.0.0' }).reason).toBe('ENGINE_VERSION_CHANGED');
  });

  it('refuses to verify when the audit did not complete', () => {
    expect(evaluateRecheckVerification({ ...validInput, auditStatus: 'FAILED' }).reason).toBe('AUDIT_NOT_COMPLETED');
  });

  it('refuses empty, inaccessible, failed-status, or partial captures', () => {
    expect(evaluateRecheckVerification({ ...validInput, pages: [] }).reason).toBe('NO_PAGE_CAPTURE');
    expect(evaluateRecheckVerification({ ...validInput, pages: [{ statusCode: 403, visibleText: 'Access denied'.repeat(20) }] }).reason).toBe('INCOMPLETE_PAGE_CAPTURE');
    expect(evaluateRecheckVerification({ ...validInput, pages: [{ statusCode: 200, visibleText: 'short' }] }).reason).toBe('INCOMPLETE_PAGE_CAPTURE');
    expect(evaluateRecheckVerification({ ...validInput, pages: [{ statusCode: 200, visibleText: 'Checking your browser '.repeat(10) }] }).reason).toBe('ACCESS_CHALLENGE');
  });

  it('does not treat a crawler limitation finding as proof of resolution', () => {
    expect(evaluateRecheckVerification({
      ...validInput,
      findings: [{ title: 'Page content could not be verified by the audit crawler' }],
    }).reason).toBe('CRAWLER_LIMITATION');
  });
});
