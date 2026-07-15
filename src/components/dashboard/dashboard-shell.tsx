import type { ReactNode } from "react";

import { DemoModeBanner } from "./demo-mode-banner";
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
    <div className="min-h-screen bg-page text-foreground">
      <a
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        href="#dashboard-content"
      >
        Skip to dashboard content
      </a>
      <div className="flex min-h-screen">
        <DashboardSidebar navItems={navItems} role={role} />
        <div className="flex min-w-0 flex-1 flex-col bg-page">
          <DashboardTopNav navItems={navItems} role={role} />
          <DemoModeBanner />
          <main
            className="flex-1 px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6 xl:px-8"
            id="dashboard-content"
          >
            <div className="mx-auto w-full max-w-[1280px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
