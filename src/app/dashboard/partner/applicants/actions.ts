"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ApplicationStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { getCurrentPartnerContext } from "@/lib/partner/context";
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
        organizationId: {
          in: context.organizationIds,
        },
      },
    },
    select: {
      id: true,
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
        organizationId: {
          in: context.organizationIds,
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
