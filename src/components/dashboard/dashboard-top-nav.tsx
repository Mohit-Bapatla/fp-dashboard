import Link from "next/link";

import { cn } from "@/lib/utils";

import { RoleBadge } from "./role-badge";
import type { DashboardNavItem, DashboardRole } from "./role-config";
import { roleMeta } from "./role-config";

type DashboardTopNavProps = {
  role: DashboardRole;
  navItems: DashboardNavItem[];
};

export function DashboardTopNav({ role, navItems }: DashboardTopNavProps) {
  const meta = roleMeta[role];

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
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
        <RoleBadge role={role} />
      </div>

      <nav
        aria-label={`${meta.label} mobile navigation`}
        className="flex gap-2 overflow-x-auto border-t border-border px-4 py-3 md:hidden"
      >
        {navItems.map((item) => {
          const ItemIcon = item.icon;

          return (
            <Link
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground",
                item.active && "border-primary bg-muted text-foreground",
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
