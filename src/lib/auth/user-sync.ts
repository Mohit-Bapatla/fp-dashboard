import "server-only";

import { currentUser } from "@clerk/nextjs/server";

import type { AppRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";

export async function syncCurrentUserFromClerk({
  clerkUserId,
  role,
}: {
  clerkUserId: string;
  role: AppRole;
}) {
  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses.at(0)?.emailAddress ??
    `${clerkUserId}@example.invalid`;

  return prisma.user.upsert({
    where: {
      clerkUserId,
    },
    update: {
      email,
      firstName: clerkUser?.firstName ?? undefined,
      lastName: clerkUser?.lastName ?? undefined,
      role,
    },
    create: {
      clerkUserId,
      email,
      firstName: clerkUser?.firstName ?? null,
      lastName: clerkUser?.lastName ?? null,
      role,
    },
  });
}
