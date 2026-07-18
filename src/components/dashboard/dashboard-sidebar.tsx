import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
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
    <aside className="hidden shrink-0 border-r border-border/80 bg-card md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col">
      <div className="px-5 py-4">
        <BrandMark className="w-full" />
      </div>

      <div className="mx-3 flex items-center gap-3 rounded-[14px] border border-primary/10 bg-blue-surface px-3 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/80 bg-card text-primary shadow-sm">
          <Icon aria-hidden="true" className="size-4.5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-brand-navy">
            {meta.label} dashboard
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
            {meta.eyebrow}
          </span>
        </span>
      </div>

      <nav
        aria-label={`${meta.label} navigation`}
        className="flex-1 space-y-4 overflow-y-auto px-3 py-4"
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
                    className="flex min-h-10 cursor-default select-none items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground/45"
                    key={item.label}
                  >
                    <ItemIcon
                      aria-hidden="true"
                      className="size-4 shrink-0 opacity-50"
                    />
                    <span>{item.label}</span>
                  </span>
                );
              }

              return (
                <Link
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:bg-blue-surface hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    item.active &&
                      "bg-primary font-semibold text-primary-foreground shadow-[0_7px_18px_rgba(47,111,237,0.2)] hover:bg-primary-hover hover:text-primary-foreground",
                  )}
                  href={item.href}
                  key={item.label}
                >
                  <ItemIcon
                    aria-hidden="true"
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      item.active
                        ? "text-primary-foreground"
                        : "text-muted-foreground/70 group-hover:text-primary",
                    )}
                  />
                  <span>{item.label}</span>
                  {item.active && (
                    <span
                      aria-hidden="true"
                      className="ml-auto size-1.5 rounded-full bg-primary-foreground/90"
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
