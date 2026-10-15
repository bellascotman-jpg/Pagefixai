import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || "https://pagefixai.vercel.app";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/founder", "/auth"] },
    ],
    sitemap: new URL("/sitemap.xml", baseUrl).toString(),
  };
}
