import {
  Building2,
  CheckCircle2,
  ClipboardCheck,
  LifeBuoy,
  Medal,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { getCurrentPartnerContext } from "@/lib/partner/context";
import { getPartnerNavItems } from "@/lib/partner/navigation";

const partnerChecklist = [
  "Review your linked organization profile and notify FP staff if anything is outdated.",
  "Post or update opportunities for student browsing and applications.",
  "Review applicants from your linked organization dashboard.",
  "Update application statuses so students and staff have current information.",
  "Record interviews and service hours for accepted students.",
  "Share applicant quality and review-usefulness feedback from applicant workflows.",
];

export default async function PartnerBetaPage() {
  await getCurrentPartnerContext();

  return (
    <DashboardShell
      navItems={getPartnerNavItems("/dashboard/partner/beta")}
      role="partner"
    >
      <div className="space-y-8">
        <header className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="partner" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Partner beta
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Partner Beta Guide
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Use this controlled beta guide to review your organization,
            opportunity postings, applicants, interviews, service hours, and
            feedback loops.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <BetaLink
            description="Review linked organization details and current opportunities."
            href="/dashboard/partner/opportunities"
            icon={Building2}
            title="Organization setup"
          />
          <BetaLink
            description="Review applicants, statuses, summaries, interviews, and feedback."
            href="/dashboard/partner/applicants"
            icon={ClipboardCheck}
            title="Applicant review"
          />
          <BetaLink
            description="Report beta blockers with role, URL, steps, and expected behavior."
            href="/dashboard/support"
            icon={LifeBuoy}
            title="Support"
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Partner onboarding checklist
          </h2>
          <ul className="mt-5 space-y-3">
            {partnerChecklist.map((item) => (
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
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <Medal aria-hidden="true" className="h-5 w-5 text-primary" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Success dashboard
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            The partner success page summarizes applicant pipeline, interviews,
            service hours, and candidate quality feedback for your linked
            organizations only.
          </p>
          <Link
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
            href="/dashboard/partner/success"
          >
            Open success dashboard
          </Link>
        </section>
      </div>
    </DashboardShell>
  );
}

function BetaLink({
  description,
  href,
  icon: Icon,
  title,
}: {
  description: string;
  href: string;
  icon: typeof Building2;
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
