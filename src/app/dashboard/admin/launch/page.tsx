import {
  CheckCircle2,
  DatabaseZap,
  FileUp,
  LifeBuoy,
  Rocket,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";

const launchChecklist = [
  "Environment variables configured in Vercel and local beta environments.",
  "PostgreSQL migrations applied and Prisma client generated.",
  "Clerk roles configured through publicMetadata.role.",
  "Demo users verified with seeded demo data.",
  "Supabase Storage resume bucket configured for private resume files.",
  "Optional Resend, Sentry, and OpenAI setup reviewed.",
  "Vercel deploy verified with protected dashboard routes.",
  "CRON_SECRET configured for scheduled operational workflows.",
  "Seed/demo verification completed without real student data.",
];

const replacementChecklist = [
  "Student signup and profiles move into Clerk and student onboarding.",
  "Opportunities are created and moderated in the dashboard.",
  "Applications are reviewed from admin and partner workspaces.",
  "Placement requests are triaged from staff/admin queues.",
  "Outreach contacts and follow-ups move into the staff CRM.",
  "Partner applicant review happens in the partner dashboard.",
  "Analytics, data quality, and feedback are reviewed from admin pages.",
];

export default async function AdminLaunchPage() {
  await assertAdminAccess();

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/launch")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="admin" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Internal launch
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Launch Readiness
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Use this page as the admin control point for internal beta launch,
            deployment verification, demo checks, and the gradual move away from
            spreadsheets and forms.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <LaunchLink
            description="Import sanitized students, partners, and opportunities before beta onboarding."
            href="/dashboard/admin/data-imports"
            icon={FileUp}
            title="CSV imports"
          />
          <LaunchLink
            description="Review missing, stale, duplicate, and incomplete records before inviting users."
            href="/dashboard/admin/data-quality"
            icon={DatabaseZap}
            title="Data quality"
          />
          <LaunchLink
            description="Send issues through the authenticated support page with role, URL, steps, and screenshots."
            href="/dashboard/support"
            icon={LifeBuoy}
            title="Support"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <ChecklistCard title="Internal launch checklist">
            {launchChecklist}
          </ChecklistCard>
          <ChecklistCard title="Replace old workflow checklist">
            {replacementChecklist}
          </ChecklistCard>
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Launch documentation
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Keep the operational rollout anchored in written checklists. Repo
            docs live in `docs/internal-launch.md`, `docs/student-beta.md`,
            `docs/partner-beta.md`, and `docs/workflow-migration.md`.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <DocLink
              href="/dashboard/admin/data-imports"
              label="Data imports"
            />
            <DocLink
              href="/dashboard/admin/data-quality"
              label="Data quality"
            />
            <DocLink href="/dashboard/admin/analytics" label="Analytics" />
            <DocLink href="/dashboard/support" label="Support" />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function ChecklistCard({
  children,
  title,
}: {
  children: string[];
  title: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-background p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <ul className="mt-5 space-y-3">
        {children.map((item) => (
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
    </article>
  );
}

function LaunchLink({
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

function DocLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
      href={href}
    >
      {label}
    </Link>
  );
}
