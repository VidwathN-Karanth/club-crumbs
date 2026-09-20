import type { MetadataRoute } from "next";

const BASE = "https://club-crumbs.vercel.app";

// Let crawlers into the marketing/landing pages; keep the auth-gated app and
// API out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/dashboard/", "/leader/", "/onboarding/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
