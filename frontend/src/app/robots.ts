import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/search",
        "/login",
        "/register",
        "/verify-email",
        "/forgot-password",
        "/reset-password",
        "/profile",
        "/dashboard",
        "/bookmarks",
        "/progress",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: new URL(siteConfig.url).host,
  };
}
