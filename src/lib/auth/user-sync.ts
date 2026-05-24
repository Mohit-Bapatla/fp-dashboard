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
  const existingUser = await prisma.user.findUnique({
    where: {
      clerkUserId,
    },
    select: {
      firstName: true,
      lastName: true,
    },
  });

  if (existingUser) {
    return prisma.user.update({
      where: {
        clerkUserId,
      },
      data: {
        email,
        firstName: existingUser.firstName
          ? undefined
          : (clerkUser?.firstName ?? undefined),
        lastName: existingUser.lastName
          ? undefined
          : (clerkUser?.lastName ?? undefined),
        role,
      },
    });
  }

  return prisma.user.create({
    data: {
      clerkUserId,
      email,
      firstName: clerkUser?.firstName ?? null,
      lastName: clerkUser?.lastName ?? null,
      role,
    },
  });
}
