"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ApplicationStatus } from "@/generated/prisma/enums";
import { createAuditLog } from "@/lib/audit/audit-log";
import { prisma } from "@/lib/db/prisma";
import { applicationStatusEmail } from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { createNotifications } from "@/lib/notifications/notifications";
import { ensureApplicationOnboardingItems } from "@/lib/onboarding/application-onboarding";
import { getCurrentPartnerContext } from "@/lib/partner/context";
import { logWorkflowFailure } from "@/lib/reliability/workflow-errors";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import {
  createSupabaseAdminClient,
  resumeBucketName,
} from "@/lib/storage/supabase-admin";

export type PartnerApplicantResumeActionState = {
  error: string | null;
  signedUrl: string | null;
};

const partnerUpdateStatuses: ApplicationStatus[] = [
  "UNDER_REVIEW",
  "INTERVIEW",
  "ACCEPTED",
  "REJECTED",
];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function revalidateApplicantReviewPaths() {
  revalidatePath("/dashboard/partner");
  revalidatePath("/dashboard/partner/applicants");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/applications");
  revalidatePath("/dashboard/notifications");
}

function getSafeRedirectTo(formData: FormData) {
  const redirectTo = getString(formData, "redirectTo");

  return redirectTo.startsWith("/dashboard/partner/applicants")
    ? redirectTo
    : "/dashboard/partner/applicants";
}

function withResult(
  redirectTo: string,
  key: "error" | "notice",
  value: string,
) {
  const url = new URL(redirectTo, "https://dashboard.invalid");
  url.searchParams.set(key, value);

  return `${url.pathname}${url.search}`;
}

export async function updatePartnerApplicationStatus(formData: FormData) {
  const context = await getCurrentPartnerContext();
  const applicationId = getString(formData, "applicationId");
  const status = getString(formData, "status") as ApplicationStatus;
  const redirectTo = getSafeRedirectTo(formData);
  const rateLimit = await enforceRateLimit({
    action: "partner_mutation",
    identifier: `user:${context.user.id}`,
    limit: 100,
    windowSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    redirect(withResult(redirectTo, "error", "rate_limited"));
  }

  if (
    !applicationId ||
    !partnerUpdateStatuses.includes(status) ||
    context.organizationIds.length === 0
  ) {
    redirect(redirectTo);
  }

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      status: {
        not: "WITHDRAWN",
      },
      opportunity: {
        visibility: "PUBLIC_DIRECTORY",
        organizationId: {
          in: context.organizationIds,
        },
        organization: {
          isSystemPlaceholder: false,
        },
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
    if (application.status === status) {
      revalidateApplicantReviewPaths();
      redirect(withResult(redirectTo, "notice", "already_updated"));
    }

    const update = await prisma.application.updateMany({
      where: {
        id: application.id,
        status: application.status,
      },
      data: {
        reviewedAt: new Date(),
        status,
      },
    });
    if (update.count !== 1) {
      revalidateApplicantReviewPaths();
      redirect(withResult(redirectTo, "notice", "changed_elsewhere"));
    }

    const email = applicationStatusEmail({
      opportunityTitle: application.opportunity.title,
      status,
      studentName: application.studentProfile.user.email,
    });
    let emailResult = { sent: false, skipped: true };
    let notificationCreated = false;
    let onboardingEnsured = status !== "ACCEPTED";

    try {
      emailResult = await sendTransactionalEmail({
        ...email,
        to: application.studentProfile.user.email,
      });
    } catch (error) {
      logWorkflowFailure({
        action: "send_partner_application_status_email",
        category: "PARTNER",
        error,
        route: "/dashboard/partner/applicants",
        userId: context.user.id,
      });
    }

    try {
      await createNotifications([application.studentProfile.user.id], {
        body: `Your application for ${application.opportunity.title} was updated to ${status}.`,
        title: "Application status updated",
      });
      notificationCreated = true;
    } catch (error) {
      logWorkflowFailure({
        action: "create_partner_application_status_notification",
        category: "PARTNER",
        error,
        route: "/dashboard/partner/applicants",
        userId: context.user.id,
      });
    }

    if (status === "ACCEPTED") {
      try {
        await ensureApplicationOnboardingItems(application.id);
        onboardingEnsured = true;
      } catch (error) {
        logWorkflowFailure({
          action: "ensure_application_onboarding_items",
          category: "PARTNER",
          error,
          route: "/dashboard/partner/applicants",
          userId: context.user.id,
        });
      }
    }

    try {
      await createAuditLog({
        action: "APPLICATION_STATUS_UPDATED",
        actorId: context.user.id,
        entityId: application.id,
        entityType: "Application",
        metadata: {
          emailSent: emailResult.sent,
          emailSkipped: emailResult.skipped,
          newStatus: status,
          notificationCreated,
          onboardingEnsured,
          opportunityTitle: application.opportunity.title,
          previousStatus: application.status,
          source: "partner",
        },
      });
    } catch (error) {
      logWorkflowFailure({
        action: "audit_partner_application_status_update",
        category: "PARTNER",
        error,
        route: "/dashboard/partner/applicants",
        userId: context.user.id,
      });
    }
  }

  revalidateApplicantReviewPaths();
  redirect(withResult(redirectTo, "notice", "status_updated"));
}

export async function createPartnerApplicantResumeSignedUrl(
  _previousState: PartnerApplicantResumeActionState,
  formData: FormData,
): Promise<PartnerApplicantResumeActionState> {
  const context = await getCurrentPartnerContext();
  const applicationId = getString(formData, "applicationId");

  if (!applicationId || context.organizationIds.length === 0) {
    return {
      error: "Application was not found.",
      signedUrl: null,
    };
  }

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      opportunity: {
        visibility: "PUBLIC_DIRECTORY",
        organizationId: {
          in: context.organizationIds,
        },
        organization: {
          isSystemPlaceholder: false,
        },
      },
    },
    select: {
      resume: {
        select: {
          fileName: true,
          fileUrl: true,
        },
      },
    },
  });

  if (!application?.resume?.fileUrl) {
    return {
      error: "Resume was not found.",
      signedUrl: null,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(resumeBucketName)
    .createSignedUrl(application.resume.fileUrl, 60 * 5, {
      download: application.resume.fileName,
    });

  if (error || !data?.signedUrl) {
    return {
      error: "Unable to create a secure resume link.",
      signedUrl: null,
    };
  }

  return {
    error: null,
    signedUrl: data.signedUrl,
  };
}
