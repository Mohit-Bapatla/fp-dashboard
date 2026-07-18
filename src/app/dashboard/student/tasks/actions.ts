"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import type { ApplicationTaskStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { isStudentOpportunitySubmittable } from "@/lib/opportunities/student-visibility";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";
import {
  calculateApplicationProgress,
  getApplicationNextAction,
  parseTaskDueDate,
  requiresAuthoritativeApplicationAction,
} from "@/lib/student/application-tasks";
import { canSubmitExistingApplication } from "@/lib/student/application-workspace";
import { assertStudentAccess } from "@/lib/student/authorization";
import {
  applicationOwnership,
  applicationTaskOwnership,
} from "@/lib/student/owned-records";
import { getCurrentStudentProfile } from "@/lib/student/profile";

export type StudentTaskActionState = {
  error: string | null;
  success: string | null;
};

const mutableStatuses = new Set<ApplicationTaskStatus>([
  "NOT_STARTED",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETE",
  "SKIPPED",
]);

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function errorState(error: string): StudentTaskActionState {
  return { error, success: null };
}

function successState(success: string): StudentTaskActionState {
  return { error: null, success };
}

function revalidateTaskPaths(applicationId: string) {
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/tasks");
  revalidatePath("/dashboard/student/applications");
  revalidatePath(`/dashboard/student/applications/${applicationId}`);
}

async function getMutationContext(action: string, limit: number) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);

  if (!user.studentProfile) {
    return {
      ok: false as const,
      error: "Complete your student profile before managing application tasks.",
    };
  }

  const rateLimit = await enforceRateLimit({
    action,
    identifier: `user:${user.id}`,
    limit,
    windowSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      ok: false as const,
      error: formatRateLimitMessage(rateLimit),
    };
  }

  return {
    ok: true as const,
    profileId: user.studentProfile.id,
    userId: user.id,
  };
}

async function refreshApplicationDerivedState(
  tx: Prisma.TransactionClient,
  applicationId: string,
  lastActivityAt: Date,
) {
  const application = await tx.application.findUnique({
    where: { id: applicationId },
    select: {
      opportunityId: true,
      studentProfileId: true,
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

  const tasks = await tx.applicationTask.findMany({
    where: { applicationId },
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
      applicationId,
      canSubmit: isStudentOpportunitySubmittable(
        application.opportunity,
        application.studentProfileId,
        lastActivityAt,
      ),
      opportunityId: application.opportunityId,
    },
    lastActivityAt,
  );

  await tx.application.update({
    where: { id: applicationId },
    data: {
      completionPercent: calculateApplicationProgress(tasks),
      lastActivityAt,
      nextAction: nextAction?.task.title ?? null,
    },
  });
}

function customTaskGuardError(task: {
  application: { status: Parameters<typeof canSubmitExistingApplication>[0] };
  source: string | null;
  studentControlled: boolean;
  type: string;
}) {
  if (
    task.source !== "STUDENT" ||
    task.type !== "CUSTOM" ||
    !task.studentControlled
  ) {
    return "Only private custom tasks can be edited or deleted.";
  }
  if (!canSubmitExistingApplication(task.application.status)) {
    return "Tasks cannot be edited after the application leaves planning.";
  }
  return null;
}

function statusSuccessMessage(status: ApplicationTaskStatus) {
  switch (status) {
    case "COMPLETE":
      return "Task completed.";
    case "IN_PROGRESS":
      return "Task marked in progress.";
    case "BLOCKED":
      return "Task marked blocked.";
    case "SKIPPED":
      return "Optional task skipped.";
    default:
      return "Task reopened.";
  }
}

export async function updateStudentApplicationTaskStatus(
  _previousState: StudentTaskActionState,
  formData: FormData,
): Promise<StudentTaskActionState> {
  const taskId = value(formData, "taskId");
  const requestedStatus = value(formData, "status") as ApplicationTaskStatus;

  if (!taskId || !mutableStatuses.has(requestedStatus)) {
    return errorState("Choose a valid task update.");
  }

  const context = await getMutationContext("application_task_status", 120);
  if (!context.ok) return errorState(context.error);

  const task = await prisma.applicationTask.findFirst({
    where: applicationTaskOwnership(context.profileId, taskId),
    select: {
      applicationId: true,
      id: true,
      required: true,
      source: true,
      status: true,
      type: true,
    },
  });

  if (!task) return errorState("Task was not found.");
  if (
    requiresAuthoritativeApplicationAction(task.type) &&
    requestedStatus === "COMPLETE"
  ) {
    return errorState(
      "Complete this task through the application submission flow.",
    );
  }
  if (
    requiresAuthoritativeApplicationAction(task.type) &&
    task.status === "COMPLETE"
  ) {
    return errorState("Submitted application tasks cannot be reopened here.");
  }
  if (requestedStatus === "SKIPPED" && task.required) {
    return errorState("Required tasks cannot be skipped.");
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.applicationTask.update({
      where: { id: task.id },
      data: {
        completedAt: requestedStatus === "COMPLETE" ? now : null,
        status: requestedStatus,
      },
    });
    await refreshApplicationDerivedState(tx, task.applicationId, now);
    await tx.auditLog.create({
      data: {
        action:
          requestedStatus === "COMPLETE"
            ? "APPLICATION_TASK_COMPLETED"
            : "APPLICATION_TASK_STATUS_UPDATED",
        actorId: context.userId,
        entityId: task.id,
        entityType: "ApplicationTask",
        metadata: {
          applicationId: task.applicationId,
          newStatus: requestedStatus,
          previousStatus: task.status,
          source: task.source,
          taskType: task.type,
        },
      },
    });
  });

  revalidateTaskPaths(task.applicationId);
  return successState(statusSuccessMessage(requestedStatus));
}

export async function createStudentCustomApplicationTask(
  _previousState: StudentTaskActionState,
  formData: FormData,
): Promise<StudentTaskActionState> {
  const applicationId = value(formData, "applicationId");
  const title = value(formData, "title").replace(/\s+/g, " ");
  const description = value(formData, "description");
  const dueDate = parseTaskDueDate(value(formData, "dueAt"));
  const required = formData.get("required") === "on";

  if (!applicationId) return errorState("Choose an application.");
  if (!title || title.length > 240) {
    return errorState("Enter a task title of 240 characters or fewer.");
  }
  if (description.length > 2_000) {
    return errorState(
      "Keep the private description to 2,000 characters or fewer.",
    );
  }
  if (!dueDate.ok) return errorState(dueDate.error);

  const context = await getMutationContext("application_task_create", 30);
  if (!context.ok) return errorState(context.error);

  const application = await prisma.application.findFirst({
    where: applicationOwnership(context.profileId, applicationId),
    select: {
      id: true,
      tasks: {
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
        take: 1,
      },
    },
  });

  if (!application) return errorState("Application was not found.");

  try {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      const task = await tx.applicationTask.create({
        data: {
          applicationId: application.id,
          description: description || null,
          dueAt: dueDate.value,
          required,
          sortOrder: (application.tasks[0]?.sortOrder ?? -1) + 1,
          source: "STUDENT",
          status: "NOT_STARTED",
          studentControlled: true,
          taskKey: null,
          title,
          type: "CUSTOM",
        },
        select: { id: true },
      });
      await refreshApplicationDerivedState(tx, application.id, now);
      await tx.auditLog.create({
        data: {
          action: "APPLICATION_TASK_CREATED",
          actorId: context.userId,
          entityId: task.id,
          entityType: "ApplicationTask",
          metadata: {
            applicationId: application.id,
            hasDueDate: Boolean(dueDate.value),
            required,
            source: "STUDENT",
            taskType: "CUSTOM",
          },
        },
      });
    });

    revalidateTaskPaths(application.id);
    return successState("Private task added.");
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorState("This application already has a task with that title.");
    }

    return errorState("Task could not be added. Please try again.");
  }
}

export async function updateStudentCustomApplicationTask(
  _previousState: StudentTaskActionState,
  formData: FormData,
): Promise<StudentTaskActionState> {
  const taskId = value(formData, "taskId");
  const title = value(formData, "title").replace(/\s+/g, " ");
  const description = value(formData, "description");
  const dueDate = parseTaskDueDate(value(formData, "dueAt"));

  if (!taskId) return errorState("Task was not found.");
  if (!title || title.length > 240) {
    return errorState("Enter a task title of 240 characters or fewer.");
  }
  if (description.length > 2_000) {
    return errorState(
      "Keep the private description to 2,000 characters or fewer.",
    );
  }
  if (!dueDate.ok) return errorState(dueDate.error);

  const context = await getMutationContext("application_task_edit", 60);
  if (!context.ok) return errorState(context.error);

  const task = await prisma.applicationTask.findFirst({
    where: applicationTaskOwnership(context.profileId, taskId),
    select: {
      applicationId: true,
      application: { select: { status: true } },
      description: true,
      dueAt: true,
      id: true,
      source: true,
      studentControlled: true,
      title: true,
      type: true,
    },
  });
  if (!task) return errorState("Task was not found.");
  const guardError = customTaskGuardError(task);
  if (guardError) return errorState(guardError);

  try {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.applicationTask.update({
        where: { id: task.id },
        data: {
          description: description || null,
          dueAt: dueDate.value,
          title,
        },
      });
      await refreshApplicationDerivedState(tx, task.applicationId, now);
      await tx.auditLog.create({
        data: {
          action: "APPLICATION_TASK_UPDATED",
          actorId: context.userId,
          entityId: task.id,
          entityType: "ApplicationTask",
          metadata: {
            applicationId: task.applicationId,
            descriptionChanged: task.description !== (description || null),
            dueDateChanged: task.dueAt?.getTime() !== dueDate.value?.getTime(),
            hasDescription: Boolean(description),
            hasDueDate: Boolean(dueDate.value),
            source: task.source,
            taskType: task.type,
            titleChanged: task.title !== title,
          },
        },
      });
    });

    revalidateTaskPaths(task.applicationId);
    return successState("Private task updated.");
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorState("This application already has a task with that title.");
    }
    return errorState("Task could not be updated. Please try again.");
  }
}

export async function deleteStudentCustomApplicationTask(
  _previousState: StudentTaskActionState,
  formData: FormData,
): Promise<StudentTaskActionState> {
  const taskId = value(formData, "taskId");
  if (!taskId) return errorState("Task was not found.");

  const context = await getMutationContext("application_task_delete", 30);
  if (!context.ok) return errorState(context.error);

  const task = await prisma.applicationTask.findFirst({
    where: applicationTaskOwnership(context.profileId, taskId),
    select: {
      applicationId: true,
      application: { select: { status: true } },
      id: true,
      required: true,
      source: true,
      studentControlled: true,
      type: true,
    },
  });
  if (!task) return errorState("Task was not found.");
  const guardError = customTaskGuardError(task);
  if (guardError) return errorState(guardError);

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.applicationTask.delete({ where: { id: task.id } });
    await refreshApplicationDerivedState(tx, task.applicationId, now);
    await tx.auditLog.create({
      data: {
        action: "APPLICATION_TASK_DELETED",
        actorId: context.userId,
        entityId: task.id,
        entityType: "ApplicationTask",
        metadata: {
          applicationId: task.applicationId,
          required: task.required,
          source: task.source,
          taskType: task.type,
        },
      },
    });
  });

  revalidateTaskPaths(task.applicationId);
  return successState("Private task deleted.");
}

export async function updateStudentApplicationTaskDueDate(
  _previousState: StudentTaskActionState,
  formData: FormData,
): Promise<StudentTaskActionState> {
  const taskId = value(formData, "taskId");
  const dueDate = parseTaskDueDate(value(formData, "dueAt"));
  if (!taskId) return errorState("Task was not found.");
  if (!dueDate.ok) return errorState(dueDate.error);

  const context = await getMutationContext("application_task_due_date", 60);
  if (!context.ok) return errorState(context.error);

  const task = await prisma.applicationTask.findFirst({
    where: applicationTaskOwnership(context.profileId, taskId),
    select: {
      applicationId: true,
      application: { select: { status: true } },
      id: true,
      source: true,
      studentControlled: true,
      type: true,
    },
  });

  if (!task) return errorState("Task was not found.");
  const guardError = customTaskGuardError(task);
  if (guardError) return errorState(guardError);

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.applicationTask.update({
      where: { id: task.id },
      data: { dueAt: dueDate.value },
    });
    await refreshApplicationDerivedState(tx, task.applicationId, now);
    await tx.auditLog.create({
      data: {
        action: "APPLICATION_TASK_DUE_DATE_UPDATED",
        actorId: context.userId,
        entityId: task.id,
        entityType: "ApplicationTask",
        metadata: {
          applicationId: task.applicationId,
          dueDateChanged: true,
          hasDueDate: Boolean(dueDate.value),
          source: task.source,
          taskType: task.type,
        },
      },
    });
  });

  revalidateTaskPaths(task.applicationId);
  return successState(
    dueDate.value ? "Due date updated." : "Due date removed.",
  );
}
