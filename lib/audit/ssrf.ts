import dns from 'node:dns/promises';
import net from 'node:net';

const blockedHosts = new Set(['localhost', 'metadata.google.internal']);

function isPrivateIPv4(ip: string) {
  const [a, b, c] = ip.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    (a === 255 && b === 255 && c === 255);
}

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (!net.isIPv6(ip)) return true;

  const normalized = ip.toLowerCase().split('%')[0];
  if (normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (/^fe[89ab]/.test(normalized) || normalized.startsWith('ff')) return true;
  if (normalized.startsWith('2001:db8:')) return true;
  if (normalized.startsWith('2002:')) return true;

  // IPv4-mapped IPv6 addresses must be checked using the embedded IPv4 address.
  if (normalized.startsWith('::ffff:')) {
    const tail = normalized.slice('::ffff:'.length);
    if (net.isIPv4(tail)) return isPrivateIPv4(tail);
    const groups = tail.split(':');
    if (groups.length === 2) {
      const high = Number.parseInt(groups[0], 16);
      const low = Number.parseInt(groups[1], 16);
      if (Number.isFinite(high) && Number.isFinite(low)) {
        const mapped = [high >> 8, high & 255, low >> 8, low & 255].join('.');
        return isPrivateIPv4(mapped);
      }
    }
    return true;
  }

  return false;
}

export async function validateAuditUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('INVALID_URL');
  }

  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('BLOCKED_URL_SCHEME');
  if (url.username || url.password) throw new Error('BLOCKED_URL_CREDENTIALS');

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host || blockedHosts.has(host) || host.endsWith('.localhost') || host.endsWith('.internal')) {
    throw new Error('BLOCKED_PRIVATE_HOST');
  }

  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error('BLOCKED_PRIVATE_IP');
    return url;
  }

  let records: Array<{ address: string; family: number }>;
  try {
    records = await dns.lookup(host, { all: true, verbatim: true });
  } catch {
    throw new Error('INVALID_URL');
  }

  if (!records.length || records.some((record) => isPrivateIp(record.address))) {
    throw new Error('BLOCKED_PRIVATE_IP');
  }

  return url;
}
