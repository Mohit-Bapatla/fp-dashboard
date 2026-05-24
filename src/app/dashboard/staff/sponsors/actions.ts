"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type {
  SponsorInteractionType,
  SponsorStatus,
} from "@/generated/prisma/enums";
import {
  createAuditLog,
  getActorIdFromClerkUserId,
} from "@/lib/audit/audit-log";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import {
  sponsorInteractionTypes,
  sponsorStatuses,
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

function getSafeSponsorRedirect(formData: FormData) {
  const redirectTo = getString(formData, "redirectTo");

  return redirectTo.startsWith("/dashboard")
    ? redirectTo
    : "/dashboard/staff/sponsors";
}

function revalidateSponsorPaths(redirectTo: string) {
  revalidatePath(redirectTo);
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/staff/sponsors");
  revalidatePath("/dashboard/staff/sponsorships");
  revalidatePath("/dashboard/admin/sponsorships");
}

export async function saveSponsorOrganization(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const sponsorId = getString(formData, "sponsorId");
  const name = getString(formData, "name");
  const status = getString(formData, "status") as SponsorStatus;
  const redirectTo = getSafeSponsorRedirect(formData);

  if (!name || !sponsorStatuses.includes(status)) {
    redirect(redirectTo);
  }

  const data = {
    contactEmail: getNullableString(formData, "contactEmail"),
    description: getNullableString(formData, "description"),
    donationUrl: getNullableString(formData, "donationUrl"),
    location: getNullableString(formData, "location"),
    name,
    status,
    website: getNullableString(formData, "website"),
  };

  if (sponsorId) {
    const existing = await prisma.sponsorOrganization.findUnique({
      where: {
        id: sponsorId,
      },
      select: {
        status: true,
      },
    });

    if (!existing) {
      redirect(redirectTo);
    }

    await prisma.sponsorOrganization.update({
      where: {
        id: sponsorId,
      },
      data,
    });
    await createAuditLog({
      action: "SPONSOR_ORGANIZATION_UPDATED",
      actorId,
      entityId: sponsorId,
      entityType: "SponsorOrganization",
      metadata: {
        name,
        newStatus: status,
        previousStatus: existing.status,
      },
    });
  } else {
    const sponsor = await prisma.sponsorOrganization.create({
      data,
      select: {
        id: true,
      },
    });
    await createAuditLog({
      action: "SPONSOR_ORGANIZATION_CREATED",
      actorId,
      entityId: sponsor.id,
      entityType: "SponsorOrganization",
      metadata: {
        name,
        status,
      },
    });
  }

  revalidateSponsorPaths(redirectTo);
  redirect(redirectTo);
}

export async function saveSponsorContact(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const contactId = getString(formData, "contactId");
  const sponsorOrganizationId = getString(formData, "sponsorOrganizationId");
  const firstName = getString(formData, "firstName");
  const redirectTo = getSafeSponsorRedirect(formData);

  if (!sponsorOrganizationId || !firstName) {
    redirect(redirectTo);
  }

  const sponsor = await prisma.sponsorOrganization.findUnique({
    where: {
      id: sponsorOrganizationId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!sponsor) {
    redirect(redirectTo);
  }

  const data = {
    email: getNullableString(formData, "email"),
    firstName,
    lastContactedAt: getOptionalDate(formData, "lastContactedAt"),
    lastName: getNullableString(formData, "lastName"),
    nextFollowUpAt: getOptionalDate(formData, "nextFollowUpAt"),
    notes: getNullableString(formData, "notes"),
    phone: getNullableString(formData, "phone"),
    sponsorOrganizationId: sponsor.id,
    title: getNullableString(formData, "title"),
  };

  if (contactId) {
    await prisma.sponsorContact.update({
      where: {
        id: contactId,
      },
      data,
    });
    await createAuditLog({
      action: "SPONSOR_CONTACT_UPDATED",
      actorId,
      entityId: contactId,
      entityType: "SponsorContact",
      metadata: {
        firstName,
        sponsorOrganizationId: sponsor.id,
      },
    });
  } else {
    const contact = await prisma.sponsorContact.create({
      data,
      select: {
        id: true,
      },
    });
    await createAuditLog({
      action: "SPONSOR_CONTACT_CREATED",
      actorId,
      entityId: contact.id,
      entityType: "SponsorContact",
      metadata: {
        firstName,
        sponsorOrganizationId: sponsor.id,
      },
    });
  }

  revalidateSponsorPaths(redirectTo);
  redirect(redirectTo);
}

export async function saveSponsorInteraction(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const sponsorOrganizationId = getString(formData, "sponsorOrganizationId");
  const contactId = getString(formData, "contactId");
  const type = getString(formData, "type") as SponsorInteractionType;
  const body = getString(formData, "body");
  const redirectTo = getSafeSponsorRedirect(formData);

  if (
    !sponsorOrganizationId ||
    !body ||
    !sponsorInteractionTypes.includes(type)
  ) {
    redirect(redirectTo);
  }

  const contact = contactId
    ? await prisma.sponsorContact.findFirst({
        where: {
          id: contactId,
          sponsorOrganizationId,
        },
        select: {
          id: true,
        },
      })
    : null;

  const interaction = await prisma.sponsorInteraction.create({
    data: {
      authorId: actorId,
      body,
      contactId: contact?.id ?? null,
      occurredAt: getOptionalDate(formData, "occurredAt") ?? new Date(),
      sponsorOrganizationId,
      type,
    },
    select: {
      id: true,
    },
  });

  await createAuditLog({
    action: "SPONSOR_INTERACTION_CREATED",
    actorId,
    entityId: interaction.id,
    entityType: "SponsorInteraction",
    metadata: {
      sponsorOrganizationId,
      type,
    },
  });

  revalidateSponsorPaths(redirectTo);
  redirect(redirectTo);
}
