"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/audit/audit-log";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { getCompletedStudentProfile } from "@/lib/student/profile-completion";
import { applicationOwnership } from "@/lib/student/owned-records";
import {
  canSubmitExistingApplication,
  getEffectiveApplicationMethod,
  parseApplicationTargetDate,
} from "@/lib/student/application-workspace";
import { logWorkflowFailure } from "@/lib/reliability/workflow-errors";
import { createWorkflowSupportReference } from "@/lib/reliability/workflow-references";
import {
  isStudentOpportunitySubmittable,
  studentAccessiblePreparationOpportunityWhere,
} from "@/lib/opportunities/student-visibility";
import {
  buildInitialApplicationTasks,
  calculateApplicationProgress,
  getApplicationNextAction,
} from "@/lib/student/application-tasks";

const value = (data: FormData, key: string) => {
  const item = data.get(key);
  return typeof item === "string" ? item.trim() : "";
};

function workspaceRedirect(
  applicationId: string,
  status: "conflict" | "error" | "invalid_date" | "rate_limited" | "saved",
  referenceId?: string,
) {
  const params = new URLSearchParams({ workspace: status });

  if (referenceId) {
    params.set("reference", referenceId);
  }

  redirect(
    `/dashboard/student/applications/${applicationId}?${params.toString()}#workspace-plan`,
  );
}

export async function startApplicationWorkspace(formData: FormData) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const opportunityId = value(formData, "opportunityId");
  const profile = getCompletedStudentProfile(user.studentProfile);
  if (!profile || !opportunityId) return;
  const rate = await enforceRateLimit({
    action: "application_workspace_mutation",
    identifier: `user:${user.id}`,
    limit: 30,
    windowSeconds: 3600,
  });
  if (!rate.allowed) return;
  const now = new Date();
  const opportunity = await prisma.opportunity.findFirst({
    where: studentAccessiblePreparationOpportunityWhere(
      opportunityId,
      profile.id,
      now,
    ),
    select: {
      id: true,
      applicationMethod: true,
      availabilityStatus: true,
      relationshipType: true,
      deadline: true,
      opensAt: true,
      requiredDocuments: true,
      essayQuestionCount: true,
      sourceType: true,
      status: true,
      studentOwnerProfileId: true,
      verificationStatus: true,
      visibility: true,
    },
  });
  if (!opportunity) return;
  const existing = await prisma.application.findUnique({
    where: {
      studentProfileId_opportunityId: {
        studentProfileId: profile.id,
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
  const initialTasks = buildInitialApplicationTasks({
    applicationMethod,
    deadline: opportunity.deadline,
    essayQuestionCount: opportunity.essayQuestionCount,
    now,
    opensAt: opportunity.opensAt,
    requiredDocuments: opportunity.requiredDocuments,
    studentProvidedExternal: opportunity.visibility === "STUDENT_PRIVATE",
  });
  const application = await prisma.$transaction(async (tx) => {
    const workspace = await tx.application.upsert({
      where: {
        studentProfileId_opportunityId: {
          studentProfileId: profile.id,
          opportunityId,
        },
      },
      create: {
        studentProfileId: profile.id,
        opportunityId,
        applicationMethod,
        status: "PREPARING",
        targetDeadline: opportunity.deadline,
        lastActivityAt: now,
      },
      update: {
        applicationMethod,
        lastActivityAt: now,
      },
      select: { id: true, status: true },
    });
    if (!canSubmitExistingApplication(workspace.status)) {
      return { ...workspace, planAvailable: false };
    }
    await tx.applicationTask.createMany({
      data: initialTasks.map((task) => ({
        ...task,
        applicationId: workspace.id,
      })),
      skipDuplicates: true,
    });
    const tasks = await tx.applicationTask.findMany({
      where: { applicationId: workspace.id },
      select: {
        applicationId: true,
        completedAt: true,
        dueAt: true,
        id: true,
        required: true,
        sortOrder: true,
        status: true,
        title: true,
        type: true,
      },
    });
    const nextAction = getApplicationNextAction(
      tasks,
      {
        applicationId: workspace.id,
        canSubmit: isStudentOpportunitySubmittable(
          opportunity,
          profile.id,
          now,
        ),
        opportunityId,
      },
      now,
    );
    await tx.application.update({
      where: { id: workspace.id },
      data: {
        completionPercent: calculateApplicationProgress(tasks),
        nextAction: nextAction?.task.title ?? null,
      },
    });
    return { ...workspace, planAvailable: true };
  });
  if (!existing && application.planAvailable) {
    await createAuditLog({
      action: "APPLICATION_WORKSPACE_STARTED",
      actorId: user.id,
      entityId: application.id,
      entityType: "Application",
      metadata: { opportunityId },
    });
  }
  revalidatePath("/dashboard/student/applications");
  redirect(`/dashboard/student/applications/${application.id}`);
}

export async function updateApplicationWorkspace(formData: FormData) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const profile = getCompletedStudentProfile(user.studentProfile);
  if (!profile) return;
  const rate = await enforceRateLimit({
    action: "application_workspace_update",
    identifier: `user:${user.id}`,
    limit: 60,
    windowSeconds: 3600,
  });
  const applicationId = value(formData, "applicationId");
  if (!applicationId) return;
  if (!rate.allowed) {
    workspaceRedirect(applicationId, "rate_limited");
  }
  const privateNotes = value(formData, "privateNotes").slice(0, 10_000);
  const resumeId = value(formData, "resumeId");
  const targetDeadline = parseApplicationTargetDate(
    value(formData, "targetDeadline"),
  );
  if (!targetDeadline.valid) {
    workspaceRedirect(applicationId, "invalid_date");
  }
  const expectedUpdatedAtValue = value(formData, "expectedUpdatedAt");
  const expectedUpdatedAt = new Date(expectedUpdatedAtValue);
  if (
    !expectedUpdatedAtValue ||
    !Number.isFinite(expectedUpdatedAt.getTime()) ||
    expectedUpdatedAt.toISOString() !== expectedUpdatedAtValue
  ) {
    workspaceRedirect(applicationId, "conflict");
  }
  const application = await prisma.application.findFirst({
    where: {
      ...applicationOwnership(profile.id, applicationId),
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
    select: {
      id: true,
      opportunityId: true,
      resumeId: true,
      updatedAt: true,
      opportunity: {
        select: {
          applicationMethod: true,
          availabilityStatus: true,
          deadline: true,
          opensAt: true,
          sourceType: true,
          status: true,
          studentOwnerProfileId: true,
          verificationStatus: true,
          visibility: true,
        },
      },
    },
  });
  if (!application) return;
  if (resumeId) {
    const ownedResume = await prisma.resume.findFirst({
      where: { id: resumeId, studentProfileId: profile.id },
      select: { id: true },
    });
    if (!ownedResume) return;
  }

  const now = new Date();
  let saved = false;
  let failureReference: string | null = null;

  try {
    saved = await prisma.$transaction(async (tx) => {
      const update = await tx.application.updateMany({
        where: {
          id: application.id,
          updatedAt: expectedUpdatedAt,
        },
        data: {
          lastActivityAt: now,
          privateNotes: privateNotes || null,
          resumeId: resumeId || null,
          targetDeadline: targetDeadline.date,
        },
      });
      if (update.count !== 1) {
        return false;
      }
      await tx.applicationTask.updateMany({
        where: {
          applicationId: application.id,
          studentControlled: false,
          type: "SELECT_RESUME",
        },
        data: resumeId
          ? { completedAt: now, status: "COMPLETE" }
          : { completedAt: null, status: "NOT_STARTED" },
      });
      const tasks = await tx.applicationTask.findMany({
        where: { applicationId: application.id },
        select: {
          applicationId: true,
          completedAt: true,
          dueAt: true,
          id: true,
          required: true,
          sortOrder: true,
          status: true,
          title: true,
          type: true,
        },
      });
      const nextAction = getApplicationNextAction(
        tasks,
        {
          applicationId: application.id,
          canSubmit: isStudentOpportunitySubmittable(
            application.opportunity,
            profile.id,
            now,
          ),
          opportunityId: application.opportunityId,
        },
        now,
      );
      await tx.application.update({
        where: { id: application.id },
        data: {
          completionPercent: calculateApplicationProgress(tasks),
          nextAction: nextAction?.task.title ?? null,
        },
      });
      return true;
    });
  } catch (error) {
    failureReference = createWorkflowSupportReference("APP");
    logWorkflowFailure({
      action: "update_application_workspace",
      category: "APP",
      error,
      referenceId: failureReference,
      route: "/dashboard/student/applications/[applicationId]",
      userId: user.id,
    });
  }

  if (failureReference) {
    workspaceRedirect(application.id, "error", failureReference);
  }
  if (!saved) {
    workspaceRedirect(application.id, "conflict");
  }

  try {
    await createAuditLog({
      action: "APPLICATION_WORKSPACE_UPDATED",
      actorId: user.id,
      entityId: application.id,
      entityType: "Application",
      metadata: {
        hasPrivateNotes: Boolean(privateNotes),
        hasResume: Boolean(resumeId),
        hasTargetDeadline: Boolean(targetDeadline.date),
        resumeChanged: application.resumeId !== (resumeId || null),
      },
    });
    if (resumeId && application.resumeId !== resumeId) {
      await createAuditLog({
        action: "RESUME_SELECTED",
        actorId: user.id,
        entityId: application.id,
        entityType: "Application",
        metadata: { resumeId },
      });
    }
  } catch (error) {
    logWorkflowFailure({
      action: "audit_application_workspace_update",
      category: "APP",
      error,
      route: "/dashboard/student/applications/[applicationId]",
      userId: user.id,
    });
  }
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/tasks");
  revalidatePath("/dashboard/student/applications");
  revalidatePath(`/dashboard/student/applications/${application.id}`);
  workspaceRedirect(application.id, "saved");
}
