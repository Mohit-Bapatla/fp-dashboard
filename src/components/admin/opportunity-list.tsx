import {
  Archive,
  CheckCircle2,
  Edit3,
  Lock,
  Search,
  XCircle,
} from "lucide-react";

import {
  archiveOpportunity,
  closeOpportunity,
  publishOpportunity,
} from "@/app/dashboard/admin/opportunities/actions";
import type {
  OpportunityStatus,
  OpportunityType,
} from "@/generated/prisma/enums";
import { EmptyState } from "@/components/dashboard/empty-state";

type OpportunityListItem = {
  id: string;
  title: string;
  type: OpportunityType;
  specialty: string | null;
  status: OpportunityStatus;
  location: string | null;
  remoteType: string | null;
  paidStatus: string | null;
  deadline: Date | null;
  capacity: number | null;
  publishedAt: Date | null;
  updatedAt: Date;
  organization: {
    name: string;
  };
};

type OpportunityListProps = {
  opportunities: OpportunityListItem[];
  redirectTo: string;
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
    case "ARCHIVED":
    case "CLOSED":
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

function StatusButton({
  action,
  disabled,
  icon: Icon,
  label,
  opportunityId,
  redirectTo,
}: {
  action: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
  icon: typeof CheckCircle2;
  label: string;
  opportunityId: string;
  redirectTo: string;
}) {
  return (
    <form action={action}>
      <input name="opportunityId" type="hidden" value={opportunityId} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <button
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled}
        title={label}
        type="submit"
      >
        <Icon aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">{label}</span>
      </button>
    </form>
  );
}

export function OpportunityList({
  opportunities,
  redirectTo,
}: OpportunityListProps) {
  if (opportunities.length === 0) {
    return (
      <EmptyState
        description="Create the first admin-managed opportunity or adjust the filters to widen the list."
        icon={Search}
        title="No opportunities found"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_120px_150px_150px] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-normal text-muted-foreground lg:grid">
        <span>Opportunity</span>
        <span>Partner</span>
        <span>Status</span>
        <span>Deadline</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="divide-y divide-border">
        {opportunities.map((opportunity) => (
          <article
            className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_120px_150px_150px] lg:items-center"
            key={opportunity.id}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {opportunity.title}
                </h3>
                <span className="rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {formatEnumLabel(opportunity.type)}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {[
                  opportunity.specialty,
                  opportunity.location,
                  opportunity.remoteType,
                ]
                  .filter(Boolean)
                  .join(" • ") || "No specialty or location set"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {opportunity.paidStatus || "Paid status not set"} · Capacity{" "}
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

            <div className="text-sm text-muted-foreground">
              <p>{formatDate(opportunity.deadline)}</p>
              <p className="mt-1 text-xs">
                Updated {formatDate(opportunity.updatedAt)}
              </p>
            </div>

            <div className="flex items-center gap-2 lg:justify-end">
              <a
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                href={`/dashboard/admin/opportunities/${opportunity.id}/edit`}
                title="Edit opportunity"
              >
                <Edit3 aria-hidden="true" className="h-4 w-4" />
                <span className="sr-only">Edit opportunity</span>
              </a>
              <StatusButton
                action={publishOpportunity}
                disabled={opportunity.status === "PUBLISHED"}
                icon={CheckCircle2}
                label="Publish opportunity"
                opportunityId={opportunity.id}
                redirectTo={redirectTo}
              />
              <StatusButton
                action={archiveOpportunity}
                disabled={opportunity.status === "ARCHIVED"}
                icon={Archive}
                label="Archive opportunity"
                opportunityId={opportunity.id}
                redirectTo={redirectTo}
              />
              <StatusButton
                action={closeOpportunity}
                disabled={opportunity.status === "CLOSED"}
                icon={XCircle}
                label="Close opportunity"
                opportunityId={opportunity.id}
                redirectTo={redirectTo}
              />
              {opportunity.status !== "PUBLISHED" ? (
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground"
                  title="Not visible to students yet"
                >
                  <Lock aria-hidden="true" className="h-4 w-4" />
                  <span className="sr-only">Not visible to students yet</span>
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
