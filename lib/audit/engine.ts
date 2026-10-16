import { db } from '@/lib/db';
import { validateAuditUrl } from '@/lib/audit/ssrf';
import { buildCommerceIntelligenceFindings } from '@/lib/audit/commerce-intelligence';
import { buildCoreRevenueFindings } from '@/lib/audit/revenue-leak-rules';
import { captureAuditScreenshots } from '@/lib/audit/screenshots';

export const ENGINE_VERSION = '1.3.1';

type ExtractedPage = {
  title: string;
  canonical: string;
  description: string;
  viewport: string;
  bodyText: string;
  buttons: string[];
  links: Array<{ text: string; href: string }>;
  images: Array<{ src: string; alt: string; width: number; height: number }>;
  structuredData: string[];
  forms: number;
  headings: Array<{ tag: string; text: string }>;
  statusCode: number | null;
};

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


function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code: string) => { const point = Number(code); return point <= 0x10ffff ? String.fromCodePoint(point) : ''; })
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => { const point = parseInt(code, 16); return point <= 0x10ffff ? String.fromCodePoint(point) : ''; });
}

function htmlText(value: string): string {
  return decodeHtml(value
    .replace(/<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

function attr(tag: string, name: string): string {
  const match = tag.match(new RegExp('\\b' + name + '\\s*=\\s*(?:"([^"]*)"|\\x27([^\\x27]*)\\x27|([^\\s>]+))', 'i'));
  return decodeHtml(match ? (match[1] ?? match[2] ?? match[3] ?? '') : '');
}

function extractHtml(html: string, statusCode: number | null): ExtractedPage {
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] ?? '';
  const meta = (name: string) => {
    const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
    const tag = tags.find((item) => attr(item, 'name').toLowerCase() === name.toLowerCase());
    return tag ? attr(tag, 'content') : '';
  };
  const canonicalTag = (html.match(/<link\b[^>]*>/gi) ?? [])
    .find((tag) => attr(tag, 'rel').toLowerCase().split(/\s+/).includes('canonical'));
  const buttons = [
    ...(html.match(/<button\b[^>]*>[\s\S]*?<\/button\s*>/gi) ?? []).map((tag) => htmlText(tag.replace(/^<button\b[^>]*>/i, '').replace(/<\/button\s*>$/i, ''))),
    ...(html.match(/<input\b[^>]*type\s*=\s*["']?(?:submit|button)["']?[^>]*>/gi) ?? []).map((tag) => attr(tag, 'value')),
  ].filter(Boolean).slice(0, 40);
  const links = (html.match(/<a\b[^>]*>[\s\S]*?<\/a\s*>/gi) ?? []).slice(0, 120).map((tag) => ({
    text: htmlText(tag.replace(/^<a\b[^>]*>/i, '').replace(/<\/a\s*>$/i, '')) || attr(tag, 'aria-label') || attr(tag, 'title'),
    href: attr(tag, 'href'),
  })).filter((link) => link.href);
  const images = (html.match(/<img\b[^>]*>/gi) ?? []).slice(0, 80).map((tag) => ({
    src: attr(tag, 'src') || attr(tag, 'data-src') || attr(tag, 'data-original'),
    alt: attr(tag, 'alt'),
    width: Number(attr(tag, 'width')) || 0,
    height: Number(attr(tag, 'height')) || 0,
  })).filter((image) => image.src);
  const structuredData = (html.match(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script\s*>/gi) ?? [])
    .map((tag) => tag.replace(/^<script\b[^>]*>/i, '').replace(/<\/script\s*>$/i, '').trim()).slice(0, 30);
  const headings: Array<{tag:string;text:string}> = [];
  for (const match of html.matchAll(/<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)) {
    const text = htmlText(match[2]);
    if (text) headings.push({ tag: match[1].toUpperCase(), text });
    if (headings.length >= 50) break;
  }
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1] ?? html;
  return {
    title: htmlText(title),
    canonical: canonicalTag ? attr(canonicalTag, 'href') : '',
    description: meta('description'),
    viewport: meta('viewport'),
    bodyText: htmlText(body).slice(0, 50000),
    buttons,
    links,
    images,
    structuredData,
    forms: (html.match(/<form\b/gi) ?? []).length,
    headings,
    statusCode,
  };
}

async function fetchStaticPage(url: URL): Promise<ExtractedPage> {
  const timeout = AbortSignal.timeout(2100);
  let current = url.toString();
  let response: Response | null = null;
  let html = '';
  for (let hop = 0; hop < 3; hop++) {
    try {
      response = await fetch(current, {
        redirect: 'manual',
        signal: timeout,
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; PageFixAI/1.2; +https://pagefixai.vercel.app)',
          accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
        },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) break;
        const next = new URL(location, current);
        if (next.hostname.toLowerCase() !== url.hostname.toLowerCase()) break;
        current = next.toString();
        continue;
      }
      html = (await response.text()).slice(0, 2_000_000);
      break;
    } catch {
      break;
    }
  }
  return extractHtml(html, response?.status ?? null);
}

export async function runAudit(auditId: string) {
  const audit = await db.audit.findUnique({ where: { id: auditId } });
  if (!audit) throw new Error('AUDIT_NOT_FOUND');

  const validatedHosts = new Map<string, number>();
  const target = await validateAuditUrl(audit.url, validatedHosts);
  await db.audit.update({ where: { id: auditId }, data: { status: 'RUNNING', startedAt: new Date(), engineVersion: ENGINE_VERSION, errorCode: null, errorMessage: null } });

  try {
    // Fast mode uses a bounded HTTP capture rather than starting a headless
    // browser. This keeps the initial evidence pass predictable on serverless
    // runtimes and still reports access challenges honestly.
    const data = await fetchStaticPage(target);
    const primary = data;

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

    // Screenshots are supplemental evidence: a capture/storage failure must not fail an otherwise valid HTML audit.
    try {
      const captures = await captureAuditScreenshots(auditId, target.toString());
      for (const capture of captures) {
        const screenshotUrl = '/api/audits/' + auditId + '/screenshots/' + capture.viewport;
        await db.screenshot.create({
          data: {
            auditId,
            viewport: capture.viewport,
            kind: 'page_capture',
            storageUrl: capture.storageKey,
            mimeType: 'image/png',
          },
        });
        await db.pageSnapshot.create({
          data: { pageId: pageRecord.id, viewport: capture.viewport, screenshotUrl },
        });
      }
    } catch (error) {
      console.warn('pagefix_screenshot_capture_failed', {
        auditId,
        message: error instanceof Error ? error.message : 'SCREENSHOT_FAILED',
      });
    }

    const evidence = await db.evidence.createManyAndReturn({
      data: [
        { auditId, type: 'TEXT', source: 'http.html_text', location: 'retrieved_html_body', content: primary.bodyText.slice(0, 20000), confidence: 'HIGH' },
        { auditId, type: 'METADATA', source: 'document.metadata', location: 'head', content: JSON.stringify({ statusCode: primary.statusCode, title: primary.title, titleLength: primary.title.length, description: primary.description, descriptionLength: primary.description.length, canonical: primary.canonical, viewport: primary.viewport }), confidence: 'HIGH' },
        { auditId, type: 'DOM', source: 'http.html_elements', location: 'buttons_forms_and_headings', content: JSON.stringify({ buttons: primary.buttons, forms: primary.forms, headings: primary.headings, unlabeledLinks: primary.links.filter((link) => !link.text).length }), confidence: 'HIGH' },
        { auditId, type: 'STRUCTURED_DATA', source: 'jsonld', location: 'script[type="application/ld+json"]', content: JSON.stringify(primary.structuredData), confidence: primary.structuredData.length ? 'HIGH' : 'LOW' },
        { auditId, type: 'SYSTEM_DETECTED', source: 'http.image_inventory', location: 'images', content: JSON.stringify({ totalVisible: primary.images.length, imagesWithoutAlt: primary.images.filter((image) => !image.alt.trim()).length, images: primary.images }), confidence: 'HIGH' },
        { auditId, type: 'LINK', source: 'http.link_inventory', location: 'visible_links', content: JSON.stringify(primary.links), confidence: 'HIGH' },
      ],
    });

    const textEvidence = evidence.find((item) => item.type === 'TEXT');
    const domEvidence = evidence.find((item) => item.type === 'DOM');
    const metadataEvidence = evidence.find((item) => item.type === 'METADATA');
    const structuredEvidence = evidence.find((item) => item.type === 'STRUCTURED_DATA');
    const imageEvidence = evidence.find((item) => item.source === 'http.image_inventory');
    const linkEvidence = evidence.find((item) => item.type === 'LINK');
    if (!textEvidence || !domEvidence || !metadataEvidence || !structuredEvidence || !imageEvidence || !linkEvidence) {
      throw new Error('EVIDENCE_CREATION_FAILED');
    }

    const findings = [];
    // Detect access challenges so they are reported honestly rather than treated
    // as missing product content. PageFix does not bypass access controls.
    const challengeText = (primary.title + ' ' + primary.bodyText).toLowerCase();
    const accessChallenge = /verify you are human|checking your browser|enable javascript and cookies|attention required|access denied|captcha|unusual traffic|security challenge|just a moment\.\.\./i.test(challengeText);
    if (accessChallenge || (primary.statusCode !== null && (primary.statusCode >= 300 && primary.statusCode < 400 || [403, 429, 503].includes(primary.statusCode))) || (primary.statusCode === null && !primary.bodyText.trim())) {
      const finding = makeFinding('Product page content could not be verified by the audit crawler', 'MEDIUM',
        'The static HTML capture returned an automated-access challenge, an HTTP ' + (primary.statusCode ?? 'unknown') + ' response, or too little page content to verify the product. No product claims were inferred from this response.',
        'A blocked capture means PageFix cannot reliably inspect product details, purchase actions, shipping information, or trust signals in this run.',
        'Retry from a permitted browser session or provide a public page/export that allows automated inspection. PageFix will not attempt to bypass the site access controls.',
        'Can the audit crawler access the same product content a normal shopper sees?', textEvidence.id);
      await db.finding.create({ data: { auditId, title: finding.title, severity: finding.severity, confidence: finding.confidence, effort: finding.effort, priority: finding.priority, buyerQuestion: finding.buyerQuestion, observation: finding.observation, hypothesis: finding.hypothesis, whyItMatters: finding.whyItMatters, recommendation: finding.recommendation, implementationSteps: finding.implementationSteps, evidence: { create: finding.evidenceIds.map((evidenceId) => ({ evidenceId })) } } });
      const pageUrl = new URL(target);
      const category = /\/(products?|items?)\//i.test(pageUrl.pathname) ? 'Product' : 'Landing Page';
      await db.audit.update({ where: { id: auditId }, data: { status: 'COMPLETED', completedAt: new Date(), category } });
      return { auditId, findings: 1, pageId: pageRecord.id, accessLimited: true };
    }
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
      findings.push(makeFinding('No H1 heading detected in retrieved HTML', 'MEDIUM', 'No H1 element was detected in the retrieved HTML.', 'The page may not have a clear, programmatically identified primary heading.', 'Add a clear H1 that accurately describes the page topic or offer.', 'What is the main thing being presented here?', domEvidence.id));
    } else if (h1s.length > 1) {
      findings.push(makeFinding('Multiple visible H1 headings', 'LOW', `The rendered page contains ${h1s.length} visible H1 elements.`, 'Multiple H1 elements are valid in some HTML structures, but they can make the main page hierarchy harder to review.', 'Review the heading outline and ensure the primary page proposition is clear. Do not remove headings solely to meet an arbitrary count.', 'Which heading is the primary page proposition?', domEvidence.id));
    }
    const ctaLabels = primary.buttons.filter((button) => /add to cart|buy now|shop now|checkout|subscribe|start free|book now|request a quote|contact sales|place order|order now/i.test(button));
    if (!ctaLabels.length) {
      findings.push(makeFinding('No clearly labeled commercial action detected', 'MEDIUM', 'The button labels found in retrieved HTML did not match common purchase or lead-action labels.', 'A visitor may need to infer the next step if the main commercial action is not explicit. Custom labels and link-based actions may not be detected by this rule.', 'Review the primary action on the page and make its label specific to the next step, such as buying, booking, subscribing or requesting information.', 'What should I do next if I am interested?', domEvidence.id));
    }
    const missingAlt = primary.images.filter((image) => !image.alt.trim()).length;
    if (primary.images.length && missingAlt > 0) {
      findings.push(makeFinding('Image elements missing alternative text', missingAlt > 5 ? 'MEDIUM' : 'LOW', `${missingAlt} of ${primary.images.length} visible images have an empty alt attribute.`, 'Meaningful alternative text helps convey relevant image information to people using assistive technology. Decorative images should intentionally use empty alt text.', 'Review each image. Add concise, useful alt text for informative images and retain empty alt text for decorative images.', 'Can someone using a screen reader understand the important visual information?', imageEvidence.id));
    }
    const unlabeledLinks = primary.links.filter((link) => !link.text.trim()).length;
    if (unlabeledLinks > 0) {
      findings.push(makeFinding('Link elements without an accessible text label', unlabeledLinks > 5 ? 'MEDIUM' : 'LOW', `${unlabeledLinks} visible links had no text, aria-label or title available to the extractor.`, 'Unlabeled links can make navigation unclear for assistive technology and for users scanning the page.', 'Give each meaningful link an accessible name. If an icon-only link is intentional, provide a suitable aria-label.', 'Can the purpose of each link be understood without seeing its icon?', linkEvidence.id));
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
      findings.push(makeFinding('No visible images detected', 'LOW', 'No image elements were detected in the retrieved HTML.', 'For visually evaluated offers, missing imagery may leave buyers with less context. CSS backgrounds and lazy-loaded content may not be detected.', 'Confirm whether the offer needs product or contextual imagery. If so, provide relevant images and ensure the primary visual is visible.', 'What will I receive or experience?', imageEvidence.id));
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

    // Phase 2: category-aware core revenue-leak checks. Findings only describe
    // what this captured public page did or did not expose; they do not infer analytics.
    findings.push(...buildCoreRevenueFindings({
      url: target.toString(),
      title: primary.title,
      bodyText: primary.bodyText,
      headings: primary.headings,
      buttons: primary.buttons,
      links: primary.links,
      forms: primary.forms,
      textEvidenceId: textEvidence.id,
      domEvidenceId: domEvidence.id,
      linkEvidenceId: linkEvidence.id,
      metadataEvidenceId: metadataEvidence.id,
      imageEvidenceId: imageEvidence.id,
      metaDescription: primary.description,
      viewportMeta: primary.viewport,
      imageCount: primary.images.length,
      imagesWithoutAlt: primary.images.filter((image) => !image.alt.trim()).length,
    }));

    // Category-aware buyer-decision checks and conservative contradiction
    // hypotheses extend the deterministic audit without inventing analytics.
    findings.push(...buildCommerceIntelligenceFindings({
      url: target.toString(),
      title: primary.title,
      bodyText: primary.bodyText,
      headings: primary.headings,
      buttons: primary.buttons,
      evidenceId: textEvidence.id,
    }));

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
  }
}
