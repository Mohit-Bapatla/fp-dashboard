import { Archive, CheckCircle2, Edit3, Send, XCircle } from "lucide-react";
import Link from "next/link";

import {
  archivePartnerOpportunity,
  closePartnerOpportunity,
  submitPartnerOpportunityForApproval,
} from "@/app/dashboard/partner/opportunities/actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import type {
  OpportunityStatus,
  OpportunityType,
} from "@/generated/prisma/enums";

export type PartnerOpportunityManagementItem = {
  id: string;
  title: string;
  type: OpportunityType;
  status: OpportunityStatus;
  specialty: string | null;
  location: string | null;
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

type PartnerOpportunityManagementListProps = {
  opportunities: PartnerOpportunityManagementItem[];
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

function StatusAction({
  action,
  disabled,
  icon: Icon,
  label,
  opportunityId,
  redirectTo,
}: {
  action: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
  icon: typeof Send;
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

export function PartnerOpportunityManagementList({
  opportunities,
  redirectTo,
}: PartnerOpportunityManagementListProps) {
  if (opportunities.length === 0) {
    return (
      <EmptyState
        description="Create a draft opportunity for one of your linked organizations, then submit it for admin approval when it is ready."
        icon={CheckCircle2}
        title="No partner opportunities yet"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_120px_130px_150px] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-normal text-muted-foreground lg:grid">
        <span>Opportunity</span>
        <span>Organization</span>
        <span>Status</span>
        <span>Applications</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="divide-y divide-border">
        {opportunities.map((opportunity) => {
          const canSubmit =
            opportunity.status === "DRAFT" || opportunity.status === "REJECTED";
          const canCloseOrArchive = opportunity.status === "PUBLISHED";

          return (
            <article
              className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_120px_130px_150px] lg:items-center"
              key={opportunity.id}
            >
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {opportunity.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatEnumLabel(opportunity.type)} |{" "}
                  {opportunity.specialty || "No specialty"} | Deadline{" "}
                  {formatDate(opportunity.deadline)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {opportunity.location || "No location"} | Capacity{" "}
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
              <p className="text-sm font-semibold text-foreground">
                {opportunity._count.applications}
              </p>
              <div className="flex items-center gap-2 lg:justify-end">
                <Link
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  href={`/dashboard/partner/opportunities/${opportunity.id}/edit`}
                  title="View or edit opportunity"
                >
                  <Edit3 aria-hidden="true" className="h-4 w-4" />
                  <span className="sr-only">View or edit opportunity</span>
                </Link>
                <StatusAction
                  action={submitPartnerOpportunityForApproval}
                  disabled={!canSubmit}
                  icon={Send}
                  label="Submit for approval"
                  opportunityId={opportunity.id}
                  redirectTo={redirectTo}
                />
                <StatusAction
                  action={archivePartnerOpportunity}
                  disabled={!canCloseOrArchive}
                  icon={Archive}
                  label="Archive opportunity"
                  opportunityId={opportunity.id}
                  redirectTo={redirectTo}
                />
                <StatusAction
                  action={closePartnerOpportunity}
                  disabled={!canCloseOrArchive}
                  icon={XCircle}
                  label="Close opportunity"
                  opportunityId={opportunity.id}
                  redirectTo={redirectTo}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
