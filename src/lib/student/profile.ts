import { auth } from "@clerk/nextjs/server";

import type { Prisma } from "@/generated/prisma/client";
import {
  acquireAccountTransitionLock,
  getStudentAccountTransitionBlockReason,
} from "@/lib/auth/account-transition";
import { getRoleFromSessionClaims } from "@/lib/auth/roles";
import { syncCurrentUserFromClerk } from "@/lib/auth/user-sync";
import { prisma } from "@/lib/db/prisma";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function useImportedString(
  currentValue: string | null,
  importedValue: string | null,
) {
  return currentValue || importedValue || null;
}

function useImportedArray<T>(currentValue: T[], importedValue: T[]) {
  return currentValue.length > 0 ? currentValue : importedValue;
}

const currentStudentUserInclude = {
  partnerMemberships: true,
  studentProfile: true,
} as const;

type CurrentStudentUser = Prisma.UserGetPayload<{
  include: typeof currentStudentUserInclude;
}>;

async function claimStagedStudentImport(
  clerkUserId: string,
  user: CurrentStudentUser,
) {
  if (
    getStudentAccountTransitionBlockReason({
      databaseRole: user.role,
      hasPartnerMembership: user.partnerMemberships.length > 0,
    })
  ) {
    return user;
  }

  const normalizedEmail = normalizeEmail(user.email);
  const staged = await prisma.studentImportRecord.findFirst({
    where: {
      claimedAt: null,
      normalizedEmail,
    },
  });

  if (!staged) {
    return user;
  }

  return prisma.$transaction(async (tx) => {
    await acquireAccountTransitionLock(tx, clerkUserId);

    const currentUser = await tx.user.findUniqueOrThrow({
      where: { id: user.id },
      include: currentStudentUserInclude,
    });
    const blockReason = getStudentAccountTransitionBlockReason({
      databaseRole: currentUser.role,
      hasPartnerMembership: currentUser.partnerMemberships.length > 0,
    });

    if (blockReason) {
      return currentUser;
    }

    const currentStaged = await tx.studentImportRecord.findFirst({
      where: {
        claimedAt: null,
        normalizedEmail,
      },
    });

    if (!currentStaged) {
      return currentUser;
    }

    if (!currentUser.firstName || !currentUser.lastName) {
      await tx.user.update({
        where: {
          id: currentUser.id,
        },
        data: {
          firstName: currentUser.firstName || currentStaged.firstName,
          lastName: currentUser.lastName || currentStaged.lastName,
        },
      });
    }

    if (currentUser.studentProfile) {
      await tx.studentProfile.update({
        where: {
          userId: currentUser.id,
        },
        data: {
          availability: useImportedArray(
            currentUser.studentProfile.availability,
            currentStaged.availability,
          ),
          careerGoals: useImportedString(
            currentUser.studentProfile.careerGoals,
            currentStaged.careerGoals,
          ),
          city: useImportedString(
            currentUser.studentProfile.city,
            currentStaged.city,
          ),
          country: useImportedString(
            currentUser.studentProfile.country,
            currentStaged.country,
          ),
          experienceLevel: useImportedString(
            currentUser.studentProfile.experienceLevel,
            currentStaged.experienceLevel,
          ),
          gradeYear: useImportedString(
            currentUser.studentProfile.gradeYear,
            currentStaged.gradeYear,
          ),
          graduationYear:
            currentUser.studentProfile.graduationYear ??
            currentStaged.graduationYear,
          interestedSpecialties: useImportedArray(
            currentUser.studentProfile.interestedSpecialties,
            currentStaged.interestedSpecialties,
          ),
          languages: useImportedArray(
            currentUser.studentProfile.languages,
            currentStaged.languages,
          ),
          locationPreference: useImportedString(
            currentUser.studentProfile.locationPreference,
            currentStaged.locationPreference,
          ),
          major: useImportedString(
            currentUser.studentProfile.major,
            currentStaged.major,
          ),
          opportunityTypes: useImportedArray(
            currentUser.studentProfile.opportunityTypes,
            currentStaged.opportunityTypes,
          ),
          remotePreference: useImportedString(
            currentUser.studentProfile.remotePreference,
            currentStaged.remotePreference,
          ),
          school: useImportedString(
            currentUser.studentProfile.school,
            currentStaged.school,
          ),
          state: useImportedString(
            currentUser.studentProfile.state,
            currentStaged.state,
          ),
        },
      });
    } else {
      await tx.studentProfile.create({
        data: {
          availability: currentStaged.availability,
          careerGoals: currentStaged.careerGoals,
          city: currentStaged.city,
          country: currentStaged.country,
          experienceLevel: currentStaged.experienceLevel,
          gradeYear: currentStaged.gradeYear,
          graduationYear: currentStaged.graduationYear,
          interestedSpecialties: currentStaged.interestedSpecialties,
          languages: currentStaged.languages,
          locationPreference: currentStaged.locationPreference,
          major: currentStaged.major,
          opportunityTypes: currentStaged.opportunityTypes,
          remotePreference: currentStaged.remotePreference,
          school: currentStaged.school,
          state: currentStaged.state,
          userId: currentUser.id,
        },
      });
    }

    await tx.studentImportRecord.update({
      where: {
        id: currentStaged.id,
      },
      data: {
        claimedAt: new Date(),
        claimedById: currentUser.id,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "STUDENT_IMPORT_RECORD_CLAIMED",
        actorId: currentUser.id,
        entityId: currentStaged.id,
        entityType: "StudentImportRecord",
        metadata: {
          normalizedEmail,
        },
      },
    });

    return tx.user.findUniqueOrThrow({
      where: {
        id: currentUser.id,
      },
      include: currentStudentUserInclude,
    });
  });
}

export async function getOrCreateCurrentStudentUser(clerkUserId: string) {
  const { sessionClaims } = await auth();
  const role = getRoleFromSessionClaims(sessionClaims);

  const syncedUser = await syncCurrentUserFromClerk({
    clerkUserId,
    preserveExistingRole: true,
    role,
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: syncedUser.id,
    },
    include: currentStudentUserInclude,
  });

  return role === "STUDENT"
    ? claimStagedStudentImport(clerkUserId, user)
    : user;
}

export async function getCurrentStudentProfile(clerkUserId: string) {
  return getOrCreateCurrentStudentUser(clerkUserId);
}
