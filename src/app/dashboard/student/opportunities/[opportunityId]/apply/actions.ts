"use server";

import { Prisma } from "@/generated/prisma/client";
import type { ApplicationTaskType } from "@/generated/prisma/enums";
import { createAuditLog } from "@/lib/audit/audit-log";
import { prisma } from "@/lib/db/prisma";
import {
  applicationSubmittedReviewerEmail,
  applicationSubmittedStudentEmail,
} from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/resend";
import {
  createNotifications,
  getUsersByRoles,
} from "@/lib/notifications/notifications";
import { getOpportunityMatchScore } from "@/lib/matching/match-score";
import { recordRecommendationEvents } from "@/lib/matching/recommendation-events";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";
import { assertStudentAccess } from "@/lib/student/authorization";
import type { StudentApplicationActionState } from "@/lib/student/application-validation";
import { validateStudentApplicationForm } from "@/lib/student/application-validation";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { redirect } from "next/navigation";
import { canSubmitExistingApplication } from "@/lib/student/application-workspace";
import {
  isOpportunitySubmittable,
  isStudentOpportunitySubmittable,
  studentAccessibleSubmittableOpportunityWhere,
  studentSubmittableOpportunityWhere,
} from "@/lib/opportunities/student-visibility";
import {
  buildInitialApplicationTasks,
  calculateApplicationProgress,
  getApplicationNextAction,
} from "@/lib/student/application-tasks";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

const preparationTaskTypes = [
  "REVIEW_ELIGIBILITY",
  "REVIEW_OFFICIAL_REQUIREMENTS",
  "UPLOAD_RESUME",
  "SELECT_RESUME",
  "REQUEST_RECOMMENDATION",
  "CONFIRM_RECOMMENDATION",
  "PREPARE_ESSAY",
  "REVIEW_ESSAY",
  "UPLOAD_TRANSCRIPT",
  "COMPLETE_PARENT_FORM",
  "OPEN_EXTERNAL_PORTAL",
  "SUBMIT_INTERNAL_APPLICATION",
  "CONFIRM_EXTERNAL_SUBMISSION",
] as const satisfies readonly ApplicationTaskType[];

async function syncSubmittedApplicationTasks(
  tx: Prisma.TransactionClient,
  applicationId: string,
  opportunity: {
    applicationMethod: "FP_INTERNAL" | "FP_REFERRAL" | "EXTERNAL_PORTAL";
    deadline: Date | null;
    essayQuestionCount: number | null;
    id: string;
    opensAt: Date | null;
    requiredDocuments: string[];
    visibility: "PUBLIC_DIRECTORY" | "STUDENT_PRIVATE";
  },
  now: Date,
) {
  const initialTasks = buildInitialApplicationTasks({
    applicationMethod: opportunity.applicationMethod,
    deadline: opportunity.deadline,
    essayQuestionCount: opportunity.essayQuestionCount,
    now,
    opensAt: opportunity.opensAt,
    requiredDocuments: opportunity.requiredDocuments,
    studentProvidedExternal: opportunity.visibility === "STUDENT_PRIVATE",
  });
  await tx.applicationTask.createMany({
    data: initialTasks.map((task) => ({ ...task, applicationId })),
    skipDuplicates: true,
  });
  await tx.applicationTask.updateMany({
    where: {
      applicationId,
      studentControlled: false,
      type: { in: [...preparationTaskTypes] },
    },
    data: { completedAt: now, status: "COMPLETE" },
  });
  const tasks = await tx.applicationTask.findMany({
    where: { applicationId },
    select: {
      applicationId: true,
      completedAt: true,
      dueAt: true,
      id: true,
      required: true,
      sortOrder: true,
      status: true,
      title: true,
      type: true,
    },
  });
  const nextAction = getApplicationNextAction(
    tasks,
    {
      applicationId,
      canSubmit: false,
      opportunityId: opportunity.id,
    },
    now,
  );
  await tx.application.update({
    where: { id: applicationId },
    data: {
      completionPercent: calculateApplicationProgress(tasks),
      nextAction: nextAction?.task.title ?? null,
    },
  });
}

export async function submitStudentApplication(
  _previousState: StudentApplicationActionState,
  formData: FormData,
): Promise<StudentApplicationActionState> {
  const { userId } = await assertStudentAccess();
  const opportunityId = getString(formData, "opportunityId");
  const recommendationSource = getString(formData, "recommendationSource");
  const validation = validateStudentApplicationForm(formData);

  if (!validation.success) {
    return {
      fieldErrors: validation.errors,
      formError: "Please fix the highlighted fields.",
      values: validation.values,
    };
  }

  if (!opportunityId) {
    return {
      fieldErrors: {},
      formError: "Opportunity could not be found.",
      values: validation.values,
    };
  }

  const user = await getCurrentStudentProfile(userId);

  if (!user.studentProfile) {
    redirect("/dashboard/student/onboarding");
  }
  const profile = user.studentProfile;

  const rateLimit = await enforceRateLimit({
    action: "application_submit",
    identifier: `user:${user.id}`,
    limit: 20,
    windowSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      fieldErrors: {},
      formError: formatRateLimitMessage(rateLimit),
      values: validation.values,
    };
  }

  const submissionCheckAt = new Date();
  const [opportunity, resume, existingApplication] = await Promise.all([
    prisma.opportunity.findFirst({
      where: {
        ...studentSubmittableOpportunityWhere(opportunityId, submissionCheckAt),
        applicationMethod: { in: ["FP_INTERNAL", "FP_REFERRAL"] },
        relationshipType: { in: ["FP_OWNED", "FP_PARTNER"] },
      },
      select: {
        applicationMethod: true,
        availabilityStatus: true,
        deadline: true,
        description: true,
        eligibilityRequirements: true,
        essayQuestionCount: true,
        id: true,
        location: true,
        opensAt: true,
        requiredDocuments: true,
        remoteType: true,
        specialty: true,
        status: true,
        title: true,
        type: true,
        verificationStatus: true,
        visibility: true,
        organization: {
          select: {
            members: {
              select: {
                user: {
                  select: {
                    email: true,
                    id: true,
                  },
                },
              },
            },
            name: true,
          },
        },
      },
    }),
    prisma.resume.findFirst({
      where: {
        id: validation.data.resumeId,
        studentProfileId: profile.id,
      },
      select: {
        extractedSkills: true,
        id: true,
      },
    }),
    prisma.application.findUnique({
      where: {
        studentProfileId_opportunityId: {
          studentProfileId: profile.id,
          opportunityId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    }),
  ]);

  if (
    !opportunity ||
    !isOpportunitySubmittable(opportunity, submissionCheckAt)
  ) {
    return {
      fieldErrors: {},
      formError: "This opportunity is no longer accepting applications.",
      values: validation.values,
    };
  }

  if (!resume) {
    return {
      fieldErrors: {
        resumeId: "Choose one of your uploaded resumes.",
      },
      formError: "Resume could not be found.",
      values: validation.values,
    };
  }

  if (
    existingApplication &&
    !canSubmitExistingApplication(existingApplication.status)
  ) {
    redirect(
      `/dashboard/student/opportunities/${opportunityId}/apply?alreadyApplied=1`,
    );
  }

  let applicationId: string;

  try {
    const submittedAt = new Date();
    const application = await prisma.$transaction(async (tx) => {
      const submittedApplication = existingApplication
        ? await tx.application.update({
            where: { id: existingApplication.id },
            data: {
              resumeId: resume.id,
              applicationMethod: opportunity.applicationMethod,
              status: "SUBMITTED",
              statement: validation.data.statement,
              submittedAt,
              submissionConfirmation: "Student confirmed submission",
              lastActivityAt: submittedAt,
            },
            select: { id: true },
          })
        : await tx.application.create({
            data: {
              studentProfileId: profile.id,
              opportunityId,
              applicationMethod: opportunity.applicationMethod,
              resumeId: resume.id,
              status: "SUBMITTED",
              statement: validation.data.statement,
              submittedAt,
              submissionConfirmation: "Student confirmed submission",
              lastActivityAt: submittedAt,
            },
            select: {
              id: true,
            },
          });

      await syncSubmittedApplicationTasks(
        tx,
        submittedApplication.id,
        opportunity,
        submittedAt,
      );
      return submittedApplication;
    });

    applicationId = application.id;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect(
        `/dashboard/student/opportunities/${opportunityId}/apply?alreadyApplied=1`,
      );
    }

    return {
      fieldErrors: {},
      formError: "Application could not be submitted. Please try again.",
      values: validation.values,
    };
  }

  const studentName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const adminUsers = await getUsersByRoles(["ADMIN", "SUPER_ADMIN"]);
  const reviewerUsers = [
    ...opportunity.organization.members.map((member) => member.user),
    ...adminUsers,
  ];
  const studentEmail = applicationSubmittedStudentEmail({
    opportunityTitle: opportunity.title,
    organizationName: opportunity.organization.name,
    studentName,
  });
  const reviewerEmail = applicationSubmittedReviewerEmail({
    opportunityTitle: opportunity.title,
    organizationName: opportunity.organization.name,
    studentName,
  });
  const [studentEmailResult, reviewerEmailResult] = await Promise.all([
    sendTransactionalEmail({
      ...studentEmail,
      to: user.email,
    }),
    sendTransactionalEmail({
      ...reviewerEmail,
      to: reviewerUsers.map((reviewer) => reviewer.email),
    }),
    createNotifications(
      reviewerUsers.map((reviewer) => reviewer.id),
      {
        body: `${studentName} applied for ${opportunity.title}.`,
        title: "New application submitted",
      },
    ),
  ]);

  await createAuditLog({
    action: "INTERNAL_APPLICATION_SUBMITTED",
    actorId: user.id,
    entityId: applicationId,
    entityType: "Application",
    metadata: {
      opportunityId,
      opportunityTitle: opportunity.title,
      reviewerEmailSent: reviewerEmailResult.sent,
      reviewerEmailSkipped: reviewerEmailResult.skipped,
      studentEmailSent: studentEmailResult.sent,
      studentEmailSkipped: studentEmailResult.skipped,
      studentProfileId: profile.id,
    },
  });

  const match = getOpportunityMatchScore({
    opportunity,
    profile: user.studentProfile,
    resume,
  });

  await recordRecommendationEvents({
    events: [
      {
        applicationId,
        eventType: "APPLICATION",
        matchScore: match.score,
        opportunityId,
        source:
          recommendationSource === "recommendation"
            ? "student_dashboard_recommendation"
            : "student_application_submit",
      },
    ],
    userId: user.id,
  });

  redirect(`/dashboard/student/opportunities/${opportunityId}/apply?success=1`);
}

export async function confirmExternalApplicationSubmission(formData: FormData) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const opportunityId = getString(formData, "opportunityId");
  const confirmed = formData.get("confirmedExternalSubmission") === "on";

  if (!user.studentProfile || !opportunityId || !confirmed) {
    return;
  }
  const profile = user.studentProfile;

  const rateLimit = await enforceRateLimit({
    action: "external_application_confirmation",
    identifier: `user:${user.id}`,
    limit: 20,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) return;

  const submissionCheckAt = new Date();
  const [opportunity, existingApplication] = await Promise.all([
    prisma.opportunity.findFirst({
      where: {
        ...studentAccessibleSubmittableOpportunityWhere(
          opportunityId,
          profile.id,
          submissionCheckAt,
        ),
        applicationMethod: "EXTERNAL_PORTAL",
        OR: [
          { officialApplicationUrl: { not: null } },
          {
            sourceType: "STUDENT_ADDED",
            studentSourceUrlNormalized: { not: null },
            visibility: "STUDENT_PRIVATE",
          },
        ],
      },
      select: {
        applicationMethod: true,
        availabilityStatus: true,
        deadline: true,
        essayQuestionCount: true,
        id: true,
        opensAt: true,
        requiredDocuments: true,
        sourceType: true,
        status: true,
        studentOwnerProfileId: true,
        title: true,
        verificationStatus: true,
        visibility: true,
      },
    }),
    prisma.application.findUnique({
      where: {
        studentProfileId_opportunityId: {
          studentProfileId: profile.id,
          opportunityId,
        },
      },
      select: { id: true, status: true },
    }),
  ]);

  if (
    !opportunity ||
    !isStudentOpportunitySubmittable(opportunity, profile.id, submissionCheckAt)
  )
    return;
  if (
    existingApplication &&
    !canSubmitExistingApplication(existingApplication.status)
  ) {
    redirect(
      `/dashboard/student/opportunities/${opportunityId}/apply?alreadyApplied=1`,
    );
  }

  const now = submissionCheckAt;
  const submissionConfirmation =
    opportunity.visibility === "STUDENT_PRIVATE"
      ? "Student confirmed they personally submitted the student-added external application."
      : "Student confirmed submission through the external host portal.";
  const application = await prisma.$transaction(async (tx) => {
    const submittedApplication = await tx.application.upsert({
      where: {
        studentProfileId_opportunityId: {
          studentProfileId: profile.id,
          opportunityId,
        },
      },
      create: {
        applicationMethod: "EXTERNAL_PORTAL",
        lastActivityAt: now,
        opportunityId,
        status: "SUBMITTED",
        studentProfileId: profile.id,
        submissionConfirmation,
        submittedAt: now,
      },
      update: {
        applicationMethod: "EXTERNAL_PORTAL",
        lastActivityAt: now,
        status: "SUBMITTED",
        submissionConfirmation,
        submittedAt: now,
      },
      select: { id: true },
    });
    await syncSubmittedApplicationTasks(
      tx,
      submittedApplication.id,
      opportunity,
      now,
    );
    return submittedApplication;
  });

  await createAuditLog({
    action: "EXTERNAL_SUBMISSION_CONFIRMED",
    actorId: user.id,
    entityId: application.id,
    entityType: "Application",
    metadata: {
      applicationMethod: "EXTERNAL_PORTAL",
      opportunityId,
      studentProfileId: profile.id,
    },
  });

  redirect(
    `/dashboard/student/opportunities/${opportunityId}/apply?success=1&external=1`,
  );
}
