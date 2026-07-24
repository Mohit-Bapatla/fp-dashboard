import { auth } from "@clerk/nextjs/server";
import { Bell } from "lucide-react";
import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUserNotificationSummary } from "@/lib/notifications/notifications";
import { cn } from "@/lib/utils";

import { DashboardAccountMenu } from "./dashboard-account-menu";
import { DashboardMobileNavigation } from "./dashboard-mobile-navigation";
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
  const activeItem = navItems.find((item) => item.active);
  const groupedItems = navItems.reduce<
    Array<[string | null, DashboardNavItem[]]>
  >((groups, item) => {
    const groupName = item.group ?? null;
    const existing = groups.find(([name]) => name === groupName);

    if (existing) {
      existing[1].push(item);
    } else {
      groups.push([groupName, [item]]);
    }

    return groups;
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="flex min-h-16 items-center gap-3 px-3 sm:px-5 lg:px-7 xl:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <DashboardMobileNavigation
            workspaceBadge={<RoleBadge role={role} />}
            workspaceDescription={meta.eyebrow}
            workspaceLabel={meta.label}
          >
            <nav
              aria-label={`${meta.label} mobile navigation`}
              className="space-y-4"
            >
              {groupedItems.map(([groupName, items]) => (
                <div className="space-y-1.5" key={groupName ?? "main"}>
                  {groupName ? (
                    <p className="px-3 pb-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      {groupName}
                    </p>
                  ) : null}
                  {items.map((item) => {
                    const ItemIcon = item.icon;

                    if (item.href === "#") {
                      return (
                        <span
                          aria-disabled="true"
                          className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground/45"
                          key={item.label}
                        >
                          <ItemIcon
                            aria-hidden="true"
                            className="size-4 shrink-0 opacity-50"
                          />
                          {item.label}
                        </span>
                      );
                    }

                    return (
                      <Link
                        aria-current={item.active ? "page" : undefined}
                        className={cn(
                          "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-blue-surface hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                          item.active &&
                            "bg-primary font-semibold text-primary-foreground shadow-[0_7px_18px_rgba(47,111,237,0.2)] hover:bg-primary-hover hover:text-primary-foreground",
                        )}
                        href={item.href}
                        key={item.label}
                      >
                        <ItemIcon
                          aria-hidden="true"
                          className={cn(
                            "size-4 shrink-0",
                            item.active
                              ? "text-primary-foreground"
                              : "text-muted-foreground/70 group-hover:text-primary",
                          )}
                        />
                        <span>{item.label}</span>
                        {item.active ? (
                          <span
                            aria-hidden="true"
                            className="ml-auto size-1.5 rounded-full bg-primary-foreground/90"
                          />
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </DashboardMobileNavigation>

          <div className="min-w-0">
            <p className="hidden text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground md:block">
              {meta.eyebrow}
            </p>
            <p className="truncate text-sm font-semibold text-brand-navy md:mt-0.5 md:text-[15px]">
              {activeItem?.label ?? `${meta.label} dashboard`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            aria-label={
              unreadCount > 0
                ? `${unreadCount} unread notifications`
                : "Notifications"
            }
            className={cn(
              "relative inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/25 hover:bg-blue-surface hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:size-11",
              unreadCount > 0 && "border-primary/20 text-primary",
            )}
            href="/dashboard/notifications"
          >
            <Bell aria-hidden="true" className="size-4.5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-card">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
          <RoleBadge className="hidden lg:inline-flex" role={role} />
          {displayName ? (
            <div className="hidden max-w-48 text-right xl:block">
              <p className="truncate text-sm font-semibold text-brand-navy">
                {displayName}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                App profile
              </p>
            </div>
          ) : null}
          <DashboardAccountMenu displayName={displayName || "Account"} />
        </div>
      </div>
    </header>
  );
}
