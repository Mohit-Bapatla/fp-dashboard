import { Building2, CalendarDays, Search } from "lucide-react";

import { updatePartnerOutreach } from "@/app/dashboard/staff/crm-actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PartnerStatusBadge } from "@/components/staff/crm-badges";
import type { PartnerStatus } from "@/generated/prisma/enums";
import {
  formatDateInput,
  formatEnumLabel,
  partnerStatusOptions,
} from "@/lib/staff/crm-validation";

export type StaffPartnerCrmItem = {
  id: string;
  contactEmail: string | null;
  createdAt: Date;
  description: string | null;
  lastContactedAt: Date | null;
  location: string | null;
  name: string;
  nextFollowUpAt: Date | null;
  status: PartnerStatus;
  type: string | null;
  _count: {
    outreachContacts: number;
    outreachTasks: number;
    opportunities: number;
  };
};

type StaffPartnerCrmListProps = {
  partners: StaffPartnerCrmItem[];
  redirectTo: string;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

export function StaffPartnerCrmList({
  partners,
  redirectTo,
}: StaffPartnerCrmListProps) {
  if (partners.length === 0) {
    return (
      <EmptyState
        description="No partner organizations match the current filters. Clear filters or create partners from the admin opportunity workflow."
        icon={Search}
        title="No partners found"
      />
    );
  }

  return (
    <div className="grid gap-5">
      {partners.map((partner) => (
        <article
          className="rounded-lg border border-border bg-background p-5 shadow-sm"
          key={partner.id}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <PartnerStatusBadge status={partner.status} />
                <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {partner.type || "No type"}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-normal text-foreground">
                {partner.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {partner.contactEmail || "No contact email"} |{" "}
                {partner.location || "No location"}
              </p>
            </div>
            <div className="grid gap-2 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground sm:grid-cols-3 lg:min-w-96">
              <span>{partner._count.outreachContacts} contacts</span>
              <span>{partner._count.outreachTasks} tasks</span>
              <span>{partner._count.opportunities} opportunities</span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CalendarDays
                  aria-hidden="true"
                  className="h-4 w-4 text-primary"
                />
                Follow-up timing
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Last contacted {formatDate(partner.lastContactedAt)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Next follow-up {formatDate(partner.nextFollowUpAt)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Building2
                  aria-hidden="true"
                  className="h-4 w-4 text-primary"
                />
                Notes
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {partner.description || "No partner notes yet."}
              </p>
            </div>
          </div>

          <form
            action={updatePartnerOutreach}
            className="mt-5 grid gap-4 rounded-lg border border-border bg-background p-4 lg:grid-cols-[180px_180px_180px_minmax(0,1fr)_auto] lg:items-end"
          >
            <input name="organizationId" type="hidden" value={partner.id} />
            <input name="redirectTo" type="hidden" value={redirectTo} />
            <label className="text-sm font-medium text-foreground">
              Status
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={partner.status}
                name="status"
              >
                {partnerStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatEnumLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Last contacted
              <input
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={formatDateInput(partner.lastContactedAt)}
                name="lastContactedAt"
                type="date"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Next follow-up
              <input
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={formatDateInput(partner.nextFollowUpAt)}
                name="nextFollowUpAt"
                type="date"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Partner notes
              <input
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={partner.description ?? ""}
                name="description"
                placeholder="Internal partner notes"
              />
            </label>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              type="submit"
            >
              Save
            </button>
          </form>
        </article>
      ))}
    </div>
  );
}
