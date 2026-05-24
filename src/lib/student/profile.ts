import { auth } from "@clerk/nextjs/server";

import type { StudentProfile } from "@/generated/prisma/client";
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

async function claimStagedStudentImport(user: {
  email: string;
  firstName: string | null;
  id: string;
  lastName: string | null;
  studentProfile: StudentProfile | null;
}) {
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

  await prisma.$transaction(async (tx) => {
    if (!user.firstName || !user.lastName) {
      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          firstName: user.firstName || staged.firstName,
          lastName: user.lastName || staged.lastName,
        },
      });
    }

    if (user.studentProfile) {
      await tx.studentProfile.update({
        where: {
          userId: user.id,
        },
        data: {
          availability: useImportedArray(
            user.studentProfile.availability,
            staged.availability,
          ),
          careerGoals: useImportedString(
            user.studentProfile.careerGoals,
            staged.careerGoals,
          ),
          city: useImportedString(user.studentProfile.city, staged.city),
          country: useImportedString(
            user.studentProfile.country,
            staged.country,
          ),
          experienceLevel: useImportedString(
            user.studentProfile.experienceLevel,
            staged.experienceLevel,
          ),
          gradeYear: useImportedString(
            user.studentProfile.gradeYear,
            staged.gradeYear,
          ),
          graduationYear:
            user.studentProfile.graduationYear ?? staged.graduationYear,
          interestedSpecialties: useImportedArray(
            user.studentProfile.interestedSpecialties,
            staged.interestedSpecialties,
          ),
          languages: useImportedArray(
            user.studentProfile.languages,
            staged.languages,
          ),
          locationPreference: useImportedString(
            user.studentProfile.locationPreference,
            staged.locationPreference,
          ),
          major: useImportedString(user.studentProfile.major, staged.major),
          opportunityTypes: useImportedArray(
            user.studentProfile.opportunityTypes,
            staged.opportunityTypes,
          ),
          remotePreference: useImportedString(
            user.studentProfile.remotePreference,
            staged.remotePreference,
          ),
          school: useImportedString(user.studentProfile.school, staged.school),
          state: useImportedString(user.studentProfile.state, staged.state),
        },
      });
    } else {
      await tx.studentProfile.create({
        data: {
          availability: staged.availability,
          careerGoals: staged.careerGoals,
          city: staged.city,
          country: staged.country,
          experienceLevel: staged.experienceLevel,
          gradeYear: staged.gradeYear,
          graduationYear: staged.graduationYear,
          interestedSpecialties: staged.interestedSpecialties,
          languages: staged.languages,
          locationPreference: staged.locationPreference,
          major: staged.major,
          opportunityTypes: staged.opportunityTypes,
          remotePreference: staged.remotePreference,
          school: staged.school,
          state: staged.state,
          userId: user.id,
        },
      });
    }

    await tx.studentImportRecord.update({
      where: {
        id: staged.id,
      },
      data: {
        claimedAt: new Date(),
        claimedById: user.id,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "STUDENT_IMPORT_RECORD_CLAIMED",
        actorId: user.id,
        entityId: staged.id,
        entityType: "StudentImportRecord",
        metadata: {
          normalizedEmail,
        },
      },
    });
  });

  return prisma.user.findUniqueOrThrow({
    where: {
      id: user.id,
    },
    include: {
      studentProfile: true,
    },
  });
}

export async function getOrCreateCurrentStudentUser(clerkUserId: string) {
  const { sessionClaims } = await auth();
  const role = getRoleFromSessionClaims(sessionClaims);

  await syncCurrentUserFromClerk({
    clerkUserId,
    role,
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      clerkUserId,
    },
    include: {
      studentProfile: true,
    },
  });

  return role === "STUDENT" ? claimStagedStudentImport(user) : user;
}

export async function getCurrentStudentProfile(clerkUserId: string) {
  return getOrCreateCurrentStudentUser(clerkUserId);
}
