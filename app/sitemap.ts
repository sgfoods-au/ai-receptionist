import type { MetadataRoute } from "next";

const siteUrl = process.env.APP_BASE_URL || "https://ai-receptionist-3fm9.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/signup`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/login`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
