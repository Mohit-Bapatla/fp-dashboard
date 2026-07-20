import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db/prisma";
import { studentDirectoryOpportunityWhere } from "@/lib/opportunities/student-visibility";
import { siteConfig } from "@/lib/site-config";

const publicRoutes = [
  "",
  "/opportunities",
  "/students",
  "/partners",
  "/events",
  "/events/global-healthcare-seminar-2025",
  "/chapters",
  "/about",
  "/impact",
  "/support",
  "/faq",
  "/contact",
  "/accessibility",
  "/data-deletion",
  "/privacy",
  "/terms",
] as const;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = publicRoutes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    changeFrequency: route === "/opportunities" ? "daily" : "monthly",
    priority: route === "" ? 1 : route === "/opportunities" ? 0.9 : 0.7,
  }));

  try {
    const opportunities = await prisma.opportunity.findMany({
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
      select: {
        id: true,
        lastVerifiedAt: true,
        publishedAt: true,
      },
      where: studentDirectoryOpportunityWhere(),
    });

    return [
      ...staticEntries,
      ...opportunities.map((opportunity) => ({
        url: `${siteConfig.url}/opportunities/${opportunity.id}`,
        lastModified:
          opportunity.lastVerifiedAt ?? opportunity.publishedAt ?? undefined,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // Builds and crawlers should still receive the static route map if the
    // database is temporarily unavailable.
    return staticEntries;
  }
}
