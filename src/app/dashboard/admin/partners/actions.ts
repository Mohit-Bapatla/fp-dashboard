"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { PartnerStatus } from "@/generated/prisma/enums";
import {
  createAuditLog,
  getActorIdFromClerkUserId,
} from "@/lib/audit/audit-log";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { prisma } from "@/lib/db/prisma";
import { createNotifications } from "@/lib/notifications/notifications";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";
import { isStudentExternalOrganizationName } from "@/lib/student/external-opportunity";

const partnerStatuses: PartnerStatus[] = [
  "NOT_CONTACTED",
  "CONTACTED",
  "FOLLOW_UP_NEEDED",
  "INTERESTED",
  "MEETING_SCHEDULED",
  "PARTNERED",
  "REJECTED",
  "NO_RESPONSE",
  "PAUSED",
];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getSafeRedirect(formData: FormData) {
  const redirectTo = getString(formData, "redirectTo");

  return redirectTo.startsWith("/dashboard/admin/partners")
    ? redirectTo
    : "/dashboard/admin/partners";
}

function revalidatePartnerPaths() {
  revalidatePath("/dashboard/admin/partners");
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/partner");
  revalidatePath("/dashboard/partner/organization");
  revalidatePath("/dashboard/notifications");
}

export async function createAdminPartnerOrganization(formData: FormData) {
  const { userId } = await assertAdminAccess();
  const redirectTo = getSafeRedirect(formData);
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

  const actorId = await getActorIdFromClerkUserId(userId);
  const name = getString(formData, "name");
  const statusValue = getString(formData, "status") as PartnerStatus;
  const status = partnerStatuses.includes(statusValue)
    ? statusValue
    : "NOT_CONTACTED";

  if (!name) {
    redirect(`${redirectTo}?partnerError=missing-name`);
  }
  if (isStudentExternalOrganizationName(name)) {
    redirect(`${redirectTo}?partnerError=reserved-name`);
  }

  const organization = await prisma.partnerOrganization.upsert({
    where: {
      name,
    },
    create: {
      city: getString(formData, "city") || null,
      contactEmail: getString(formData, "contactEmail") || null,
      country: getString(formData, "country") || null,
      description: getString(formData, "description") || null,
      location: getString(formData, "location") || null,
      name,
      state: getString(formData, "state") || null,
      status,
      type: getString(formData, "type") || null,
      website: getString(formData, "website") || null,
    },
    update: {
      city: getString(formData, "city") || undefined,
      contactEmail: getString(formData, "contactEmail") || undefined,
      country: getString(formData, "country") || undefined,
      description: getString(formData, "description") || undefined,
      location: getString(formData, "location") || undefined,
      state: getString(formData, "state") || undefined,
      status,
      type: getString(formData, "type") || undefined,
      website: getString(formData, "website") || undefined,
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  await createAuditLog({
    action: "PARTNER_ORGANIZATION_ADMIN_UPSERTED",
    actorId,
    entityId: organization.id,
    entityType: "PartnerOrganization",
    metadata: {
      name: organization.name,
      status: organization.status,
    },
  });

  revalidatePartnerPaths();
  redirect(`${redirectTo}?partnerSaved=1`);
}

export async function linkPartnerUserToOrganization(formData: FormData) {
  const { userId } = await assertAdminAccess();
  const redirectTo = getSafeRedirect(formData);
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

  const actorId = await getActorIdFromClerkUserId(userId);
  const partnerUserId = getString(formData, "partnerUserId");
  const organizationId = getString(formData, "organizationId");
  const title = getString(formData, "title");

  if (!partnerUserId || !organizationId) {
    redirect(`${redirectTo}?linkError=missing-fields`);
  }

  const [partnerUser, organization] = await Promise.all([
    prisma.user.findFirst({
      where: {
        id: partnerUserId,
        role: "PARTNER",
      },
      select: {
        id: true,
      },
    }),
    prisma.partnerOrganization.findFirst({
      where: {
        id: organizationId,
        isSystemPlaceholder: false,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    }),
  ]);

  if (!partnerUser || !organization) {
    redirect(`${redirectTo}?linkError=not-found`);
  }

  const existingMembershipCount = await prisma.partnerMember.count({
    where: {
      userId: partnerUser.id,
    },
  });

  await prisma.$transaction([
    prisma.partnerMember.upsert({
      where: {
        userId_organizationId: {
          organizationId: organization.id,
          userId: partnerUser.id,
        },
      },
      create: {
        isPrimary: existingMembershipCount === 0,
        organizationId: organization.id,
        title: title || null,
        userId: partnerUser.id,
      },
      update: {
        title: title || null,
      },
    }),
    prisma.partnerOrganization.update({
      where: {
        id: organization.id,
      },
      data: {
        status: organization.status === "PARTNERED" ? undefined : "PARTNERED",
      },
    }),
  ]);

  await Promise.all([
    createNotifications([partnerUser.id], {
      body: `Your partner account is now linked to ${organization.name}.`,
      title: "Organization connected",
    }),
    createAuditLog({
      action: "PARTNER_USER_LINKED_TO_ORGANIZATION",
      actorId,
      entityId: organization.id,
      entityType: "PartnerOrganization",
      metadata: {
        organizationName: organization.name,
        partnerUserId: partnerUser.id,
      },
    }),
  ]);

  revalidatePartnerPaths();
  redirect(`${redirectTo}?partnerLinked=1`);
}
