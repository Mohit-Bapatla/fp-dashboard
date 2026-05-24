import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

type WorkflowSource = "cron" | "manual";

type RuleName =
  | "expiredOpportunities"
  | "stalePlacementRequests"
  | "dueFollowUps"
  | "applicationsUnderReview"
  | "overdueOutreachTasks";

type DedupedNotificationInput = {
  action: string;
  anchorDate: Date;
  body: string;
  entityId: string;
  entityType: string;
  metadata?: Prisma.InputJsonValue;
  recipientIds: Array<string | null | undefined>;
  title: string;
};

type DedupedNotificationResult = {
  auditsCreated: number;
  deduped: number;
  notificationsCreated: number;
};

export type OperationalWorkflowRuleResult = {
  auditsCreated: number;
  changed: number;
  deduped: number;
  errors: string[];
  notificationsCreated: number;
  rule: RuleName;
  scanned: number;
};

export type OperationalWorkflowRunResult = {
  durationMs: number;
  errors: string[];
  finishedAt: string;
  results: OperationalWorkflowRuleResult[];
  runId: string;
  source: WorkflowSource;
  startedAt: string;
  success: boolean;
  totals: {
    auditsCreated: number;
    changed: number;
    deduped: number;
    notificationsCreated: number;
    scanned: number;
  };
};

const staffRoles = ["STAFF", "ADMIN", "SUPER_ADMIN"] as const;
const terminalOpportunityStatuses = ["CLOSED", "ARCHIVED", "REJECTED"] as const;
const terminalPlacementRequestStatuses = ["PLACED", "CLOSED"] as const;

function emptyRuleResult(rule: RuleName): OperationalWorkflowRuleResult {
  return {
    auditsCreated: 0,
    changed: 0,
    deduped: 0,
    errors: [],
    notificationsCreated: 0,
    rule,
    scanned: 0,
  };
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown automation error.";
}

function daysAgo(days: number, now: Date) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);

  return date;
}

function hoursAgo(hours: number, now: Date) {
  const date = new Date(now);
  date.setHours(date.getHours() - hours);

  return date;
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

async function getStaffAdminRecipientIds() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: [...staffRoles],
      },
    },
    select: {
      id: true,
    },
  });

  return users.map((user) => user.id);
}

async function createDedupedNotification({
  action,
  anchorDate,
  body,
  entityId,
  entityType,
  metadata,
  recipientIds,
  title,
}: DedupedNotificationInput): Promise<DedupedNotificationResult> {
  const userIds = uniqueIds(recipientIds);

  if (userIds.length === 0) {
    return {
      auditsCreated: 0,
      deduped: 0,
      notificationsCreated: 0,
    };
  }

  return prisma.$transaction(async (tx) => {
    const existingAuditCount = await tx.auditLog.count({
      where: {
        action,
        createdAt: {
          gte: anchorDate,
        },
        entityId,
        entityType,
      },
    });

    if (existingAuditCount > 0) {
      return {
        auditsCreated: 0,
        deduped: 1,
        notificationsCreated: 0,
      };
    }

    const notificationResult = await tx.notification.createMany({
      data: userIds.map((userId) => ({
        body,
        title,
        userId,
      })),
    });

    await tx.auditLog.create({
      data: {
        action,
        entityId,
        entityType,
        metadata: {
          anchorDate: anchorDate.toISOString(),
          notificationCount: notificationResult.count,
          recipientIds: userIds,
          ...(metadata && typeof metadata === "object" ? metadata : {}),
        },
      },
    });

    return {
      auditsCreated: 1,
      deduped: 0,
      notificationsCreated: notificationResult.count,
    };
  });
}

function addNotificationResult(
  result: OperationalWorkflowRuleResult,
  notificationResult: DedupedNotificationResult,
) {
  result.auditsCreated += notificationResult.auditsCreated;
  result.deduped += notificationResult.deduped;
  result.notificationsCreated += notificationResult.notificationsCreated;
}

async function closeExpiredOpportunities(now: Date) {
  const result = emptyRuleResult("expiredOpportunities");
  const opportunities = await prisma.opportunity.findMany({
    where: {
      deadline: {
        lt: now,
      },
      status: {
        notIn: [...terminalOpportunityStatuses],
      },
    },
    select: {
      deadline: true,
      id: true,
      status: true,
      title: true,
    },
  });

  result.scanned = opportunities.length;

  for (const opportunity of opportunities) {
    const updateResult = await prisma.opportunity.updateMany({
      where: {
        id: opportunity.id,
        status: {
          notIn: [...terminalOpportunityStatuses],
        },
      },
      data: {
        status: "CLOSED",
      },
    });

    if (updateResult.count === 0) {
      result.deduped += 1;
      continue;
    }

    result.changed += updateResult.count;
    await prisma.auditLog.create({
      data: {
        action: "AUTOMATION_OPPORTUNITY_CLOSED",
        entityId: opportunity.id,
        entityType: "Opportunity",
        metadata: {
          deadline: opportunity.deadline?.toISOString() ?? null,
          previousStatus: opportunity.status,
          title: opportunity.title,
        },
      },
    });
    result.auditsCreated += 1;
  }

  return result;
}

async function notifyStalePlacementRequests(
  now: Date,
  staffRecipientIds: string[],
) {
  const result = emptyRuleResult("stalePlacementRequests");
  const cutoff = hoursAgo(48, now);
  const placementRequests = await prisma.placementRequest.findMany({
    where: {
      status: {
        notIn: [...terminalPlacementRequestStatuses],
      },
      updatedAt: {
        lte: cutoff,
      },
    },
    select: {
      assignedStaffId: true,
      id: true,
      status: true,
      title: true,
      updatedAt: true,
    },
  });

  result.scanned = placementRequests.length;

  for (const request of placementRequests) {
    const notificationResult = await createDedupedNotification({
      action: "AUTOMATION_PLACEMENT_REQUEST_STALE_NOTIFIED",
      anchorDate: request.updatedAt,
      body: `${request.title} has not been updated in 48 hours.`,
      entityId: request.id,
      entityType: "PlacementRequest",
      metadata: {
        status: request.status,
        title: request.title,
        updatedAt: request.updatedAt.toISOString(),
      },
      recipientIds: request.assignedStaffId
        ? [request.assignedStaffId]
        : staffRecipientIds,
      title: "Placement request needs review",
    });

    addNotificationResult(result, notificationResult);
  }

  return result;
}

async function notifyDueFollowUps(now: Date, staffRecipientIds: string[]) {
  const result = emptyRuleResult("dueFollowUps");
  const [organizations, contacts] = await Promise.all([
    prisma.partnerOrganization.findMany({
      where: {
        nextFollowUpAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        name: true,
        nextFollowUpAt: true,
        status: true,
      },
    }),
    prisma.outreachContact.findMany({
      where: {
        nextFollowUpAt: {
          lte: now,
        },
      },
      select: {
        firstName: true,
        id: true,
        lastName: true,
        nextFollowUpAt: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  result.scanned = organizations.length + contacts.length;

  for (const organization of organizations) {
    if (!organization.nextFollowUpAt) {
      continue;
    }

    const notificationResult = await createDedupedNotification({
      action: "AUTOMATION_PARTNER_FOLLOW_UP_DUE_NOTIFIED",
      anchorDate: organization.nextFollowUpAt,
      body: `${organization.name} has a partner follow-up due.`,
      entityId: organization.id,
      entityType: "PartnerOrganization",
      metadata: {
        nextFollowUpAt: organization.nextFollowUpAt.toISOString(),
        organizationName: organization.name,
        status: organization.status,
      },
      recipientIds: staffRecipientIds,
      title: "Partner follow-up due",
    });

    addNotificationResult(result, notificationResult);
  }

  for (const contact of contacts) {
    if (!contact.nextFollowUpAt) {
      continue;
    }

    const contactName = [contact.firstName, contact.lastName]
      .filter(Boolean)
      .join(" ");
    const notificationResult = await createDedupedNotification({
      action: "AUTOMATION_CONTACT_FOLLOW_UP_DUE_NOTIFIED",
      anchorDate: contact.nextFollowUpAt,
      body: `${contactName} at ${contact.organization.name} has a follow-up due.`,
      entityId: contact.id,
      entityType: "OutreachContact",
      metadata: {
        contactName,
        nextFollowUpAt: contact.nextFollowUpAt.toISOString(),
        organizationName: contact.organization.name,
      },
      recipientIds: staffRecipientIds,
      title: "Contact follow-up due",
    });

    addNotificationResult(result, notificationResult);
  }

  return result;
}

async function notifyApplicationsUnderReview(
  now: Date,
  staffRecipientIds: string[],
) {
  const result = emptyRuleResult("applicationsUnderReview");
  const cutoff = daysAgo(7, now);
  const applications = await prisma.application.findMany({
    where: {
      OR: [
        {
          reviewedAt: {
            lte: cutoff,
          },
        },
        {
          reviewedAt: null,
          updatedAt: {
            lte: cutoff,
          },
        },
      ],
      status: "UNDER_REVIEW",
    },
    select: {
      id: true,
      opportunity: {
        select: {
          organization: {
            select: {
              members: {
                select: {
                  userId: true,
                },
              },
              name: true,
            },
          },
          title: true,
        },
      },
      reviewedAt: true,
      studentProfile: {
        select: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      updatedAt: true,
    },
  });

  result.scanned = applications.length;

  for (const application of applications) {
    const anchorDate = application.reviewedAt ?? application.updatedAt;
    const studentName =
      [
        application.studentProfile.user.firstName,
        application.studentProfile.user.lastName,
      ]
        .filter(Boolean)
        .join(" ") || application.studentProfile.user.email;
    const partnerMemberIds = application.opportunity.organization.members.map(
      (member) => member.userId,
    );
    const notificationResult = await createDedupedNotification({
      action: "AUTOMATION_APPLICATION_REVIEW_DELAY_NOTIFIED",
      anchorDate,
      body: `${studentName}'s application for ${application.opportunity.title} has been under review for 7+ days.`,
      entityId: application.id,
      entityType: "Application",
      metadata: {
        anchorDate: anchorDate.toISOString(),
        opportunityTitle: application.opportunity.title,
        organizationName: application.opportunity.organization.name,
        studentName,
      },
      recipientIds:
        partnerMemberIds.length > 0 ? partnerMemberIds : staffRecipientIds,
      title: "Application review follow-up",
    });

    addNotificationResult(result, notificationResult);
  }

  return result;
}

async function notifyOverdueOutreachTasks(
  now: Date,
  staffRecipientIds: string[],
) {
  const result = emptyRuleResult("overdueOutreachTasks");
  const tasks = await prisma.outreachTask.findMany({
    where: {
      dueAt: {
        lt: now,
      },
      status: {
        not: "COMPLETED",
      },
    },
    select: {
      assignedToId: true,
      dueAt: true,
      id: true,
      priority: true,
      status: true,
      title: true,
    },
  });

  result.scanned = tasks.length;

  for (const task of tasks) {
    if (!task.dueAt) {
      continue;
    }

    const notificationResult = await createDedupedNotification({
      action: "AUTOMATION_OUTREACH_TASK_OVERDUE_NOTIFIED",
      anchorDate: task.dueAt,
      body: `${task.title} is overdue.`,
      entityId: task.id,
      entityType: "OutreachTask",
      metadata: {
        dueAt: task.dueAt.toISOString(),
        priority: task.priority,
        status: task.status,
        title: task.title,
      },
      recipientIds: task.assignedToId ? [task.assignedToId] : staffRecipientIds,
      title: "Outreach task overdue",
    });

    addNotificationResult(result, notificationResult);
  }

  return result;
}

async function runRule(
  rule: RuleName,
  callback: () => Promise<OperationalWorkflowRuleResult>,
) {
  try {
    return await callback();
  } catch (error) {
    return {
      ...emptyRuleResult(rule),
      errors: [formatError(error)],
    };
  }
}

export async function runOperationalWorkflows({
  actorId = null,
  source,
}: {
  actorId?: string | null;
  source: WorkflowSource;
}): Promise<OperationalWorkflowRunResult> {
  const runId = randomUUID();
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();
  const startedMs = Date.now();
  const staffRecipientIds = await getStaffAdminRecipientIds();

  const results = [
    await runRule("expiredOpportunities", () =>
      closeExpiredOpportunities(startedAtDate),
    ),
    await runRule("stalePlacementRequests", () =>
      notifyStalePlacementRequests(startedAtDate, staffRecipientIds),
    ),
    await runRule("dueFollowUps", () =>
      notifyDueFollowUps(startedAtDate, staffRecipientIds),
    ),
    await runRule("applicationsUnderReview", () =>
      notifyApplicationsUnderReview(startedAtDate, staffRecipientIds),
    ),
    await runRule("overdueOutreachTasks", () =>
      notifyOverdueOutreachTasks(startedAtDate, staffRecipientIds),
    ),
  ];
  const finishedAtDate = new Date();
  const totals = results.reduce(
    (accumulator, result) => ({
      auditsCreated: accumulator.auditsCreated + result.auditsCreated,
      changed: accumulator.changed + result.changed,
      deduped: accumulator.deduped + result.deduped,
      notificationsCreated:
        accumulator.notificationsCreated + result.notificationsCreated,
      scanned: accumulator.scanned + result.scanned,
    }),
    {
      auditsCreated: 0,
      changed: 0,
      deduped: 0,
      notificationsCreated: 0,
      scanned: 0,
    },
  );
  const errors = results.flatMap((result) => result.errors);
  const runResult: OperationalWorkflowRunResult = {
    durationMs: Date.now() - startedMs,
    errors,
    finishedAt: finishedAtDate.toISOString(),
    results,
    runId,
    source,
    startedAt,
    success: errors.length === 0,
    totals,
  };

  try {
    await prisma.auditLog.create({
      data: {
        action: "AUTOMATION_RUN_COMPLETED",
        actorId,
        entityId: runId,
        entityType: "AutomationRun",
        metadata: runResult as unknown as Prisma.InputJsonValue,
      },
    });
    runResult.totals.auditsCreated += 1;
  } catch (error) {
    runResult.success = false;
    runResult.errors.push(
      `Unable to create automation run audit log: ${formatError(error)}`,
    );
  }

  if (runResult.success) {
    console.info("Operational workflows completed", runResult);
  } else {
    console.error("Operational workflows completed with errors", runResult);
  }

  return runResult;
}
