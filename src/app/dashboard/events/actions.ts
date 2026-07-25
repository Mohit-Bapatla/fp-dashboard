"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type {
  EventRegistrationStatus,
  ProgramEventStatus,
  ProgramEventType,
} from "@/generated/prisma/enums";
import {
  createAuditLog,
  getActorIdFromClerkUserId,
} from "@/lib/audit/audit-log";
import { prisma } from "@/lib/db/prisma";
import {
  eventAttendanceStatuses,
  programEventStatuses,
  programEventTypes,
} from "@/lib/events/events";
import { createNotifications } from "@/lib/notifications/notifications";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { getCompletedStudentProfile } from "@/lib/student/profile-completion";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);

  return value || null;
}

function getOptionalDate(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getOptionalInt(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getSafeEventRedirect(formData: FormData) {
  const redirectTo = getString(formData, "redirectTo");

  return redirectTo.startsWith("/dashboard") ? redirectTo : "/dashboard";
}

function revalidateEventPaths(redirectTo: string) {
  revalidatePath(redirectTo);
  revalidatePath("/dashboard/admin/events");
  revalidatePath("/dashboard/staff/events");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/events");
  revalidatePath("/dashboard/notifications");
}

export async function saveProgramEvent(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const eventId = getString(formData, "eventId");
  const title = getString(formData, "title");
  const eventType = getString(formData, "eventType") as ProgramEventType;
  const status = getString(formData, "status") as ProgramEventStatus;
  const startAt = getOptionalDate(formData, "startAt");
  const endAt = getOptionalDate(formData, "endAt");
  const redirectTo = getSafeEventRedirect(formData);

  if (
    !title ||
    !startAt ||
    !programEventTypes.includes(eventType) ||
    !programEventStatuses.includes(status)
  ) {
    redirect(redirectTo);
  }

  const data = {
    capacity: getOptionalInt(formData, "capacity"),
    description: getNullableString(formData, "description"),
    endAt,
    eventType,
    location: getNullableString(formData, "location"),
    registrationDeadline: getOptionalDate(formData, "registrationDeadline"),
    speakerNames: parseLines(getString(formData, "speakerNames")),
    startAt,
    status,
    title,
    virtualLink: getNullableString(formData, "virtualLink"),
  };

  if (eventId) {
    const existing = await prisma.programEvent.findUnique({
      where: {
        id: eventId,
      },
      select: {
        status: true,
        title: true,
      },
    });

    if (!existing) {
      redirect(redirectTo);
    }

    await prisma.programEvent.update({
      where: {
        id: eventId,
      },
      data,
    });
    await createAuditLog({
      action: "PROGRAM_EVENT_UPDATED",
      actorId,
      entityId: eventId,
      entityType: "ProgramEvent",
      metadata: {
        newStatus: status,
        previousStatus: existing.status,
        previousTitle: existing.title,
        title,
      },
    });
  } else {
    const event = await prisma.programEvent.create({
      data: {
        ...data,
        createdById: actorId,
      },
      select: {
        id: true,
      },
    });
    await createAuditLog({
      action: "PROGRAM_EVENT_CREATED",
      actorId,
      entityId: event.id,
      entityType: "ProgramEvent",
      metadata: {
        status,
        title,
      },
    });
  }

  revalidateEventPaths(redirectTo);
  redirect(redirectTo);
}

export async function registerForProgramEvent(formData: FormData) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const profile = getCompletedStudentProfile(user.studentProfile);
  const eventId = getString(formData, "eventId");
  const redirectTo = getSafeEventRedirect(formData);

  if (!profile || !eventId) {
    redirect(redirectTo);
  }

  const now = new Date();
  const event = await prisma.programEvent.findFirst({
    where: {
      id: eventId,
      status: "PUBLISHED",
      startAt: {
        gt: now,
      },
      OR: [
        {
          registrationDeadline: null,
        },
        {
          registrationDeadline: {
            gte: now,
          },
        },
      ],
    },
    select: {
      capacity: true,
      id: true,
      title: true,
    },
  });

  if (!event) {
    redirect(redirectTo);
  }

  const activeRegistrationCount = await prisma.eventRegistration.count({
    where: {
      eventId: event.id,
      status: {
        in: ["REGISTERED", "ATTENDED"],
      },
    },
  });
  const registrationStatus =
    event.capacity !== null && activeRegistrationCount >= event.capacity
      ? "WAITLISTED"
      : "REGISTERED";

  const registration = await prisma.eventRegistration.upsert({
    where: {
      eventId_studentProfileId: {
        eventId: event.id,
        studentProfileId: profile.id,
      },
    },
    update: {
      attendedAt: null,
      checkedInById: null,
      status: registrationStatus,
    },
    create: {
      eventId: event.id,
      status: registrationStatus,
      studentProfileId: profile.id,
    },
    select: {
      id: true,
    },
  });

  await Promise.all([
    createNotifications([user.id], {
      body:
        registrationStatus === "WAITLISTED"
          ? `You joined the waitlist for ${event.title}.`
          : `You registered for ${event.title}.`,
      title:
        registrationStatus === "WAITLISTED"
          ? "Event waitlist joined"
          : "Event registration confirmed",
    }),
    createAuditLog({
      action: "PROGRAM_EVENT_REGISTERED",
      actorId: user.id,
      entityId: registration.id,
      entityType: "EventRegistration",
      metadata: {
        eventId: event.id,
        status: registrationStatus,
      },
    }),
  ]);

  revalidateEventPaths(redirectTo);
  redirect(redirectTo);
}

export async function cancelProgramEventRegistration(formData: FormData) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const profile = getCompletedStudentProfile(user.studentProfile);
  const registrationId = getString(formData, "registrationId");
  const redirectTo = getSafeEventRedirect(formData);

  if (!profile || !registrationId) {
    redirect(redirectTo);
  }

  const registration = await prisma.eventRegistration.findFirst({
    where: {
      id: registrationId,
      studentProfileId: profile.id,
      event: {
        startAt: {
          gt: new Date(),
        },
      },
      status: {
        in: ["REGISTERED", "WAITLISTED"],
      },
    },
    select: {
      event: {
        select: {
          id: true,
          title: true,
        },
      },
      id: true,
    },
  });

  if (!registration) {
    redirect(redirectTo);
  }

  await Promise.all([
    prisma.eventRegistration.update({
      where: {
        id: registration.id,
      },
      data: {
        status: "CANCELED",
      },
    }),
    createAuditLog({
      action: "PROGRAM_EVENT_REGISTRATION_CANCELED",
      actorId: user.id,
      entityId: registration.id,
      entityType: "EventRegistration",
      metadata: {
        eventId: registration.event.id,
      },
    }),
  ]);

  revalidateEventPaths(redirectTo);
  redirect(redirectTo);
}

export async function updateEventAttendance(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const registrationId = getString(formData, "registrationId");
  const status = getString(formData, "status") as EventRegistrationStatus;
  const redirectTo = getSafeEventRedirect(formData);

  if (
    !registrationId ||
    !actorId ||
    !eventAttendanceStatuses.includes(status)
  ) {
    redirect(redirectTo);
  }

  const registration = await prisma.eventRegistration.findUnique({
    where: {
      id: registrationId,
    },
    select: {
      event: {
        select: {
          id: true,
          title: true,
        },
      },
      id: true,
      status: true,
      studentProfile: {
        select: {
          user: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!registration) {
    redirect(redirectTo);
  }

  await Promise.all([
    prisma.eventRegistration.update({
      where: {
        id: registration.id,
      },
      data: {
        attendedAt: status === "ATTENDED" ? new Date() : null,
        checkedInById: actorId,
        certificateStatus:
          status === "ATTENDED" ? "PENDING_APPROVAL" : "NOT_REQUESTED",
        status,
      },
    }),
    createNotifications([registration.studentProfile.user.id], {
      body: `Your attendance for ${registration.event.title} was marked ${status}.`,
      title: "Event attendance updated",
    }),
    createAuditLog({
      action: "PROGRAM_EVENT_ATTENDANCE_UPDATED",
      actorId,
      entityId: registration.id,
      entityType: "EventRegistration",
      metadata: {
        eventId: registration.event.id,
        newStatus: status,
        previousStatus: registration.status,
      },
    }),
  ]);

  revalidateEventPaths(redirectTo);
  redirect(redirectTo);
}
