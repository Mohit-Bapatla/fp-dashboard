import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  MapPin,
} from "lucide-react";
import Link from "next/link";

import { EligibilityBadge } from "@/components/opportunities/eligibility-badge";
import { type AppRole, getDashboardPathForRole } from "@/lib/auth/roles";
import { formatGradeLevelCode } from "@/lib/matching/grade-levels";
import type { EligibilityResult } from "@/lib/matching/opportunity-eligibility";
import type { PublicOpportunity } from "@/lib/public/opportunities";
import { getEffectiveApplicationMethod } from "@/lib/student/application-workspace";
import { cn } from "@/lib/utils";

export function formatOpportunityEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatOpportunityDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export function getPublicApplicationMethod(
  opportunity: Pick<
    PublicOpportunity,
    "applicationMethod" | "relationshipType"
  >,
) {
  return getEffectiveApplicationMethod(
    opportunity.relationshipType,
    opportunity.applicationMethod,
  );
}

export function getApplicationMethodLabel(
  opportunity: Pick<
    PublicOpportunity,
    "applicationMethod" | "relationshipType"
  >,
) {
  const method = getPublicApplicationMethod(opportunity);
  return method === "FP_INTERNAL"
    ? "Apply through FP"
    : method === "FP_REFERRAL"
      ? "FP introduction"
      : "External application";
}

function getLocationLabel(opportunity: PublicOpportunity) {
  const structuredLocation = [
    opportunity.city,
    opportunity.state,
    opportunity.country,
  ]
    .filter(Boolean)
    .join(", ");
  return opportunity.location || structuredLocation || "Location not listed";
}

function getDeadlineLabel(opportunity: PublicOpportunity) {
  if (opportunity.isRolling || opportunity.availabilityStatus === "ROLLING") {
    return "Rolling applications";
  }

  const deadline = formatOpportunityDate(opportunity.deadline);
  return deadline ? `Due ${deadline}` : "No published deadline";
}

function getGradeLabel(opportunity: PublicOpportunity) {
  if (opportunity.acceptedGradeLevels.length === 0) {
    return "Education level not listed";
  }

  const grades = opportunity.acceptedGradeLevels.map(formatGradeLevelCode);
  return grades.length > 3
    ? `${grades.slice(0, 3).join(", ")} +${grades.length - 3}`
    : grades.join(", ");
}

export function getPublicOpportunityCardAction(
  opportunityId: string,
  viewerRole: AppRole | null,
) {
  const dashboardHref = `/dashboard/student/opportunities/${opportunityId}`;

  if (!viewerRole) {
    return {
      href: `/sign-in?redirect_url=${encodeURIComponent(dashboardHref)}`,
      kind: "sign-in" as const,
      label: "Sign in to save",
    };
  }

  if (viewerRole === "STUDENT") {
    return {
      href: dashboardHref,
      kind: "save" as const,
      label: "Save in dashboard",
    };
  }

  return {
    href: getDashboardPathForRole(viewerRole),
    kind: "dashboard" as const,
    label: "Open your dashboard",
  };
}

export function PublicOpportunityCard({
  compact = false,
  eligibility,
  opportunity,
  viewerRole = null,
}: {
  compact?: boolean;
  eligibility?: EligibilityResult | null;
  opportunity: PublicOpportunity;
  viewerRole?: AppRole | null;
}) {
  const publicHref = `/opportunities/${opportunity.id}`;
  const action = getPublicOpportunityCardAction(opportunity.id, viewerRole);

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-border bg-white p-5 shadow-[0_8px_30px_rgba(16,33,58,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_14px_34px_rgba(16,33,58,0.09)] sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
          <CheckCircle2 aria-hidden="true" className="size-3.5" />
          Verified listing
        </span>
        <span className="rounded-full border border-border bg-blue-surface px-2.5 py-1 text-xs font-semibold text-primary">
          {formatOpportunityEnum(opportunity.type)}
        </span>
        {opportunity.availabilityStatus === "OPENING_SOON" ? (
          <span className="rounded-full border border-warning/20 bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
            Opening soon
          </span>
        ) : null}
        {eligibility ? (
          <EligibilityBadge category={eligibility.category} />
        ) : null}
      </div>

      <p className="mt-5 text-sm font-semibold text-muted-foreground">
        {opportunity.organization.name}
      </p>
      <h3
        className={cn(
          "mt-2 text-balance font-semibold leading-tight tracking-[-0.025em] text-brand-navy",
          compact ? "text-xl" : "text-2xl",
        )}
      >
        <Link
          className="rounded-md outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
          href={publicHref}
        >
          {opportunity.title}
        </Link>
      </h3>
      {opportunity.shortDescription || opportunity.description ? (
        <p
          className={cn(
            "mt-3 text-sm leading-6 text-muted-foreground",
            compact ? "line-clamp-2" : "line-clamp-3",
          )}
        >
          {opportunity.shortDescription || opportunity.description}
        </p>
      ) : null}

      <dl className="mt-5 grid gap-3 text-sm text-muted-foreground">
        <div className="flex gap-2.5">
          <MapPin
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <div>
            <dt className="sr-only">Location and format</dt>
            <dd>
              {getLocationLabel(opportunity)}
              {opportunity.remoteType
                ? ` \u00b7 ${opportunity.remoteType}`
                : ""}
            </dd>
          </div>
        </div>
        <div className="flex gap-2.5">
          <GraduationCap
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <div>
            <dt className="sr-only">Accepted education levels</dt>
            <dd>{getGradeLabel(opportunity)}</dd>
          </div>
        </div>
        <div className="flex gap-2.5">
          <CalendarDays
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <div>
            <dt className="sr-only">Application deadline</dt>
            <dd>{getDeadlineLabel(opportunity)}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4 text-xs font-semibold text-muted-foreground">
        <span className="rounded-lg bg-muted px-2.5 py-1.5">
          {getApplicationMethodLabel(opportunity)}
        </span>
        {opportunity.paidStatus ? (
          <span className="rounded-lg bg-muted px-2.5 py-1.5">
            {opportunity.paidStatus}
          </span>
        ) : null}
        {opportunity.specialty ? (
          <span className="rounded-lg bg-muted px-2.5 py-1.5">
            {opportunity.specialty}
          </span>
        ) : null}
      </div>

      <div className="relative z-10 mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href={publicHref}
        >
          View details
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-3.5 text-sm font-semibold text-brand-navy transition hover:border-primary/30 hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href={action.href}
        >
          {action.kind === "dashboard" ? (
            <LayoutDashboard aria-hidden="true" className="size-4" />
          ) : (
            <Bookmark aria-hidden="true" className="size-4" />
          )}
          {action.label}
        </Link>
      </div>
    </article>
  );
}
