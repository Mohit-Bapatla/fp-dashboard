import Link from "next/link";

import { cn } from "@/lib/utils";

import type { DashboardNavItem, DashboardRole } from "./role-config";
import { roleMeta } from "./role-config";

type DashboardSidebarProps = {
  role: DashboardRole;
  navItems: DashboardNavItem[];
};

export function DashboardSidebar({ role, navItems }: DashboardSidebarProps) {
  const meta = roleMeta[role];
  const Icon = meta.icon;

  return (
    <aside className="hidden border-r border-border bg-background/95 md:flex md:w-72 md:flex-col">
      <div className="border-b border-border p-6">
        <Link
          className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          href="/"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground">
              FP Dashboard
            </span>
            <span className="block text-xs text-muted-foreground">
              {meta.eyebrow}
            </span>
          </span>
        </Link>
      </div>

      <nav
        aria-label={`${meta.label} navigation`}
        className="flex-1 space-y-1 p-4"
      >
        {navItems.map((item) => {
          const ItemIcon = item.icon;

          return (
            <Link
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                item.active && "bg-primary/[0.08] text-foreground font-semibold",
              )}
              href={item.href}
              key={item.label}
            >
              <ItemIcon
                aria-hidden="true"
                className={cn("h-4 w-4 shrink-0", item.active ? "text-primary" : "text-muted-foreground/70")}
              />
              <span>{item.label}</span>
              {item.active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
