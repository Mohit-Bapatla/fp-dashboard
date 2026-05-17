import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  MapPin,
} from "lucide-react";
import Link from "next/link";

import type { OpportunityType } from "@/generated/prisma/enums";

export type StudentOpportunityDetailData = {
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
  requiredDocuments: string[];
  applicationInstructions: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  organization: {
    name: string;
    website: string | null;
    description: string | null;
  };
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

function fieldValue(value: string | null) {
  return value || "Not specified";
}

export function StudentOpportunityDetail({
  opportunity,
}: {
  opportunity: StudentOpportunityDetailData;
}) {
  return (
    <div className="space-y-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        href="/dashboard/student/opportunities"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to opportunities
      </Link>

      <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {formatEnumLabel(opportunity.type)}
              </span>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                Published
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              {opportunity.title}
            </h1>
            <p className="mt-3 text-base font-medium text-muted-foreground">
              {opportunity.organization.name}
            </p>
          </div>
          <button
            className="inline-flex min-h-10 shrink-0 cursor-not-allowed items-center justify-center rounded-md border border-border bg-muted px-4 text-sm font-medium text-muted-foreground"
            disabled
            type="button"
          >
            Applications coming soon
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DetailFact
            icon={BriefcaseBusiness}
            label="Specialty"
            value={fieldValue(opportunity.specialty)}
          />
          <DetailFact
            icon={MapPin}
            label="Location"
            value={fieldValue(opportunity.location)}
          />
          <DetailFact
            label="Format"
            value={fieldValue(opportunity.remoteType)}
          />
          <DetailFact
            label="Paid status"
            value={fieldValue(opportunity.paidStatus)}
          />
          <DetailFact
            icon={CalendarDays}
            label="Deadline"
            value={formatDate(opportunity.deadline)}
          />
          <DetailFact
            label="Capacity"
            value={
              opportunity.capacity
                ? `${opportunity.capacity} students`
                : "Not specified"
            }
          />
          <DetailFact
            label="Published"
            value={formatDate(opportunity.publishedAt ?? opportunity.createdAt)}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article className="space-y-6 rounded-lg border border-border bg-background p-6 shadow-sm">
          <ContentBlock body={opportunity.description} title="Description" />
          <ContentBlock
            body={opportunity.eligibilityRequirements}
            title="Eligibility requirements"
          />
          <ContentBlock
            body={opportunity.applicationInstructions}
            title="Application instructions"
          />
        </article>

        <aside className="space-y-6">
          <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <FileText aria-hidden="true" className="h-5 w-5 text-primary" />
            <h2 className="mt-4 text-base font-semibold text-foreground">
              Required documents
            </h2>
            {opportunity.requiredDocuments.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {opportunity.requiredDocuments.map((document) => (
                  <li
                    className="rounded-md border border-border p-3"
                    key={document}
                  >
                    {document}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                No required documents have been specified yet.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">
              Partner organization
            </h2>
            <p className="mt-3 text-sm font-medium text-foreground">
              {opportunity.organization.name}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {opportunity.organization.description ||
                "More partner details will be added later."}
            </p>
            {opportunity.organization.website ? (
              <a
                className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
                href={opportunity.organization.website}
                rel="noreferrer"
                target="_blank"
              >
                Visit website
              </a>
            ) : null}
          </section>
        </aside>
      </section>
    </div>
  );
}

type DetailFactProps = {
  icon?: typeof BriefcaseBusiness;
  label: string;
  value: string;
};

function DetailFact({ icon: Icon, label, value }: DetailFactProps) {
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

function ContentBlock({ body, title }: { body: string | null; title: string }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
        {body || "Not specified yet."}
      </p>
    </section>
  );
}
