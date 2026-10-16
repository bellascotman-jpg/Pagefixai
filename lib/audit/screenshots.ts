import chromium from '@sparticuz/chromium';
import { chromium as playwrightChromium, type Browser } from 'playwright-core';
import { validateAuditUrl } from '@/lib/audit/ssrf';
import { isScreenshotStorageConfigured, storeAuditScreenshot } from '@/lib/storage/object-store';

export type StoredAuditScreenshot = {
  viewport: 'desktop' | 'mobile';
  storageKey: string;
};

const CAPTURES = [
  { viewport: 'desktop' as const, width: 1440, height: 1000 },
  { viewport: 'mobile' as const, width: 390, height: 844 },
];

export async function captureAuditScreenshots(auditId: string, rawUrl: string): Promise<StoredAuditScreenshot[]> {
  // Without private object storage configured, do not create fake screenshot
  // records or spend serverless time launching a browser whose bytes cannot persist.
  if (!isScreenshotStorageConfigured()) return [];

  const validatedHosts = new Map<string, number>();
  const target = await validateAuditUrl(rawUrl, validatedHosts);
  let browser: Browser | null = null;
  const stored: StoredAuditScreenshot[] = [];

  try {
    browser = await playwrightChromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
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

        await page.goto(target.toString(), { waitUntil: 'domcontentloaded', timeout: 12_000 });
        await page.waitForTimeout(450);
        const bytes = await page.screenshot({
          type: 'png',
          fullPage: false,
          animations: 'disabled',
          timeout: 8_000,
        });
        const storageKey = await storeAuditScreenshot(auditId, capture.viewport, Buffer.from(bytes));
        if (storageKey) stored.push({ viewport: capture.viewport, storageKey });
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
    await browser?.close().catch(() => undefined);
  }

  return stored;
}
