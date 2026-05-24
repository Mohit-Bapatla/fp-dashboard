import "server-only";

import type { InterviewRequestStatus } from "@/generated/prisma/enums";

export type InterviewRequestView = {
  id: string;
  location: string | null;
  meetingLink: string | null;
  notes: string | null;
  selectedSlotId: string | null;
  status: InterviewRequestStatus;
  studentResponseNotes: string | null;
  proposedSlots: Array<{
    endsAt: Date;
    id: string;
    selected: boolean;
    startsAt: Date;
  }>;
};

export function formatInterviewStatus(status: InterviewRequestStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
