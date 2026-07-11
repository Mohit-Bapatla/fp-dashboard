"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/audit/audit-log";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { applicationOwnership } from "@/lib/student/owned-records";

const value = (data: FormData, key: string) => { const item = data.get(key); return typeof item === "string" ? item.trim() : ""; };
export async function startApplicationWorkspace(formData: FormData) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const opportunityId = value(formData, "opportunityId");
  if (!user.studentProfile || !opportunityId) return;
  const rate = await enforceRateLimit({ action: "application_workspace_mutation", identifier: `user:${user.id}`, limit: 30, windowSeconds: 3600 });
  if (!rate.allowed) return;
  const opportunity = await prisma.opportunity.findFirst({ where: { id: opportunityId, status: "PUBLISHED" }, select: { id: true, deadline: true, requiredDocuments: true, essayQuestionCount: true } });
  if (!opportunity) return;
  const existing = await prisma.application.findUnique({ where: { studentProfileId_opportunityId: { studentProfileId: user.studentProfile.id, opportunityId } }, select: { id: true, status: true } });
  if (existing && !["DRAFT", "SAVED", "PLANNING", "PREPARING", "WAITING_FOR_RECOMMENDATION", "READY_TO_SUBMIT"].includes(existing.status)) redirect(`/dashboard/student/applications/${existing.id}`);
  const application = await prisma.application.upsert({ where: { studentProfileId_opportunityId: { studentProfileId: user.studentProfile.id, opportunityId } }, create: { studentProfileId: user.studentProfile.id, opportunityId, status: "PREPARING", targetDeadline: opportunity.deadline, nextAction: "Review the official application requirements.", lastActivityAt: new Date() }, update: { status: existing?.status === "DRAFT" ? "PREPARING" : undefined, lastActivityAt: new Date() }, select: { id: true } });
  const labels = [...opportunity.requiredDocuments, "Select a resume", ...(opportunity.essayQuestionCount ? [`Prepare ${opportunity.essayQuestionCount} essay response${opportunity.essayQuestionCount === 1 ? "" : "s"}`] : []), "Confirm submission in the host portal"];
  await prisma.applicationChecklistItem.createMany({ data: labels.map((label, sortOrder) => ({ applicationId: application.id, label, required: true, source: "OPPORTUNITY", sortOrder })), skipDuplicates: true });
  await createAuditLog({ action: "APPLICATION_WORKSPACE_STARTED", actorId: user.id, entityId: application.id, entityType: "Application", metadata: { opportunityId } });
  revalidatePath("/dashboard/student/applications");
  redirect(`/dashboard/student/applications/${application.id}`);
}

export async function updateApplicationWorkspace(formData: FormData) {
  const { userId } = await assertStudentAccess(); const user = await getCurrentStudentProfile(userId); if (!user.studentProfile) return;
  const applicationId = value(formData, "applicationId");
  const application = await prisma.application.findFirst({ where: { ...applicationOwnership(user.studentProfile.id, applicationId), status: { in: ["DRAFT", "SAVED", "PLANNING", "PREPARING", "WAITING_FOR_RECOMMENDATION", "READY_TO_SUBMIT"] } }, select: { id: true } });
  if (!application) return;
  const percent = Math.max(0, Math.min(100, Number.parseInt(value(formData, "completionPercent"), 10) || 0));
  await prisma.application.update({ where: { id: application.id }, data: { completionPercent: percent, nextAction: value(formData, "nextAction") || null, privateNotes: value(formData, "privateNotes") || null, lastActivityAt: new Date() } });
  revalidatePath(`/dashboard/student/applications/${application.id}`);
}
