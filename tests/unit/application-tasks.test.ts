import { describe, expect, it } from "vitest";

import type {
  ApplicationTaskStatus,
  ApplicationTaskType,
} from "@/generated/prisma/enums";
import {
  buildInitialApplicationTasks,
  calculateApplicationProgress,
  filterApplicationTasks,
  getApplicationNextAction,
  getApplicationTaskProgress,
  groupApplicationTasks,
  parseTaskDueDate,
  type ApplicationTaskLike,
} from "@/lib/student/application-tasks";

const now = new Date("2026-07-13T12:00:00.000Z");

function task(
  overrides: Partial<ApplicationTaskLike> & {
    id: string;
    type?: ApplicationTaskType;
    status?: ApplicationTaskStatus;
  },
): ApplicationTaskLike {
  return {
    applicationId: "application-1",
    dueAt: null,
    required: true,
    sortOrder: 0,
    status: "NOT_STARTED",
    title: overrides.id,
    type: "CUSTOM",
    ...overrides,
  };
}

describe("initial application tasks", () => {
  it("builds stable typed external-portal preparation tasks", () => {
    const input = {
      applicationMethod: "EXTERNAL_PORTAL" as const,
      deadline: new Date("2026-09-01T23:59:00.000Z"),
      essayQuestionCount: 2,
      now,
      opensAt: new Date("2026-08-01T13:00:00.000Z"),
      requiredDocuments: [
        "Official transcript",
        "Parent consent form",
        "Recommendation letter",
      ],
    };
    const first = buildInitialApplicationTasks(input);
    const second = buildInitialApplicationTasks(input);

    expect(second).toEqual(first);
    expect(first.map((item) => item.taskKey)).toHaveLength(
      new Set(first.map((item) => item.taskKey)).size,
    );
    expect(first).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          studentControlled: false,
          taskKey: "SYSTEM:REVIEW_ELIGIBILITY",
          type: "REVIEW_ELIGIBILITY",
        }),
        expect.objectContaining({ type: "UPLOAD_TRANSCRIPT" }),
        expect.objectContaining({ type: "COMPLETE_PARENT_FORM" }),
        expect.objectContaining({ type: "REQUEST_RECOMMENDATION" }),
        expect.objectContaining({
          title: "Prepare 2 essay responses",
          type: "PREPARE_ESSAY",
        }),
        expect.objectContaining({ type: "OPEN_EXTERNAL_PORTAL" }),
        expect.objectContaining({ type: "CONFIRM_EXTERNAL_SUBMISSION" }),
      ]),
    );
    expect(
      first.find((item) => item.type === "REVIEW_ELIGIBILITY")?.dueAt,
    ).toEqual(new Date("2026-08-01T00:00:00.000Z"));
    expect(
      first.find((item) => item.type === "CONFIRM_EXTERNAL_SUBMISSION")?.dueAt,
    ).toEqual(new Date("2026-09-01T00:00:00.000Z"));
  });

  it("uses the internal submission task for FP applications", () => {
    const tasks = buildInitialApplicationTasks({
      applicationMethod: "FP_INTERNAL",
      deadline: null,
      essayQuestionCount: null,
      now,
      opensAt: null,
      requiredDocuments: [],
    });

    expect(
      tasks.some((item) => item.type === "SUBMIT_INTERNAL_APPLICATION"),
    ).toBe(true);
    expect(tasks.some((item) => item.type === "OPEN_EXTERNAL_PORTAL")).toBe(
      false,
    );
  });

  it("labels student-added external tasks without claiming the link is official", () => {
    const tasks = buildInitialApplicationTasks({
      applicationMethod: "EXTERNAL_PORTAL",
      deadline: null,
      essayQuestionCount: null,
      now,
      opensAt: null,
      requiredDocuments: [],
      studentProvidedExternal: true,
    });

    expect(
      tasks.find((item) => item.type === "OPEN_EXTERNAL_PORTAL")?.title,
    ).toBe("Open the student-provided application link");
    expect(
      tasks.find((item) => item.type === "CONFIRM_EXTERNAL_SUBMISSION")?.title,
    ).toBe("Confirm external submission");
    expect(JSON.stringify(tasks)).not.toContain("official application portal");
  });
});

describe("application task progress", () => {
  it("calculates progress from required non-skipped tasks only", () => {
    const tasks = [
      task({ id: "complete", status: "COMPLETE" }),
      task({ id: "open" }),
      task({ id: "optional", required: false }),
      task({ id: "skipped", status: "SKIPPED" }),
    ];

    expect(getApplicationTaskProgress(tasks)).toEqual({
      completedRequired: 1,
      percent: 50,
      requiredTotal: 2,
      usesLegacyFallback: false,
    });
    expect(calculateApplicationProgress(tasks)).toBe(50);
  });

  it("reopening a completed required task reduces progress", () => {
    const complete = [task({ id: "one", status: "COMPLETE" })];
    const reopened = [task({ id: "one", status: "NOT_STARTED" })];
    expect(calculateApplicationProgress(complete)).toBe(100);
    expect(calculateApplicationProgress(reopened)).toBe(0);
  });

  it("uses the bounded legacy value only when there are no tasks", () => {
    expect(getApplicationTaskProgress([], 140)).toMatchObject({
      percent: 100,
      usesLegacyFallback: true,
    });
  });
});

describe("application task prioritization and grouping", () => {
  it("prioritizes overdue required work, then blockers, before submission", () => {
    const tasks = [
      task({
        dueAt: new Date("2026-07-12T00:00:00.000Z"),
        id: "overdue",
        title: "Overdue requirement",
      }),
      task({
        id: "blocked-document",
        status: "BLOCKED",
        type: "UPLOAD_TRANSCRIPT",
      }),
      task({ id: "submit", type: "SUBMIT_INTERNAL_APPLICATION" }),
    ];

    expect(
      getApplicationNextAction(
        tasks,
        {
          applicationId: "application-1",
          canSubmit: true,
          opportunityId: "opportunity-1",
        },
        now,
      )?.task.id,
    ).toBe("overdue");

    const afterOverdue = tasks.map((item) =>
      item.id === "overdue" ? { ...item, status: "COMPLETE" as const } : item,
    );
    expect(
      getApplicationNextAction(
        afterOverdue,
        {
          applicationId: "application-1",
          canSubmit: true,
          opportunityId: "opportunity-1",
        },
        now,
      )?.task.id,
    ).toBe("blocked-document");
  });

  it("selects submission only when preparation is complete and submission is open", () => {
    const tasks = [
      task({ id: "prepare", status: "COMPLETE" }),
      task({ id: "submit", type: "SUBMIT_INTERNAL_APPLICATION" }),
    ];
    expect(
      getApplicationNextAction(
        tasks,
        {
          applicationId: "application-1",
          canSubmit: true,
          opportunityId: "opportunity-1",
        },
        now,
      )?.task.id,
    ).toBe("submit");
    expect(
      getApplicationNextAction(
        tasks,
        {
          applicationId: "application-1",
          canSubmit: false,
          opportunityId: "opportunity-1",
        },
        now,
      ),
    ).toBeNull();
  });

  it("does not surface the external portal before applications open", () => {
    const tasks = [
      task({ id: "prepare", status: "COMPLETE" }),
      task({ id: "portal", sortOrder: 4, type: "OPEN_EXTERNAL_PORTAL" }),
      task({
        id: "confirm",
        sortOrder: 5,
        type: "CONFIRM_EXTERNAL_SUBMISSION",
      }),
    ];

    expect(
      getApplicationNextAction(
        tasks,
        {
          applicationId: "application-1",
          canSubmit: false,
          opportunityId: "opportunity-1",
        },
        now,
      ),
    ).toBeNull();
    expect(
      getApplicationNextAction(
        tasks,
        {
          applicationId: "application-1",
          canSubmit: true,
          opportunityId: "opportunity-1",
        },
        now,
      )?.task.id,
    ).toBe("portal");
  });

  it("groups date-only tasks and keeps oldest overdue work first", () => {
    const tasks = [
      task({ dueAt: new Date("2026-07-12T00:00:00.000Z"), id: "yesterday" }),
      task({ dueAt: new Date("2026-07-01T00:00:00.000Z"), id: "oldest" }),
      task({ dueAt: new Date("2026-07-13T00:00:00.000Z"), id: "today" }),
      task({ dueAt: new Date("2026-07-18T00:00:00.000Z"), id: "week" }),
      task({ id: "later" }),
      task({ id: "done", status: "COMPLETE" }),
    ];
    const groups = groupApplicationTasks(tasks, now);

    expect(groups.overdue.map((item) => item.id)).toEqual([
      "oldest",
      "yesterday",
    ]);
    expect(groups.today.map((item) => item.id)).toEqual(["today"]);
    expect(groups.thisWeek.map((item) => item.id)).toEqual(["week"]);
    expect(groups.later.map((item) => item.id)).toEqual(["later"]);
    expect(groups.completed.map((item) => item.id)).toEqual(["done"]);
  });

  it("uses the student's timezone for today and upcoming task buckets", () => {
    const eveningInChicago = new Date("2026-07-14T02:00:00.000Z");
    const tasks = [
      task({
        dueAt: new Date("2026-07-13T00:00:00.000Z"),
        id: "local-today",
      }),
      task({
        dueAt: new Date("2026-07-14T00:00:00.000Z"),
        id: "local-tomorrow",
      }),
    ];

    const groups = groupApplicationTasks(
      tasks,
      eveningInChicago,
      "America/Chicago",
    );

    expect(groups.today.map((item) => item.id)).toEqual(["local-today"]);
    expect(groups.thisWeek.map((item) => item.id)).toEqual(["local-tomorrow"]);
    expect(groups.overdue).toHaveLength(0);
  });

  it("filters by owner-selected application, type, due bucket, and completion", () => {
    const tasks = [
      task({
        applicationId: "application-a",
        dueAt: new Date("2026-07-12T00:00:00.000Z"),
        id: "match",
        status: "BLOCKED",
        type: "UPLOAD_TRANSCRIPT",
      }),
      task({ applicationId: "application-b", id: "other" }),
    ];

    expect(
      filterApplicationTasks(
        tasks,
        {
          applicationId: "application-a",
          completion: "BLOCKED",
          due: "OVERDUE",
          type: "UPLOAD_TRANSCRIPT",
        },
        now,
      ).map((item) => item.id),
    ).toEqual(["match"]);
  });
});

describe("task due date parsing", () => {
  it("accepts real ISO dates and rejects normalized invalid dates", () => {
    expect(parseTaskDueDate("2026-07-31")).toEqual({
      ok: true,
      value: new Date("2026-07-31T00:00:00.000Z"),
    });
    expect(parseTaskDueDate("2026-02-31")).toEqual({
      error: "Enter a valid due date.",
      ok: false,
    });
  });
});
