import type { MetadataRoute } from "next";

const frontendUrl = process.env.FRONTEND_URL;
const siteUrl =
  frontendUrl && frontendUrl.startsWith("http")
    ? frontendUrl
    : "http://localhost:3000";
const normalizedSiteUrl = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${normalizedSiteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${normalizedSiteUrl}/login`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
