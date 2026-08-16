"use client";

import {
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  Compass,
  LayoutDashboard,
  RefreshCcw,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode, SVGProps } from "react";

import { DashboardMobileNavigation } from "@/components/dashboard/dashboard-mobile-navigation";
import { BrandMark } from "@/components/shared/brand-mark";
import { cn } from "@/lib/utils";

import { DemoExitButton } from "./demo-exit-button";
import { useDemoState } from "./demo-state-provider";

type DemoRole = "partner" | "student";
type DemoNavItem = {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
};

const studentNav: DemoNavItem[] = [
  {
    href: "/demo/student",
    icon: LayoutDashboard,
    label: "Overview",
  },
  {
    href: "/demo/student/opportunities",
    icon: Compass,
    label: "Opportunities",
  },
  {
    href: "/demo/student/applications",
    icon: ClipboardCheck,
    label: "Applications",
  },
  {
    href: "/demo/student/onboarding",
    icon: Sparkles,
    label: "Onboarding preview",
  },
  {
    href: "/demo/student/profile",
    icon: UserRound,
    label: "Profile",
  },
];

const partnerNav: DemoNavItem[] = [
  {
    href: "/demo/partner",
    icon: LayoutDashboard,
    label: "Overview",
  },
  {
    href: "/demo/partner/opportunities",
    icon: BriefcaseBusiness,
    label: "Opportunities",
  },
  {
    href: "/demo/partner/applicants",
    icon: UsersRound,
    label: "Applicants",
  },
];

function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-blue-surface px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-secondary" />
      Demo — synthetic data
    </span>
  );
}

function DemoNav({ items }: { items: DemoNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Demo workspace navigation" className="space-y-1.5">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href.split("/").length > 3 &&
            pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-blue-surface hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active &&
                "bg-primary font-semibold text-primary-foreground shadow-[0_7px_18px_rgba(36,95,213,0.2)] hover:bg-primary-hover hover:text-primary-foreground",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DemoShell({
  children,
  role,
}: {
  children: ReactNode;
  role: DemoRole;
}) {
  const { resetDemo } = useDemoState();
  const items = role === "student" ? studentNav : partnerNav;
  const roleLabel = role === "student" ? "Student" : "Partner";
  const RoleIcon = role === "student" ? UserRound : Building2;

  return (
    <div className="min-h-screen bg-page md:flex">
      <aside className="hidden w-64 shrink-0 border-r border-border/80 bg-card md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <div className="px-5 py-4">
          <BrandMark href="/demo" />
        </div>
        <div className="mx-3 rounded-[14px] border border-primary/10 bg-blue-surface p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl border border-white bg-card text-primary shadow-sm">
              <RoleIcon aria-hidden="true" className="size-4" />
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-brand-navy">
                {roleLabel} dashboard
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                Recruiter walkthrough
              </span>
            </span>
          </div>
          <div className="mt-3">
            <DemoBadge />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <DemoNav items={items} />
        </div>
        <Link
          className="mx-3 mb-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold text-brand-navy transition hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href="/demo"
        >
          Switch demo role
        </Link>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-card/95 backdrop-blur">
          <div className="mx-auto flex min-h-[72px] max-w-[1180px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <DashboardMobileNavigation
              brandHref="/demo"
              brandPrefetch={false}
              workspaceBadge={<DemoBadge />}
              workspaceDescription="Synthetic, browser-only product walkthrough"
              workspaceLabel={roleLabel}
            >
              <DemoNav items={items} />
              <Link
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold text-brand-navy"
                href="/demo"
              >
                Switch demo role
              </Link>
            </DashboardMobileNavigation>

            <div className="min-w-0 flex-1 md:hidden">
              <p className="truncate text-sm font-semibold text-brand-navy">
                {roleLabel} demo
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Synthetic data
              </p>
            </div>
            <div className="hidden flex-1 md:block">
              <DemoBadge />
            </div>

            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-brand-navy transition hover:border-primary/25 hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={resetDemo}
              type="button"
            >
              <RefreshCcw aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Reset Demo</span>
              <span className="sr-only sm:hidden">Reset Demo</span>
            </button>
            <DemoExitButton
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-brand-navy transition hover:border-error/25 hover:bg-error/5 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
              compact
            />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
