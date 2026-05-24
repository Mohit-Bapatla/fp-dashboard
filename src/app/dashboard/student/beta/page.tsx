import {
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  LifeBuoy,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";

const studentChecklist = [
  "Complete your student profile so opportunities can be matched to your goals.",
  "Upload a resume and review parse status before applying.",
  "Browse published opportunities and use search/filter tools.",
  "Apply to opportunities that match your interests and availability.",
  "Submit a placement request when the board does not have the right fit.",
  "Check notifications for application, interview, onboarding, and event updates.",
  "Share feedback from application and placement request pages.",
];

export default async function StudentBetaPage() {
  await assertStudentAccess();

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/beta")}
      role="student"
    >
      <div className="space-y-8">
        <header className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="student" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Student beta
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Beta Guide
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            FP Dashboard is in controlled beta. Use real care with your
            information, report anything confusing, and rely on Future
            Physicians staff for final placement guidance.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <BetaLink
            description="Update school, goals, interests, location, availability, and resume."
            href="/dashboard/student/onboarding"
            icon={ClipboardCheck}
            title="Profile readiness"
          />
          <BetaLink
            description="Find published opportunities, apply, and track application statuses."
            href="/dashboard/student/opportunities"
            icon={FileClock}
            title="Opportunities"
          />
          <BetaLink
            description="Use authenticated support when beta behavior seems wrong or unclear."
            href="/dashboard/support"
            icon={LifeBuoy}
            title="Support"
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Student onboarding checklist
          </h2>
          <ul className="mt-5 space-y-3">
            {studentChecklist.map((item) => (
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
          <BellRing aria-hidden="true" className="h-5 w-5 text-primary" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Beta feedback
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Use the feedback forms on your applications and placement requests
            when feedback is tied to a record. Use support for bugs, confusing
            screens, or access issues.
          </p>
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
  icon: typeof BellRing;
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
