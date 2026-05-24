import "server-only";

import { prisma } from "@/lib/db/prisma";

export type ApplicationOnboardingItemInput = {
  description?: string | null;
  required?: boolean;
  title: string;
};

export async function ensureApplicationOnboardingItems(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: {
      id: applicationId,
    },
    select: {
      id: true,
      opportunity: {
        select: {
          requiredDocuments: true,
        },
      },
      resumeId: true,
      status: true,
    },
  });

  if (!application || application.status !== "ACCEPTED") {
    return 0;
  }

  const defaultItems: ApplicationOnboardingItemInput[] = [
    {
      description: application.resumeId
        ? "Confirm the accepted application has the correct resume attached."
        : "Attach or confirm a resume for this accepted application.",
      title: "Resume confirmation",
    },
    ...application.opportunity.requiredDocuments.map((documentTitle) => ({
      description:
        "Track this opportunity requirement as status metadata only. Do not upload sensitive documents here.",
      title: documentTitle,
    })),
  ];

  const uniqueItems = Array.from(
    new Map(
      defaultItems
        .map((item) => ({
          ...item,
          title: item.title.trim(),
        }))
        .filter((item) => item.title)
        .map((item) => [item.title.toLowerCase(), item]),
    ).values(),
  );

  if (uniqueItems.length === 0) {
    return 0;
  }

  const result = await prisma.applicationOnboardingItem.createMany({
    data: uniqueItems.map((item) => ({
      applicationId: application.id,
      description: item.description ?? null,
      required: item.required ?? true,
      title: item.title,
    })),
    skipDuplicates: true,
  });

  return result.count;
}
