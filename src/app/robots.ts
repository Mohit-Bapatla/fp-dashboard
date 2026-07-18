import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/dashboard/",
        "/sign-in",
        "/sign-in/",
        "/sign-up",
        "/sign-up/",
        "/api",
        "/api/",
        "/data-deletion",
        "/data-deletion/",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
