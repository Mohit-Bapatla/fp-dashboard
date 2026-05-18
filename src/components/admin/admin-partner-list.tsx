import { Building2, Search } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import type { PartnerStatus } from "@/generated/prisma/enums";

export type AdminPartnerListItem = {
  id: string;
  name: string;
  status: PartnerStatus;
  type: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  contactEmail: string | null;
  createdAt: Date;
  memberCount: number;
  opportunityCount: number;
  applicationCount: number;
};

type AdminPartnerListProps = {
  partners: AdminPartnerListItem[];
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClassName(status: PartnerStatus) {
  switch (status) {
    case "PARTNERED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INTERESTED":
    case "MEETING_SCHEDULED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "FOLLOW_UP_NEEDED":
    case "CONTACTED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "REJECTED":
    case "NO_RESPONSE":
      return "border-red-200 bg-red-50 text-red-700";
    case "PAUSED":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "NOT_CONTACTED":
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getLocation(partner: AdminPartnerListItem) {
  return (
    partner.location ||
    [partner.city, partner.state, partner.country].filter(Boolean).join(", ") ||
    "Not provided"
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function AdminPartnerList({ partners }: AdminPartnerListProps) {
  if (partners.length === 0) {
    return (
      <EmptyState
        description="No partner organizations match the current filters. Clear the filters to return to the full partner list."
        icon={Search}
        title="No partners found"
      />
    );
  }

  return (
    <div className="grid gap-4">
      {partners.map((partner) => (
        <article
          className="rounded-lg border border-border bg-background p-5 shadow-sm"
          key={partner.id}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-primary">
                <Building2 aria-hidden="true" className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-normal text-foreground">
                {partner.name}
              </h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {partner.contactEmail ?? "No contact email"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={[
                  "inline-flex rounded-md border px-2.5 py-1 text-xs font-medium",
                  statusClassName(partner.status),
                ].join(" ")}
              >
                {formatEnumLabel(partner.status)}
              </span>
              <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium text-muted-foreground">
                Created {formatDate(partner.createdAt)}
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Detail label="Type" value={partner.type ?? "Not provided"} />
            <Detail label="Location" value={getLocation(partner)} />
            <Detail label="Members" value={partner.memberCount} />
            <Detail label="Opportunities" value={partner.opportunityCount} />
            <Detail label="Applications" value={partner.applicationCount} />
          </div>
        </article>
      ))}
    </div>
  );
}
