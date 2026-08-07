import type { MetadataRoute } from "next";

const siteUrl = process.env.APP_BASE_URL || "https://ai-receptionist-3fm9.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/onboard", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
