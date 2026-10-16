import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

type MockRoute = {
  request: () => { url: () => string };
  continue: () => Promise<void>;
  abort: (errorCode?: string) => Promise<void>;
};

type MockPage = {
  goto: ReturnType<typeof vi.fn>;
  waitForTimeout: ReturnType<typeof vi.fn>;
  screenshot: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  route: ReturnType<typeof vi.fn>;
  routeHandler: null | ((route: MockRoute) => Promise<void>);
  viewport: { width: number; height: number };
};

const storage = vi.hoisted(() => ({
  configured: true,
  stored: [] as Array<{ auditId: string; viewport: string; bytes: Buffer }>,
}));

vi.mock('@/lib/storage/object-store', () => ({
  isScreenshotStorageConfigured: () => storage.configured,
  storeAuditScreenshot: async (auditId: string, viewport: string, bytes: Buffer) => {
    storage.stored.push({ auditId, viewport, bytes });
    return 'audits/' + auditId + '/' + viewport + '.png';
  },
}));

vi.mock('@/lib/audit/ssrf', () => ({
  validateAuditUrl: async (rawUrl: string) => new URL(rawUrl),
}));

const browserMock = vi.hoisted(() => ({
  launch: vi.fn(),
  executablePath: vi.fn(),
  args: ['--no-sandbox'],
  pages: [] as MockPage[],
}));

vi.mock('@sparticuz/chromium', () => ({
  default: { args: browserMock.args, executablePath: browserMock.executablePath },
}));

vi.mock('playwright-core', () => ({
  chromium: { launch: browserMock.launch },
}));

import { captureAuditScreenshots } from '@/lib/audit/screenshots';

describe('captureAuditScreenshots', () => {
  beforeEach(() => {
    storage.configured = true;
    storage.stored = [];
    browserMock.pages = [];
    browserMock.executablePath.mockResolvedValue('/tmp/chromium');
    browserMock.launch.mockResolvedValue({
      newPage: vi.fn(async ({ viewport }: { viewport: { width: number; height: number } }) => {
        const page = {
          goto: vi.fn(async () => undefined),
          waitForTimeout: vi.fn(async () => undefined),
          screenshot: vi.fn(async () => Buffer.from('png-bytes')),
          close: vi.fn(async () => undefined),
          route: vi.fn(),
          routeHandler: null as MockPage['routeHandler'],
          viewport,
        } satisfies Omit<MockPage, 'route'> & { route: ReturnType<typeof vi.fn> };
        page.route = vi.fn(async (_pattern: string, handler: (route: MockRoute) => Promise<void>) => {
          page.routeHandler = handler;
        });
        browserMock.pages.push(page);
        return page;
      }),
      close: vi.fn(async () => undefined),
    });
  });

  afterEach(() => vi.clearAllMocks());

  it('stores desktop and mobile captures when storage is configured', async () => {
    const result = await captureAuditScreenshots('audit-1', 'https://example.com/product');
    expect(result.map(item => item.viewport)).toEqual(['desktop', 'mobile']);
    expect(storage.stored).toHaveLength(2);
    expect(storage.stored.every(item => item.bytes.length > 0)).toBe(true);
  });

  it('does not launch a browser or claim screenshots when storage is not configured', async () => {
    storage.configured = false;
    expect(await captureAuditScreenshots('audit-2', 'https://example.com')).toEqual([]);
    expect(browserMock.launch).not.toHaveBeenCalled();
    expect(storage.stored).toHaveLength(0);
  });

  it('validates browser requests before allowing network access', async () => {
    await captureAuditScreenshots('audit-3', 'https://example.com');
    const page = browserMock.pages[0];
    const continueRequest = vi.fn(async () => undefined);
    const abortRequest = vi.fn(async () => undefined);
    await page.routeHandler?.({
      request: () => ({ url: () => 'http://127.0.0.1/admin' }),
      continue: continueRequest,
      abort: abortRequest,
    });
    expect(abortRequest).toHaveBeenCalledWith('blockedbyclient');
    expect(continueRequest).not.toHaveBeenCalled();
  });
});
