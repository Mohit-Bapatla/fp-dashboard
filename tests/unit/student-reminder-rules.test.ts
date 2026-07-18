import { describe, expect, it } from "vitest";

import { buildStudentReminderCandidates } from "@/lib/notifications/student-reminder-rules";

const enabledPreference = {
  deadlineAlertsEnabled: true,
  interviewReminderEnabled: true,
  openingAlertsEnabled: true,
  outcomeReminderEnabled: true,
  recommendationReminderEnabled: true,
  taskReminderEnabled: true,
};

function application() {
  return {
    id: "application-1",
    opportunity: {
      availabilityStatus: "OPEN",
      deadline: new Date("2026-07-27T00:00:00.000Z"),
      id: "opportunity-1",
      opensAt: new Date("2026-07-14T00:00:00.000Z"),
      title: "Hospital Program",
    },
    status: "PREPARING",
    targetDeadline: new Date("2026-07-20T00:00:00.000Z"),
    tasks: [
      {
        dueAt: new Date("2026-07-12T00:00:00.000Z"),
        id: "task-overdue",
        required: true,
        status: "NOT_STARTED",
        type: "PREPARE_ESSAY",
      },
      {
        dueAt: new Date("2026-07-20T00:00:00.000Z"),
        id: "task-recommendation",
        required: true,
        status: "NOT_STARTED",
        type: "REQUEST_RECOMMENDATION",
      },
    ],
  };
}

describe("student reminder rules", () => {
  it.each([14, 7, 3, 1])(
    "creates the %i-day official deadline offset",
    (offset) => {
      const deadline = new Date("2026-07-13T00:00:00.000Z");
      deadline.setUTCDate(deadline.getUTCDate() + offset);
      const app = {
        ...application(),
        opportunity: {
          ...application().opportunity,
          deadline,
          opensAt: null,
        },
        targetDeadline: null,
        tasks: [],
      };
      const reminders = buildStudentReminderCandidates({
        applications: [app],
        now: new Date("2026-07-13T16:00:00.000Z"),
        preference: enabledPreference,
        savedOpportunities: [],
        timezone: "America/Chicago",
        userId: "user-1",
      });
      expect(
        reminders.filter((item) => item.type === "APPLICATION_DEADLINE"),
      ).toHaveLength(1);
      expect(
        reminders.find((item) => item.type === "APPLICATION_DEADLINE")
          ?.deduplicationKey,
      ).toContain(`D${offset}`);
    },
  );

  it("creates deterministic deadline, target, task, recommendation, and opening reminders", () => {
    const input = {
      applications: [application()],
      now: new Date("2026-07-13T16:00:00.000Z"),
      preference: enabledPreference,
      savedOpportunities: [],
      timezone: "America/Chicago",
      userId: "user-1",
    };
    const first = buildStudentReminderCandidates(input);
    const second = buildStudentReminderCandidates(input);
    expect(first.map((item) => item.type)).toEqual(
      expect.arrayContaining([
        "APPLICATION_DEADLINE",
        "INTERNAL_TARGET_DEADLINE",
        "TASK_OVERDUE",
        "RECOMMENDATION_REQUEST",
        "OPPORTUNITY_OPENING_SOON",
      ]),
    );
    expect(first.map((item) => item.deduplicationKey)).toEqual(
      second.map((item) => item.deduplicationKey),
    );
    expect(new Set(first.map((item) => item.deduplicationKey)).size).toBe(
      first.length,
    );
    expect(
      first.find((item) => item.type === "TASK_OVERDUE")?.actionUrl,
    ).toContain("#task-task-overdue");
  });

  it("respects topic preferences", () => {
    const reminders = buildStudentReminderCandidates({
      applications: [application()],
      now: new Date("2026-07-13T16:00:00.000Z"),
      preference: {
        deadlineAlertsEnabled: false,
        interviewReminderEnabled: false,
        openingAlertsEnabled: false,
        outcomeReminderEnabled: false,
        recommendationReminderEnabled: false,
        taskReminderEnabled: false,
      },
      savedOpportunities: [],
      timezone: "America/Chicago",
      userId: "user-1",
    });
    expect(reminders).toEqual([]);
  });

  it("deduplicates an opened opportunity followed through two sources", () => {
    const app = application();
    app.opportunity.opensAt = new Date("2026-07-13T00:00:00.000Z");
    const reminders = buildStudentReminderCandidates({
      applications: [app],
      now: new Date("2026-07-13T16:00:00.000Z"),
      preference: enabledPreference,
      savedOpportunities: [
        { followReopening: true, opportunity: app.opportunity },
      ],
      timezone: "America/Chicago",
      userId: "user-1",
    });
    expect(
      reminders.filter((item) => item.type === "OPPORTUNITY_OPENED"),
    ).toHaveLength(1);
  });

  it("does not announce an opening after its local opening day", () => {
    const app = application();
    app.opportunity.opensAt = new Date("2026-07-12T00:00:00.000Z");
    const reminders = buildStudentReminderCandidates({
      applications: [app],
      now: new Date("2026-07-13T16:00:00.000Z"),
      preference: enabledPreference,
      savedOpportunities: [],
      timezone: "America/Chicago",
      userId: "user-1",
    });
    expect(
      reminders.filter((item) => item.type === "OPPORTUNITY_OPENED"),
    ).toHaveLength(0);
  });

  it("creates a timezone-aware interview-tomorrow reminder", () => {
    const app = {
      ...application(),
      interviewRequests: [
        {
          id: "interview-1",
          scheduledAt: new Date("2026-07-15T00:30:00.000Z"),
          selectedSlot: null,
          status: "SCHEDULED",
        },
      ],
    };
    const reminders = buildStudentReminderCandidates({
      applications: [app],
      now: new Date("2026-07-13T23:00:00.000Z"),
      preference: enabledPreference,
      savedOpportunities: [],
      timezone: "America/Chicago",
      userId: "user-1",
    });
    const interview = reminders.find(
      (item) => item.type === "INTERVIEW_REMINDER",
    );
    expect(interview?.body).toContain("Jul 14, 2026, 7:30 PM");
    expect(interview?.deduplicationKey).toContain("interview-1");
  });

  it("does not remind about stale preparation tasks after submission", () => {
    const app = application();
    app.status = "SUBMITTED";
    const reminders = buildStudentReminderCandidates({
      applications: [app],
      now: new Date("2026-07-13T16:00:00.000Z"),
      preference: enabledPreference,
      savedOpportunities: [],
      timezone: "America/Chicago",
      userId: "user-1",
    });
    expect(reminders.some((item) => item.type === "TASK_OVERDUE")).toBe(false);
  });

  it("uses the outcome preference for an optional structured outcome task", () => {
    const app = application();
    app.status = "SUBMITTED";
    app.tasks = [
      {
        dueAt: new Date("2026-07-13T00:00:00.000Z"),
        id: "task-outcome",
        required: false,
        status: "NOT_STARTED",
        type: "REPORT_OUTCOME",
      },
    ];
    const enabled = buildStudentReminderCandidates({
      applications: [app],
      now: new Date("2026-07-13T16:00:00.000Z"),
      preference: enabledPreference,
      savedOpportunities: [],
      timezone: "America/Chicago",
      userId: "user-1",
    });
    expect(enabled.some((item) => item.type === "OUTCOME_REPORTING")).toBe(
      true,
    );

    const disabled = buildStudentReminderCandidates({
      applications: [app],
      now: new Date("2026-07-13T16:00:00.000Z"),
      preference: { ...enabledPreference, outcomeReminderEnabled: false },
      savedOpportunities: [],
      timezone: "America/Chicago",
      userId: "user-1",
    });
    expect(disabled.some((item) => item.type === "OUTCOME_REPORTING")).toBe(
      false,
    );
  });
});
