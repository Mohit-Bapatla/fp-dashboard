"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit/audit-log";
import { prisma } from "@/lib/db/prisma";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { getCompletedStudentProfile } from "@/lib/student/profile-completion";
import { savedOpportunityOwnership } from "@/lib/student/owned-records";
import { studentDirectoryOpportunityWhere } from "@/lib/opportunities/student-visibility";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}
function revalidate(opportunityId: string) {
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/saved");
  revalidatePath("/dashboard/student/opportunities");
  revalidatePath(`/dashboard/student/opportunities/${opportunityId}`);
}
async function baseContext(formData: FormData) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const opportunityId = value(formData, "opportunityId");
  const profile = getCompletedStudentProfile(user.studentProfile);
  if (!profile || !opportunityId) return null;
  const rate = await enforceRateLimit({
    action: "saved_opportunity_mutation",
    identifier: `user:${user.id}`,
    limit: 60,
    windowSeconds: 3600,
  });
  if (!rate.allowed) return null;
  return { opportunityId, profileId: profile.id, userId: user.id };
}
async function visibleOpportunityContext(formData: FormData) {
  const ctx = await baseContext(formData);
  if (!ctx) return null;
  const opportunity = await prisma.opportunity.findFirst({
    where: { ...studentDirectoryOpportunityWhere(), id: ctx.opportunityId },
    select: { id: true },
  });
  return opportunity ? ctx : null;
}
async function savedRecordContext(formData: FormData) {
  const ctx = await baseContext(formData);
  if (!ctx) return null;
  const saved = await prisma.savedOpportunity.findFirst({
    where: savedOpportunityOwnership(ctx.profileId, ctx.opportunityId),
    select: { id: true },
  });
  return saved ? ctx : null;
}

export async function saveOpportunity(formData: FormData) {
  const ctx = await visibleOpportunityContext(formData);
  if (!ctx) return;
  const saved = await prisma.savedOpportunity.upsert({
    where: {
      studentProfileId_opportunityId: {
        studentProfileId: ctx.profileId,
        opportunityId: ctx.opportunityId,
      },
    },
    create: {
      studentProfileId: ctx.profileId,
      opportunityId: ctx.opportunityId,
    },
    update: { dismissedAt: null },
    select: { id: true },
  });
  await createAuditLog({
    action: "OPPORTUNITY_SAVED",
    actorId: ctx.userId,
    entityId: saved.id,
    entityType: "SavedOpportunity",
    metadata: { opportunityId: ctx.opportunityId },
  });
  revalidate(ctx.opportunityId);
}
export async function unsaveOpportunity(formData: FormData) {
  const ctx = await savedRecordContext(formData);
  if (!ctx) return;
  await prisma.savedOpportunity.deleteMany({
    where: savedOpportunityOwnership(ctx.profileId, ctx.opportunityId),
  });
  revalidate(ctx.opportunityId);
}
export async function setFollowReopening(formData: FormData) {
  const ctx = await savedRecordContext(formData);
  if (!ctx) return;
  await prisma.savedOpportunity.updateMany({
    where: savedOpportunityOwnership(ctx.profileId, ctx.opportunityId),
    data: { followReopening: value(formData, "followReopening") === "true" },
  });
  revalidate(ctx.opportunityId);
}
export async function dismissRecommendation(formData: FormData) {
  const ctx = await visibleOpportunityContext(formData);
  if (!ctx) return;
  await prisma.savedOpportunity.upsert({
    where: {
      studentProfileId_opportunityId: {
        studentProfileId: ctx.profileId,
        opportunityId: ctx.opportunityId,
      },
    },
    create: {
      studentProfileId: ctx.profileId,
      opportunityId: ctx.opportunityId,
      dismissedAt: new Date(),
    },
    update: { dismissedAt: new Date() },
  });
  revalidate(ctx.opportunityId);
}
