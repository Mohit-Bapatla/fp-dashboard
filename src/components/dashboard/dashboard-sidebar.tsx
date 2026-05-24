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
    <aside className="hidden border-r border-border bg-background md:flex md:w-72 md:flex-col">
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
        className="flex-1 space-y-5 overflow-y-auto p-4"
      >
        {groupedItems.map(([groupName, items]) => (
          <div className="space-y-1" key={groupName ?? "main"}>
            {groupName ? (
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {groupName}
              </p>
            ) : null}
            {items.map((item) => {
              const ItemIcon = item.icon;

              if (item.href === "#") {
                return (
                  <span
                    className="flex cursor-default select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground/50"
                    key={item.label}
                  >
                    <ItemIcon
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 opacity-40"
                    />
                    <span>{item.label}</span>
                  </span>
                );
              }

              return (
                <Link
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                    item.active &&
                      "bg-primary/10 text-foreground font-semibold",
                  )}
                  href={item.href}
                  key={item.label}
                >
                  <ItemIcon
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4 shrink-0",
                      item.active ? "text-primary" : "text-muted-foreground/60",
                    )}
                  />
                  <span>{item.label}</span>
                  {item.active && (
                    <span
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
