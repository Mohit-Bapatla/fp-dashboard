import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Bell } from "lucide-react";
import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUserNotificationSummary } from "@/lib/notifications/notifications";
import { cn } from "@/lib/utils";

import { RoleBadge } from "./role-badge";
import type { DashboardNavItem, DashboardRole } from "./role-config";
import { roleMeta } from "./role-config";

type DashboardTopNavProps = {
  role: DashboardRole;
  navItems: DashboardNavItem[];
};

export async function DashboardTopNav({
  role,
  navItems,
}: DashboardTopNavProps) {
  const meta = roleMeta[role];
  const { unreadCount } = await getCurrentUserNotificationSummary();
  const { userId } = await auth();
  const appUser = userId
    ? await prisma.user.findUnique({
        where: {
          clerkUserId: userId,
        },
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      })
    : null;
  const displayName =
    appUser &&
    ([appUser.firstName, appUser.lastName].filter(Boolean).join(" ") ||
      appUser.email);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <Link
            className="text-sm font-semibold text-foreground md:hidden"
            href="/"
          >
            FP Dashboard
          </Link>
          <p className="hidden text-sm font-medium text-muted-foreground md:block">
            {meta.eyebrow}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            aria-label={
              unreadCount > 0
                ? `${unreadCount} unread notifications`
                : "Notifications"
            }
            className={cn(
              "relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground",
              unreadCount > 0 && "text-foreground",
            )}
            href="/dashboard/notifications"
          >
            <Bell aria-hidden="true" className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
          <RoleBadge role={role} />
          {displayName ? (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground">App profile</p>
            </div>
          ) : null}
          <UserButton />
        </div>
      </div>

      <nav
        aria-label={`${meta.label} mobile navigation`}
        className="flex gap-2 overflow-x-auto border-t border-border px-4 py-3 md:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {navItems
          .filter((item) => item.href !== "#")
          .map((item) => {
            const ItemIcon = item.icon;

            return (
              <Link
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  item.active &&
                    "border-primary/60 bg-primary/[0.08] text-foreground",
                )}
                href={item.href}
                key={item.label}
              >
                <ItemIcon aria-hidden="true" className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>
    </header>
  );
}
