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
import { createStudentOnboardingFailure } from "@/lib/student/onboarding-errors";
import { getStudentOnboardingProgress } from "@/lib/student/onboarding-progress";
import type { StudentOnboardingActionState } from "@/lib/student/onboarding-state";
import { getOrCreateCurrentStudentUser } from "@/lib/student/profile";
import {
  validateStudentProfileStep,
  valuesFromFormData,
} from "@/lib/student/profile-validation";

const minimumAgeAuditAction = "STUDENT_ONBOARDING_AGE_AFFIRMED";
const completionAuditAction = "STUDENT_ONBOARDING_COMPLETED";
const finalOnboardingStep = 3;

function parseStep(formData: FormData) {
  const rawStep = formData.get("step");
  const step = typeof rawStep === "string" ? Number(rawStep) : Number.NaN;

  return Number.isInteger(step) && step >= 0 && step <= finalOnboardingStep
    ? step
    : null;
}

function profileDataForStep(
  data: Extract<
    ReturnType<typeof validateStudentProfileStep>,
    { success: true }
  >["data"],
  step: number,
) {
  switch (step) {
    case 0:
      return {
        ageYears: data.ageYears,
        gradeYear: data.gradeYear,
        school: data.school,
      };
    case 1:
      return {
        city: data.city,
        country: data.country,
        locationPreference: data.locationPreference,
        maximumTravelMiles: data.maximumTravelMiles,
        remotePreference: data.remotePreference,
        state: data.state,
        transportationNotes: data.transportationNotes,
      };
    case 2:
      return {
        availability: data.availability,
        certifications: data.certifications,
        interestedSpecialties: data.interestedSpecialties,
        languages: data.languages,
        opportunityTypes: data.opportunityTypes,
        paidOnlyPreference: data.paidOnlyPreference,
        preferredSeasons: data.preferredSeasons,
      };
    case 3:
      return {
        careerGoals: data.careerGoals,
        githubUrl: data.githubUrl,
        linkedinUrl: data.linkedinUrl,
        portfolioUrl: data.portfolioUrl,
      };
    default:
      return {};
  }
}

export async function saveStudentProfile(
  previousState: StudentOnboardingActionState,
  formData: FormData,
): Promise<StudentOnboardingActionState> {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  if (getRoleFromSessionClaims(sessionClaims) !== "STUDENT") {
    redirect("/dashboard");
  }

  const step = parseStep(formData);
  const values = valuesFromFormData(formData);

  if (step == null) {
    return {
      fieldErrors: {},
      formError: "Return to onboarding and try that step again.",
      resumeStep: 0,
      savedStep: null,
      saveSequence: previousState.saveSequence,
      saveStatus: "error",
      supportReference: null,
      values,
    };
  }

  let user: Awaited<ReturnType<typeof getOrCreateCurrentStudentUser>>;

  try {
    user = await getOrCreateCurrentStudentUser(userId);
  } catch (error) {
    return createStudentOnboardingFailure({
      error,
      previousState,
      resumeStep: step,
      userId,
      values,
    });
  }

  const currentProgress = getStudentOnboardingProgress({
    firstName: user.firstName,
    lastName: user.lastName,
    profile: user.studentProfile,
  });
  let ageAffirmation: { id: string } | null;

  if (step === 0 && !currentProgress.isComplete) {
    try {
      ageAffirmation = await prisma.auditLog.findFirst({
        where: {
          action: minimumAgeAuditAction,
          actorId: user.id,
          entityType: "StudentProfile",
        },
        select: { id: true },
      });
    } catch (error) {
      return createStudentOnboardingFailure({
        error,
        previousState,
        resumeStep: step,
        userId: user.id,
        values,
      });
    }
  } else {
    ageAffirmation = null;
  }
  const requireMinimumAgeAffirmation =
    step === 0 && !currentProgress.isComplete && !ageAffirmation;
  const validation = validateStudentProfileStep(formData, step, {
    requireMinimumAgeAffirmation,
  });

  if (!validation.success) {
    return {
      fieldErrors: validation.errors,
      formError: "Please fix the highlighted fields before this step is saved.",
      resumeStep: step,
      savedStep: null,
      saveSequence: previousState.saveSequence,
      saveStatus: "error",
      supportReference: null,
      values: validation.values,
    };
  }

  try {
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
        resumeStep: step,
        savedStep: null,
        saveSequence: previousState.saveSequence,
        saveStatus: "error",
        supportReference: null,
        values: validation.values,
      };
    }

    const transition = await prisma.$transaction(async (transaction) => {
      await acquireAccountTransitionLock(transaction, user.id);

      const account = await transaction.user.findUnique({
        where: { id: user.id },
        select: {
          firstName: true,
          lastName: true,
          partnerMemberships: { select: { id: true }, take: 1 },
          role: true,
          studentProfile: true,
        },
      });

      if (!account) {
        return {
          blockReason: "NON_STUDENT_ROLE" as const,
          completed: false,
          resumeStep: step,
        };
      }

      const blockReason = getStudentAccountTransitionBlockReason({
        databaseRole: account.role,
        hasPartnerMembership: account.partnerMemberships.length > 0,
      });

      if (blockReason) {
        return { blockReason, completed: false, resumeStep: step };
      }

      let firstName = account.firstName;
      let lastName = account.lastName;

      if (step === 0) {
        const updatedUser = await transaction.user.update({
          where: { id: user.id },
          data: {
            firstName: validation.data.firstName,
            lastName: validation.data.lastName,
          },
          select: { firstName: true, lastName: true },
        });
        firstName = updatedUser.firstName;
        lastName = updatedUser.lastName;
      }

      const studentProfile = await transaction.studentProfile.upsert({
        where: { userId: user.id },
        update: profileDataForStep(validation.data, step),
        create: {
          userId: user.id,
          ...profileDataForStep(validation.data, step),
        },
      });

      if (requireMinimumAgeAffirmation) {
        const existingAffirmation = await transaction.auditLog.findFirst({
          where: {
            action: minimumAgeAuditAction,
            actorId: user.id,
            entityId: studentProfile.id,
            entityType: "StudentProfile",
          },
          select: { id: true },
        });

        if (!existingAffirmation) {
          await transaction.auditLog.create({
            data: {
              action: minimumAgeAuditAction,
              actorId: user.id,
              entityId: studentProfile.id,
              entityType: "StudentProfile",
              metadata: { minimumAge: 13 },
            },
          });
        }
      }

      const progress = getStudentOnboardingProgress({
        firstName,
        lastName,
        profile: studentProfile,
      });

      await transaction.auditLog.create({
        data: {
          action: account.studentProfile
            ? "STUDENT_PROFILE_UPDATED"
            : "STUDENT_PROFILE_CREATED",
          actorId: user.id,
          entityId: studentProfile.id,
          entityType: "StudentProfile",
          metadata: { onboardingStep: step + 1 },
        },
      });

      if (step === finalOnboardingStep && progress.isComplete) {
        const existingCompletion = await transaction.auditLog.findFirst({
          where: {
            action: completionAuditAction,
            actorId: user.id,
            entityId: studentProfile.id,
            entityType: "StudentProfile",
          },
          select: { id: true },
        });

        if (!existingCompletion) {
          await transaction.auditLog.create({
            data: {
              action: completionAuditAction,
              actorId: user.id,
              entityId: studentProfile.id,
              entityType: "StudentProfile",
              metadata: { completedSteps: 4 },
            },
          });
        }
      }

      return {
        blockReason: null,
        completed: progress.isComplete,
        resumeStep: progress.firstIncompleteStep,
      };
    });

    if (transition.blockReason) {
      return {
        fieldErrors: {},
        formError: studentAccountTransitionBlockMessage(transition.blockReason),
        resumeStep: step,
        savedStep: null,
        saveSequence: previousState.saveSequence,
        saveStatus: "error",
        supportReference: null,
        values: validation.values,
      };
    }

    if (step === finalOnboardingStep && !transition.completed) {
      return {
        fieldErrors: {},
        formError:
          "An earlier required step still needs attention. Your saved progress is available.",
        resumeStep: transition.resumeStep,
        savedStep: null,
        saveSequence: previousState.saveSequence,
        saveStatus: "error",
        supportReference: null,
        values: validation.values,
      };
    }
  } catch (error) {
    return createStudentOnboardingFailure({
      error,
      previousState,
      resumeStep: step,
      userId: user.id,
      values: validation.values,
    });
  }

  if (step === finalOnboardingStep) {
    const rawReturnTo = formData.get("returnTo");
    const returnTo = safeInternalPath(
      typeof rawReturnTo === "string" ? rawReturnTo : null,
      "/dashboard/student",
    );

    redirect(returnTo);
  }

  return {
    fieldErrors: {},
    formError: null,
    resumeStep: step + 1,
    savedStep: step,
    saveSequence: previousState.saveSequence + 1,
    saveStatus: "saved",
    supportReference: null,
    values: validation.values,
  };
}
