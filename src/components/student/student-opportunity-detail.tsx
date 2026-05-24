import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  MapPin,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import type { OpportunityType } from "@/generated/prisma/enums";

export type StudentOpportunityDetailData = {
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

export type StudentOpportunityApplyState =
  | {
      kind: "alreadyApplied";
      submittedAt: Date | null;
    }
  | {
      kind: "canApply";
    }
  | {
      kind: "needsProfile";
    }
  | {
      kind: "needsResume";
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
  applyState,
  opportunity,
}: {
  applyState: StudentOpportunityApplyState;
  opportunity: StudentOpportunityDetailData;
}) {
  return (
    <div className="space-y-8">
      <Link
        className="inline-flex items-center gap-2 rounded text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        href="/dashboard/student/opportunities"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to opportunities
      </Link>

      <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {formatEnumLabel(opportunity.type)}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
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
          <ApplyCallToAction
            opportunityId={opportunity.id}
            state={applyState}
          />
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
        <article className="divide-y divide-border rounded-xl border border-border bg-background shadow-sm">
          <div className="p-6">
            <ContentBlock body={opportunity.description} title="Description" />
          </div>
          <div className="p-6">
            <ContentBlock
              body={opportunity.eligibilityRequirements}
              title="Eligibility requirements"
            />
          </div>
          <div className="p-6">
            <ContentBlock
              body={opportunity.applicationInstructions}
              title="Application instructions"
            />
          </div>
        </article>

        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <FileText aria-hidden="true" className="h-5 w-5 text-primary" />
            <h2 className="mt-4 text-base font-semibold text-foreground">
              Required documents
            </h2>
            {opportunity.requiredDocuments.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {opportunity.requiredDocuments.map((document) => (
                  <li
                    className="rounded-lg border border-border p-3"
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

          <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
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
                className="mt-4 inline-flex rounded text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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

function ApplyCallToAction({
  opportunityId,
  state,
}: {
  opportunityId: string;
  state: StudentOpportunityApplyState;
}) {
  if (state.kind === "alreadyApplied") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
        <div className="flex items-center gap-2 font-semibold text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-600" />
          Application submitted
        </div>
        <p className="mt-2 text-emerald-700">
          {state.submittedAt
            ? `Submitted ${formatDate(state.submittedAt)}.`
            : "Your application has been submitted."}
        </p>
        <Link
          className="mt-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-emerald-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          href="/dashboard/student/applications"
        >
          View my applications
        </Link>
      </div>
    );
  }

  if (state.kind === "needsProfile") {
    return (
      <Link
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        href="/dashboard/student/onboarding"
      >
        <UserRound aria-hidden="true" className="h-4 w-4" />
        Complete profile to apply
      </Link>
    );
  }

  if (state.kind === "needsResume") {
    return (
      <Link
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        href="/dashboard/student"
      >
        <FileText aria-hidden="true" className="h-4 w-4" />
        Upload resume to apply
      </Link>
    );
  }

  return (
    <Link
      className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      href={`/dashboard/student/opportunities/${opportunityId}/apply`}
    >
      Apply now
    </Link>
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
