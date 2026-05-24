"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/lib/audit/audit-log";
import type { PartnerOpportunityActionState } from "@/lib/partner/opportunity-validation";
import { prisma } from "@/lib/db/prisma";
import {
  createNotifications,
  getUsersByRoles,
} from "@/lib/notifications/notifications";
import { getCurrentPartnerContext } from "@/lib/partner/context";
import { validatePartnerOpportunityForm } from "@/lib/partner/opportunity-validation";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function revalidatePartnerOpportunityPaths() {
  revalidatePath("/dashboard/partner");
  revalidatePath("/dashboard/partner/opportunities");
  revalidatePath("/dashboard/admin/opportunities");
  revalidatePath("/dashboard/notifications");
}

function hasOrganizationAccess(
  organizationIds: string[],
  organizationId: string,
) {
  return organizationIds.includes(organizationId);
}

export async function savePartnerOpportunity(
  _previousState: PartnerOpportunityActionState,
  formData: FormData,
): Promise<PartnerOpportunityActionState> {
  const context = await getCurrentPartnerContext();
  const validation = validatePartnerOpportunityForm(formData);
  const rateLimit = await enforceRateLimit({
    action: "partner_mutation",
    identifier: `user:${context.user.id}`,
    limit: 100,
    windowSeconds: 60 * 60,
  });

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

  if (
    !hasOrganizationAccess(
      context.organizationIds,
      validation.data.organizationId,
    )
  ) {
    return {
      fieldErrors: {
        organizationId: "Choose one of your linked organizations.",
      },
      formError: "You cannot manage opportunities for that organization.",
      values: validation.values,
    };
  }

  const opportunityId = validation.values.opportunityId;

  if (opportunityId) {
    const existingOpportunity = await prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        organizationId: {
          in: context.organizationIds,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existingOpportunity) {
      return {
        fieldErrors: {},
        formError: "Opportunity could not be found.",
        values: validation.values,
      };
    }

    if (
      existingOpportunity.status !== "DRAFT" &&
      existingOpportunity.status !== "REJECTED"
    ) {
      return {
        fieldErrors: {},
        formError: "Only draft or rejected opportunities can be edited.",
        values: validation.values,
      };
    }

    await prisma.opportunity.update({
      where: {
        id: existingOpportunity.id,
      },
      data: {
        ...validation.data,
      },
    });
    await createAuditLog({
      action: "OPPORTUNITY_UPDATED",
      actorId: context.user.id,
      entityId: existingOpportunity.id,
      entityType: "Opportunity",
      metadata: {
        newStatus: existingOpportunity.status,
        previousStatus: existingOpportunity.status,
        source: "partner",
        title: validation.data.title,
      },
    });

    revalidatePartnerOpportunityPaths();
    redirect(
      `/dashboard/partner/opportunities/${existingOpportunity.id}/edit?saved=1`,
    );
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      ...validation.data,
      status: "DRAFT",
    },
    select: {
      id: true,
    },
  });
  await createAuditLog({
    action: "OPPORTUNITY_CREATED",
    actorId: context.user.id,
    entityId: opportunity.id,
    entityType: "Opportunity",
    metadata: {
      organizationId: validation.data.organizationId,
      source: "partner",
      status: "DRAFT",
      title: validation.data.title,
    },
  });

  revalidatePartnerOpportunityPaths();
  redirect(`/dashboard/partner/opportunities/${opportunity.id}/edit?saved=1`);
}

export async function submitPartnerOpportunityForApproval(formData: FormData) {
  const context = await getCurrentPartnerContext();
  const opportunityId = getString(formData, "opportunityId");
  const rateLimit = await enforceRateLimit({
    action: "partner_mutation",
    identifier: `user:${context.user.id}`,
    limit: 100,
    windowSeconds: 60 * 60,
  });

  if (!opportunityId) {
    redirect("/dashboard/partner/opportunities");
  }

  if (!rateLimit.allowed) {
    redirect(
      `/dashboard/partner/opportunities?error=${encodeURIComponent(formatRateLimitMessage(rateLimit))}`,
    );
  }

  const opportunity = await prisma.opportunity.findFirst({
    where: {
      id: opportunityId,
      organizationId: {
        in: context.organizationIds,
      },
      status: {
        in: ["DRAFT", "REJECTED"],
      },
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (opportunity) {
    await prisma.opportunity.update({
      where: {
        id: opportunity.id,
      },
      data: {
        status: "PENDING_APPROVAL",
      },
    });
    const adminUsers = await getUsersByRoles(["ADMIN", "SUPER_ADMIN"]);

    await Promise.all([
      createNotifications(
        adminUsers.map((adminUser) => adminUser.id),
        {
          body: `${opportunity.title} was submitted for approval.`,
          title: "Opportunity awaiting approval",
        },
      ),
      createAuditLog({
        action: "OPPORTUNITY_SUBMITTED_FOR_APPROVAL",
        actorId: context.user.id,
        entityId: opportunity.id,
        entityType: "Opportunity",
        metadata: {
          newStatus: "PENDING_APPROVAL",
          title: opportunity.title,
        },
      }),
    ]);
  }

  revalidatePartnerOpportunityPaths();
  redirect("/dashboard/partner/opportunities");
}

async function updatePublishedPartnerOpportunityStatus(
  formData: FormData,
  status: "ARCHIVED" | "CLOSED",
) {
  const context = await getCurrentPartnerContext();
  const opportunityId = getString(formData, "opportunityId");
  const redirectTo =
    getString(formData, "redirectTo") || "/dashboard/partner/opportunities";
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

  if (opportunityId) {
    const opportunity = await prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        organizationId: {
          in: context.organizationIds,
        },
        status: "PUBLISHED",
      },
      select: {
        id: true,
        status: true,
        title: true,
      },
    });

    if (opportunity) {
      await prisma.opportunity.update({
        where: {
          id: opportunity.id,
        },
        data: {
          status,
        },
      });
      await createAuditLog({
        action: `OPPORTUNITY_${status}`,
        actorId: context.user.id,
        entityId: opportunity.id,
        entityType: "Opportunity",
        metadata: {
          newStatus: status,
          previousStatus: opportunity.status,
          source: "partner",
          title: opportunity.title,
        },
      });
    }
  }

  revalidatePartnerOpportunityPaths();
  redirect(redirectTo);
}

export async function archivePartnerOpportunity(formData: FormData) {
  await updatePublishedPartnerOpportunityStatus(formData, "ARCHIVED");
}

export async function closePartnerOpportunity(formData: FormData) {
  await updatePublishedPartnerOpportunityStatus(formData, "CLOSED");
}
