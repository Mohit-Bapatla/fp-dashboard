import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db/prisma";

export async function getOrCreateCurrentStudentUser(clerkUserId: string) {
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
    },
    create: {
      clerkUserId,
      email,
      firstName: clerkUser?.firstName ?? null,
      lastName: clerkUser?.lastName ?? null,
      role: "STUDENT",
    },
    include: {
      studentProfile: true,
    },
  });
}

export async function getCurrentStudentProfile(clerkUserId: string) {
  return getOrCreateCurrentStudentUser(clerkUserId);
}
