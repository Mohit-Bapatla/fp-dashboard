"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
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

  await prisma.placementRequest.create({
    data: {
      ...validation.data,
      requestedById: user.id,
      status: "NEW",
      studentProfileId: user.studentProfile.id,
    },
  });

  revalidatePlacementRequestPaths();
  redirect("/dashboard/student/placement-requests?created=1");
}

export async function updatePlacementRequestStatus(formData: FormData) {
  await assertPlacementQueueAccess();

  const requestId = getString(formData, "requestId");
  const status = getString(formData, "status");
  const redirectTo = getSafeQueueRedirect(formData);

  if (!requestId || !isPlacementRequestStatus(status)) {
    redirect(redirectTo);
  }

  await prisma.placementRequest.update({
    where: {
      id: requestId,
    },
    data: {
      status,
    },
  });

  revalidatePlacementRequestPaths();
  redirect(redirectTo);
}

export async function assignPlacementRequest(formData: FormData) {
  await assertPlacementQueueAccess();

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
        status: true,
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

  revalidatePlacementRequestPaths();
  redirect(redirectTo);
}

export async function updatePlacementRequestPriority(formData: FormData) {
  await assertPlacementQueueAccess();

  const requestId = getString(formData, "requestId");
  const priority = getString(formData, "priority");
  const redirectTo = getSafeQueueRedirect(formData);

  if (!requestId || !isPlacementRequestPriority(priority)) {
    redirect(redirectTo);
  }

  await prisma.placementRequest.update({
    where: {
      id: requestId,
    },
    data: {
      priority,
    },
  });

  revalidatePlacementRequestPaths();
  redirect(redirectTo);
}

export async function updatePlacementRequestNotes(formData: FormData) {
  await assertPlacementQueueAccess();

  const requestId = getString(formData, "requestId");
  const notes = getString(formData, "notes");
  const redirectTo = getSafeQueueRedirect(formData);

  if (!requestId) {
    redirect(redirectTo);
  }

  await prisma.placementRequest.update({
    where: {
      id: requestId,
    },
    data: {
      notes: notes || null,
    },
  });

  revalidatePlacementRequestPaths();
  redirect(redirectTo);
}
