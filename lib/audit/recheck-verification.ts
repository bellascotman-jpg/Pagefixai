export type RecheckPageCapture = {
  statusCode: number | null;
  visibleText: string | null;
};

export type RecheckVerificationInput = {
  previousEngineVersion: string;
  currentEngineVersion: string;
  auditStatus: string;
  pages: RecheckPageCapture[];
  findings: Array<{ title: string }>;
};

export type RecheckVerificationDecision = {
  canVerify: boolean;
  reason:
    | 'READY'
    | 'AUDIT_NOT_COMPLETED'
    | 'ENGINE_VERSION_CHANGED'
    | 'NO_PAGE_CAPTURE'
    | 'INCOMPLETE_PAGE_CAPTURE'
    | 'ACCESS_CHALLENGE'
    | 'CRAWLER_LIMITATION';
};

const ACCESS_CHALLENGE_PATTERNS = [
  /captcha/i,
  /verify you are human/i,
  /checking your browser/i,
  /enable javascript and cookies to continue/i,
  /cloudflare ray id/i,
  /automated requests? (?:are|is) not allowed/i,
  /temporarily blocked/i,
];

export function evaluateRecheckVerification(
  input: RecheckVerificationInput,
): RecheckVerificationDecision {
  if (input.auditStatus !== 'COMPLETED') {
    return { canVerify: false, reason: 'AUDIT_NOT_COMPLETED' };
  }

  // Rule changes can change what a finding means. Do not compare old findings
  // with a new engine and present absence as a verified fix.
  if (!input.previousEngineVersion || input.previousEngineVersion !== input.currentEngineVersion) {
    return { canVerify: false, reason: 'ENGINE_VERSION_CHANGED' };
  }

  if (!input.pages.length) {
    return { canVerify: false, reason: 'NO_PAGE_CAPTURE' };
  }

  const successfulPages = input.pages.filter(
    page => page.statusCode !== null && page.statusCode >= 200 && page.statusCode < 300,
  );
  if (!successfulPages.length || successfulPages.length !== input.pages.length) {
    return { canVerify: false, reason: 'INCOMPLETE_PAGE_CAPTURE' };
  }

  const combinedText = successfulPages.map(page => page.visibleText ?? '').join(' ').trim();
  if (combinedText.length < 80) {
    return { canVerify: false, reason: 'INCOMPLETE_PAGE_CAPTURE' };
  }

  if (ACCESS_CHALLENGE_PATTERNS.some(pattern => pattern.test(combinedText))) {
    return { canVerify: false, reason: 'ACCESS_CHALLENGE' };
  }

  if (input.findings.some(finding => /could not be verified by the audit crawler/i.test(finding.title))) {
    return { canVerify: false, reason: 'CRAWLER_LIMITATION' };
  }

  return { canVerify: true, reason: 'READY' };
}
