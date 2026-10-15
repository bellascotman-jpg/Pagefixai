import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep the browser runtime outside the webpack bundle and include its compressed
  // Chromium/font assets in the serverless functions that execute audits.
  serverExternalPackages: ['@sparticuz/chromium', 'playwright-core'],
  outputFileTracingIncludes: {
    '/api/audits': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/internal/jobs/audit': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    ] }];
  },
};
export default nextConfig;
