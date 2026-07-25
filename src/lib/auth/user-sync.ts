import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@/generated/prisma/client";

import type { AppRole } from "@/lib/auth/roles";
import { getVerifiedClerkEmailAddress } from "@/lib/auth/clerk-email";
import { prisma } from "@/lib/db/prisma";

const syncedUserSelect = {
  clerkUserId: true,
  firstName: true,
  id: true,
  lastName: true,
} as const;

type SyncedUser = {
  clerkUserId: string;
  firstName: string | null;
  id: string;
  lastName: string | null;
};

async function findExistingUser(
  clerkUserId: string,
  verifiedEmail: string | null,
) {
  const clerkMatch = await prisma.user.findUnique({
    where: { clerkUserId },
    select: syncedUserSelect,
  });

  if (clerkMatch || !verifiedEmail) {
    return clerkMatch;
  }

  return prisma.user.findUnique({
    where: { email: verifiedEmail },
    select: syncedUserSelect,
  });
}

function updateExistingUser({
  clerkUser,
  clerkUserId,
  existingUser,
  preserveExistingRole,
  role,
  verifiedEmail,
}: {
  clerkUser: Awaited<ReturnType<typeof currentUser>>;
  clerkUserId: string;
  existingUser: SyncedUser;
  preserveExistingRole: boolean;
  role: AppRole;
  verifiedEmail: string | null;
}) {
  return prisma.user.update({
    where: { id: existingUser.id },
    data: {
      clerkUserId:
        existingUser.clerkUserId === clerkUserId ? undefined : clerkUserId,
      email: verifiedEmail ?? undefined,
      firstName: existingUser.firstName
        ? undefined
        : (clerkUser?.firstName ?? undefined),
      lastName: existingUser.lastName
        ? undefined
        : (clerkUser?.lastName ?? undefined),
      // Transition flows opt out because their session claim can lag the
      // role established under the shared account-transition lock.
      role: preserveExistingRole ? undefined : role,
    },
  });
}

export async function syncCurrentUserFromClerk({
  clerkUserId,
  preserveExistingRole = false,
  role,
}: {
  clerkUserId: string;
  preserveExistingRole?: boolean;
  role: AppRole;
}) {
  const clerkUser = await currentUser();
  const verifiedEmail = getVerifiedClerkEmailAddress(clerkUser);
  const existingUser = await findExistingUser(clerkUserId, verifiedEmail);

  if (existingUser) {
    return updateExistingUser({
      clerkUser,
      clerkUserId,
      existingUser,
      preserveExistingRole,
      role,
      verifiedEmail,
    });
  }

  try {
    return await prisma.user.create({
      data: {
        clerkUserId,
        email: verifiedEmail ?? `${clerkUserId}@example.invalid`,
        firstName: clerkUser?.firstName ?? null,
        lastName: clerkUser?.lastName ?? null,
        role,
      },
    });
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }

    // Two server components can perform their first sync concurrently. If
    // either request created or linked the identity, reuse that row instead
    // of surfacing a unique-constraint failure through the dashboard boundary.
    const racedUser = await findExistingUser(clerkUserId, verifiedEmail);

    if (!racedUser) {
      throw error;
    }

    return updateExistingUser({
      clerkUser,
      clerkUserId,
      existingUser: racedUser,
      preserveExistingRole,
      role,
      verifiedEmail,
    });
  }
}
