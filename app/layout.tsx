import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./product-upgrade.css";
import "./impact-upgrade.css";
import "./store-intelligence.css";
import "./premium-refresh.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

const siteUrl = process.env.APP_URL || "https://pagefixai.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PageFix AI — Evidence-led website diagnostics",
    template: "%s | PageFix AI",
  },
  description: "Inspect public product pages and landing pages, find evidence-backed website issues, prioritize practical fixes and verify changes.",
  applicationName: "PageFix AI",
  category: "technology",
  openGraph: {
    type: "website",
    siteName: "PageFix AI",
    title: "PageFix AI — Find what's breaking the customer journey",
    description: "Evidence-led website diagnostics with practical, verifiable fixes.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "PageFix AI — Evidence-led website diagnostics",
    description: "Inspect public pages, understand observable friction and prioritize practical fixes.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={plusJakarta.variable}>{children}</body>
    </html>
  );
}
