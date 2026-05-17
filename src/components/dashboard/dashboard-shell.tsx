import type { ReactNode } from "react";

import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopNav } from "./dashboard-top-nav";
import type { DashboardNavItem, DashboardRole } from "./role-config";

type DashboardShellProps = {
  role: DashboardRole;
  navItems: DashboardNavItem[];
  children: ReactNode;
};

export function DashboardShell({
  role,
  navItems,
  children,
}: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-muted/30 text-foreground">
      <div className="flex min-h-screen">
        <DashboardSidebar navItems={navItems} role={role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopNav navItems={navItems} role={role} />
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
