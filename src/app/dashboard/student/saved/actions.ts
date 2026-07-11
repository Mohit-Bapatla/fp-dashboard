"use server";

import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit/audit-log";
import { prisma } from "@/lib/db/prisma";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { savedOpportunityOwnership } from "@/lib/student/owned-records";

function value(formData: FormData, key: string) { const item = formData.get(key); return typeof item === "string" ? item.trim() : ""; }
function revalidate(opportunityId: string) {
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/saved");
  revalidatePath("/dashboard/student/opportunities");
  revalidatePath(`/dashboard/student/opportunities/${opportunityId}`);
}
async function context(formData: FormData) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const opportunityId = value(formData, "opportunityId");
  if (!user.studentProfile || !opportunityId) return null;
  const rate = await enforceRateLimit({ action: "saved_opportunity_mutation", identifier: `user:${user.id}`, limit: 60, windowSeconds: 3600 });
  if (!rate.allowed) return null;
  const opportunity = await prisma.opportunity.findFirst({ where: { id: opportunityId, status: "PUBLISHED" }, select: { id: true } });
  return opportunity ? { opportunityId, profileId: user.studentProfile.id, userId: user.id } : null;
}

export async function saveOpportunity(formData: FormData) {
  const ctx = await context(formData); if (!ctx) return;
  const saved = await prisma.savedOpportunity.upsert({ where: { studentProfileId_opportunityId: { studentProfileId: ctx.profileId, opportunityId: ctx.opportunityId } }, create: { studentProfileId: ctx.profileId, opportunityId: ctx.opportunityId }, update: { dismissedAt: null }, select: { id: true } });
  await createAuditLog({ action: "OPPORTUNITY_SAVED", actorId: ctx.userId, entityId: saved.id, entityType: "SavedOpportunity", metadata: { opportunityId: ctx.opportunityId } });
  revalidate(ctx.opportunityId);
}
export async function unsaveOpportunity(formData: FormData) {
  const ctx = await context(formData); if (!ctx) return;
  await prisma.savedOpportunity.deleteMany({ where: savedOpportunityOwnership(ctx.profileId, ctx.opportunityId) });
  revalidate(ctx.opportunityId);
}
export async function setFollowReopening(formData: FormData) {
  const ctx = await context(formData); if (!ctx) return;
  await prisma.savedOpportunity.updateMany({ where: savedOpportunityOwnership(ctx.profileId, ctx.opportunityId), data: { followReopening: value(formData, "followReopening") === "true" } });
  revalidate(ctx.opportunityId);
}
export async function dismissRecommendation(formData: FormData) {
  const ctx = await context(formData); if (!ctx) return;
  await prisma.savedOpportunity.upsert({ where: { studentProfileId_opportunityId: { studentProfileId: ctx.profileId, opportunityId: ctx.opportunityId } }, create: { studentProfileId: ctx.profileId, opportunityId: ctx.opportunityId, dismissedAt: new Date() }, update: { dismissedAt: new Date() } });
  revalidate(ctx.opportunityId);
}
