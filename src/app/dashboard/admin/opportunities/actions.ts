"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAuditLog,
  getActorIdFromClerkUserId,
} from "@/lib/audit/audit-log";
import { assertAdminAccess } from "@/lib/admin/authorization";
import type {
  OpportunityActionState,
  PartnerOrganizationActionState,
} from "@/lib/admin/opportunity-validation";
import {
  validateOpportunityForm,
  validateOpportunityPublishReadiness,
  validatePartnerOrganizationForm,
} from "@/lib/admin/opportunity-validation";
import { prisma } from "@/lib/db/prisma";
import { createNotifications } from "@/lib/notifications/notifications";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function revalidateAdminOpportunityPaths() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/opportunities");
  revalidatePath("/dashboard/notifications");
}

export async function saveOpportunity(
  _previousState: OpportunityActionState,
  formData: FormData,
): Promise<OpportunityActionState> {
  const { userId } = await assertAdminAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const rateLimit = await enforceRateLimit({
    action: "admin_mutation",
    identifier: `user:${userId}`,
    limit: 100,
    windowSeconds: 60 * 60,
  });

  const validation = validateOpportunityForm(formData);

  if (!validation.success) {
    return {
      fieldErrors: validation.errors,
      formError: "Please fix the highlighted fields.",
      values: validation.values,
    };
  }

  if (!rateLimit.allowed) {
    return {
      fieldErrors: {},
      formError: formatRateLimitMessage(rateLimit),
      values: validation.values,
    };
  }

  const organization = await prisma.partnerOrganization.findUnique({
    where: {
      id: validation.data.organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!organization) {
    return {
      fieldErrors: {
        organizationId: "Choose an existing partner organization.",
      },
      formError: "The selected partner organization could not be found.",
      values: validation.values,
    };
  }

  const opportunityId = validation.values.opportunityId;
  const publishedAt =
    validation.data.status === "PUBLISHED" ? new Date() : undefined;

  if (opportunityId) {
    const existingOpportunity = await prisma.opportunity.findUnique({
      where: {
        id: opportunityId,
      },
      select: {
        id: true,
        publishedAt: true,
        status: true,
        title: true,
        relationshipType: true,
        officialSourceUrl: true,
        verificationStatus: true,
        lastVerifiedAt: true,
      },
    });

    if (!existingOpportunity) {
      return {
        fieldErrors: {},
        formError: "Opportunity could not be found.",
        values: validation.values,
      };
    }

    await prisma.opportunity.update({
      where: {
        id: opportunityId,
      },
      data: {
        ...validation.data,
        publishedAt:
          validation.data.status === "PUBLISHED" &&
          !existingOpportunity.publishedAt
            ? publishedAt
            : undefined,
      },
    });
    await createAuditLog({
      action: "OPPORTUNITY_UPDATED",
      actorId,
      entityId: opportunityId,
      entityType: "Opportunity",
      metadata: {
        newStatus: validation.data.status,
        previousStatus: existingOpportunity.status,
        title: validation.data.title,
      },
    });

    revalidateAdminOpportunityPaths();
    redirect(`/dashboard/admin/opportunities/${opportunityId}/edit?saved=1`);
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      ...validation.data,
      publishedAt,
    },
    select: {
      id: true,
    },
  });
  await createAuditLog({
    action: "OPPORTUNITY_CREATED",
    actorId,
    entityId: opportunity.id,
    entityType: "Opportunity",
    metadata: {
      organizationId: validation.data.organizationId,
      status: validation.data.status,
      title: validation.data.title,
    },
  });

  revalidateAdminOpportunityPaths();
  redirect(`/dashboard/admin/opportunities/${opportunity.id}/edit?saved=1`);
}

export async function createPartnerOrganization(
  _previousState: PartnerOrganizationActionState,
  formData: FormData,
): Promise<PartnerOrganizationActionState> {
  const { userId } = await assertAdminAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const rateLimit = await enforceRateLimit({
    action: "admin_mutation",
    identifier: `user:${userId}`,
    limit: 100,
    windowSeconds: 60 * 60,
  });

  const validation = validatePartnerOrganizationForm(formData);

  if (!validation.success) {
    return {
      fieldErrors: validation.errors,
      formError: "Please fix the highlighted fields.",
      values: validation.values,
    };
  }

  if (!rateLimit.allowed) {
    return {
      fieldErrors: {},
      formError: formatRateLimitMessage(rateLimit),
      values: validation.values,
    };
  }

  const redirectTo =
    getString(formData, "redirectTo") || "/dashboard/admin/opportunities/new";

  let organizationId: string;

  try {
    const organization = await prisma.partnerOrganization.create({
      data: validation.data,
      select: {
        id: true,
      },
    });

    organizationId = organization.id;
  } catch {
    return {
      fieldErrors: {
        name: "Use a unique organization name.",
      },
      formError: "Partner organization could not be created.",
      values: validation.values,
    };
  }

  await createAuditLog({
    action: "PARTNER_ORGANIZATION_CREATED",
    actorId,
    entityId: organizationId,
    entityType: "PartnerOrganization",
    metadata: {
      name: validation.data.name,
      status: validation.data.status,
    },
  });

  revalidateAdminOpportunityPaths();
  redirect(`${redirectTo}?partnerCreated=1`);
}

async function updateOpportunityStatus(
  formData: FormData,
  status: "PUBLISHED" | "ARCHIVED" | "CLOSED",
) {
  const { userId } = await assertAdminAccess();
  const actorId = await getActorIdFromClerkUserId(userId);

  const opportunityId = getString(formData, "opportunityId");
  const redirectTo =
    getString(formData, "redirectTo") || "/dashboard/admin/opportunities";
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

  if (opportunityId) {
    const opportunity = await prisma.opportunity.findUnique({
      where: {
        id: opportunityId,
      },
      select: {
        id: true,
        status: true,
        title: true,
        relationshipType: true,
        officialSourceUrl: true,
        verificationStatus: true,
        lastVerifiedAt: true,
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
      },
    });

    if (!opportunity) {
      revalidateAdminOpportunityPaths();
      redirect(redirectTo);
    }

    if (status === "PUBLISHED") {
      const readiness = validateOpportunityPublishReadiness(opportunity);
      if (!readiness.ready) {
        redirect(`${redirectTo}?error=${encodeURIComponent(readiness.errors.join(" "))}`);
      }
    }

    await prisma.opportunity.update({
      where: {
        id: opportunityId,
      },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : undefined,
      },
    });
    await Promise.all([
      createNotifications(
        opportunity.organization.members.map((member) => member.userId),
        {
          body: `${opportunity.title} was updated to ${status}.`,
          title: "Opportunity status updated",
        },
      ),
      createAuditLog({
        action: `OPPORTUNITY_${status}`,
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
  }

  revalidateAdminOpportunityPaths();
  redirect(redirectTo);
}

export async function publishOpportunity(formData: FormData) {
  await updateOpportunityStatus(formData, "PUBLISHED");
}

export async function archiveOpportunity(formData: FormData) {
  await updateOpportunityStatus(formData, "ARCHIVED");
}

export async function closeOpportunity(formData: FormData) {
  await updateOpportunityStatus(formData, "CLOSED");
}
