import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applicationFindFirst: vi.fn(),
  applicationFindUnique: vi.fn(),
  applicationTaskCreate: vi.fn(),
  applicationTaskDelete: vi.fn(),
  applicationTaskFindFirst: vi.fn(),
  applicationTaskFindMany: vi.fn(),
  applicationTaskUpdate: vi.fn(),
  applicationUpdate: vi.fn(),
  auditCreate: vi.fn(),
  rateLimit: vi.fn(),
  revalidatePath: vi.fn(),
  transaction: vi.fn(),
}));

const transactionClient = {
  application: {
    findUnique: mocks.applicationFindUnique,
    update: mocks.applicationUpdate,
  },
  applicationTask: {
    create: mocks.applicationTaskCreate,
    delete: mocks.applicationTaskDelete,
    findMany: mocks.applicationTaskFindMany,
    update: mocks.applicationTaskUpdate,
  },
  auditLog: { create: mocks.auditCreate },
};

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    application: {
      findFirst: mocks.applicationFindFirst,
      update: mocks.applicationUpdate,
    },
    applicationTask: {
      findFirst: mocks.applicationTaskFindFirst,
      update: mocks.applicationTaskUpdate,
    },
    auditLog: { create: mocks.auditCreate },
  },
}));
vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: mocks.rateLimit,
  formatRateLimitMessage: vi.fn().mockReturnValue("Try again later."),
}));
vi.mock("@/lib/student/authorization", () => ({
  assertStudentAccess: vi.fn().mockResolvedValue({ userId: "clerk-1" }),
}));
vi.mock("@/lib/student/profile", () => ({
  getCurrentStudentProfile: vi.fn().mockResolvedValue({
    id: "user-1",
    studentProfile: {
      availability: ["Weekends"],
      careerGoals: "Explore clinical care",
      city: "Chicago",
      country: "United States",
      gradeYear: "College freshman",
      id: "profile-1",
      interestedSpecialties: ["Pediatrics"],
      opportunityTypes: ["SHADOWING"],
      school: "Example University",
      state: "Illinois",
    },
  }),
}));

import {
  createStudentCustomApplicationTask,
  deleteStudentCustomApplicationTask,
  updateStudentApplicationTaskDueDate,
  updateStudentApplicationTaskStatus,
  updateStudentCustomApplicationTask,
  type StudentTaskActionState,
} from "@/app/dashboard/student/tasks/actions";

const initialState: StudentTaskActionState = { error: null, success: null };

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function taskSnapshot(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    applicationId: "application-1",
    completedAt: null,
    dueAt: null,
    id: "task-1",
    required: true,
    sortOrder: 0,
    status: "COMPLETE",
    title: "Prepare essay",
    type: "PREPARE_ESSAY",
    ...overrides,
  };
}

const activeApplication = { status: "PREPARING" };

describe("student application task actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.applicationFindUnique.mockResolvedValue({
      opportunityId: "opportunity-1",
      studentProfileId: "profile-1",
      opportunity: {
        applicationMethod: "EXTERNAL_PORTAL",
        availabilityStatus: "OPEN",
        deadline: null,
        opensAt: null,
        sourceType: "FP_CATALOG",
        status: "PUBLISHED",
        studentOwnerProfileId: null,
        verificationStatus: "VERIFIED",
        visibility: "PUBLIC_DIRECTORY",
      },
    });
    mocks.applicationTaskFindMany.mockResolvedValue([taskSnapshot()]);
    mocks.applicationTaskUpdate.mockResolvedValue({ id: "task-1" });
    mocks.applicationTaskDelete.mockResolvedValue({ id: "task-1" });
    mocks.applicationUpdate.mockResolvedValue({ id: "application-1" });
    mocks.applicationTaskCreate.mockResolvedValue({ id: "task-new" });
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
    mocks.transaction.mockImplementation(
      async (
        input:
          | ((tx: typeof transactionClient) => Promise<unknown>)
          | Array<Promise<unknown>>,
      ) =>
        typeof input === "function"
          ? input(transactionClient)
          : Promise.all(input),
    );
  });

  it("includes application ownership and refuses another student's task", async () => {
    mocks.applicationTaskFindFirst.mockResolvedValue(null);
    const result = await updateStudentApplicationTaskStatus(
      initialState,
      form({ taskId: "task-other", status: "COMPLETE" }),
    );

    expect(result).toEqual({ error: "Task was not found.", success: null });
    expect(mocks.applicationTaskFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          application: { studentProfileId: "profile-1" },
          id: "task-other",
        },
      }),
    );
    expect(mocks.applicationTaskUpdate).not.toHaveBeenCalled();
  });

  it("completes a task, refreshes progress, and audits no private content", async () => {
    mocks.applicationTaskFindFirst.mockResolvedValue({
      applicationId: "application-1",
      id: "task-1",
      required: true,
      source: "OPPORTUNITY",
      status: "IN_PROGRESS",
      type: "PREPARE_ESSAY",
    });
    const result = await updateStudentApplicationTaskStatus(
      initialState,
      form({ taskId: "task-1", status: "COMPLETE" }),
    );

    expect(result).toEqual({ error: null, success: "Task completed." });
    expect(mocks.applicationTaskUpdate).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: {
        completedAt: expect.any(Date),
        status: "COMPLETE",
      },
    });
    expect(mocks.applicationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ completionPercent: 100 }),
      }),
    );
    const auditInput = mocks.auditCreate.mock.calls[0]?.[0];
    expect(auditInput.data.metadata).toEqual({
      applicationId: "application-1",
      newStatus: "COMPLETE",
      previousStatus: "IN_PROGRESS",
      source: "OPPORTUNITY",
      taskType: "PREPARE_ESSAY",
    });
    expect(JSON.stringify(auditInput)).not.toContain("title");
    expect(JSON.stringify(auditInput)).not.toContain("description");
  });

  it("reopening clears completion and reduces the progress snapshot", async () => {
    mocks.applicationTaskFindFirst.mockResolvedValue({
      applicationId: "application-1",
      id: "task-1",
      required: true,
      source: "SYSTEM",
      status: "COMPLETE",
      type: "SELECT_RESUME",
    });
    mocks.applicationTaskFindMany.mockResolvedValue([
      taskSnapshot({ status: "NOT_STARTED" }),
    ]);

    await updateStudentApplicationTaskStatus(
      initialState,
      form({ taskId: "task-1", status: "NOT_STARTED" }),
    );

    expect(mocks.applicationTaskUpdate).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: { completedAt: null, status: "NOT_STARTED" },
    });
    expect(mocks.applicationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ completionPercent: 0 }),
      }),
    );
  });

  it("requires authoritative submission actions to complete submission tasks", async () => {
    mocks.applicationTaskFindFirst.mockResolvedValue({
      application: activeApplication,
      applicationId: "application-1",
      id: "task-submit",
      required: true,
      source: "SYSTEM",
      status: "IN_PROGRESS",
      type: "SUBMIT_INTERNAL_APPLICATION",
    });

    const result = await updateStudentApplicationTaskStatus(
      initialState,
      form({ taskId: "task-submit", status: "COMPLETE" }),
    );

    expect(result).toEqual({
      error: "Complete this task through the application submission flow.",
      success: null,
    });
    expect(mocks.applicationTaskUpdate).not.toHaveBeenCalled();
    expect(mocks.applicationUpdate).not.toHaveBeenCalled();
  });

  it("does not reopen an authoritatively completed confirmation task", async () => {
    mocks.applicationTaskFindFirst.mockResolvedValue({
      application: activeApplication,
      applicationId: "application-1",
      id: "task-confirm",
      required: true,
      source: "SYSTEM",
      status: "COMPLETE",
      type: "CONFIRM_EXTERNAL_SUBMISSION",
    });

    const result = await updateStudentApplicationTaskStatus(
      initialState,
      form({ taskId: "task-confirm", status: "NOT_STARTED" }),
    );

    expect(result).toEqual({
      error: "Submitted application tasks cannot be reopened here.",
      success: null,
    });
    expect(mocks.applicationTaskUpdate).not.toHaveBeenCalled();
    expect(mocks.applicationUpdate).not.toHaveBeenCalled();
  });

  it("returns a visible rate-limit error without reading or mutating a task", async () => {
    mocks.rateLimit.mockResolvedValue({ allowed: false });
    const result = await updateStudentApplicationTaskStatus(
      initialState,
      form({ taskId: "task-1", status: "BLOCKED" }),
    );

    expect(result).toEqual({ error: "Try again later.", success: null });
    expect(mocks.applicationTaskFindFirst).not.toHaveBeenCalled();
    expect(mocks.applicationTaskUpdate).not.toHaveBeenCalled();
  });

  it("adds a private custom task through an owned application", async () => {
    mocks.applicationFindFirst.mockResolvedValue({
      id: "application-1",
      tasks: [{ sortOrder: 4 }],
    });
    const result = await createStudentCustomApplicationTask(
      initialState,
      form({
        applicationId: "application-1",
        description: "Private details that must not be audited",
        dueAt: "2026-07-31",
        required: "on",
        title: "Call the coordinator",
      }),
    );

    expect(result).toEqual({ error: null, success: "Private task added." });
    expect(mocks.applicationFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "application-1", studentProfileId: "profile-1" },
      }),
    );
    expect(mocks.applicationTaskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationId: "application-1",
          source: "STUDENT",
          studentControlled: true,
          title: "Call the coordinator",
          type: "CUSTOM",
        }),
      }),
    );
    const auditInput = mocks.auditCreate.mock.calls[0]?.[0];
    expect(JSON.stringify(auditInput)).not.toContain("Call the coordinator");
    expect(JSON.stringify(auditInput)).not.toContain("Private details");
  });

  it("allows due-date edits only for student-controlled owned tasks", async () => {
    mocks.applicationTaskFindFirst.mockResolvedValue({
      application: activeApplication,
      applicationId: "application-1",
      id: "task-1",
      source: "SYSTEM",
      studentControlled: false,
      type: "SELECT_RESUME",
    });
    const rejected = await updateStudentApplicationTaskDueDate(
      initialState,
      form({ dueAt: "2026-08-01", taskId: "task-1" }),
    );
    expect(rejected.error).toContain("private custom tasks");
    expect(mocks.applicationTaskUpdate).not.toHaveBeenCalled();

    mocks.applicationTaskFindFirst.mockResolvedValue({
      application: activeApplication,
      applicationId: "application-1",
      id: "task-2",
      source: "STUDENT",
      studentControlled: true,
      type: "CUSTOM",
    });
    const accepted = await updateStudentApplicationTaskDueDate(
      initialState,
      form({ dueAt: "2026-08-01", taskId: "task-2" }),
    );
    expect(accepted).toEqual({ error: null, success: "Due date updated." });
    expect(mocks.applicationTaskUpdate).toHaveBeenCalledWith({
      where: { id: "task-2" },
      data: { dueAt: new Date("2026-08-01T00:00:00.000Z") },
    });
  });

  it("edits an owned custom task and refreshes its next-action title", async () => {
    mocks.applicationTaskFindFirst.mockResolvedValue({
      application: activeApplication,
      applicationId: "application-1",
      description: "Old private details",
      dueAt: null,
      id: "task-custom",
      source: "STUDENT",
      studentControlled: true,
      title: "Old task title",
      type: "CUSTOM",
    });
    mocks.applicationTaskFindMany.mockResolvedValue([
      taskSnapshot({
        id: "task-custom",
        status: "NOT_STARTED",
        title: "Call the mentor",
        type: "CUSTOM",
      }),
    ]);

    const result = await updateStudentCustomApplicationTask(
      initialState,
      form({
        description: "New private details",
        dueAt: "2026-08-02",
        taskId: "task-custom",
        title: "Call the mentor",
      }),
    );

    expect(result).toEqual({ error: null, success: "Private task updated." });
    expect(mocks.applicationTaskUpdate).toHaveBeenCalledWith({
      where: { id: "task-custom" },
      data: {
        description: "New private details",
        dueAt: new Date("2026-08-02T00:00:00.000Z"),
        title: "Call the mentor",
      },
    });
    expect(mocks.applicationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          completionPercent: 0,
          nextAction: "Call the mentor",
        }),
      }),
    );
    expect(mocks.rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "application_task_edit", limit: 60 }),
    );
    const auditInput = mocks.auditCreate.mock.calls[0]?.[0];
    expect(JSON.stringify(auditInput)).not.toContain("Old task title");
    expect(JSON.stringify(auditInput)).not.toContain("Call the mentor");
    expect(JSON.stringify(auditInput)).not.toContain("private details");
  });

  it("refuses a cross-user custom-task edit through the ownership predicate", async () => {
    mocks.applicationTaskFindFirst.mockResolvedValue(null);

    const result = await updateStudentCustomApplicationTask(
      initialState,
      form({ taskId: "task-other", title: "Do not change" }),
    );

    expect(result).toEqual({ error: "Task was not found.", success: null });
    expect(mocks.applicationTaskFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          application: { studentProfileId: "profile-1" },
          id: "task-other",
        },
      }),
    );
    expect(mocks.applicationTaskUpdate).not.toHaveBeenCalled();
  });

  it("protects system tasks from custom-task edits", async () => {
    mocks.applicationTaskFindFirst.mockResolvedValue({
      application: activeApplication,
      applicationId: "application-1",
      description: null,
      dueAt: null,
      id: "task-system",
      source: "SYSTEM",
      studentControlled: false,
      title: "Submit application",
      type: "SUBMIT_INTERNAL_APPLICATION",
    });

    const result = await updateStudentCustomApplicationTask(
      initialState,
      form({ taskId: "task-system", title: "Changed" }),
    );

    expect(result.error).toContain("private custom tasks");
    expect(mocks.applicationTaskUpdate).not.toHaveBeenCalled();
  });

  it("blocks custom-task deletion after planning", async () => {
    mocks.applicationTaskFindFirst.mockResolvedValue({
      application: { status: "SUBMITTED" },
      applicationId: "application-1",
      id: "task-custom",
      required: false,
      source: "STUDENT",
      studentControlled: true,
      type: "CUSTOM",
    });

    const result = await deleteStudentCustomApplicationTask(
      initialState,
      form({ taskId: "task-custom" }),
    );

    expect(result.error).toContain("leaves planning");
    expect(mocks.applicationTaskDelete).not.toHaveBeenCalled();
  });

  it("deletes an owned custom task and recalculates progress and next action", async () => {
    mocks.applicationTaskFindFirst.mockResolvedValue({
      application: activeApplication,
      applicationId: "application-1",
      id: "task-custom",
      required: true,
      source: "STUDENT",
      studentControlled: true,
      type: "CUSTOM",
    });
    mocks.applicationTaskFindMany.mockResolvedValue([
      taskSnapshot({ id: "task-remaining", title: "Finished requirement" }),
    ]);

    const result = await deleteStudentCustomApplicationTask(
      initialState,
      form({ taskId: "task-custom" }),
    );

    expect(result).toEqual({ error: null, success: "Private task deleted." });
    expect(mocks.applicationTaskDelete).toHaveBeenCalledWith({
      where: { id: "task-custom" },
    });
    expect(mocks.applicationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          completionPercent: 100,
          nextAction: null,
        }),
      }),
    );
    expect(mocks.rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "application_task_delete", limit: 30 }),
    );
    const auditInput = mocks.auditCreate.mock.calls[0]?.[0];
    expect(JSON.stringify(auditInput)).not.toContain("Finished requirement");
  });
});
