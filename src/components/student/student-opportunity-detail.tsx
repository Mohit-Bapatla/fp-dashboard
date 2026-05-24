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
import type { MatchScoreResult } from "@/lib/matching/match-score";

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
  match,
  opportunity,
}: {
  applyState: StudentOpportunityApplyState;
  match: MatchScoreResult | null;
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
              {match ? (
                <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {match.score}% fit
                </span>
              ) : null}
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

      {match ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <MatchPanel
            empty="Add more profile and resume details to improve matching."
            items={match.reasons}
            title="Why this may fit"
          />
          <MatchPanel
            empty="No major gaps detected from available profile and resume data."
            items={match.gaps}
            title="Possible gaps"
          />
        </section>
      ) : null}

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

function MatchPanel({
  empty,
  items,
  title,
}: {
  empty: string;
  items: string[];
  title: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{empty}</p>
      )}
    </article>
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
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-primary" />
          Already applied
        </div>
        <p className="mt-2">
          {state.submittedAt
            ? `Submitted ${formatDate(state.submittedAt)}.`
            : "Your application has been submitted."}
        </p>
      </div>
    );
  }

  if (state.kind === "needsProfile") {
    return (
      <Link
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
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
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        href="/dashboard/student"
      >
        <FileText aria-hidden="true" className="h-4 w-4" />
        Upload resume to apply
      </Link>
    );
  }

  return (
    <Link
      className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
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
