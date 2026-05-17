"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertAdminAccess } from "@/lib/admin/authorization";
import type {
  OpportunityActionState,
  PartnerOrganizationActionState,
} from "@/lib/admin/opportunity-validation";
import {
  validateOpportunityForm,
  validatePartnerOrganizationForm,
} from "@/lib/admin/opportunity-validation";
import { prisma } from "@/lib/db/prisma";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function revalidateAdminOpportunityPaths() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/opportunities");
}

export async function saveOpportunity(
  _previousState: OpportunityActionState,
  formData: FormData,
): Promise<OpportunityActionState> {
  await assertAdminAccess();

  const validation = validateOpportunityForm(formData);

  if (!validation.success) {
    return {
      fieldErrors: validation.errors,
      formError: "Please fix the highlighted fields.",
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

  revalidateAdminOpportunityPaths();
  redirect(`/dashboard/admin/opportunities/${opportunity.id}/edit?saved=1`);
}

export async function createPartnerOrganization(
  _previousState: PartnerOrganizationActionState,
  formData: FormData,
): Promise<PartnerOrganizationActionState> {
  await assertAdminAccess();

  const validation = validatePartnerOrganizationForm(formData);

  if (!validation.success) {
    return {
      fieldErrors: validation.errors,
      formError: "Please fix the highlighted fields.",
      values: validation.values,
    };
  }

  const redirectTo =
    getString(formData, "redirectTo") || "/dashboard/admin/opportunities/new";

  try {
    await prisma.partnerOrganization.create({
      data: validation.data,
    });
  } catch {
    return {
      fieldErrors: {
        name: "Use a unique organization name.",
      },
      formError: "Partner organization could not be created.",
      values: validation.values,
    };
  }

  revalidateAdminOpportunityPaths();
  redirect(`${redirectTo}?partnerCreated=1`);
}

async function updateOpportunityStatus(
  formData: FormData,
  status: "PUBLISHED" | "ARCHIVED" | "CLOSED",
) {
  await assertAdminAccess();

  const opportunityId = getString(formData, "opportunityId");
  const redirectTo =
    getString(formData, "redirectTo") || "/dashboard/admin/opportunities";

  if (opportunityId) {
    await prisma.opportunity.update({
      where: {
        id: opportunityId,
      },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : undefined,
      },
    });
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
