import {
  CheckCircle2,
  LifeBuoy,
  MailCheck,
  Rocket,
  Workflow,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import { getStaffNavItems } from "@/lib/staff/navigation";

const quickStart = [
  "Review placement requests and assign active requests to staff owners.",
  "Move partner outreach into contacts, organizations, and outreach tasks.",
  "Run automations manually before trusting scheduled production checks.",
  "Use notifications and audit logs to confirm workflow changes are visible.",
  "Send launch issues through support with URL, role, steps, and expected behavior.",
];

export default async function StaffLaunchPage() {
  await assertPlacementQueueAccess();

  return (
    <DashboardShell
      navItems={getStaffNavItems("/dashboard/staff/launch")}
      role="staff"
    >
      <div className="space-y-8">
        <header className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="staff" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Staff launch
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Internal Operations Quick Start
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Use this guide to coordinate the first internal launch without
            reverting to manual memory or scattered spreadsheets.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <LaunchCard
            description="Triage student requests, assign owners, and update operational status."
            href="/dashboard/staff/placement-requests"
            icon={Workflow}
            title="Placement queue"
          />
          <LaunchCard
            description="Track contacts, partner follow-ups, notes, and outreach tasks."
            href="/dashboard/staff/outreach"
            icon={MailCheck}
            title="Outreach CRM"
          />
          <LaunchCard
            description="Report launch blockers with role, URL, steps, and expected result."
            href="/dashboard/support"
            icon={LifeBuoy}
            title="Support"
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Staff launch checklist
          </h2>
          <ul className="mt-5 space-y-3">
            {quickStart.map((item) => (
              <li
                className="flex gap-3 text-sm leading-6 text-muted-foreground"
                key={item}
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-1 h-4 w-4 shrink-0 text-primary"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              href="/dashboard/staff/automations"
            >
              Automations
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              href="/dashboard/support"
            >
              Support
            </Link>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function LaunchCard({
  description,
  href,
  icon: Icon,
  title,
}: {
  description: string;
  href: string;
  icon: typeof Rocket;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
      <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <Link
        className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
        href={href}
      >
        Open
      </Link>
    </article>
  );
}
