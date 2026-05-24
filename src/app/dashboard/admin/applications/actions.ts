"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ApplicationStatus } from "@/generated/prisma/enums";
import {
  createAuditLog,
  getActorIdFromClerkUserId,
} from "@/lib/audit/audit-log";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { prisma } from "@/lib/db/prisma";
import { applicationStatusEmail } from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { createNotifications } from "@/lib/notifications/notifications";
import { ensureApplicationOnboardingItems } from "@/lib/onboarding/application-onboarding";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";

const adminUpdateStatuses: ApplicationStatus[] = [
  "UNDER_REVIEW",
  "INTERVIEW",
  "ACCEPTED",
  "REJECTED",
];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getSafeRedirectTo(formData: FormData) {
  const redirectTo = getString(formData, "redirectTo");

  return redirectTo.startsWith("/dashboard/admin/applications")
    ? redirectTo
    : "/dashboard/admin/applications";
}

function revalidateApplicationStatusPaths() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/applications");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/applications");
  revalidatePath("/dashboard/partner");
  revalidatePath("/dashboard/partner/applicants");
  revalidatePath("/dashboard/notifications");
}

export async function updateAdminApplicationStatus(formData: FormData) {
  const { userId } = await assertAdminAccess();

  const applicationId = getString(formData, "applicationId");
  const status = getString(formData, "status") as ApplicationStatus;
  const redirectTo = getSafeRedirectTo(formData);
  const rateLimit = await enforceRateLimit({
    action: "admin_mutation",
    identifier: `user:${userId}`,
    limit: 100,
    windowSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    redirect(
      `${redirectTo}?error=${encodeURIComponent(formatRateLimitMessage(rateLimit))}`,
    );
  }

  if (!applicationId || !adminUpdateStatuses.includes(status)) {
    redirect(redirectTo);
  }

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      status: {
        not: "WITHDRAWN",
      },
    },
    select: {
      id: true,
      status: true,
      studentProfile: {
        select: {
          user: {
            select: {
              email: true,
              id: true,
            },
          },
        },
      },
      opportunity: {
        select: {
          title: true,
        },
      },
    },
  });

  if (application) {
    await prisma.application.update({
      where: {
        id: application.id,
      },
      data: {
        reviewedAt: new Date(),
        status,
      },
    });
    const email = applicationStatusEmail({
      opportunityTitle: application.opportunity.title,
      status,
      studentName: application.studentProfile.user.email,
    });
    const [actorId, emailResult] = await Promise.all([
      getActorIdFromClerkUserId(userId),
      sendTransactionalEmail({
        ...email,
        to: application.studentProfile.user.email,
      }),
      createNotifications([application.studentProfile.user.id], {
        body: `Your application for ${application.opportunity.title} was updated to ${status}.`,
        title: "Application status updated",
      }),
    ]);

    await createAuditLog({
      action: "APPLICATION_STATUS_UPDATED",
      actorId,
      entityId: application.id,
      entityType: "Application",
      metadata: {
        emailSent: emailResult.sent,
        emailSkipped: emailResult.skipped,
        newStatus: status,
        opportunityTitle: application.opportunity.title,
        previousStatus: application.status,
        source: "admin",
      },
    });

    if (status === "ACCEPTED") {
      await ensureApplicationOnboardingItems(application.id);
    }
  }

  revalidateApplicationStatusPaths();
  redirect(redirectTo);
}
