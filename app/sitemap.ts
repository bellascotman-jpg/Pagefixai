import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.APP_URL || "https://pagefixai.vercel.app";
  const now = new Date();
  return [
    { url: new URL("/", baseUrl).toString(), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: new URL("/pricing", baseUrl).toString(), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
