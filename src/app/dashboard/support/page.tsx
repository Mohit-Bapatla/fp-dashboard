import { auth } from "@clerk/nextjs/server";
import { ClipboardList, LifeBuoy, Mail, MessageSquareText } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { DashboardRole } from "@/components/dashboard/role-config";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { getRoleFromSessionClaims } from "@/lib/auth/roles";
import { syncCurrentUserFromClerk } from "@/lib/auth/user-sync";
import { getPartnerNavItems } from "@/lib/partner/navigation";
import { getStaffNavItems } from "@/lib/staff/navigation";
import { getStudentNavItems } from "@/lib/student/navigation";
import {
  DASHBOARD_SUPPORT_ACTION,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from "@/lib/support-contact";

const reportDetails = [
  "Your role and the account email you used.",
  "The page URL where the issue happened.",
  "What you expected to happen.",
  "What actually happened.",
  "Steps to reproduce the issue.",
  "A screenshot or screen recording if it helps explain the problem.",
];

export default async function SupportPage() {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const appRole = getRoleFromSessionClaims(sessionClaims);
  await syncCurrentUserFromClerk({
    clerkUserId: userId,
    role: appRole,
  });
  const role = getDashboardRole(appRole);

  return (
    <DashboardShell navItems={getNavItems(role)} role={role}>
      <div className="space-y-8">
        <header className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Support
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Bug Reports and Beta Feedback
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            This is an authenticated support guide for the beta. It does not
            create a public support form or store bug reports in the database.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <SupportCard
            description="Use record-level feedback forms for application, placement request, applicant, and staff workflow feedback."
            href={getFeedbackHref(role)}
            icon={MessageSquareText}
            title="Existing feedback"
          />
          <SupportCard
            actionLabel={DASHBOARD_SUPPORT_ACTION.label}
            description="Open the public contact page for Future Physicians support."
            href={DASHBOARD_SUPPORT_ACTION.href}
            icon={Mail}
            title="Contact support"
          />
          <SupportCard
            description="Use launch and beta docs to verify whether the behavior is expected during rollout."
            href={getGuideHref(role)}
            icon={ClipboardList}
            title="Guides"
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <LifeBuoy aria-hidden="true" className="h-5 w-5 text-primary" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Include these details
          </h2>
          <ul className="mt-5 space-y-3">
            {reportDetails.map((item) => (
              <li
                className="text-sm leading-6 text-muted-foreground"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Need help with the FP Dashboard? Email{" "}
            <a
              aria-label={`Email Future Physicians support at ${SUPPORT_EMAIL}`}
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              href={SUPPORT_MAILTO}
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            and include what you expected, what happened, steps to reproduce the
            issue, and any helpful screenshots.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}

function getDashboardRole(role: string): DashboardRole {
  if (role === "PARTNER") {
    return "partner";
  }

  if (role === "STAFF") {
    return "staff";
  }

  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return "admin";
  }

  return "student";
}

function getNavItems(role: DashboardRole) {
  if (role === "admin") {
    return getAdminNavItems("/dashboard/support");
  }

  if (role === "staff") {
    return getStaffNavItems("/dashboard/support");
  }

  if (role === "partner") {
    return getPartnerNavItems("/dashboard/support");
  }

  return getStudentNavItems("/dashboard/support");
}

function getFeedbackHref(role: DashboardRole) {
  if (role === "admin") {
    return "/dashboard/admin/feedback";
  }

  if (role === "partner") {
    return "/dashboard/partner/applicants";
  }

  if (role === "staff") {
    return "/dashboard/staff/placement-requests";
  }

  return "/dashboard/student/applications";
}

function getGuideHref(role: DashboardRole) {
  if (role === "admin") {
    return "/dashboard/admin/launch";
  }

  if (role === "staff") {
    return "/dashboard/staff/launch";
  }

  if (role === "partner") {
    return "/dashboard/partner/beta";
  }

  return "/dashboard/student/beta";
}

export function SupportCard({
  actionLabel = "Open",
  description,
  href,
  icon: Icon,
  title,
}: {
  actionLabel?: string;
  description: string;
  href: string;
  icon: typeof LifeBuoy;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
      <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {href.startsWith("mailto:") ? (
        <a
          aria-label={`${actionLabel} at ${SUPPORT_EMAIL}`}
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          href={href}
        >
          {actionLabel}
        </a>
      ) : (
        <Link
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          href={href}
        >
          {actionLabel}
        </Link>
      )}
    </article>
  );
}
