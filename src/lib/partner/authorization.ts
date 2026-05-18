import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getAppRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";

export async function assertPartnerAccess() {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  if (getAppRole(sessionClaims?.metadata?.role) !== "PARTNER") {
    redirect("/dashboard");
  }

  return {
    userId,
  };
}

export async function getOrCreateCurrentPartnerUser(clerkUserId: string) {
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
      role: "PARTNER",
    },
    create: {
      clerkUserId,
      email,
      firstName: clerkUser?.firstName ?? null,
      lastName: clerkUser?.lastName ?? null,
      role: "PARTNER",
    },
  });
}
