export type CommercialLink = { text: string; href: string };

const COMMERCIAL_ACTION_LABEL = /add to cart|add to bag|add to basket|buy now|shop now|checkout|place order|complete purchase|pay now|purchase|start free|start trial|book now|request a quote|contact sales|sign up|get started/i;

/**
 * Select a small, same-origin subset of commercial-action destinations for a
 * bounded status check. External URLs are intentionally excluded here.
 */
export function selectInternalCommercialLinks(
  links: CommercialLink[],
  baseUrl: string,
  limit = 3,
): CommercialLink[] {
  let base: URL;
  try { base = new URL(baseUrl); } catch { return []; }
  const seen = new Set<string>();
  const selected: CommercialLink[] = [];
  for (const link of links) {
    if (!COMMERCIAL_ACTION_LABEL.test(link.text) || !link.href.trim()) continue;
    if (/^javascript:/i.test(link.href.trim()) || /^#?$/.test(link.href.trim())) continue;
    try {
      const target = new URL(link.href, base);
      if (!['http:', 'https:'].includes(target.protocol) ||
          target.username || target.password ||
          target.hostname.toLowerCase() !== base.hostname.toLowerCase()) continue;
      target.hash = '';
      const href = target.toString();
      if (seen.has(href)) continue;
      seen.add(href);
      selected.push({ text: link.text.trim(), href });
      if (selected.length >= limit) break;
    } catch {
      // Malformed destinations are not fetched.
    }
  }
  return selected;
}

export function isConfirmedBrokenDestination(statusCode: number | null): boolean {
  return statusCode === 404 || statusCode === 410;
}
