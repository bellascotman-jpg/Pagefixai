import { chromium, type Page as PlaywrightPage } from 'playwright';
import { db } from '@/lib/db';
import { validateAuditUrl } from '@/lib/audit/ssrf';
import { isScreenshotStorageConfigured, storeAuditScreenshot } from '@/lib/storage/object-store';

export const ENGINE_VERSION = '1.1.0';

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
  statusCode: number | null;
};

async function extract(page: PlaywrightPage): Promise<ExtractedPage> {
  return page.evaluate(() => {
    const visible = (element: Element) => {
      const style = window.getComputedStyle(element);
      const rect = (element as HTMLElement).getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]'))
      .filter(visible)
      .map((element) => (element.textContent || (element as HTMLInputElement).value || '').trim())
      .filter(Boolean)
      .slice(0, 40);
    const links = Array.from(document.querySelectorAll('a[href]'))
      .filter(visible)
      .map((element) => ({ text: (element.textContent || element.getAttribute('aria-label') || element.getAttribute('title') || '').trim(), href: (element as HTMLAnchorElement).href }))
      .slice(0, 120);
    const images = Array.from(document.images)
      .filter(visible)
      .map((element) => ({ src: element.currentSrc || element.src, alt: element.alt, width: element.naturalWidth, height: element.naturalHeight }))
      .slice(0, 80);
    const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((element) => element.textContent || '')
      .slice(0, 30);
    const bodyText = (document.body?.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 50000);
    return {
      title: document.title.trim(),
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
        .slice(0, 50),
      statusCode: null,
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
    hypothesis: 'Directly Observed Evidence',
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
    const results: Array<{ viewport: string; data: ExtractedPage; screenshotKey: string | null }> = [];
    const viewports = [
      { name: 'desktop', width: 1440, height: 1000 },
      { name: 'mobile', width: 390, height: 844 },
    ];

    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
      try {
        // Revalidate every network request, including redirect destinations, to reduce SSRF exposure.
        await context.route('**/*', async (route) => {
          const requestUrl = route.request().url();
          if (!requestUrl.startsWith('http://') && !requestUrl.startsWith('https://')) {
            await route.abort();
            return;
          }
          try {
            await validateAuditUrl(requestUrl);
            await route.continue();
          } catch {
            await route.abort('blockedbyclient');
          }
        });
        const page = await context.newPage();
        page.setDefaultTimeout(8000);
        const response = await page.goto(target.toString(), { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForLoadState('networkidle', { timeout: 7000 }).catch(() => undefined);
        const data = await extract(page);
        data.statusCode = response?.status() ?? null;
        let screenshotKey: string | null = null;
        if (isScreenshotStorageConfigured()) {
          try {
            const screenshotBytes = await page.screenshot({ type: 'png', fullPage: false });
            screenshotKey = await storeAuditScreenshot(auditId, viewport.name, screenshotBytes);
          } catch {
            console.error('audit_screenshot_storage_failed', { auditId, viewport: viewport.name });
          }
        }
        results.push({ viewport: viewport.name, data, screenshotKey });
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
        statusCode: primary.statusCode,
        title: primary.title,
        canonical: primary.canonical,
        metaDescription: primary.description,
        visibleText: primary.bodyText,
      },
    });

    for (const result of results) {
      const screenshotUrl = result.screenshotKey ? '/api/audits/' + auditId + '/screenshots/' + result.viewport : null;
      await db.pageSnapshot.create({
        data: { pageId: pageRecord.id, viewport: result.viewport, screenshotUrl },
      });
      await db.screenshot.create({
        data: { auditId, viewport: result.viewport, kind: 'viewport', storageUrl: result.screenshotKey, mimeType: 'image/png' },
      });
    }

    const evidence = await db.evidence.createManyAndReturn({
      data: [
        { auditId, type: 'TEXT', source: 'browser.visible_text', location: 'body', content: primary.bodyText.slice(0, 20000), confidence: 'HIGH' },
        { auditId, type: 'METADATA', source: 'document.metadata', location: 'head', content: JSON.stringify({ statusCode: primary.statusCode, title: primary.title, titleLength: primary.title.length, description: primary.description, descriptionLength: primary.description.length, canonical: primary.canonical }), confidence: 'HIGH' },
        { auditId, type: 'DOM', source: 'browser.dom', location: 'interactive_elements_and_headings', content: JSON.stringify({ buttons: primary.buttons, forms: primary.forms, headings: primary.headings, unlabeledLinks: primary.links.filter((link) => !link.text).length }), confidence: 'HIGH' },
        { auditId, type: 'STRUCTURED_DATA', source: 'jsonld', location: 'script[type="application/ld+json"]', content: JSON.stringify(primary.structuredData), confidence: primary.structuredData.length ? 'HIGH' : 'LOW' },
        { auditId, type: 'SYSTEM_DETECTED', source: 'browser.image_inventory', location: 'images', content: JSON.stringify({ totalVisible: primary.images.length, imagesWithoutAlt: primary.images.filter((image) => !image.alt.trim()).length, images: primary.images }), confidence: 'HIGH' },
        { auditId, type: 'LINK', source: 'browser.link_inventory', location: 'visible_links', content: JSON.stringify(primary.links), confidence: 'HIGH' },
      ],
    });

    const textEvidence = evidence.find((item) => item.type === 'TEXT');
    const domEvidence = evidence.find((item) => item.type === 'DOM');
    const metadataEvidence = evidence.find((item) => item.type === 'METADATA');
    const structuredEvidence = evidence.find((item) => item.type === 'STRUCTURED_DATA');
    const imageEvidence = evidence.find((item) => item.source === 'browser.image_inventory');
    const linkEvidence = evidence.find((item) => item.type === 'LINK');
    if (!textEvidence || !domEvidence || !metadataEvidence || !structuredEvidence || !imageEvidence || !linkEvidence) {
      throw new Error('EVIDENCE_CREATION_FAILED');
    }

    const findings = [];
    if (primary.statusCode !== null && primary.statusCode >= 400) {
      findings.push(makeFinding('Page returned an HTTP error status', 'HIGH', `The main document navigation returned HTTP ${primary.statusCode}.`, 'Visitors and crawlers may be unable to use this page normally while the response remains an error.', 'Confirm the intended URL, server response and redirect configuration. Recheck the URL after the response is corrected.', 'Can a visitor and search crawler reach this page?', metadataEvidence.id));
    }
    if (!primary.title) {
      findings.push(makeFinding('Missing page title', 'MEDIUM', 'No document title was observed in the rendered page.', 'The browser tab and search preview may lack a concise page-specific label.', 'Add a concise, page-specific title that accurately describes the actual offer.', 'What exactly is this page offering?', metadataEvidence.id));
    } else if (primary.title.length > 60) {
      findings.push(makeFinding('Page title is long', 'LOW', `The observed title contains ${primary.title.length} characters.`, 'Long titles may be truncated in some search result layouts; display varies by device and query.', 'Review the title and keep the most distinctive, accurate page description near the beginning.', 'Can a searcher understand the page from the beginning of the title?', metadataEvidence.id));
    }
    if (!primary.description.trim()) {
      findings.push(makeFinding('Missing meta description', 'LOW', 'No non-empty meta description was observed.', 'Search systems may choose a snippet from page content instead of the description you intended.', 'Add a concise, accurate description based on the visible page content. Search engines may still generate a different snippet.', 'What is this page about?', metadataEvidence.id));
    } else if (primary.description.trim().length > 170) {
      findings.push(makeFinding('Meta description is long', 'LOW', `The observed meta description contains ${primary.description.trim().length} characters.`, 'Search snippets can be truncated and are not guaranteed to use the supplied description.', 'Review whether the most useful and accurate summary appears first. Treat character length as a review cue, not a ranking rule.', 'Does the opening sentence communicate the offer clearly?', metadataEvidence.id));
    }
    if (!primary.canonical.trim()) {
      findings.push(makeFinding('Canonical link not detected', 'LOW', 'No link rel="canonical" was observed in the document head.', 'On pages with duplicate or variant URLs, canonical handling may need review. The absence alone does not prove duplicate indexing.', 'Confirm whether the page needs a canonical URL. If it does, add an absolute canonical that points to the preferred version.', 'Which URL should search systems treat as the preferred version?', metadataEvidence.id));
    }
    const h1s = primary.headings.filter((heading) => heading.tag === 'H1');
    if (h1s.length === 0) {
      findings.push(makeFinding('No visible H1 detected', 'MEDIUM', 'No visible H1 element was detected in the rendered page.', 'The page may not have a clear, programmatically identified primary heading.', 'Add a clear H1 that accurately describes the page topic or offer.', 'What is the main thing being presented here?', domEvidence.id));
    } else if (h1s.length > 1) {
      findings.push(makeFinding('Multiple visible H1 headings', 'LOW', `The rendered page contains ${h1s.length} visible H1 elements.`, 'Multiple H1 elements are valid in some HTML structures, but they can make the main page hierarchy harder to review.', 'Review the heading outline and ensure the primary page proposition is clear. Do not remove headings solely to meet an arbitrary count.', 'Which heading is the primary page proposition?', domEvidence.id));
    }
    const ctaLabels = primary.buttons.filter((button) => /add to cart|buy now|shop now|checkout|subscribe|start free|book now|request a quote|contact sales|place order|order now/i.test(button));
    if (!ctaLabels.length) {
      findings.push(makeFinding('No clearly labeled commercial action detected', 'MEDIUM', 'The visible button labels did not match common purchase or lead-action labels.', 'A visitor may need to infer the next step if the main commercial action is not explicit. Custom labels and link-based actions may not be detected by this rule.', 'Review the primary action on the page and make its label specific to the next step, such as buying, booking, subscribing or requesting information.', 'What should I do next if I am interested?', domEvidence.id));
    }
    const missingAlt = primary.images.filter((image) => !image.alt.trim()).length;
    if (primary.images.length && missingAlt > 0) {
      findings.push(makeFinding('Visible images missing alternative text', missingAlt > 5 ? 'MEDIUM' : 'LOW', `${missingAlt} of ${primary.images.length} visible images have an empty alt attribute.`, 'Meaningful alternative text helps convey relevant image information to people using assistive technology. Decorative images should intentionally use empty alt text.', 'Review each image. Add concise, useful alt text for informative images and retain empty alt text for decorative images.', 'Can someone using a screen reader understand the important visual information?', imageEvidence.id));
    }
    const unlabeledLinks = primary.links.filter((link) => !link.text.trim()).length;
    if (unlabeledLinks > 0) {
      findings.push(makeFinding('Visible links without an accessible text label', unlabeledLinks > 5 ? 'MEDIUM' : 'LOW', `${unlabeledLinks} visible links had no text, aria-label or title available to the extractor.`, 'Unlabeled links can make navigation unclear for assistive technology and for users scanning the page.', 'Give each meaningful link an accessible name. If an icon-only link is intentional, provide a suitable aria-label.', 'Can the purpose of each link be understood without seeing its icon?', linkEvidence.id));
    }
    const parsedStructuredData = primary.structuredData.filter((item) => item.trim()).map((item) => {
      try { JSON.parse(item); return true; } catch { return false; }
    });
    if (parsedStructuredData.some((valid) => !valid)) {
      findings.push(makeFinding('Structured data contains invalid JSON', 'MEDIUM', 'At least one non-empty JSON-LD script could not be parsed as JSON.', 'Invalid JSON prevents that script from being read as structured data.', 'Validate each JSON-LD script as JSON first, then check the schema properties against the relevant Schema.org type. This check does not validate every schema rule.', 'Can search systems parse the structured data on this page?', structuredEvidence.id));
    }
    if (!primary.structuredData.join(' ').match(/"@type"\s*:\s*"Product"/i)) {
      findings.push(makeFinding('Product structured data not detected', 'LOW', 'No JSON-LD Product type was detected by the current pattern check.', 'For a product detail page, valid product structured data can help search systems interpret product attributes. This finding may not apply to non-product pages.', 'If this is a product detail page, review whether accurate Product structured data is appropriate and reflects the visible product information.', 'Is this a product page, and are its key attributes machine-readable?', structuredEvidence.id));
    }
    if (!primary.images.length) {
      findings.push(makeFinding('No visible images detected', 'LOW', 'No visible image elements were detected in the captured viewport and page state.', 'For visually evaluated offers, missing imagery may leave buyers with less context. CSS backgrounds and lazy-loaded content may not be detected.', 'Confirm whether the offer needs product or contextual imagery. If so, provide relevant images and ensure the primary visual is visible.', 'What will I receive or experience?', imageEvidence.id));
    }

    const visibleText = primary.bodyText.toLowerCase();
    const buyerQuestionChecks = [
      { question: 'What does this product or offer cost?', observed: /(?:\$|₦|€|£)\s?\d|\b(?:usd|ngn|gbp|eur)\s?\d/i.test(primary.bodyText), evidenceIds: [textEvidence.id] },
      { question: 'How is shipping or delivery handled?', observed: /shipping|delivery|dispatch|fulfilment|fulfillment/i.test(visibleText), evidenceIds: [textEvidence.id, linkEvidence.id] },
      { question: 'What are the return, refund or exchange terms?', observed: /return policy|returns|refund|exchange/i.test(visibleText), evidenceIds: [textEvidence.id, linkEvidence.id] },
      { question: 'What product details or specifications are provided?', observed: /dimensions|materials|ingredients|specifications|size chart|product details|product information/i.test(visibleText), evidenceIds: [textEvidence.id] },
      { question: 'How can a visitor contact the business?', observed: /contact us|customer support|support@|mailto:|whatsapp|call us|phone number/i.test(visibleText) || primary.links.some((link) => /contact|support|help/i.test(link.text)), evidenceIds: [textEvidence.id, linkEvidence.id] },
      { question: 'Is a clear commercial next action exposed?', observed: primary.buttons.some((button) => /add to cart|buy now|shop now|checkout|subscribe|start free|book now|request a quote|contact sales|place order|order now/i.test(button)) || primary.links.some((link) => /buy now|shop now|add to cart|book now|request a quote|contact sales/i.test(link.text)), evidenceIds: [domEvidence.id, linkEvidence.id] },
      { question: 'Are visible images available?', observed: primary.images.length > 0, evidenceIds: [imageEvidence.id] },
    ];

    await db.buyerQuestionResult.createMany({
      data: buyerQuestionChecks.map((item) => ({
        auditId,
        question: item.question,
        status: item.observed ? 'OBSERVED_IN_CAPTURED_PAGE' : 'NOT_OBSERVED_IN_CAPTURED_PAGE',
        evidenceIds: item.evidenceIds,
      })),
    });

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
          hypothesis: item.hypothesis,
          whyItMatters: item.whyItMatters,
          recommendation: item.recommendation,
          implementationSteps: item.implementationSteps,
          evidence: { create: item.evidenceIds.map((evidenceId) => ({ evidenceId })) },
        },
      });
    }

    const pageUrl = new URL(target);
    const isProductPage = /\/(products?|items?)\//i.test(pageUrl.pathname) || /add to cart|product details|\bsku\b|in stock/i.test(primary.bodyText);
    const isCategoryPage = /\/(collections?|categories?)\//i.test(pageUrl.pathname);
    const category = isProductPage ? 'Product' : isCategoryPage ? 'Category' : 'Landing Page';
    await db.audit.update({ where: { id: auditId }, data: { status: 'COMPLETED', completedAt: new Date(), category } });
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
