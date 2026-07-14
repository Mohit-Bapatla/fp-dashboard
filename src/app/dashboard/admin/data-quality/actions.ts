"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAuditLog,
  getActorIdFromClerkUserId,
} from "@/lib/audit/audit-log";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { prisma } from "@/lib/db/prisma";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function revalidateDataQualityPaths() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/data-quality");
  revalidatePath("/dashboard/admin/opportunities");
  revalidatePath("/dashboard/admin/audit-logs");
}

export async function acknowledgeDataQualityIssue(formData: FormData) {
  const { userId } = await assertAdminAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const entityType = getString(formData, "entityType");
  const entityId = getString(formData, "entityId");
  const issueKey = getString(formData, "issueKey");
  const notes = getString(formData, "notes");

  if (!actorId || !entityType || !entityId || !issueKey) {
    redirect("/dashboard/admin/data-quality");
  }

  await prisma.dataQualityAcknowledgement.upsert({
    where: {
      entityType_entityId_issueKey: {
        entityId,
        entityType,
        issueKey,
      },
    },
    update: {
      acknowledgedById: actorId,
      notes: notes || null,
    },
    create: {
      acknowledgedById: actorId,
      entityId,
      entityType,
      issueKey,
      notes: notes || null,
    },
  });

  await createAuditLog({
    action: "DATA_QUALITY_ISSUE_ACKNOWLEDGED",
    actorId,
    entityId,
    entityType,
    metadata: {
      issueKey,
      notes: notes || null,
    },
  });

  revalidateDataQualityPaths();
  redirect("/dashboard/admin/data-quality");
}

export async function archiveExpiredOpportunity(formData: FormData) {
  const { userId } = await assertAdminAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const opportunityId = getString(formData, "opportunityId");

  if (!actorId || !opportunityId) {
    redirect("/dashboard/admin/data-quality");
  }

  const opportunity = await prisma.opportunity.findFirst({
    where: {
      deadline: {
        lt: new Date(),
      },
      id: opportunityId,
      organization: { isSystemPlaceholder: false },
      visibility: "PUBLIC_DIRECTORY",
      status: "PUBLISHED",
    },
    select: {
      deadline: true,
      id: true,
      status: true,
      title: true,
    },
  });

  if (!opportunity) {
    redirect("/dashboard/admin/data-quality");
  }

  await prisma.opportunity.update({
    where: {
      id: opportunity.id,
    },
    data: {
      moderatedAt: new Date(),
      moderatedById: actorId,
      status: "ARCHIVED",
    },
  });

  await createAuditLog({
    action: "DATA_QUALITY_EXPIRED_OPPORTUNITY_ARCHIVED",
    actorId,
    entityId: opportunity.id,
    entityType: "Opportunity",
    metadata: {
      deadline: opportunity.deadline?.toISOString() ?? null,
      previousStatus: opportunity.status,
      title: opportunity.title,
    },
  });

  revalidateDataQualityPaths();
  redirect("/dashboard/admin/data-quality");
}
