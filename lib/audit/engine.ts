import { chromium, type Page as PlaywrightPage } from 'playwright';
import { db } from '@/lib/db';
import { validateAuditUrl } from '@/lib/audit/ssrf';

export const ENGINE_VERSION = '1.0.0';

const text = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();

async function safeText(page: PlaywrightPage, selector: string) {
  try { return text(await page.locator(selector).first().innerText({ timeout: 2500 })); } catch { return ''; }
}

async function extract(page: PlaywrightPage) {
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const s = window.getComputedStyle(el);
      const r = (el as HTMLElement).getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const els = Array.from(document.querySelectorAll('body *')).filter(visible);
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"]')).filter(visible).map((e) => (e.textContent || (e as HTMLInputElement).value || '').trim()).filter(Boolean).slice(0, 30);
    const links = Array.from(document.querySelectorAll('a[href]')).filter(visible).map((e) => ({ text: (e.textContent || '').trim(), href: (e as HTMLAnchorElement).href })).slice(0, 80);
    const images = Array.from(document.images).filter(visible).map((e) => ({ src: e.currentSrc || e.src, alt: e.alt, width: e.naturalWidth, height: e.naturalHeight })).slice(0, 50);
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((e) => e.textContent || '').slice(0, 20);
    const bodyText = (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 50000);
    return {
      title: document.title,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      bodyText, buttons, links, images, structuredData: scripts,
      forms: document.querySelectorAll('form').length,
      headings: Array.from(document.querySelectorAll('h1,h2,h3')).filter(visible).map((e) => ({ tag: e.tagName, text: (e.textContent || '').trim() })).slice(0, 40),
      prices: bodyText.match(/(?:[$€£₦]\s?\d[\d,.]*|\d[\d,.]*\s?(?:USD|EUR|GBP|NGN))/gi)?.slice(0, 20) || [],
    };
  });
}

function finding(title: string, severity: 'HIGH' | 'MEDIUM' | 'LOW', observation: string, why: string, recommendation: string, buyerQuestion: string, evidenceId: string) {
  return { title, severity, confidence: 'HIGH' as const, effort: 'LOW' as const, priority: severity === 'HIGH' ? 'FIX_NOW' as const : severity === 'MEDIUM' ? 'FIX_NEXT' as const : 'FIX_LATER' as const, observation, whyItMatters: why, recommendation, implementationSteps: recommendation, buyerQuestion, evidenceIds: [evidenceId] };
}

export async function runAudit(auditId: string) {
  const audit = await db.audit.findUnique({ where: { id: auditId } });
  if (!audit) throw new Error('AUDIT_NOT_FOUND');
  const target = await validateAuditUrl(audit.url);
  await db.audit.update({ where: { id: auditId }, data: { status: 'RUNNING', startedAt: new Date(), engineVersion: ENGINE_VERSION } });
  const browser = await chromium.launch({ headless: true });
  try {
    const results: Array<{ viewport: string; data: Awaited<ReturnType<typeof extract>>; screenshot: Buffer }> = [];
    for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      page.setDefaultTimeout(8000);
      await page.goto(target.toString(), { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForLoadState('networkidle', { timeout: 7000 }).catch(() => undefined);
      const data = await extract(page);
      const screenshot = await page.screenshot({ fullPage: true, type: 'png' });
      results.push({ viewport: viewport.name, data, screenshot });
      await context.close();
    }
    const primary = results[0].data;
    const pageRecord = await db.page.create({ data: { auditId, url: target.toString(), title: primary.title, canonical: primary.canonical, metaDescription: primary.description, visibleText: primary.bodyText } });
    const evidence = await db.evidence.createManyAndReturn({ data: [
      { auditId, type: 'TEXT', source: 'browser.visible_text', location: 'body', content: primary.bodyText.slice(0, 20000), confidence: 'HIGH' },
      { auditId, type: 'METADATA', source: 'document.metadata', location: 'head', content: JSON.stringify({ title: primary.title, description: primary.description, canonical: primary.canonical }), confidence: 'HIGH' },
      { auditId, type: 'DOM', source: 'browser.dom', location: 'interactive_elements', content: JSON.stringify({ buttons: primary.buttons, forms: primary.forms, headings: primary.headings }), confidence: 'HIGH' },
      { auditId, type: 'STRUCTURED_DATA', source: 'jsonld', location: 'script[type=application/ld+json]', content: JSON.stringify(primary.structuredData), confidence: primary.structuredData.length ? 'HIGH' : 'LOW' },
      { auditId, type: 'SYSTEM_DETECTED', source: 'browser.image_inventory', location: 'images', content: JSON.stringify(primary.images), confidence: 'HIGH' },
    ]);
    await Promise.all(results.map(async (result) => db.pageSnapshot.create({ data: { pageId: pageRecord.id, viewport: result.viewport, screenshotUrl: null } })));
    const findings = [];
    const textEvidence = evidence.find((e) => e.type === 'TEXT')!;
    const domEvidence = evidence.find((e) => e.type === 'DOM')!;
    const metadataEvidence = evidence.find((e) => e.type === 'METADATA')!;
    if (!primary.title) findings.push(finding('Missing page title', 'MEDIUM', 'No document title was observed in the rendered page.', 'A buyer and search system may receive less context about what the page represents.', 'Add a concise, product-specific title that matches the page offer.', 'What exactly is this page offering?', metadataEvidence.id));
    if (!primary.headings.some((h) => h.tag === 'H1')) findings.push(finding('No visible H1 detected', 'MEDIUM', 'No visible H1 element was detected in the rendered page.', 'The primary page proposition may be harder to identify quickly.', 'Add one clear H1 that states the product or offer and the main buyer outcome without unsupported claims.', 'What is the main thing being sold here?', domEvidence.id));
    if (!primary.buttons.some((b) => /add to cart|buy|shop|checkout|subscribe|start|order/i.test(b))) findings.push(finding('Primary purchase CTA not clearly detected', 'HIGH', 'The rendered page did not expose a button label that clearly signals purchase or the next commercial action.', 'Purchase intent can be interrupted when the next step is ambiguous.', 'Make the primary commercial action explicit and visually identifiable near the product decision point.', 'How do I buy or take the next step?', domEvidence.id));
    if (!primary.description) findings.push(finding('Missing meta description', 'LOW', 'No meta description was observed.', 'Search previews may have less controlled context when this page is shared or indexed.', 'Add a concise description grounded in the actual product and offer.', 'What is this page about?', metadataEvidence.id));
    if (!primary.images.length) findings.push(finding('No visible product imagery detected', 'HIGH', 'No visible images were detected in the rendered page.', 'For image-dependent products, buyers may lack the visual information needed for confidence.', 'Add clear, relevant product imagery and ensure the primary image is prominent.', 'What exactly will I receive?', textEvidence.id));
    const structured = primary.structuredData.join(' ');
    if (!/Product/i.test(structured)) findings.push(finding('Product structured data not detected', 'LOW', 'No JSON-LD Product object was detected in the captured structured data.', 'Search and commerce systems may have less machine-readable product context.', 'Add valid Product structured data using facts already present on the page.', 'Can the product information be understood consistently?', metadataEvidence.id));
    const storedFindings = await Promise.all(findings.map(async (f) => db.finding.create({ data: { auditId, title: f.title, severity: f.severity, confidence: f.confidence, effort: f.effort, priority: f.priority, buyerQuestion: f.buyerQuestion, observation: f.observation, whyItMatters: f.whyItMatters, recommendation: f.recommendation, implementationSteps: f.implementationSteps, evidence: { create: f.evidenceIds.map((evidenceId) => ({ evidenceId })) } } })));
    await db.audit.update({ where: { id: auditId }, data: { status: 'COMPLETED', completedAt: new Date(), category: 'Other' } });
    return { auditId, findings: storedFindings.length, pageId: pageRecord.id };
  } catch (error) {
    await db.audit.update({ where: { id: auditId }, data: { status: 'FAILED', completedAt: new Date(), errorCode: error instanceof Error ? error.message : 'UNKNOWN_ERROR', errorMessage: error instanceof Error ? error.message : 'Audit failed.' } }).catch(() => undefined);
    throw error;
  } finally {
    await browser.close();
  }
}
