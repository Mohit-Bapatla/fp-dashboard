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
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";
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
    redirect(
      `${redirectTo}?error=${encodeURIComponent(formatRateLimitMessage(rateLimit))}`,
    );
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
    const [emailResult] = await Promise.all([
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
      actorId: context.user.id,
      entityId: application.id,
      entityType: "Application",
      metadata: {
        emailSent: emailResult.sent,
        emailSkipped: emailResult.skipped,
        newStatus: status,
        opportunityTitle: application.opportunity.title,
        previousStatus: application.status,
        source: "partner",
      },
    });

    if (status === "ACCEPTED") {
      await ensureApplicationOnboardingItems(application.id);
    }
  }

  revalidateApplicantReviewPaths();
  redirect(redirectTo);
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
