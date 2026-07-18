import type {
  ApplicationMethod,
  ApplicationTaskStatus,
  ApplicationTaskType,
} from "@/generated/prisma/enums";
import { differenceInStudentCalendarDays } from "@/lib/notifications/reminder-schedule";

export const applicationTaskTypes = [
  "REVIEW_ELIGIBILITY",
  "REVIEW_OFFICIAL_REQUIREMENTS",
  "UPLOAD_RESUME",
  "SELECT_RESUME",
  "REQUEST_RECOMMENDATION",
  "CONFIRM_RECOMMENDATION",
  "PREPARE_ESSAY",
  "REVIEW_ESSAY",
  "UPLOAD_TRANSCRIPT",
  "COMPLETE_PARENT_FORM",
  "OPEN_EXTERNAL_PORTAL",
  "SUBMIT_INTERNAL_APPLICATION",
  "CONFIRM_EXTERNAL_SUBMISSION",
  "SCHEDULE_INTERVIEW",
  "PREPARE_FOR_INTERVIEW",
  "SEND_FOLLOW_UP",
  "REPORT_OUTCOME",
  "CUSTOM",
] as const satisfies readonly ApplicationTaskType[];

export const applicationTaskStatuses = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETE",
  "SKIPPED",
] as const satisfies readonly ApplicationTaskStatus[];

export const taskDueFilters = [
  "ALL",
  "OVERDUE",
  "TODAY",
  "THIS_WEEK",
  "LATER",
] as const;

export const taskCompletionFilters = [
  "ALL",
  "OPEN",
  "COMPLETED",
  "BLOCKED",
] as const;

export type TaskDueFilter = (typeof taskDueFilters)[number];
export type TaskCompletionFilter = (typeof taskCompletionFilters)[number];

export type InitialApplicationTask = {
  type: ApplicationTaskType;
  title: string;
  description: string | null;
  status: ApplicationTaskStatus;
  required: boolean;
  dueAt: Date | null;
  source: "OPPORTUNITY" | "SYSTEM";
  taskKey: string;
  studentControlled: false;
  sortOrder: number;
};

export type BuildInitialApplicationTasksInput = {
  applicationMethod: ApplicationMethod;
  deadline: Date | null;
  opensAt: Date | null;
  requiredDocuments: readonly string[];
  essayQuestionCount: number | null;
  now?: Date;
  studentProvidedExternal?: boolean;
};

export type ApplicationTaskLike = {
  id: string;
  applicationId: string;
  type: ApplicationTaskType;
  title: string;
  description?: string | null;
  status: ApplicationTaskStatus;
  required: boolean;
  dueAt: Date | null;
  completedAt?: Date | null;
  source?: string | null;
  studentControlled?: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ApplicationTaskProgress = {
  completedRequired: number;
  percent: number;
  requiredTotal: number;
  usesLegacyFallback: boolean;
};

export type ApplicationNextActionContext = {
  applicationId: string;
  opportunityId: string;
  canSubmit?: boolean;
};

export type CalculatedApplicationNextAction<T extends ApplicationTaskLike> = {
  task: T;
  href: string;
  whyItMatters: string;
};

export type TaskFilterInput = {
  applicationId?: string;
  type?: ApplicationTaskType;
  due?: TaskDueFilter;
  completion?: TaskCompletionFilter;
};

export type ApplicationTaskGroups<T extends ApplicationTaskLike> = {
  overdue: T[];
  today: T[];
  thisWeek: T[];
  later: T[];
  completed: T[];
};

type TaskDateBucket = keyof ApplicationTaskGroups<ApplicationTaskLike>;

const submissionTaskTypes = new Set<ApplicationTaskType>([
  "OPEN_EXTERNAL_PORTAL",
  "SUBMIT_INTERNAL_APPLICATION",
  "CONFIRM_EXTERNAL_SUBMISSION",
]);

const authoritativeCompletionTaskTypes = new Set<ApplicationTaskType>([
  "SUBMIT_INTERNAL_APPLICATION",
  "CONFIRM_EXTERNAL_SUBMISSION",
]);

export function requiresAuthoritativeApplicationAction(
  type: ApplicationTaskType,
) {
  return authoritativeCompletionTaskTypes.has(type);
}

const documentTaskTypes = new Set<ApplicationTaskType>([
  "UPLOAD_RESUME",
  "SELECT_RESUME",
  "REQUEST_RECOMMENDATION",
  "CONFIRM_RECOMMENDATION",
  "PREPARE_ESSAY",
  "REVIEW_ESSAY",
  "UPLOAD_TRANSCRIPT",
  "COMPLETE_PARENT_FORM",
]);

function normalizeTaskTitle(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 240);
}

function stableStringHash(value: string) {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0).toString(36);
}

function toUtcDate(value: Date | null) {
  if (!value || Number.isNaN(value.getTime())) return null;
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

function addUtcDays(value: Date, days: number) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function earlierDate(...values: Array<Date | null>) {
  const dates = values.filter((value): value is Date => Boolean(value));
  if (dates.length === 0) return null;
  return new Date(Math.min(...dates.map((value) => value.getTime())));
}

function clampToDate(value: Date | null, minimum: Date) {
  if (!value) return null;
  return value < minimum ? new Date(minimum) : value;
}

function getRequiredDocumentTaskType(title: string): ApplicationTaskType {
  const normalized = title.toLowerCase();

  if (normalized.includes("transcript")) return "UPLOAD_TRANSCRIPT";
  if (
    normalized.includes("parent") ||
    normalized.includes("guardian") ||
    normalized.includes("consent")
  ) {
    return "COMPLETE_PARENT_FORM";
  }
  if (
    normalized.includes("recommendation") ||
    normalized.includes("reference")
  ) {
    return "REQUEST_RECOMMENDATION";
  }
  if (normalized.includes("resume") || normalized.includes("cv")) {
    return "UPLOAD_RESUME";
  }

  return "CUSTOM";
}

function initialTask(
  task: Omit<InitialApplicationTask, "sortOrder" | "status">,
): Omit<InitialApplicationTask, "sortOrder"> {
  return {
    ...task,
    status: "NOT_STARTED",
  };
}

/**
 * Builds deterministic, idempotent preparation tasks. The returned rows are
 * compatible with ApplicationTask createMany data after applicationId is added.
 */
export function buildInitialApplicationTasks({
  applicationMethod,
  deadline,
  opensAt,
  requiredDocuments,
  essayQuestionCount,
  now = new Date(),
  studentProvidedExternal = false,
}: BuildInitialApplicationTasksInput): InitialApplicationTask[] {
  const today = toUtcDate(now) ?? new Date(0);
  const deadlineDate = toUtcDate(deadline);
  const openingDate = opensAt && opensAt > now ? toUtcDate(opensAt) : null;
  const reviewDueAt = clampToDate(
    earlierDate(
      openingDate,
      deadlineDate ? addUtcDays(deadlineDate, -14) : null,
    ),
    today,
  );
  const preparationDueAt = clampToDate(
    earlierDate(
      openingDate,
      deadlineDate ? addUtcDays(deadlineDate, -7) : null,
    ),
    today,
  );
  const rows: Array<Omit<InitialApplicationTask, "sortOrder">> = [
    initialTask({
      description:
        "Confirm that the published eligibility details match your situation.",
      dueAt: reviewDueAt,
      required: true,
      source: "SYSTEM",
      studentControlled: false,
      taskKey: "SYSTEM:REVIEW_ELIGIBILITY",
      title: "Review your eligibility",
      type: "REVIEW_ELIGIBILITY",
    }),
    initialTask({
      description:
        "Review the official source and note every required application step.",
      dueAt: reviewDueAt,
      required: true,
      source: "SYSTEM",
      studentControlled: false,
      taskKey: "SYSTEM:REVIEW_OFFICIAL_REQUIREMENTS",
      title: "Review the official application requirements",
      type: "REVIEW_OFFICIAL_REQUIREMENTS",
    }),
    initialTask({
      description: "Choose the resume version you plan to use.",
      dueAt: preparationDueAt,
      required: true,
      source: "SYSTEM",
      studentControlled: false,
      taskKey: "SYSTEM:SELECT_RESUME",
      title: "Select a resume",
      type: "SELECT_RESUME",
    }),
  ];

  for (const document of requiredDocuments) {
    const title = normalizeTaskTitle(document);
    if (!title) continue;
    const normalized = title.toLowerCase();

    rows.push(
      initialTask({
        description: "Prepare this document for the application.",
        dueAt: preparationDueAt,
        required: true,
        source: "OPPORTUNITY",
        studentControlled: false,
        taskKey: `OPPORTUNITY:REQUIRED_DOCUMENT:${stableStringHash(normalized)}`,
        title,
        type: getRequiredDocumentTaskType(title),
      }),
    );
  }

  if ((essayQuestionCount ?? 0) > 0) {
    const count = Math.max(1, Math.trunc(essayQuestionCount ?? 1));
    rows.push(
      initialTask({
        description: "Draft each response, verify the facts, and review it.",
        dueAt: preparationDueAt,
        required: true,
        source: "OPPORTUNITY",
        studentControlled: false,
        taskKey: "OPPORTUNITY:PREPARE_ESSAYS",
        title: `Prepare ${count} essay response${count === 1 ? "" : "s"}`,
        type: "PREPARE_ESSAY",
      }),
    );
  }

  if (applicationMethod === "EXTERNAL_PORTAL") {
    rows.push(
      initialTask({
        description: studentProvidedExternal
          ? "Open the private link you added and confirm where the application is submitted."
          : "Open the official host portal when applications are accepting submissions.",
        dueAt: openingDate ?? preparationDueAt,
        required: true,
        source: "SYSTEM",
        studentControlled: false,
        taskKey: "SYSTEM:OPEN_EXTERNAL_PORTAL",
        title: studentProvidedExternal
          ? "Open the student-provided application link"
          : "Open the official application portal",
        type: "OPEN_EXTERNAL_PORTAL",
      }),
      initialTask({
        description: studentProvidedExternal
          ? "After submitting outside Future Physicians, explicitly confirm your submission here."
          : "After you submit on the host site, explicitly confirm it in Future Physicians.",
        dueAt: deadlineDate,
        required: true,
        source: "SYSTEM",
        studentControlled: false,
        taskKey: "SYSTEM:CONFIRM_EXTERNAL_SUBMISSION",
        title: studentProvidedExternal
          ? "Confirm external submission"
          : "Confirm submission in the host portal",
        type: "CONFIRM_EXTERNAL_SUBMISSION",
      }),
    );
  } else {
    rows.push(
      initialTask({
        description:
          "Review your materials and explicitly submit through Future Physicians.",
        dueAt: deadlineDate,
        required: true,
        source: "SYSTEM",
        studentControlled: false,
        taskKey: "SYSTEM:SUBMIT_INTERNAL_APPLICATION",
        title: "Submit the Future Physicians application",
        type: "SUBMIT_INTERNAL_APPLICATION",
      }),
    );
  }

  const seenTitles = new Set<string>();
  return rows
    .filter((task) => {
      const titleKey = task.title.toLowerCase();
      if (seenTitles.has(titleKey)) return false;
      seenTitles.add(titleKey);
      return true;
    })
    .map((task, sortOrder) => ({ ...task, sortOrder }));
}

export function getApplicationTaskProgress(
  tasks: readonly Pick<ApplicationTaskLike, "required" | "status">[],
  legacyPercent = 0,
): ApplicationTaskProgress {
  if (tasks.length === 0) {
    return {
      completedRequired: 0,
      percent: Math.max(0, Math.min(100, Math.round(legacyPercent))),
      requiredTotal: 0,
      usesLegacyFallback: true,
    };
  }

  const requiredTasks = tasks.filter(
    (task) => task.required && task.status !== "SKIPPED",
  );
  const completedRequired = requiredTasks.filter(
    (task) => task.status === "COMPLETE",
  ).length;

  return {
    completedRequired,
    percent:
      requiredTasks.length === 0
        ? 100
        : Math.round((completedRequired / requiredTasks.length) * 100),
    requiredTotal: requiredTasks.length,
    usesLegacyFallback: false,
  };
}

export function calculateApplicationProgress(
  tasks: readonly Pick<ApplicationTaskLike, "required" | "status">[],
  legacyPercent = 0,
) {
  return getApplicationTaskProgress(tasks, legacyPercent).percent;
}

function taskDateBucket(
  task: Pick<ApplicationTaskLike, "dueAt" | "status">,
  now: Date,
  timezone: string,
): TaskDateBucket {
  if (task.status === "COMPLETE" || task.status === "SKIPPED") {
    return "completed";
  }

  if (!task.dueAt) return "later";
  const calendarDays = differenceInStudentCalendarDays(
    task.dueAt,
    now,
    timezone,
  );
  if (calendarDays < 0) return "overdue";
  if (calendarDays === 0) return "today";
  if (calendarDays <= 7) return "thisWeek";
  return "later";
}

function taskSortValue(task: ApplicationTaskLike) {
  return [
    task.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER,
    task.required ? 0 : 1,
    task.status === "BLOCKED" ? 0 : 1,
    task.sortOrder,
    task.createdAt?.getTime() ?? 0,
  ] as const;
}

function compareTasks(left: ApplicationTaskLike, right: ApplicationTaskLike) {
  const leftValues = taskSortValue(left);
  const rightValues = taskSortValue(right);

  for (let index = 0; index < leftValues.length; index += 1) {
    const difference = leftValues[index] - rightValues[index];
    if (difference !== 0) return difference;
  }

  return left.title.localeCompare(right.title);
}

export function groupApplicationTasks<T extends ApplicationTaskLike>(
  tasks: readonly T[],
  now = new Date(),
  timezone = "UTC",
): ApplicationTaskGroups<T> {
  const groups: ApplicationTaskGroups<T> = {
    overdue: [],
    today: [],
    thisWeek: [],
    later: [],
    completed: [],
  };

  for (const task of tasks) {
    groups[taskDateBucket(task, now, timezone)].push(task);
  }

  groups.overdue.sort(compareTasks);
  groups.today.sort(compareTasks);
  groups.thisWeek.sort(compareTasks);
  groups.later.sort(compareTasks);
  groups.completed.sort((left, right) => {
    const leftDate =
      left.completedAt?.getTime() ?? left.updatedAt?.getTime() ?? 0;
    const rightDate =
      right.completedAt?.getTime() ?? right.updatedAt?.getTime() ?? 0;
    return rightDate - leftDate || compareTasks(left, right);
  });

  return groups;
}

export function filterApplicationTasks<T extends ApplicationTaskLike>(
  tasks: readonly T[],
  filters: TaskFilterInput,
  now = new Date(),
  timezone = "UTC",
) {
  return tasks.filter((task) => {
    if (filters.applicationId && task.applicationId !== filters.applicationId) {
      return false;
    }
    if (filters.type && task.type !== filters.type) return false;

    if (filters.completion === "OPEN") {
      if (task.status === "COMPLETE" || task.status === "SKIPPED") return false;
    } else if (filters.completion === "COMPLETED") {
      if (task.status !== "COMPLETE" && task.status !== "SKIPPED") return false;
    } else if (filters.completion === "BLOCKED" && task.status !== "BLOCKED") {
      return false;
    }

    if (filters.due && filters.due !== "ALL") {
      const bucket = taskDateBucket(task, now, timezone);
      const expectedBucket: Record<
        Exclude<TaskDueFilter, "ALL">,
        TaskDateBucket
      > = {
        OVERDUE: "overdue",
        TODAY: "today",
        THIS_WEEK: "thisWeek",
        LATER: "later",
      };
      if (bucket !== expectedBucket[filters.due]) return false;
    }

    return true;
  });
}

function isDueWithinDays(
  task: ApplicationTaskLike,
  now: Date,
  days: number,
  timezone: string,
) {
  if (!task.dueAt) return false;
  const calendarDays = differenceInStudentCalendarDays(
    task.dueAt,
    now,
    timezone,
  );
  return calendarDays >= 0 && calendarDays <= days;
}

function nextActionRank(
  task: ApplicationTaskLike,
  tasks: readonly ApplicationTaskLike[],
  canSubmit: boolean,
  now: Date,
  timezone: string,
) {
  const isSubmission = submissionTaskTypes.has(task.type);
  const readyToSubmit = tasks.every(
    (candidate) =>
      candidate.id === task.id ||
      submissionTaskTypes.has(candidate.type) ||
      !candidate.required ||
      candidate.status === "COMPLETE" ||
      candidate.status === "SKIPPED",
  );

  if (isSubmission && (!readyToSubmit || !canSubmit)) return 90;
  if (task.required && taskDateBucket(task, now, timezone) === "overdue") {
    return 0;
  }
  if (task.required && isDueWithinDays(task, now, 7, timezone)) return 1;
  if (documentTaskTypes.has(task.type) && task.status === "BLOCKED") return 2;
  if (task.required && documentTaskTypes.has(task.type)) return 3;
  if (isSubmission) return 4;
  if (
    task.type === "SCHEDULE_INTERVIEW" ||
    task.type === "PREPARE_FOR_INTERVIEW"
  ) {
    return 5;
  }
  if (task.type === "SEND_FOLLOW_UP") return 6;
  if (task.type === "REPORT_OUTCOME") return 7;
  return task.required ? 8 : 9;
}

export function getTaskWhyItMatters(
  task: ApplicationTaskLike,
  now = new Date(),
  timezone = "UTC",
) {
  const bucket = taskDateBucket(task, now, timezone);
  if (bucket === "overdue") return "This required step is overdue.";
  if (bucket === "today") return "This step is due today.";
  if (bucket === "thisWeek") return "This step is due within the next week.";
  if (task.status === "BLOCKED") {
    return "Resolve the blocker so your application can keep moving.";
  }
  if (documentTaskTypes.has(task.type)) {
    return "This material may be needed before your application is ready.";
  }
  if (submissionTaskTypes.has(task.type)) {
    return "Explicit submission or confirmation is required to finish applying.";
  }
  if (task.type === "PREPARE_FOR_INTERVIEW") {
    return "Preparation helps you arrive ready with specific examples and questions.";
  }
  if (task.type === "SEND_FOLLOW_UP") {
    return "A timely follow-up keeps your application organized and professional.";
  }
  if (task.type === "REPORT_OUTCOME") {
    return "Recording the outcome keeps your application history accurate.";
  }
  return task.required
    ? "This required step contributes to application readiness."
    : "This is part of the plan you created for this application.";
}

export function getApplicationTaskHref(
  task: Pick<ApplicationTaskLike, "id" | "applicationId" | "type">,
  opportunityId: string,
) {
  if (task.type === "UPLOAD_RESUME") return "/dashboard/student#resume";
  if (
    task.type === "REVIEW_ELIGIBILITY" ||
    task.type === "REVIEW_OFFICIAL_REQUIREMENTS"
  ) {
    return `/dashboard/student/opportunities/${opportunityId}`;
  }
  if (submissionTaskTypes.has(task.type)) {
    return `/dashboard/student/opportunities/${opportunityId}/apply`;
  }
  return `/dashboard/student/applications/${task.applicationId}#task-${task.id}`;
}

export function getApplicationNextAction<T extends ApplicationTaskLike>(
  tasks: readonly T[],
  context: ApplicationNextActionContext,
  now = new Date(),
  timezone = "UTC",
): CalculatedApplicationNextAction<T> | null {
  const openTasks = tasks.filter(
    (task) => task.status !== "COMPLETE" && task.status !== "SKIPPED",
  );
  if (openTasks.length === 0) return null;

  const ranked = [...openTasks].sort((left, right) => {
    const rankDifference =
      nextActionRank(left, tasks, context.canSubmit ?? true, now, timezone) -
      nextActionRank(right, tasks, context.canSubmit ?? true, now, timezone);
    return rankDifference || compareTasks(left, right);
  });
  const task = ranked.find(
    (candidate) =>
      nextActionRank(
        candidate,
        tasks,
        context.canSubmit ?? true,
        now,
        timezone,
      ) < 90,
  );
  if (!task) return null;

  return {
    task,
    href: getApplicationTaskHref(task, context.opportunityId),
    whyItMatters: getTaskWhyItMatters(task, now, timezone),
  };
}

export function formatApplicationTaskType(type: ApplicationTaskType) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatApplicationTaskStatus(status: ApplicationTaskStatus) {
  if (status === "COMPLETE") return "Complete";
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseTaskDueDate(value: string) {
  if (!value) return { ok: true as const, value: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { ok: false as const, error: "Enter a valid due date." };
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    return { ok: false as const, error: "Enter a valid due date." };
  }

  return { ok: true as const, value: parsed };
}
