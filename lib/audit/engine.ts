import { chromium, type Page as PlaywrightPage } from 'playwright';
import { db } from '@/lib/db';
import { validateAuditUrl } from '@/lib/audit/ssrf';

export const ENGINE_VERSION = '1.0.0';

type ExtractedPage = {
  title: string;
  canonical: string;
  description: string;
  bodyText: string;
  buttons: string[];
  links: Array<{ text: string; href: string }>;
  images: Array<{ src: string; alt: string; width: number; height: number }>;
  structuredData: string[];
  forms: number;
  headings: Array<{ tag: string; text: string }>;
};

async function extract(page: PlaywrightPage): Promise<ExtractedPage> {
  return page.evaluate(() => {
    const visible = (element: Element) => {
      const style = window.getComputedStyle(element);
      const rect = (element as HTMLElement).getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"]'))
      .filter(visible)
      .map((element) => (element.textContent || (element as HTMLInputElement).value || '').trim())
      .filter(Boolean)
      .slice(0, 30);
    const links = Array.from(document.querySelectorAll('a[href]'))
      .filter(visible)
      .map((element) => ({ text: (element.textContent || '').trim(), href: (element as HTMLAnchorElement).href }))
      .slice(0, 80);
    const images = Array.from(document.images)
      .filter(visible)
      .map((element) => ({ src: element.currentSrc || element.src, alt: element.alt, width: element.naturalWidth, height: element.naturalHeight }))
      .slice(0, 50);
    const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((element) => element.textContent || '')
      .slice(0, 20);
    const bodyText = (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 50000);
    return {
      title: document.title,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      bodyText,
      buttons,
      links,
      images,
      structuredData,
      forms: document.querySelectorAll('form').length,
      headings: Array.from(document.querySelectorAll('h1,h2,h3'))
        .filter(visible)
        .map((element) => ({ tag: element.tagName, text: (element.textContent || '').trim() }))
        .slice(0, 40),
    };
  });
}

function makeFinding(
  title: string,
  severity: 'HIGH' | 'MEDIUM' | 'LOW',
  observation: string,
  whyItMatters: string,
  recommendation: string,
  buyerQuestion: string,
  evidenceId: string,
) {
  return {
    title,
    severity,
    confidence: 'HIGH' as const,
    effort: 'LOW' as const,
    priority: severity === 'HIGH' ? 'FIX_NOW' as const : severity === 'MEDIUM' ? 'FIX_NEXT' as const : 'FIX_LATER' as const,
    observation,
    whyItMatters,
    recommendation,
    implementationSteps: recommendation,
    buyerQuestion,
    evidenceIds: [evidenceId],
  };
}

export async function runAudit(auditId: string) {
  const audit = await db.audit.findUnique({ where: { id: auditId } });
  if (!audit) throw new Error('AUDIT_NOT_FOUND');

  const target = await validateAuditUrl(audit.url);
  await db.audit.update({ where: { id: auditId }, data: { status: 'RUNNING', startedAt: new Date(), engineVersion: ENGINE_VERSION } });

  const browser = await chromium.launch({ headless: true });
  try {
    const results: Array<{ viewport: string; data: ExtractedPage }> = [];
    const viewports = [
      { name: 'desktop', width: 1440, height: 1000 },
      { name: 'mobile', width: 390, height: 844 },
    ];

    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(8000);
        await page.goto(target.toString(), { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForLoadState('networkidle', { timeout: 7000 }).catch(() => undefined);
        const data = await extract(page);
        await page.screenshot({ fullPage: true, type: 'png' });
        results.push({ viewport: viewport.name, data });
      } finally {
        await context.close();
      }
    }

    const primary = results[0]?.data;
    if (!primary) throw new Error('PAGE_RENDER_FAILED');

    const pageRecord = await db.page.create({
      data: {
        auditId,
        url: target.toString(),
        title: primary.title,
        canonical: primary.canonical,
        metaDescription: primary.description,
        visibleText: primary.bodyText,
      },
    });

    for (const result of results) {
      await db.pageSnapshot.create({
        data: { pageId: pageRecord.id, viewport: result.viewport, screenshotUrl: null },
      });
    }

    const evidence = await db.evidence.createManyAndReturn({
      data: [
        { auditId, type: 'TEXT', source: 'browser.visible_text', location: 'body', content: primary.bodyText.slice(0, 20000), confidence: 'HIGH' },
        { auditId, type: 'METADATA', source: 'document.metadata', location: 'head', content: JSON.stringify({ title: primary.title, description: primary.description, canonical: primary.canonical }), confidence: 'HIGH' },
        { auditId, type: 'DOM', source: 'browser.dom', location: 'interactive_elements', content: JSON.stringify({ buttons: primary.buttons, forms: primary.forms, headings: primary.headings }), confidence: 'HIGH' },
        { auditId, type: 'STRUCTURED_DATA', source: 'jsonld', location: 'script[type=application/ld+json]', content: JSON.stringify(primary.structuredData), confidence: primary.structuredData.length ? 'HIGH' : 'LOW' },
        { auditId, type: 'SYSTEM_DETECTED', source: 'browser.image_inventory', location: 'images', content: JSON.stringify(primary.images), confidence: 'HIGH' },
      ],
    });

    const textEvidence = evidence.find((item) => item.type === 'TEXT');
    const domEvidence = evidence.find((item) => item.type === 'DOM');
    const metadataEvidence = evidence.find((item) => item.type === 'METADATA');
    if (!textEvidence || !domEvidence || !metadataEvidence) throw new Error('EVIDENCE_CREATION_FAILED');

    const findings = [];
    if (!primary.title) {
      findings.push(makeFinding('Missing page title', 'MEDIUM', 'No document title was observed in the rendered page.', 'A buyer and search system may receive less context about what the page represents.', 'Add a concise, product-specific title grounded in the actual offer.', 'What exactly is this page offering?', metadataEvidence.id));
    }
    if (!primary.headings.some((heading) => heading.tag === 'H1')) {
      findings.push(makeFinding('No visible H1 detected', 'MEDIUM', 'No visible H1 element was detected in the rendered page.', 'The primary page proposition may be harder to identify quickly.', 'Add one clear H1 stating the product or offer and main buyer outcome without unsupported claims.', 'What is the main thing being sold here?', domEvidence.id));
    }
    if (!primary.buttons.some((button) => /add to cart|buy|shop|checkout|subscribe|start|order/i.test(button))) {
      findings.push(makeFinding('Primary purchase CTA not clearly detected', 'HIGH', 'The rendered page did not expose a button label that clearly signals purchase or the next commercial action.', 'Purchase intent can be interrupted when the next step is ambiguous.', 'Make the primary commercial action explicit and visually identifiable near the product decision point.', 'How do I buy or take the next step?', domEvidence.id));
    }
    if (!primary.description) {
      findings.push(makeFinding('Missing meta description', 'LOW', 'No meta description was observed.', 'Search previews may have less controlled context when this page is shared or indexed.', 'Add a concise description grounded in the actual product and offer.', 'What is this page about?', metadataEvidence.id));
    }
    if (!primary.images.length) {
      findings.push(makeFinding('No visible product imagery detected', 'HIGH', 'No visible images were detected in the rendered page.', 'For image-dependent products, buyers may lack the visual information needed for confidence.', 'Add clear, relevant product imagery and ensure the primary image is prominent.', 'What exactly will I receive?', textEvidence.id));
    }
    if (!primary.structuredData.join(' ').match(/Product/i)) {
      findings.push(makeFinding('Product structured data not detected', 'LOW', 'No JSON-LD Product object was detected in the captured structured data.', 'Search and commerce systems may have less machine-readable product context.', 'Add valid Product structured data using facts already present on the page.', 'Can the product information be understood consistently?', metadataEvidence.id));
    }

    for (const item of findings) {
      await db.finding.create({
        data: {
          auditId,
          title: item.title,
          severity: item.severity,
          confidence: item.confidence,
          effort: item.effort,
          priority: item.priority,
          buyerQuestion: item.buyerQuestion,
          observation: item.observation,
          whyItMatters: item.whyItMatters,
          recommendation: item.recommendation,
          implementationSteps: item.implementationSteps,
          evidence: { create: item.evidenceIds.map((evidenceId) => ({ evidenceId })) },
        },
      });
    }

    await db.audit.update({ where: { id: auditId }, data: { status: 'COMPLETED', completedAt: new Date(), category: 'Other' } });
    return { auditId, findings: findings.length, pageId: pageRecord.id };
  } catch (error) {
    await db.audit.update({
      where: { id: auditId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorCode: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Audit failed.',
      },
    }).catch(() => undefined);
    throw error;
  } finally {
    await browser.close();
  }
}
