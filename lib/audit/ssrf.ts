import dns from 'node:dns/promises';
import net from 'node:net';

const blockedHosts = new Set(['localhost', 'metadata.google.internal']);

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 0;
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
  }
  return true;
}

export async function validateAuditUrl(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error('INVALID_URL'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('BLOCKED_URL_SCHEME');
  if (url.username || url.password) throw new Error('BLOCKED_URL_CREDENTIALS');
  const host = url.hostname.toLowerCase();
  if (blockedHosts.has(host) || host.endsWith('.localhost') || host.endsWith('.internal')) throw new Error('BLOCKED_PRIVATE_HOST');
  const records = await dns.lookup(host, { all: true, verbatim: true });
  if (!records.length || records.some((r) => isPrivateIp(r.address))) throw new Error('BLOCKED_PRIVATE_IP');
  return url;
}
