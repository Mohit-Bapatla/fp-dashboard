"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/audit/audit-log";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { applicationOwnership } from "@/lib/student/owned-records";
import {
  canSubmitExistingApplication,
  getEffectiveApplicationMethod,
} from "@/lib/student/application-workspace";
import { studentApplicationOpportunityWhere } from "@/lib/opportunities/student-visibility";

const value = (data: FormData, key: string) => {
  const item = data.get(key);
  return typeof item === "string" ? item.trim() : "";
};
export async function startApplicationWorkspace(formData: FormData) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const opportunityId = value(formData, "opportunityId");
  if (!user.studentProfile || !opportunityId) return;
  const rate = await enforceRateLimit({
    action: "application_workspace_mutation",
    identifier: `user:${user.id}`,
    limit: 30,
    windowSeconds: 3600,
  });
  if (!rate.allowed) return;
  const opportunity = await prisma.opportunity.findFirst({
    where: studentApplicationOpportunityWhere(opportunityId),
    select: {
      id: true,
      applicationMethod: true,
      relationshipType: true,
      deadline: true,
      requiredDocuments: true,
      essayQuestionCount: true,
    },
  });
  if (!opportunity) return;
  const existing = await prisma.application.findUnique({
    where: {
      studentProfileId_opportunityId: {
        studentProfileId: user.studentProfile.id,
        opportunityId,
      },
    },
    select: { id: true, status: true },
  });
  if (existing && !canSubmitExistingApplication(existing.status))
    redirect(`/dashboard/student/applications/${existing.id}`);
  const applicationMethod = getEffectiveApplicationMethod(
    opportunity.relationshipType,
    opportunity.applicationMethod,
  );
  const application = await prisma.application.upsert({
    where: {
      studentProfileId_opportunityId: {
        studentProfileId: user.studentProfile.id,
        opportunityId,
      },
    },
    create: {
      studentProfileId: user.studentProfile.id,
      opportunityId,
      applicationMethod,
      status: "PREPARING",
      targetDeadline: opportunity.deadline,
      nextAction: "Review the official application requirements.",
      lastActivityAt: new Date(),
    },
    update: {
      applicationMethod,
      status: existing?.status === "DRAFT" ? "PREPARING" : undefined,
      lastActivityAt: new Date(),
    },
    select: { id: true },
  });
  const labels = [
    ...opportunity.requiredDocuments,
    "Select a resume",
    ...(opportunity.essayQuestionCount
      ? [
          `Prepare ${opportunity.essayQuestionCount} essay response${opportunity.essayQuestionCount === 1 ? "" : "s"}`,
        ]
      : []),
    applicationMethod === "EXTERNAL_PORTAL"
      ? "Confirm submission in the host portal"
      : "Complete the configured Future Physicians submission",
  ];
  await prisma.applicationChecklistItem.createMany({
    data: labels.map((label, sortOrder) => ({
      applicationId: application.id,
      label,
      required: true,
      source: "OPPORTUNITY",
      sortOrder,
    })),
    skipDuplicates: true,
  });
  await createAuditLog({
    action: "APPLICATION_WORKSPACE_STARTED",
    actorId: user.id,
    entityId: application.id,
    entityType: "Application",
    metadata: { opportunityId },
  });
  revalidatePath("/dashboard/student/applications");
  redirect(`/dashboard/student/applications/${application.id}`);
}

export async function updateApplicationWorkspace(formData: FormData) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  if (!user.studentProfile) return;
  const rate = await enforceRateLimit({
    action: "application_workspace_update",
    identifier: `user:${user.id}`,
    limit: 60,
    windowSeconds: 3600,
  });
  if (!rate.allowed) return;
  const applicationId = value(formData, "applicationId");
  const application = await prisma.application.findFirst({
    where: {
      ...applicationOwnership(user.studentProfile.id, applicationId),
      status: {
        in: [
          "DRAFT",
          "SAVED",
          "PLANNING",
          "PREPARING",
          "WAITING_FOR_RECOMMENDATION",
          "READY_TO_SUBMIT",
        ],
      },
    },
    select: { id: true },
  });
  if (!application) return;
  const parsedPercent = Number(value(formData, "completionPercent"));
  const percent = Number.isInteger(parsedPercent)
    ? Math.max(0, Math.min(100, parsedPercent))
    : 0;
  const nextAction = value(formData, "nextAction").slice(0, 300);
  const privateNotes = value(formData, "privateNotes").slice(0, 10_000);
  await prisma.application.update({
    where: { id: application.id },
    data: {
      completionPercent: percent,
      nextAction: nextAction || null,
      privateNotes: privateNotes || null,
      lastActivityAt: new Date(),
    },
  });
  revalidatePath(`/dashboard/student/applications/${application.id}`);
}
