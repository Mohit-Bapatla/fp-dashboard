import { BriefcaseBusiness, CalendarDays } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import type {
  OpportunityStatus,
  OpportunityType,
} from "@/generated/prisma/enums";

export type PartnerOpportunityListItem = {
  id: string;
  title: string;
  type: OpportunityType;
  status: OpportunityStatus;
  deadline: Date | null;
  capacity: number | null;
  updatedAt: Date;
  organization: {
    name: string;
  };
  _count: {
    applications: number;
  };
};

type PartnerOpportunityListProps = {
  opportunities: PartnerOpportunityListItem[];
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
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function statusClassName(status: OpportunityStatus) {
  switch (status) {
    case "PUBLISHED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CLOSED":
    case "ARCHIVED":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    case "PENDING_APPROVAL":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "DRAFT":
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function PartnerOpportunityList({
  opportunities,
}: PartnerOpportunityListProps) {
  if (opportunities.length === 0) {
    return (
      <EmptyState
        description="Partner-owned opportunities will appear here after Future Physicians connects records to your organization."
        icon={BriefcaseBusiness}
        title="No organization opportunities yet"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_120px_130px_120px] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-normal text-muted-foreground lg:grid">
        <span>Opportunity</span>
        <span>Organization</span>
        <span>Status</span>
        <span>Deadline</span>
        <span className="text-right">Applications</span>
      </div>
      <div className="divide-y divide-border">
        {opportunities.map((opportunity) => (
          <article
            className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_120px_130px_120px] lg:items-center"
            key={opportunity.id}
          >
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {opportunity.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatEnumLabel(opportunity.type)} · Capacity{" "}
                {opportunity.capacity ?? "not set"}
              </p>
            </div>
            <p className="text-sm font-medium text-foreground">
              {opportunity.organization.name}
            </p>
            <div>
              <span
                className={[
                  "inline-flex rounded-md border px-2.5 py-1 text-xs font-medium",
                  statusClassName(opportunity.status),
                ].join(" ")}
              >
                {formatEnumLabel(opportunity.status)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              {formatDate(opportunity.deadline)}
            </div>
            <p className="text-sm font-semibold text-foreground lg:text-right">
              {opportunity._count.applications}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
