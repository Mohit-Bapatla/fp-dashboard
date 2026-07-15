"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { PartnerVerificationStatus } from "@/generated/prisma/enums";
import {
  createAuditLog,
  getActorIdFromClerkUserId,
} from "@/lib/audit/audit-log";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { validateOpportunityOrganizationReadiness } from "@/lib/admin/opportunity-validation";
import { prisma } from "@/lib/db/prisma";
import { createNotifications } from "@/lib/notifications/notifications";

const verificationStatuses: PartnerVerificationStatus[] = [
  "UNVERIFIED",
  "IN_REVIEW",
  "VERIFIED",
  "SUSPENDED",
];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getSafeRedirect(formData: FormData) {
  const redirectTo = getString(formData, "redirectTo");

  return redirectTo.startsWith("/dashboard/admin/moderation")
    ? redirectTo
    : "/dashboard/admin/moderation";
}

function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function revalidateModerationPaths() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/moderation");
  revalidatePath("/dashboard/admin/partners");
  revalidatePath("/dashboard/admin/opportunities");
  revalidatePath("/dashboard/notifications");
}

export async function updatePartnerVerification(formData: FormData) {
  const { userId } = await assertAdminAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const organizationId = getString(formData, "organizationId");
  const status = getString(
    formData,
    "verificationStatus",
  ) as PartnerVerificationStatus;
  const verificationNotes = getString(formData, "verificationNotes");
  const checklist = parseLines(getString(formData, "verificationChecklist"));
  const redirectTo = getSafeRedirect(formData);

  if (!organizationId || !verificationStatuses.includes(status)) {
    redirect(redirectTo);
  }

  const organization = await prisma.partnerOrganization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      id: true,
      members: {
        select: {
          userId: true,
        },
      },
      name: true,
      verificationStatus: true,
    },
  });

  if (!organization) {
    redirect(redirectTo);
  }

  await prisma.partnerOrganization.update({
    where: {
      id: organization.id,
    },
    data: {
      verificationChecklist: checklist,
      verificationNotes: verificationNotes || null,
      verificationStatus: status,
      verifiedAt: status === "VERIFIED" ? new Date() : null,
      verifiedById: status === "VERIFIED" ? actorId : null,
    },
  });

  await Promise.all([
    createNotifications(
      organization.members.map((member) => member.userId),
      {
        body: `${organization.name} verification status is now ${status}.`,
        title: "Partner verification updated",
      },
    ),
    createAuditLog({
      action: "PARTNER_VERIFICATION_UPDATED",
      actorId,
      entityId: organization.id,
      entityType: "PartnerOrganization",
      metadata: {
        checklist,
        newStatus: status,
        organizationName: organization.name,
        previousStatus: organization.verificationStatus,
      },
    }),
  ]);

  revalidateModerationPaths();
  redirect(redirectTo);
}

export async function flagOpportunity(formData: FormData) {
  const { userId } = await assertAdminAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const opportunityId = getString(formData, "opportunityId");
  const flag = getString(formData, "flag");
  const moderationNotes = getString(formData, "moderationNotes");
  const redirectTo = getSafeRedirect(formData);

  if (!opportunityId || !flag) {
    redirect(redirectTo);
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: {
      id: opportunityId,
    },
    select: {
      id: true,
      moderationFlags: true,
      organization: {
        select: {
          members: {
            select: {
              userId: true,
            },
          },
          name: true,
        },
      },
      title: true,
    },
  });

  if (!opportunity) {
    redirect(redirectTo);
  }

  const moderationFlags = Array.from(
    new Set([...opportunity.moderationFlags, flag]),
  );

  await prisma.opportunity.update({
    where: {
      id: opportunity.id,
    },
    data: {
      moderatedAt: new Date(),
      moderatedById: actorId,
      moderationFlags,
      moderationNotes: moderationNotes || null,
    },
  });

  await Promise.all([
    createNotifications(
      opportunity.organization.members.map((member) => member.userId),
      {
        body: `${opportunity.title} was flagged for moderation review.`,
        title: "Opportunity moderation update",
      },
    ),
    createAuditLog({
      action: "OPPORTUNITY_FLAGGED",
      actorId,
      entityId: opportunity.id,
      entityType: "Opportunity",
      metadata: {
        flag,
        moderationFlags,
        organizationName: opportunity.organization.name,
        title: opportunity.title,
      },
    }),
  ]);

  revalidateModerationPaths();
  redirect(redirectTo);
}

export async function clearOpportunityFlags(formData: FormData) {
  const { userId } = await assertAdminAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const opportunityId = getString(formData, "opportunityId");
  const moderationNotes = getString(formData, "moderationNotes");
  const redirectTo = getSafeRedirect(formData);

  if (!opportunityId) {
    redirect(redirectTo);
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: {
      id: opportunityId,
    },
    select: {
      id: true,
      moderationFlags: true,
      title: true,
    },
  });

  if (!opportunity) {
    redirect(redirectTo);
  }

  await prisma.opportunity.update({
    where: {
      id: opportunity.id,
    },
    data: {
      moderatedAt: new Date(),
      moderatedById: actorId,
      moderationFlags: [],
      moderationNotes: moderationNotes || null,
    },
  });

  await createAuditLog({
    action: "OPPORTUNITY_FLAGS_CLEARED",
    actorId,
    entityId: opportunity.id,
    entityType: "Opportunity",
    metadata: {
      previousFlags: opportunity.moderationFlags,
      title: opportunity.title,
    },
  });

  revalidateModerationPaths();
  redirect(redirectTo);
}

async function updateOpportunityModerationStatus(
  formData: FormData,
  status: "ARCHIVED" | "PUBLISHED" | "REJECTED",
) {
  const { userId } = await assertAdminAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const opportunityId = getString(formData, "opportunityId");
  const redirectTo = getSafeRedirect(formData);

  if (!opportunityId) {
    redirect(redirectTo);
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: {
      id: opportunityId,
    },
    select: {
      id: true,
      organization: {
        select: {
          members: {
            select: {
              userId: true,
            },
          },
          name: true,
          verificationStatus: true,
        },
      },
      status: true,
      title: true,
    },
  });

  if (!opportunity) {
    redirect(redirectTo);
  }

  if (status === "PUBLISHED") {
    const organizationReadiness = validateOpportunityOrganizationReadiness({
      organizationVerificationStatus:
        opportunity.organization.verificationStatus,
      status,
    });

    if (!organizationReadiness.ready) {
      redirect(
        `${redirectTo}?error=${encodeURIComponent(organizationReadiness.errors.join(" "))}`,
      );
    }
  }

  await prisma.opportunity.update({
    where: {
      id: opportunity.id,
    },
    data: {
      moderatedAt: new Date(),
      moderatedById: actorId,
      publishedAt: status === "PUBLISHED" ? new Date() : undefined,
      status,
    },
  });

  await Promise.all([
    createNotifications(
      opportunity.organization.members.map((member) => member.userId),
      {
        body: `${opportunity.title} was updated to ${status}.`,
        title: "Opportunity moderation update",
      },
    ),
    createAuditLog({
      action: `OPPORTUNITY_MODERATION_${status}`,
      actorId,
      entityId: opportunity.id,
      entityType: "Opportunity",
      metadata: {
        newStatus: status,
        organizationName: opportunity.organization.name,
        previousStatus: opportunity.status,
        title: opportunity.title,
      },
    }),
  ]);

  revalidateModerationPaths();
  redirect(redirectTo);
}

export async function publishModeratedOpportunity(formData: FormData) {
  await updateOpportunityModerationStatus(formData, "PUBLISHED");
}

export async function rejectModeratedOpportunity(formData: FormData) {
  await updateOpportunityModerationStatus(formData, "REJECTED");
}

export async function archiveModeratedOpportunity(formData: FormData) {
  await updateOpportunityModerationStatus(formData, "ARCHIVED");
}
