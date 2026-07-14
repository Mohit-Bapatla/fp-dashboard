"use server";

import { Prisma } from "@/generated/prisma/client";
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
import { studentApplicationOpportunityWhere } from "@/lib/opportunities/student-visibility";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
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

  const [opportunity, resume, existingApplication] = await Promise.all([
    prisma.opportunity.findFirst({
      where: {
        ...studentApplicationOpportunityWhere(opportunityId),
        applicationMethod: { in: ["FP_INTERNAL", "FP_REFERRAL"] },
        relationshipType: { in: ["FP_OWNED", "FP_PARTNER"] },
      },
      select: {
        applicationMethod: true,
        description: true,
        eligibilityRequirements: true,
        id: true,
        location: true,
        remoteType: true,
        specialty: true,
        title: true,
        type: true,
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
        studentProfileId: user.studentProfile.id,
      },
      select: {
        extractedSkills: true,
        id: true,
      },
    }),
    prisma.application.findUnique({
      where: {
        studentProfileId_opportunityId: {
          studentProfileId: user.studentProfile.id,
          opportunityId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    }),
  ]);

  if (!opportunity) {
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
    const application = existingApplication
      ? await prisma.application.update({
          where: { id: existingApplication.id },
          data: {
            resumeId: resume.id,
            applicationMethod: opportunity.applicationMethod,
            status: "SUBMITTED",
            statement: validation.data.statement,
            submittedAt: new Date(),
            submissionConfirmation: "Student confirmed submission",
            completionPercent: 100,
            lastActivityAt: new Date(),
          },
          select: { id: true },
        })
      : await prisma.application.create({
          data: {
            studentProfileId: user.studentProfile.id,
            opportunityId,
            applicationMethod: opportunity.applicationMethod,
            resumeId: resume.id,
            status: "SUBMITTED",
            statement: validation.data.statement,
            submittedAt: new Date(),
            submissionConfirmation: "Student confirmed submission",
            completionPercent: 100,
            lastActivityAt: new Date(),
          },
          select: {
            id: true,
          },
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
    action: "APPLICATION_SUBMITTED",
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
      studentProfileId: user.studentProfile.id,
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

  const rateLimit = await enforceRateLimit({
    action: "external_application_confirmation",
    identifier: `user:${user.id}`,
    limit: 20,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) return;

  const [opportunity, existingApplication] = await Promise.all([
    prisma.opportunity.findFirst({
      where: {
        ...studentApplicationOpportunityWhere(opportunityId),
        applicationMethod: "EXTERNAL_PORTAL",
        officialApplicationUrl: { not: null },
      },
      select: { id: true, title: true },
    }),
    prisma.application.findUnique({
      where: {
        studentProfileId_opportunityId: {
          studentProfileId: user.studentProfile.id,
          opportunityId,
        },
      },
      select: { id: true, status: true },
    }),
  ]);

  if (!opportunity) return;
  if (
    existingApplication &&
    !canSubmitExistingApplication(existingApplication.status)
  ) {
    redirect(
      `/dashboard/student/opportunities/${opportunityId}/apply?alreadyApplied=1`,
    );
  }

  const now = new Date();
  const application = await prisma.application.upsert({
    where: {
      studentProfileId_opportunityId: {
        studentProfileId: user.studentProfile.id,
        opportunityId,
      },
    },
    create: {
      applicationMethod: "EXTERNAL_PORTAL",
      completionPercent: 100,
      lastActivityAt: now,
      opportunityId,
      status: "SUBMITTED",
      studentProfileId: user.studentProfile.id,
      submissionConfirmation:
        "Student confirmed submission through the external host portal.",
      submittedAt: now,
    },
    update: {
      applicationMethod: "EXTERNAL_PORTAL",
      completionPercent: 100,
      lastActivityAt: now,
      status: "SUBMITTED",
      submissionConfirmation:
        "Student confirmed submission through the external host portal.",
      submittedAt: now,
    },
    select: { id: true },
  });

  await createAuditLog({
    action: "EXTERNAL_APPLICATION_SUBMISSION_CONFIRMED",
    actorId: user.id,
    entityId: application.id,
    entityType: "Application",
    metadata: {
      applicationMethod: "EXTERNAL_PORTAL",
      opportunityId,
      studentProfileId: user.studentProfile.id,
    },
  });

  redirect(
    `/dashboard/student/opportunities/${opportunityId}/apply?success=1&external=1`,
  );
}
