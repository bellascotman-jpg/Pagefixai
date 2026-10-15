import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.APP_URL || "https://pagefixai.vercel.app";
  const now = new Date();
  return [
    { url: new URL("/", baseUrl).toString(), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: new URL("/pricing", baseUrl).toString(), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: new URL("/privacy", baseUrl).toString(), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: new URL("/security", baseUrl).toString(), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: new URL("/compare", baseUrl).toString(), lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: new URL("/resources", baseUrl).toString(), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: new URL("/resources/how-to-audit-product-pages", baseUrl).toString(), lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: new URL("/resources/pagefix-vs-seo-audit-tools", baseUrl).toString(), lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: new URL("/resources/evidence-led-conversion-optimization", baseUrl).toString(), lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: new URL("/methodology", baseUrl).toString(), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: new URL("/partners/affiliate", baseUrl).toString(), lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: new URL("/referrals", baseUrl).toString(), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
