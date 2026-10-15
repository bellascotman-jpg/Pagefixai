import { describe, expect, it } from 'vitest';
import { validateAuditUrl } from '@/lib/audit/ssrf';

describe('audit URL security', () => {
  it('rejects non-web schemes', async () => {
    await expect(validateAuditUrl('file:///etc/passwd')).rejects.toThrow('BLOCKED_URL_SCHEME');
    await expect(validateAuditUrl('javascript:alert(1)')).rejects.toThrow('BLOCKED_URL_SCHEME');
  });

  it('rejects embedded credentials', async () => {
    await expect(validateAuditUrl('https://user:password@example.com')).rejects.toThrow('BLOCKED_URL_CREDENTIALS');
  });

  it('rejects localhost and internal hosts before DNS access', async () => {
    await expect(validateAuditUrl('http://localhost:3000')).rejects.toThrow('BLOCKED_PRIVATE_HOST');
    await expect(validateAuditUrl('http://service.internal')).rejects.toThrow('BLOCKED_PRIVATE_HOST');
  });

  it('rejects loopback, link-local, reserved and mapped private IP literals', async () => {
    await expect(validateAuditUrl('http://127.0.0.1')).rejects.toThrow('BLOCKED_PRIVATE_IP');
    await expect(validateAuditUrl('http://169.254.169.254')).rejects.toThrow('BLOCKED_PRIVATE_IP');
    await expect(validateAuditUrl('http://192.0.2.10')).rejects.toThrow('BLOCKED_PRIVATE_IP');
    await expect(validateAuditUrl('http://[::1]')).rejects.toThrow('BLOCKED_PRIVATE_IP');
    await expect(validateAuditUrl('http://[::ffff:127.0.0.1]')).rejects.toThrow('BLOCKED_PRIVATE_IP');
  });
});
