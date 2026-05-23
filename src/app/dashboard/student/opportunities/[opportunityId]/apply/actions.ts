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
import { assertStudentAccess } from "@/lib/student/authorization";
import type { StudentApplicationActionState } from "@/lib/student/application-validation";
import { validateStudentApplicationForm } from "@/lib/student/application-validation";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { redirect } from "next/navigation";

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

  const [opportunity, resume, existingApplication] = await Promise.all([
    prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
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

  if (existingApplication) {
    redirect(
      `/dashboard/student/opportunities/${opportunityId}/apply?alreadyApplied=1`,
    );
  }

  let applicationId: string;

  try {
    const application = await prisma.application.create({
      data: {
        studentProfileId: user.studentProfile.id,
        opportunityId,
        resumeId: resume.id,
        status: "SUBMITTED",
        statement: validation.data.statement,
        submittedAt: new Date(),
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

  redirect(`/dashboard/student/opportunities/${opportunityId}/apply?success=1`);
}
