import "server-only";

import type {
  EventRegistrationStatus,
  ProgramEventStatus,
  ProgramEventType,
} from "@/generated/prisma/enums";

export const programEventTypes: ProgramEventType[] = [
  "SEMINAR",
  "WORKSHOP",
  "PANEL",
  "VOLUNTEERING",
  "NETWORKING",
  "FUNDRAISER",
  "OTHER",
];

export const programEventStatuses: ProgramEventStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "CANCELED",
  "COMPLETED",
  "ARCHIVED",
];

export const eventAttendanceStatuses: EventRegistrationStatus[] = [
  "ATTENDED",
  "NO_SHOW",
];

export function formatEventLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatEventDate(value: Date | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function canRegisterForEvent(event: {
  registrationDeadline: Date | null;
  startAt: Date;
  status: ProgramEventStatus;
}) {
  const now = new Date();

  return (
    event.status === "PUBLISHED" &&
    event.startAt > now &&
    (!event.registrationDeadline || event.registrationDeadline >= now)
  );
}
