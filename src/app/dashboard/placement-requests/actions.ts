"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAuditLog,
  getActorIdFromClerkUserId,
} from "@/lib/audit/audit-log";
import { prisma } from "@/lib/db/prisma";
import {
  placementRequestQueueEmail,
  placementRequestStudentEmail,
} from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/resend";
import {
  createNotifications,
  getUsersByRoles,
} from "@/lib/notifications/notifications";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import {
  isPlacementRequestPriority,
  isPlacementRequestStatus,
  type StudentPlacementRequestActionState,
  validateStudentPlacementRequestForm,
} from "@/lib/placement-requests/validation";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getCurrentStudentProfile } from "@/lib/student/profile";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function revalidatePlacementRequestPaths() {
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/placement-requests");
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/staff/placement-requests");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/placement-requests");
  revalidatePath("/dashboard/notifications");
}

function getSafeQueueRedirect(formData: FormData) {
  const redirectTo = getString(formData, "redirectTo");

  if (
    redirectTo.startsWith("/dashboard/staff/placement-requests") ||
    redirectTo.startsWith("/dashboard/admin/placement-requests")
  ) {
    return redirectTo;
  }

  return "/dashboard/staff/placement-requests";
}

export async function createStudentPlacementRequest(
  _previousState: StudentPlacementRequestActionState,
  formData: FormData,
): Promise<StudentPlacementRequestActionState> {
  const { userId } = await assertStudentAccess();
  const validation = validateStudentPlacementRequestForm(formData);

  if (!validation.success) {
    return {
      fieldErrors: validation.errors,
      formError: "Please fix the highlighted fields.",
      values: validation.values,
    };
  }

  const user = await getCurrentStudentProfile(userId);

  if (!user.studentProfile) {
    redirect("/dashboard/student/onboarding");
  }

  const request = await prisma.placementRequest.create({
    data: {
      ...validation.data,
      requestedById: user.id,
      status: "NEW",
      studentProfileId: user.studentProfile.id,
    },
    select: {
      id: true,
      title: true,
    },
  });
  const queueUsers = await getUsersByRoles(["STAFF", "ADMIN", "SUPER_ADMIN"]);
  const studentEmail = placementRequestStudentEmail({
    title: request.title,
  });
  const queueEmail = placementRequestQueueEmail({
    title: request.title,
  });
  const [studentEmailResult, queueEmailResult] = await Promise.all([
    sendTransactionalEmail({
      ...studentEmail,
      to: user.email,
    }),
    sendTransactionalEmail({
      ...queueEmail,
      to: queueUsers.map((queueUser) => queueUser.email),
    }),
    createNotifications(
      queueUsers.map((queueUser) => queueUser.id),
      {
        body: `${request.title} was added to the placement queue.`,
        title: "New placement request",
      },
    ),
  ]);

  await createAuditLog({
    action: "PLACEMENT_REQUEST_CREATED",
    actorId: user.id,
    entityId: request.id,
    entityType: "PlacementRequest",
    metadata: {
      queueEmailSent: queueEmailResult.sent,
      queueEmailSkipped: queueEmailResult.skipped,
      studentEmailSent: studentEmailResult.sent,
      studentEmailSkipped: studentEmailResult.skipped,
      studentProfileId: user.studentProfile.id,
      title: request.title,
    },
  });

  revalidatePlacementRequestPaths();
  redirect("/dashboard/student/placement-requests?created=1");
}

export async function updatePlacementRequestStatus(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();

  const requestId = getString(formData, "requestId");
  const status = getString(formData, "status");
  const redirectTo = getSafeQueueRedirect(formData);

  if (!requestId || !isPlacementRequestStatus(status)) {
    redirect(redirectTo);
  }

  const request = await prisma.placementRequest.findUnique({
    where: {
      id: requestId,
    },
    select: {
      assignedStaffId: true,
      id: true,
      status: true,
      studentProfile: {
        select: {
          user: {
            select: {
              email: true,
              id: true,
            },
          },
        },
      },
      title: true,
    },
  });

  if (!request) {
    redirect(redirectTo);
  }

  await prisma.placementRequest.update({
    where: {
      id: request.id,
    },
    data: {
      status,
    },
  });
  const actorId = await getActorIdFromClerkUserId(userId);
  const studentEmail = placementRequestStudentEmail({
    status,
    title: request.title,
  });
  const [emailResult] = await Promise.all([
    sendTransactionalEmail({
      ...studentEmail,
      to: request.studentProfile.user.email,
    }),
    createNotifications(
      [request.studentProfile.user.id, request.assignedStaffId],
      {
        body: `${request.title} was updated to ${status}.`,
        title: "Placement request status updated",
      },
    ),
  ]);

  await createAuditLog({
    action: "PLACEMENT_REQUEST_STATUS_UPDATED",
    actorId,
    entityId: request.id,
    entityType: "PlacementRequest",
    metadata: {
      emailSent: emailResult.sent,
      emailSkipped: emailResult.skipped,
      newStatus: status,
      previousStatus: request.status,
      title: request.title,
    },
  });

  revalidatePlacementRequestPaths();
  redirect(redirectTo);
}

export async function assignPlacementRequest(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();

  const requestId = getString(formData, "requestId");
  const assignedStaffId = getString(formData, "assignedStaffId");
  const redirectTo = getSafeQueueRedirect(formData);

  if (!requestId) {
    redirect(redirectTo);
  }

  const [request, staffUser] = await Promise.all([
    prisma.placementRequest.findUnique({
      where: {
        id: requestId,
      },
      select: {
        id: true,
        assignedStaffId: true,
        status: true,
        studentProfile: {
          select: {
            userId: true,
          },
        },
        title: true,
      },
    }),
    assignedStaffId
      ? prisma.user.findFirst({
          where: {
            id: assignedStaffId,
            role: "STAFF",
          },
          select: {
            id: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (!request || (assignedStaffId && !staffUser)) {
    redirect(redirectTo);
  }

  await prisma.placementRequest.update({
    where: {
      id: request.id,
    },
    data: {
      assignedStaffId: staffUser?.id ?? null,
      status:
        request.status === "NEW" && staffUser ? "ASSIGNED" : request.status,
    },
  });
  const actorId = await getActorIdFromClerkUserId(userId);
  await Promise.all([
    createNotifications([request.studentProfile.userId, staffUser?.id], {
      body: staffUser
        ? `${request.title} was assigned for follow-up.`
        : `${request.title} was unassigned.`,
      title: "Placement request assignment updated",
    }),
    createAuditLog({
      action: "PLACEMENT_REQUEST_ASSIGNED",
      actorId,
      entityId: request.id,
      entityType: "PlacementRequest",
      metadata: {
        newAssignedStaffId: staffUser?.id ?? null,
        previousAssignedStaffId: request.assignedStaffId,
        statusAfter:
          request.status === "NEW" && staffUser ? "ASSIGNED" : request.status,
        title: request.title,
      },
    }),
  ]);

  revalidatePlacementRequestPaths();
  redirect(redirectTo);
}

export async function updatePlacementRequestPriority(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();

  const requestId = getString(formData, "requestId");
  const priority = getString(formData, "priority");
  const redirectTo = getSafeQueueRedirect(formData);

  if (!requestId || !isPlacementRequestPriority(priority)) {
    redirect(redirectTo);
  }

  const request = await prisma.placementRequest.findUnique({
    where: {
      id: requestId,
    },
    select: {
      id: true,
      priority: true,
      title: true,
    },
  });

  if (!request) {
    redirect(redirectTo);
  }

  await prisma.placementRequest.update({
    where: {
      id: request.id,
    },
    data: {
      priority,
    },
  });
  const actorId = await getActorIdFromClerkUserId(userId);

  await createAuditLog({
    action: "PLACEMENT_REQUEST_PRIORITY_UPDATED",
    actorId,
    entityId: request.id,
    entityType: "PlacementRequest",
    metadata: {
      newPriority: priority,
      previousPriority: request.priority,
      title: request.title,
    },
  });

  revalidatePlacementRequestPaths();
  redirect(redirectTo);
}

export async function updatePlacementRequestNotes(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();

  const requestId = getString(formData, "requestId");
  const notes = getString(formData, "notes");
  const redirectTo = getSafeQueueRedirect(formData);

  if (!requestId) {
    redirect(redirectTo);
  }

  const request = await prisma.placementRequest.findUnique({
    where: {
      id: requestId,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!request) {
    redirect(redirectTo);
  }

  await prisma.placementRequest.update({
    where: {
      id: request.id,
    },
    data: {
      notes: notes || null,
    },
  });
  const actorId = await getActorIdFromClerkUserId(userId);

  await createAuditLog({
    action: "PLACEMENT_REQUEST_NOTES_UPDATED",
    actorId,
    entityId: request.id,
    entityType: "PlacementRequest",
    metadata: {
      hasNotes: Boolean(notes),
      title: request.title,
    },
  });

  revalidatePlacementRequestPaths();
  redirect(redirectTo);
}
