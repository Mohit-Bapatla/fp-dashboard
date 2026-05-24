"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type {
  SponsorDeliverableStatus,
  SponsorDeliverableType,
  SponsorshipCampaignStatus,
  SponsorshipCommitmentStatus,
} from "@/generated/prisma/enums";
import {
  createAuditLog,
  getActorIdFromClerkUserId,
} from "@/lib/audit/audit-log";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import {
  dollarsToCents,
  sponsorDeliverableStatuses,
  sponsorDeliverableTypes,
  sponsorshipCampaignStatuses,
  sponsorshipCommitmentStatuses,
} from "@/lib/sponsorships/sponsorships";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);

  return value || null;
}

function getOptionalDate(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getSafeSponsorshipRedirect(formData: FormData) {
  const redirectTo = getString(formData, "redirectTo");

  return redirectTo.startsWith("/dashboard")
    ? redirectTo
    : "/dashboard/staff/sponsorships";
}

function revalidateSponsorshipPaths(redirectTo: string) {
  revalidatePath(redirectTo);
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/staff/sponsors");
  revalidatePath("/dashboard/staff/sponsorships");
  revalidatePath("/dashboard/admin/sponsorships");
}

export async function saveSponsorshipCampaign(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const campaignId = getString(formData, "campaignId");
  const name = getString(formData, "name");
  const status = getString(formData, "status") as SponsorshipCampaignStatus;
  const redirectTo = getSafeSponsorshipRedirect(formData);

  if (!name || !sponsorshipCampaignStatuses.includes(status)) {
    redirect(redirectTo);
  }

  const data = {
    description: getNullableString(formData, "description"),
    endAt: getOptionalDate(formData, "endAt"),
    goalAmountCents: dollarsToCents(getString(formData, "goalAmount")),
    name,
    startAt: getOptionalDate(formData, "startAt"),
    status,
  };

  if (campaignId) {
    const existing = await prisma.sponsorshipCampaign.findUnique({
      where: {
        id: campaignId,
      },
      select: {
        status: true,
      },
    });

    if (!existing) {
      redirect(redirectTo);
    }

    await prisma.sponsorshipCampaign.update({
      where: {
        id: campaignId,
      },
      data,
    });
    await createAuditLog({
      action: "SPONSORSHIP_CAMPAIGN_UPDATED",
      actorId,
      entityId: campaignId,
      entityType: "SponsorshipCampaign",
      metadata: {
        name,
        newStatus: status,
        previousStatus: existing.status,
      },
    });
  } else {
    const campaign = await prisma.sponsorshipCampaign.create({
      data,
      select: {
        id: true,
      },
    });
    await createAuditLog({
      action: "SPONSORSHIP_CAMPAIGN_CREATED",
      actorId,
      entityId: campaign.id,
      entityType: "SponsorshipCampaign",
      metadata: {
        name,
        status,
      },
    });
  }

  revalidateSponsorshipPaths(redirectTo);
  redirect(redirectTo);
}

export async function saveSponsorshipCommitment(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const commitmentId = getString(formData, "commitmentId");
  const sponsorOrganizationId = getString(formData, "sponsorOrganizationId");
  const campaignId = getString(formData, "campaignId");
  const status = getString(formData, "status") as SponsorshipCommitmentStatus;
  const redirectTo = getSafeSponsorshipRedirect(formData);

  if (
    !sponsorOrganizationId ||
    !sponsorshipCommitmentStatuses.includes(status)
  ) {
    redirect(redirectTo);
  }

  const data = {
    amountCents: dollarsToCents(getString(formData, "amount")),
    campaignId: campaignId || null,
    committedAt: getOptionalDate(formData, "committedAt"),
    notes: getNullableString(formData, "notes"),
    receivedAt: getOptionalDate(formData, "receivedAt"),
    sponsorOrganizationId,
    status,
  };

  if (commitmentId) {
    const existing = await prisma.sponsorshipCommitment.findUnique({
      where: {
        id: commitmentId,
      },
      select: {
        status: true,
      },
    });

    if (!existing) {
      redirect(redirectTo);
    }

    await prisma.sponsorshipCommitment.update({
      where: {
        id: commitmentId,
      },
      data,
    });
    await createAuditLog({
      action: "SPONSORSHIP_COMMITMENT_UPDATED",
      actorId,
      entityId: commitmentId,
      entityType: "SponsorshipCommitment",
      metadata: {
        newStatus: status,
        previousStatus: existing.status,
        sponsorOrganizationId,
      },
    });
  } else {
    const commitment = await prisma.sponsorshipCommitment.create({
      data,
      select: {
        id: true,
      },
    });
    await createAuditLog({
      action: "SPONSORSHIP_COMMITMENT_CREATED",
      actorId,
      entityId: commitment.id,
      entityType: "SponsorshipCommitment",
      metadata: {
        sponsorOrganizationId,
        status,
      },
    });
  }

  revalidateSponsorshipPaths(redirectTo);
  redirect(redirectTo);
}

export async function saveSponsorDeliverable(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const deliverableId = getString(formData, "deliverableId");
  const commitmentId = getString(formData, "commitmentId");
  const type = getString(formData, "type") as SponsorDeliverableType;
  const status = getString(formData, "status") as SponsorDeliverableStatus;
  const redirectTo = getSafeSponsorshipRedirect(formData);

  if (
    !commitmentId ||
    !sponsorDeliverableTypes.includes(type) ||
    !sponsorDeliverableStatuses.includes(status)
  ) {
    redirect(redirectTo);
  }

  const data = {
    commitmentId,
    completedAt: status === "COMPLETED" ? new Date() : null,
    dueAt: getOptionalDate(formData, "dueAt"),
    notes: getNullableString(formData, "notes"),
    status,
    type,
  };

  if (deliverableId) {
    const existing = await prisma.sponsorDeliverable.findUnique({
      where: {
        id: deliverableId,
      },
      select: {
        status: true,
      },
    });

    if (!existing) {
      redirect(redirectTo);
    }

    await prisma.sponsorDeliverable.update({
      where: {
        id: deliverableId,
      },
      data,
    });
    await createAuditLog({
      action: "SPONSOR_DELIVERABLE_UPDATED",
      actorId,
      entityId: deliverableId,
      entityType: "SponsorDeliverable",
      metadata: {
        commitmentId,
        newStatus: status,
        previousStatus: existing.status,
        type,
      },
    });
  } else {
    const deliverable = await prisma.sponsorDeliverable.create({
      data,
      select: {
        id: true,
      },
    });
    await createAuditLog({
      action: "SPONSOR_DELIVERABLE_CREATED",
      actorId,
      entityId: deliverable.id,
      entityType: "SponsorDeliverable",
      metadata: {
        commitmentId,
        status,
        type,
      },
    });
  }

  revalidateSponsorshipPaths(redirectTo);
  redirect(redirectTo);
}
