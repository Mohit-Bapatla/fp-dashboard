import { Building2, Globe2, Mail, MapPin } from "lucide-react";

import type { PartnerStatus } from "@/generated/prisma/enums";

type PartnerOrganizationSummary = {
  name: string;
  status: PartnerStatus;
  website: string | null;
  type: string | null;
  description: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  specialtyAreas: string[];
  contactEmail: string | null;
};

type PartnerDashboardSummaryProps = {
  organization: PartnerOrganizationSummary;
  organizationCount: number;
};

function formatStatus(status: PartnerStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function organizationLocation(organization: PartnerOrganizationSummary) {
  return (
    organization.location ||
    [organization.city, organization.state, organization.country]
      .filter(Boolean)
      .join(", ") ||
    "Location not provided"
  );
}

export function PartnerDashboardSummary({
  organization,
  organizationCount,
}: PartnerDashboardSummaryProps) {
  return (
    <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <Building2 aria-hidden="true" className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-normal text-foreground">
            {organization.name}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {organization.description ||
              "Organization details will become editable in a later partner or admin workflow."}
          </p>
        </div>
        <div className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium text-muted-foreground">
          {formatStatus(organization.status)}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryFact
          icon={Building2}
          label="Organization type"
          value={organization.type ?? "Not provided"}
        />
        <SummaryFact
          icon={MapPin}
          label="Location"
          value={organizationLocation(organization)}
        />
        <SummaryFact
          icon={Mail}
          label="Contact email"
          value={organization.contactEmail ?? "Not provided"}
        />
        <SummaryFact
          icon={Globe2}
          label="Linked organizations"
          value={organizationCount.toString()}
        />
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-muted-foreground">
          Specialty areas
        </p>
        {organization.specialtyAreas.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {organization.specialtyAreas.map((specialty) => (
              <span
                className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
                key={specialty}
              >
                {specialty}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Not provided</p>
        )}
      </div>
    </section>
  );
}

type SummaryFactProps = {
  icon: typeof Building2;
  label: string;
  value: string;
};

function SummaryFact({ icon: Icon, label, value }: SummaryFactProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
      <p className="mt-3 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
