import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
} from "lucide-react";
import Link from "next/link";

import type { OpportunityType } from "@/generated/prisma/enums";
import { EmptyState } from "@/components/dashboard/empty-state";

export type StudentOpportunityListItem = {
  id: string;
  title: string;
  description: string | null;
  type: OpportunityType;
  specialty: string | null;
  location: string | null;
  remoteType: string | null;
  paidStatus: string | null;
  deadline: Date | null;
  capacity: number | null;
  eligibilityRequirements: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  organization: {
    name: string;
  };
};

type StudentOpportunityListProps = {
  hasPublishedOpportunities: boolean;
  opportunities: StudentOpportunityListItem[];
};

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function previewText(value: string | null, maxLength = 160) {
  if (!value) {
    return "Details coming soon.";
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}

export function StudentOpportunityList({
  hasPublishedOpportunities,
  opportunities,
}: StudentOpportunityListProps) {
  if (opportunities.length === 0) {
    return (
      <EmptyState
        description={
          hasPublishedOpportunities
            ? "Try clearing filters or searching for another specialty, location, or partner."
            : "Published opportunities will appear here when the Future Physicians team opens listings for students."
        }
        icon={BriefcaseBusiness}
        title={
          hasPublishedOpportunities
            ? "No opportunities match your filters"
            : "No published opportunities yet"
        }
      />
    );
  }

  return (
    <div className="grid gap-4">
      {opportunities.map((opportunity) => (
        <article
          className="rounded-xl border border-border bg-background p-5 shadow-sm"
          key={opportunity.id}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {formatEnumLabel(opportunity.type)}
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  Published
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-normal text-foreground">
                {opportunity.title}
              </h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {opportunity.organization.name}
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                {previewText(opportunity.description)}
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              href={`/dashboard/student/opportunities/${opportunity.id}`}
            >
              View details
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OpportunityFact
              label="Specialty"
              value={opportunity.specialty ?? "Not specified"}
            />
            <OpportunityFact
              icon={MapPin}
              label="Location"
              value={opportunity.location ?? "Not specified"}
            />
            <OpportunityFact
              label="Format"
              value={opportunity.remoteType ?? "Not specified"}
            />
            <OpportunityFact
              label="Paid status"
              value={opportunity.paidStatus ?? "Not specified"}
            />
            <OpportunityFact
              icon={CalendarDays}
              label="Deadline"
              value={formatDate(opportunity.deadline)}
            />
            <OpportunityFact
              label="Capacity"
              value={
                opportunity.capacity
                  ? `${opportunity.capacity} students`
                  : "Not specified"
              }
            />
            <OpportunityFact
              label="Published"
              value={formatDate(
                opportunity.publishedAt ?? opportunity.createdAt,
              )}
            />
          </div>

          <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">
              Eligibility preview
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {previewText(opportunity.eligibilityRequirements, 220)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

type OpportunityFactProps = {
  icon?: typeof MapPin;
  label: string;
  value: string;
};

function OpportunityFact({ icon: Icon, label, value }: OpportunityFactProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
