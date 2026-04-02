import type { MetadataRoute } from "next";

const frontendUrl = process.env.FRONTEND_URL;
const siteUrl =
  frontendUrl && frontendUrl.startsWith("http")
    ? frontendUrl
    : "http://localhost:3000";
const normalizedSiteUrl = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/impressum", "/datenschutz"],
      disallow: ["/admin/", "/student/", "/auth/", "/api/"],
    },
    sitemap: `${normalizedSiteUrl}/sitemap.xml`,
    host: normalizedSiteUrl,
  };
}
