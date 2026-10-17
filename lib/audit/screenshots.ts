import chromium from '@sparticuz/chromium';
import { chromium as playwrightChromium, type Browser } from 'playwright-core';
import { validateAuditUrl } from '@/lib/audit/ssrf';
import { isScreenshotStorageConfigured, storeAuditScreenshot } from '@/lib/storage/object-store';

export type ViewportAuditSignals = {
  viewport: 'desktop' | 'mobile';
  viewportWidth: number;
  documentWidth: number;
  horizontalOverflow: boolean;
  primaryHeadingVisible: boolean;
  commercialActionVisible: boolean;
  visibleTextLength: number;
};

export type StoredAuditScreenshot = {
  viewport: 'desktop' | 'mobile';
  storageKey: string;
  signals: ViewportAuditSignals;
};

const CAPTURES = [
  { viewport: 'desktop' as const, width: 1440, height: 1000 },
  { viewport: 'mobile' as const, width: 390, height: 844 },
];

export async function captureAuditScreenshots(auditId: string, rawUrl: string): Promise<StoredAuditScreenshot[]> {
  // The storage adapter supports either private object storage or a database-backed
  // data-URI fallback. Do not fabricate records: only persist captures returned
  // by a successful browser screenshot and storage write.
  if (!isScreenshotStorageConfigured()) return [];

  const validatedHosts = new Map<string, number>();
  const target = await validateAuditUrl(rawUrl, validatedHosts);
  let browser: Browser | null = null;
  const stored: StoredAuditScreenshot[] = [];
  // Screenshots are supplemental. A hostile/slow page or constrained serverless
  // browser must never hold the core audit open indefinitely.
  const hardStop = setTimeout(() => { void browser?.close().catch(() => undefined); }, 12_000);
  hardStop.unref?.();

  try {
    browser = await playwrightChromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      timeout: 7_000,
    });

    for (const capture of CAPTURES) {
      let page: Awaited<ReturnType<Browser['newPage']>> | null = null;
      try {
        page = await browser.newPage({
          viewport: { width: capture.width, height: capture.height },
          deviceScaleFactor: 1,
          isMobile: capture.viewport === 'mobile',
          hasTouch: capture.viewport === 'mobile',
        });

        // A public URL can redirect or request private network resources. Apply
        // the same URL validation to every browser request, not only the first URL.
        await page.route('**/*', async route => {
          const requestUrl = route.request().url();
          if (!/^https?:/i.test(requestUrl)) {
            await route.continue();
            return;
          }
          try {
            await validateAuditUrl(requestUrl, validatedHosts);
            await route.continue();
          } catch {
            await route.abort('blockedbyclient');
          }
        });

        await page.goto(target.toString(), { waitUntil: 'domcontentloaded', timeout: 3_500 });
        await page.waitForTimeout(100);
        const signals = await page.evaluate(() => {
          const viewportWidth = window.innerWidth;
          const documentWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0);
          const isVisibleInViewport = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
              style.visibility !== 'hidden' && Number(style.opacity || '1') > 0 &&
              rect.bottom > 0 && rect.top < window.innerHeight &&
              rect.right > 0 && rect.left < window.innerWidth;
          };
          const primaryHeadingVisible = Array.from(document.querySelectorAll('h1')).some(isVisibleInViewport);
          const actionPattern = /add to cart|buy now|shop now|checkout|subscribe|start free|book now|request a quote|contact sales|place order|order now|sign up|get started|download now|purchase|try (?:it )?free|schedule a demo/i;
          const commercialActionVisible = Array.from(document.querySelectorAll('a,button,input[type="submit"],input[type="button"]')).some((element) => {
            const label = [
              element.textContent ?? '',
              element.getAttribute('aria-label') ?? '',
              element.getAttribute('title') ?? '',
              element instanceof HTMLInputElement ? element.value : '',
            ].join(' ').trim();
            return actionPattern.test(label) && isVisibleInViewport(element);
          });
          const visibleTextLength = Array.from(document.querySelectorAll('h1,h2,h3,p,button,a,[role="button"]'))
            .filter(isVisibleInViewport)
            .reduce((total, element) => total + (element.textContent ?? '').trim().length, 0);
          return {
            viewportWidth,
            documentWidth,
            horizontalOverflow: documentWidth > viewportWidth + 2,
            primaryHeadingVisible,
            commercialActionVisible,
            visibleTextLength,
          };
        });
        const bytes = await page.screenshot({
          type: 'png',
          fullPage: false,
          animations: 'disabled',
          timeout: 2_500,
        });
        const storageKey = await storeAuditScreenshot(auditId, capture.viewport, Buffer.from(bytes));
        if (storageKey) stored.push({ viewport: capture.viewport, storageKey, signals: { viewport: capture.viewport, ...signals } });
      } catch (error) {
        console.warn('pagefix_screenshot_viewport_failed', {
          auditId,
          viewport: capture.viewport,
          message: error instanceof Error ? error.message : 'SCREENSHOT_FAILED',
        });
      } finally {
        await page?.close().catch(() => undefined);
      }
    }
  } finally {
    clearTimeout(hardStop);
    await browser?.close().catch(() => undefined);
  }

  return stored;
}
