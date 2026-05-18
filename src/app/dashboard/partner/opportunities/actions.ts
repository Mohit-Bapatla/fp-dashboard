"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { PartnerOpportunityActionState } from "@/lib/partner/opportunity-validation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentPartnerContext } from "@/lib/partner/context";
import { validatePartnerOpportunityForm } from "@/lib/partner/opportunity-validation";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function revalidatePartnerOpportunityPaths() {
  revalidatePath("/dashboard/partner");
  revalidatePath("/dashboard/partner/opportunities");
  revalidatePath("/dashboard/admin/opportunities");
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

  if (!validation.success) {
    return {
      fieldErrors: validation.errors,
      formError: "Please fix the highlighted fields.",
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

  revalidatePartnerOpportunityPaths();
  redirect(`/dashboard/partner/opportunities/${opportunity.id}/edit?saved=1`);
}

export async function submitPartnerOpportunityForApproval(formData: FormData) {
  const context = await getCurrentPartnerContext();
  const opportunityId = getString(formData, "opportunityId");

  if (!opportunityId) {
    redirect("/dashboard/partner/opportunities");
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
