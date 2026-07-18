import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditCreate: vi.fn(),
  buildCandidates: vi.fn(),
  buildDigestEmail: vi.fn(),
  buildSummaryEmail: vi.fn(),
  getWeeklyPlan: vi.fn(),
  notificationCreateMany: vi.fn(),
  notificationFindFirst: vi.fn(),
  notificationFindMany: vi.fn(),
  notificationUpdateMany: vi.fn(),
  sendEmail: vi.fn(),
  studentFindMany: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    auditLog: { create: mocks.auditCreate },
    notification: {
      createMany: mocks.notificationCreateMany,
      findFirst: mocks.notificationFindFirst,
      findMany: mocks.notificationFindMany,
      updateMany: mocks.notificationUpdateMany,
    },
    studentProfile: { findMany: mocks.studentFindMany },
  },
}));
vi.mock("@/lib/email/resend", () => ({
  sendTransactionalEmail: mocks.sendEmail,
}));
vi.mock("@/lib/email/student-reminders", () => ({
  buildStudentReminderSummaryEmail: mocks.buildSummaryEmail,
  buildStudentWeeklyDigestEmail: mocks.buildDigestEmail,
}));
vi.mock("@/lib/notifications/student-reminder-rules", () => ({
  buildStudentReminderCandidates: mocks.buildCandidates,
}));
vi.mock("@/lib/student/weekly-plan", () => ({
  getStudentWeeklyPlan: mocks.getWeeklyPlan,
}));

import { runStudentReminderWorkflows } from "@/lib/jobs/student-reminders";

const student = {
  applications: [],
  id: "profile-1",
  notificationPreference: {
    deadlineAlertsEnabled: true,
    emailEnabled: true,
    inAppEnabled: true,
    interviewReminderEnabled: true,
    openingAlertsEnabled: true,
    outcomeReminderEnabled: true,
    quietHoursEnd: null,
    quietHoursStart: null,
    recommendationReminderEnabled: true,
    taskReminderEnabled: true,
    timezone: "UTC",
    weeklyDigestEnabled: true,
  },
  savedOpportunities: [],
  user: {
    email: "student@example.com",
    firstName: "Student",
    id: "user-1",
  },
};

const ordinaryReminder = {
  actionUrl: "/dashboard/student/applications/application-1",
  applicationTask: null,
  body: "The deadline is in 14 days.",
  id: "ordinary-14-day",
  title: "Application deadline",
  type: "APPLICATION_DEADLINE",
};

describe("student reminder workflow delivery claims", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    mocks.studentFindMany.mockResolvedValue([student]);
    mocks.buildCandidates.mockReturnValue([]);
    mocks.getWeeklyPlan.mockResolvedValue({ items: [{ id: "weekly-item" }] });
    mocks.notificationCreateMany.mockResolvedValue({ count: 0 });
    mocks.notificationUpdateMany.mockResolvedValue({ count: 1 });
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
    mocks.buildDigestEmail.mockReturnValue({
      subject: "Weekly plan",
      text: "Weekly plan body",
    });
    mocks.buildSummaryEmail.mockReturnValue({
      subject: "Reminder summary",
      text: "Reminder summary body",
    });
    mocks.sendEmail.mockResolvedValue({ sent: true, skipped: false });
  });

  it("leaves ordinary reminders pending when a digest uses the run's email slot", async () => {
    mocks.notificationFindFirst
      .mockResolvedValueOnce({ id: "digest-1" })
      .mockResolvedValueOnce(null);
    mocks.notificationFindMany.mockResolvedValue([ordinaryReminder]);

    const digestRun = await runStudentReminderWorkflows({
      now: new Date("2026-07-13T12:00:00.000Z"),
    });

    expect(digestRun.emailsSent).toBe(1);
    expect(mocks.notificationFindMany).not.toHaveBeenCalled();
    expect(mocks.notificationUpdateMany).toHaveBeenCalledTimes(1);
    expect(mocks.notificationUpdateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { emailedAt: null, id: "digest-1" },
      }),
    );

    const ordinaryRun = await runStudentReminderWorkflows({
      now: new Date("2026-07-14T12:00:00.000Z"),
    });

    expect(ordinaryRun.emailsSent).toBe(1);
    expect(mocks.notificationFindMany).toHaveBeenCalledTimes(1);
    expect(mocks.notificationUpdateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { emailedAt: null, id: { in: ["ordinary-14-day"] } },
      }),
    );
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
  });
});
