"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  acquireAccountTransitionLock,
  getStudentAccountTransitionBlockReason,
  studentAccountTransitionBlockMessage,
} from "@/lib/auth/account-transition";
import { getRoleFromSessionClaims } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";
import { safeInternalPath } from "@/lib/security/safe-url";
import type { StudentOnboardingActionState } from "@/lib/student/onboarding-state";
import { getOrCreateCurrentStudentUser } from "@/lib/student/profile";
import { validateStudentProfileForm } from "@/lib/student/profile-validation";

export async function saveStudentProfile(
  _previousState: StudentOnboardingActionState,
  formData: FormData,
): Promise<StudentOnboardingActionState> {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  if (getRoleFromSessionClaims(sessionClaims) !== "STUDENT") {
    redirect("/dashboard");
  }

  const user = await getOrCreateCurrentStudentUser(userId);
  const validation = validateStudentProfileForm(formData, {
    requireMinimumAgeAffirmation: !user.studentProfile,
  });

  if (!validation.success) {
    return {
      fieldErrors: validation.errors,
      formError: "Please fix the highlighted fields.",
      values: validation.values,
    };
  }

  const rateLimit = await enforceRateLimit({
    action: "student_profile_update",
    identifier: `user:${user.id}`,
    limit: 60,
    windowSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      fieldErrors: {},
      formError: formatRateLimitMessage(rateLimit),
      values: validation.values,
    };
  }

  const transition = await prisma.$transaction(async (transaction) => {
    await acquireAccountTransitionLock(transaction, userId);

    const account = await transaction.user.findUnique({
      where: { id: user.id },
      select: {
        partnerMemberships: { select: { id: true }, take: 1 },
        role: true,
        studentProfile: { select: { id: true } },
      },
    });

    if (!account) {
      return { blockReason: "NON_STUDENT_ROLE" as const };
    }

    const blockReason = getStudentAccountTransitionBlockReason({
      databaseRole: account.role,
      hasPartnerMembership: account.partnerMemberships.length > 0,
    });

    if (blockReason) {
      return { blockReason };
    }

    await transaction.user.update({
      where: {
        id: user.id,
      },
      data: {
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
      },
    });

    const studentProfile = await transaction.studentProfile.upsert({
      where: {
        userId: user.id,
      },
      update: {
        school: validation.data.school,
        gradeYear: validation.data.gradeYear,
        city: validation.data.city,
        state: validation.data.state,
        country: validation.data.country,
        locationPreference: validation.data.locationPreference,
        remotePreference: validation.data.remotePreference,
        interestedSpecialties: validation.data.interestedSpecialties,
        opportunityTypes: validation.data.opportunityTypes,
        availability: validation.data.availability,
        languages: validation.data.languages,
        careerGoals: validation.data.careerGoals,
        linkedinUrl: validation.data.linkedinUrl,
        githubUrl: validation.data.githubUrl,
        portfolioUrl: validation.data.portfolioUrl,
        ageYears: validation.data.ageYears,
        maximumTravelMiles: validation.data.maximumTravelMiles,
        paidOnlyPreference: validation.data.paidOnlyPreference,
        preferredSeasons: validation.data.preferredSeasons,
        certifications: validation.data.certifications,
        transportationNotes: validation.data.transportationNotes,
      },
      create: {
        userId: user.id,
        school: validation.data.school,
        gradeYear: validation.data.gradeYear,
        city: validation.data.city,
        state: validation.data.state,
        country: validation.data.country,
        locationPreference: validation.data.locationPreference,
        remotePreference: validation.data.remotePreference,
        interestedSpecialties: validation.data.interestedSpecialties,
        opportunityTypes: validation.data.opportunityTypes,
        availability: validation.data.availability,
        languages: validation.data.languages,
        careerGoals: validation.data.careerGoals,
        linkedinUrl: validation.data.linkedinUrl,
        githubUrl: validation.data.githubUrl,
        portfolioUrl: validation.data.portfolioUrl,
        ageYears: validation.data.ageYears,
        maximumTravelMiles: validation.data.maximumTravelMiles,
        paidOnlyPreference: validation.data.paidOnlyPreference,
        preferredSeasons: validation.data.preferredSeasons,
        certifications: validation.data.certifications,
        transportationNotes: validation.data.transportationNotes,
      },
      select: {
        id: true,
      },
    });

    await transaction.auditLog.create({
      data: {
        action: account.studentProfile
          ? "STUDENT_PROFILE_UPDATED"
          : "STUDENT_PROFILE_CREATED",
        actorId: user.id,
        entityId: studentProfile.id,
        entityType: "StudentProfile",
        metadata: {
          school: validation.data.school,
        },
      },
    });

    return { blockReason: null };
  });

  if (transition.blockReason) {
    return {
      fieldErrors: {},
      formError: studentAccountTransitionBlockMessage(transition.blockReason),
      values: validation.values,
    };
  }

  const rawReturnTo = formData.get("returnTo");
  const returnTo = safeInternalPath(
    typeof rawReturnTo === "string" ? rawReturnTo : null,
    "/dashboard/student",
  );

  redirect(returnTo);
}
