import { auth } from "@clerk/nextjs/server";
import { BellRing } from "lucide-react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type {
  DashboardNavItem,
  DashboardRole,
} from "@/components/dashboard/role-config";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { NotificationList } from "@/components/notifications/notification-list";
import type { UserRole } from "@/generated/prisma/enums";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";
import { getPartnerNavItems } from "@/lib/partner/navigation";
import { getStaffNavItems } from "@/lib/staff/navigation";
import { getStudentNavItems } from "@/lib/student/navigation";

function getDashboardRole(role: UserRole): DashboardRole {
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return "admin";
  }

  return role.toLowerCase() as DashboardRole;
}

function getNavItems(role: DashboardRole): DashboardNavItem[] {
  if (role === "admin") {
    return getAdminNavItems("/dashboard/notifications");
  }

  if (role === "staff") {
    return getStaffNavItems("/dashboard/notifications");
  }

  if (role === "partner") {
    return getPartnerNavItems("/dashboard/notifications");
  }

  return getStudentNavItems("/dashboard/notifications");
}

export default async function NotificationsPage() {
  const { redirectToSignIn, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkUserId: userId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/dashboard");
  }

  const [notifications, unreadCount, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      select: {
        body: true,
        createdAt: true,
        id: true,
        readAt: true,
        title: true,
      },
    }),
    prisma.notification.count({
      where: {
        readAt: null,
        userId: user.id,
      },
    }),
    prisma.notification.count({
      where: {
        userId: user.id,
      },
    }),
  ]);
  const dashboardRole = getDashboardRole(user.role);

  return (
    <DashboardShell navItems={getNavItems(dashboardRole)} role={dashboardRole}>
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role={dashboardRole} />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Workflow inbox
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Notifications
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Review application, placement request, opportunity, and outreach
              updates relevant to your dashboard role.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <BellRing aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section
          aria-label="Notification stats"
          className="grid gap-4 md:grid-cols-2"
        >
          <StatCard
            helper="Unread updates waiting for review."
            label="Unread"
            value={unreadCount.toString()}
          />
          <StatCard
            helper="Most recent notification records for this account."
            label="Total"
            value={totalCount.toString()}
          />
        </section>

        <NotificationList
          notifications={notifications}
          unreadCount={unreadCount}
        />
      </div>
    </DashboardShell>
  );
}
