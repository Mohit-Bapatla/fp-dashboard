import { FileClock } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  PlacementRequestQueue,
  type PlacementRequestQueueItem,
} from "@/components/placement-requests/placement-request-queue";
import { Prisma } from "@/generated/prisma/client";
import type { DashboardRole } from "@/components/dashboard/role-config";
import type { PlacementRequestStatus } from "@/generated/prisma/enums";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { getRecordCommentThread } from "@/lib/comments/record-comments";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import {
  formatEnumLabel,
  isPlacementRequestPriority,
  isPlacementRequestStatus,
  placementRequestPriorityOptions,
  placementRequestStatusOptions,
} from "@/lib/placement-requests/validation";
import { getStaffNavItems } from "@/lib/staff/navigation";

type PlacementRequestQueuePageProps = {
  activeHref: string;
  dashboardRole: Extract<DashboardRole, "admin" | "staff">;
  description: string;
  searchParams: {
    assignedStaffId?: string;
    priority?: string;
    q?: string;
    status?: string;
  };
  title: string;
};

function getNavItems(role: Extract<DashboardRole, "admin" | "staff">) {
  return role === "admin"
    ? getAdminNavItems("/dashboard/admin/placement-requests")
    : getStaffNavItems("/dashboard/staff/placement-requests");
}

function buildRedirectTo({
  assignedStaffId,
  basePath,
  priority,
  query,
  status,
}: {
  assignedStaffId: string;
  basePath: string;
  priority: string;
  query: string;
  status: string;
}) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (status) {
    params.set("status", status);
  }

  if (priority) {
    params.set("priority", priority);
  }

  if (assignedStaffId) {
    params.set("assignedStaffId", assignedStaffId);
  }

  const search = params.toString();

  return search ? `${basePath}?${search}` : basePath;
}

export async function PlacementRequestQueuePage({
  activeHref,
  dashboardRole,
  description,
  searchParams,
  title,
}: PlacementRequestQueuePageProps) {
  await assertPlacementQueueAccess();

  const query = searchParams.q?.trim() ?? "";
  const status = searchParams.status
    ? isPlacementRequestStatus(searchParams.status)
      ? searchParams.status
      : ""
    : "";
  const priority = searchParams.priority
    ? isPlacementRequestPriority(searchParams.priority)
      ? searchParams.priority
      : ""
    : "";
  const staffUsers = await prisma.user.findMany({
    where: {
      role: "STAFF",
    },
    orderBy: [
      {
        firstName: "asc",
      },
      {
        email: "asc",
      },
    ],
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });
  const staffIds = new Set(staffUsers.map((user) => user.id));
  const assignedStaffId =
    searchParams.assignedStaffId && staffIds.has(searchParams.assignedStaffId)
      ? searchParams.assignedStaffId
      : "";
  const where: Prisma.PlacementRequestWhereInput = {};

  if (query) {
    where.OR = [
      {
        title: {
          contains: query,
        },
      },
      {
        description: {
          contains: query,
        },
      },
      {
        studentProfile: {
          user: {
            email: {
              contains: query,
            },
          },
        },
      },
      {
        studentProfile: {
          user: {
            firstName: {
              contains: query,
            },
          },
        },
      },
      {
        studentProfile: {
          user: {
            lastName: {
              contains: query,
            },
          },
        },
      },
      {
        studentProfile: {
          school: {
            contains: query,
          },
        },
      },
    ];
  }

  if (status) {
    where.status = status as PlacementRequestStatus;
  }

  if (priority) {
    where.priority = priority;
  }

  if (assignedStaffId) {
    where.assignedStaffId = assignedStaffId;
  }

  const [requests, totalCount, newCount, activeCount, urgentCount] =
    await Promise.all([
      prisma.placementRequest.findMany({
        where,
        orderBy: [
          {
            updatedAt: "desc",
          },
        ],
        select: {
          id: true,
          assignedStaffId: true,
          assignedStaff: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          availability: true,
          createdAt: true,
          description: true,
          locationPreference: true,
          notes: true,
          priority: true,
          remotePreference: true,
          requestedOpportunityTypes: true,
          requestedSpecialties: true,
          status: true,
          studentProfile: {
            select: {
              school: true,
              gradeYear: true,
              city: true,
              state: true,
              country: true,
              resumes: {
                take: 1,
                select: {
                  id: true,
                },
              },
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          title: true,
          updatedAt: true,
          urgency: true,
        },
      }),
      prisma.placementRequest.count(),
      prisma.placementRequest.count({
        where: {
          status: "NEW",
        },
      }),
      prisma.placementRequest.count({
        where: {
          status: {
            notIn: ["PLACED", "CLOSED"],
          },
        },
      }),
      prisma.placementRequest.count({
        where: {
          priority: "URGENT",
          status: {
            notIn: ["PLACED", "CLOSED"],
          },
        },
      }),
    ]);
  const requestsWithThreads = await Promise.all(
    requests.map(async (request) => ({
      ...request,
      commentThread: await getRecordCommentThread({
        entityId: request.id,
        entityType: "PLACEMENT_REQUEST",
      }),
    })),
  );
  const redirectTo = buildRedirectTo({
    assignedStaffId,
    basePath: activeHref,
    priority,
    query,
    status,
  });

  return (
    <DashboardShell navItems={getNavItems(dashboardRole)} role={dashboardRole}>
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role={dashboardRole} />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Placement queue
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <FileClock aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="All personalized placement requests."
            label="Total requests"
            value={totalCount.toString()}
          />
          <StatCard
            helper="Requests waiting for assignment or triage."
            label="New"
            value={newCount.toString()}
          />
          <StatCard
            helper="Requests not yet placed or closed."
            label="Active"
            value={activeCount.toString()}
          />
          <StatCard
            helper="Active requests marked urgent."
            label="Urgent"
            value={urgentCount.toString()}
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_160px_220px_auto] lg:items-end">
            <label className="text-sm font-medium text-foreground">
              Search
              <input
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
                defaultValue={query}
                name="q"
                placeholder="Search student, school, title, or notes"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Status
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={status}
                name="status"
              >
                <option value="">Any status</option>
                {placementRequestStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatEnumLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Priority
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={priority}
                name="priority"
              >
                <option value="">Any priority</option>
                {placementRequestPriorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Assignee
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={assignedStaffId}
                name="assignedStaffId"
              >
                <option value="">Any assignee</option>
                {staffUsers.map((staffUser) => (
                  <option key={staffUser.id} value={staffUser.id}>
                    {[staffUser.firstName, staffUser.lastName]
                      .filter(Boolean)
                      .join(" ") || staffUser.email}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                type="submit"
              >
                Apply
              </button>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href={activeHref}
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <PlacementRequestQueue
          redirectTo={redirectTo}
          requests={requestsWithThreads as PlacementRequestQueueItem[]}
          staffUsers={staffUsers}
        />
      </div>
    </DashboardShell>
  );
}
