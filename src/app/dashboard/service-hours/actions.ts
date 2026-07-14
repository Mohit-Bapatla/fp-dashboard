"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { CertificateStatus } from "@/generated/prisma/enums";
import {
  createAuditLog,
  getActorIdFromClerkUserId,
} from "@/lib/audit/audit-log";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { prisma } from "@/lib/db/prisma";
import { createNotifications } from "@/lib/notifications/notifications";
import { getCurrentPartnerContext } from "@/lib/partner/context";

const certificateStatuses: CertificateStatus[] = [
  "NOT_REQUESTED",
  "PENDING_APPROVAL",
  "APPROVED",
  "ISSUED",
  "REVOKED",
];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getSafeRedirect(formData: FormData) {
  const redirectTo = getString(formData, "redirectTo");

  return redirectTo.startsWith("/dashboard") ? redirectTo : "/dashboard";
}

function revalidateServiceHourPaths(redirectTo: string) {
  revalidatePath(redirectTo);
  revalidatePath("/dashboard/admin/service-hours");
  revalidatePath("/dashboard/partner");
  revalidatePath("/dashboard/partner/applicants");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/applications");
  revalidatePath("/dashboard/notifications");
}

export async function upsertPartnerServiceHours(formData: FormData) {
  const context = await getCurrentPartnerContext();
  const applicationId = getString(formData, "applicationId");
  const recordId = getString(formData, "recordId");
  const description = getString(formData, "description");
  const verificationNotes = getString(formData, "verificationNotes");
  const hours = Number.parseFloat(getString(formData, "hours"));
  const shouldVerify = getString(formData, "verify") === "1";
  const redirectTo = getSafeRedirect(formData);

  if (!applicationId || !Number.isFinite(hours) || hours <= 0) {
    redirect(redirectTo);
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
      status: "ACCEPTED",
    },
    select: {
      id: true,
      opportunityId: true,
      studentProfileId: true,
      studentProfile: {
        select: {
          user: {
            select: {
              id: true,
            },
          },
        },
      },
      opportunity: {
        select: {
          organizationId: true,
          title: true,
        },
      },
    },
  });

  if (!application) {
    redirect(redirectTo);
  }

  const data = {
    certificateStatus: shouldVerify
      ? ("PENDING_APPROVAL" as const)
      : ("NOT_REQUESTED" as const),
    description: description || null,
    hours,
    verificationNotes: verificationNotes || null,
    verificationStatus: shouldVerify
      ? ("VERIFIED" as const)
      : ("PENDING" as const),
    verifiedAt: shouldVerify ? new Date() : null,
    verifiedById: shouldVerify ? context.user.id : null,
  };
  const record =
    recordId &&
    (await prisma.serviceHourRecord.findFirst({
      where: {
        applicationId: application.id,
        id: recordId,
        partnerOrganizationId: {
          in: context.organizationIds,
        },
        partnerOrganization: {
          isSystemPlaceholder: false,
        },
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organization: {
            isSystemPlaceholder: false,
          },
        },
      },
      select: {
        id: true,
      },
    }))
      ? await prisma.serviceHourRecord.update({
          where: {
            id: recordId,
          },
          data,
          select: {
            id: true,
          },
        })
      : await prisma.serviceHourRecord.create({
          data: {
            ...data,
            applicationId: application.id,
            opportunityId: application.opportunityId,
            partnerOrganizationId: application.opportunity.organizationId,
            studentProfileId: application.studentProfileId,
          },
          select: {
            id: true,
          },
        });

  await Promise.all([
    createNotifications([application.studentProfile.user.id], {
      body: `${hours} service hours were ${shouldVerify ? "verified" : "recorded"} for ${application.opportunity.title}.`,
      title: "Service hours updated",
    }),
    createAuditLog({
      action: "SERVICE_HOURS_PARTNER_UPSERTED",
      actorId: context.user.id,
      entityId: record.id,
      entityType: "ServiceHourRecord",
      metadata: {
        applicationId: application.id,
        hours,
        verified: shouldVerify,
      },
    }),
  ]);

  revalidateServiceHourPaths(redirectTo);
  redirect(redirectTo);
}

export async function updateCertificateStatus(formData: FormData) {
  const { userId } = await assertAdminAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const recordId = getString(formData, "recordId");
  const certificateStatus = getString(
    formData,
    "certificateStatus",
  ) as CertificateStatus;
  const certificateNotes = getString(formData, "certificateNotes");
  const redirectTo = getSafeRedirect(formData);

  if (
    !actorId ||
    !recordId ||
    !certificateStatuses.includes(certificateStatus)
  ) {
    redirect(redirectTo);
  }

  const record = await prisma.serviceHourRecord.findFirst({
    where: {
      id: recordId,
      opportunity: {
        visibility: "PUBLIC_DIRECTORY",
        organization: {
          isSystemPlaceholder: false,
        },
      },
      partnerOrganization: {
        isSystemPlaceholder: false,
      },
    },
    select: {
      id: true,
      studentProfile: {
        select: {
          user: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!record) {
    redirect(redirectTo);
  }

  await Promise.all([
    prisma.serviceHourRecord.update({
      where: {
        id: record.id,
      },
      data: {
        approvedAt:
          certificateStatus === "APPROVED" || certificateStatus === "ISSUED"
            ? new Date()
            : null,
        approvedById:
          certificateStatus === "APPROVED" || certificateStatus === "ISSUED"
            ? actorId
            : null,
        certificateNotes: certificateNotes || null,
        certificateStatus,
      },
    }),
    createNotifications([record.studentProfile.user.id], {
      body: `Certificate status updated to ${certificateStatus}.`,
      title: "Certificate status updated",
    }),
    createAuditLog({
      action: "CERTIFICATE_STATUS_UPDATED",
      actorId,
      entityId: record.id,
      entityType: "ServiceHourRecord",
      metadata: {
        certificateStatus,
      },
    }),
  ]);

  revalidateServiceHourPaths(redirectTo);
  redirect(redirectTo);
}
