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

import { MatchExplanationPanel } from "@/components/matching/match-explanation-panel";
import type { OpportunityType } from "@/generated/prisma/enums";
import type {
  OpportunityAvailabilityStatus,
  OpportunityRelationshipType,
  OpportunityVerificationStatus,
} from "@/generated/prisma/enums";
import { EligibilityBadge } from "@/components/opportunities/eligibility-badge";
import {
  OpportunityRelationshipBadge,
  OpportunityRelationshipDisclaimer,
} from "@/components/opportunities/opportunity-relationship-badge";
import type { EligibilityResult } from "@/lib/matching/opportunity-eligibility";
import {
  saveOpportunity,
  setFollowReopening,
  unsaveOpportunity,
} from "@/app/dashboard/student/saved/actions";
import { startApplicationWorkspace } from "@/app/dashboard/student/applications/workspace-actions";
import { reportIncorrectOpportunity } from "@/app/dashboard/student/opportunities/[opportunityId]/correction-actions";
import type { MatchExplanation } from "@/lib/matching/explanations";
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
  relationshipType: OpportunityRelationshipType;
  officialSourceUrl: string | null;
  officialApplicationUrl: string | null;
  verificationStatus: OpportunityVerificationStatus;
  lastVerifiedAt: Date | null;
  nextVerificationAt: Date | null;
  availabilityStatus: OpportunityAvailabilityStatus;
  opensAt: Date | null;
  startsAt: Date | null;
  endsAt: Date | null;
  city: string | null;
  state: string | null;
  country: string | null;
  geographicScope: string | null;
  minimumAge: number | null;
  maximumAge: number | null;
  acceptedGradeLevels: string[];
  requiredCertifications: string[];
  eligibilityUnknowns: string[];
  estimatedApplicationMinutes: number | null;
  essayQuestionCount: number | null;
  scheduleRequirements: string | null;
  estimatedWeeklyHours: number | null;
  organization: {
    name: string;
    website: string | null;
    description: string | null;
  };
};

export type SimilarOpportunityData = {
  id: string;
  organizationName: string;
  similarity: number;
  specialty: string | null;
  title: string;
  type: OpportunityType;
};

export type StudentOpportunityApplyState =
  | {
      kind: "alreadyApplied";
      submittedAt: Date | null;
    }
  | {
      kind: "canApply";
    }
  | { kind: "workspace"; applicationId: string }
  | { kind: "unavailable" }
  | {
      kind: "needsProfile";
    }
  | {
      kind: "needsResume";
    };

export function getStudentOpportunityOnboardingHref(returnTo: string) {
  return `/dashboard/student/onboarding?returnTo=${encodeURIComponent(returnTo)}`;
}

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
  explanation,
  match,
  opportunity,
  similarOpportunities,
  eligibility,
  isSaved,
  followReopening,
}: {
  applyState: StudentOpportunityApplyState;
  explanation: MatchExplanation | null;
  match: MatchScoreResult | null;
  opportunity: StudentOpportunityDetailData;
  similarOpportunities: SimilarOpportunityData[];
  eligibility: EligibilityResult;
  isSaved: boolean;
  followReopening: boolean;
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
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        href={`/opportunities/${opportunity.id}`}
      >
        View public preview
      </Link>

      <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {formatEnumLabel(opportunity.type)}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                {formatEnumLabel(opportunity.availabilityStatus)}
              </span>
              <OpportunityRelationshipBadge
                relationshipType={opportunity.relationshipType}
              />
              <EligibilityBadge category={eligibility.category} />
              {match ? (
                <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Ranking score {match.score}
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
          <StudentOpportunityPrimaryActions
            isSaved={isSaved}
            opportunityId={opportunity.id}
            applyState={applyState}
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
          <DetailFact
            label="Last verified"
            value={formatDate(opportunity.lastVerifiedAt)}
          />
          <DetailFact
            label="Program dates"
            value={`${formatDate(opportunity.startsAt)} – ${formatDate(opportunity.endsAt)}`}
          />
          <DetailFact
            label="Weekly commitment"
            value={
              opportunity.estimatedWeeklyHours == null
                ? "Not specified"
                : `${opportunity.estimatedWeeklyHours} hours`
            }
          />
          <DetailFact
            label="Application effort"
            value={
              opportunity.estimatedApplicationMinutes == null
                ? "Not specified"
                : `${opportunity.estimatedApplicationMinutes} minutes`
            }
          />
        </div>
        <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <OpportunityRelationshipDisclaimer
            relationshipType={opportunity.relationshipType}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {opportunity.officialSourceUrl ? (
            <a
              className="text-sm font-medium text-primary underline"
              href={opportunity.officialSourceUrl}
              rel="noreferrer"
              target="_blank"
            >
              Official source
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">
              Official source not published
            </span>
          )}
          {opportunity.officialApplicationUrl ? (
            <a
              className="text-sm font-medium text-primary underline"
              href={opportunity.officialApplicationUrl}
              rel="noreferrer"
              target="_blank"
            >
              Official application
            </a>
          ) : null}
        </div>
        {isSaved ? (
          <form action={setFollowReopening} className="mt-4">
            <input name="opportunityId" type="hidden" value={opportunity.id} />
            <input
              name="followReopening"
              type="hidden"
              value={String(!followReopening)}
            />
            <button
              className="rounded-lg border border-border px-4 py-2 text-sm"
              type="submit"
            >
              {followReopening
                ? "Stop reopening alerts"
                : "Follow for reopening"}
            </button>
          </form>
        ) : null}
      </section>

      <details className="rounded-xl border border-border bg-background p-6">
        <summary className="cursor-pointer font-semibold">
          Report incorrect information
        </summary>
        <form action={reportIncorrectOpportunity} className="mt-4 grid gap-3">
          <input name="opportunityId" type="hidden" value={opportunity.id} />
          <select
            className="rounded-lg border border-border p-2 text-sm"
            name="category"
          >
            <option value="BROKEN_LINK">Broken link</option>
            <option value="INCORRECT_DEADLINE">Incorrect deadline</option>
            <option value="ELIGIBILITY_ERROR">Eligibility error</option>
            <option value="PROGRAM_CLOSED">Program closed</option>
            <option value="DUPLICATE">Duplicate</option>
            <option value="OTHER">Other</option>
          </select>
          <textarea
            className="rounded-lg border border-border p-2 text-sm"
            name="details"
            placeholder="What should the team verify?"
            rows={4}
          />
          <input
            className="rounded-lg border border-border p-2 text-sm"
            name="sourceUrl"
            placeholder="Supporting source URL (optional)"
            type="url"
          />
          <button
            className="w-fit rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            type="submit"
          >
            Send report
          </button>
        </form>
      </details>

      <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">Eligibility</h2>
          <EligibilityBadge category={eligibility.category} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <MatchPanel
            empty="No confirmed requirements yet."
            items={eligibility.confirmedMatches}
            title="Confirmed matches"
          />
          <MatchPanel
            empty="No explicit concerns found."
            items={[...eligibility.blockingReasons, ...eligibility.concerns]}
            title="Concerns"
          />
          <MatchPanel
            empty="No unknown requirements recorded."
            items={[
              ...eligibility.unknowns,
              ...opportunity.eligibilityUnknowns,
            ]}
            title="Unknown requirements"
          />
        </div>
      </section>

      {match ? (
        <section className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
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
          </div>
          {explanation ? (
            <MatchExplanationPanel explanation={explanation} />
          ) : null}
        </section>
      ) : null}

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
              Host organization
            </h2>
            <p className="mt-3 text-sm font-medium text-foreground">
              {opportunity.organization.name}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {opportunity.organization.description ||
                "More host details will be added later."}
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

      {similarOpportunities.length > 0 ? (
        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Similar published opportunities
          </h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {similarOpportunities.map((similar) => (
              <Link
                className="rounded-lg border border-border bg-muted/20 p-4 transition hover:bg-muted"
                href={`/dashboard/student/opportunities/${similar.id}`}
                key={similar.id}
              >
                <p className="text-sm font-semibold text-foreground">
                  {similar.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {similar.organizationName}
                </p>
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  {formatEnumLabel(similar.type)} |{" "}
                  {similar.specialty ?? "No specialty"} |{" "}
                  {Math.round(similar.similarity * 100)}% semantic similarity
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function StudentOpportunityPrimaryActions({
  applyState,
  isSaved,
  opportunityId,
}: {
  applyState: StudentOpportunityApplyState;
  isSaved: boolean;
  opportunityId: string;
}) {
  const detailPath = `/dashboard/student/opportunities/${opportunityId}`;

  return (
    <>
      <ApplyCallToAction opportunityId={opportunityId} state={applyState} />
      {applyState.kind === "needsProfile" ? (
        <Link
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          href={getStudentOpportunityOnboardingHref(detailPath)}
        >
          <UserRound aria-hidden="true" className="h-4 w-4" />
          Complete profile to save
        </Link>
      ) : (
        <form action={isSaved ? unsaveOpportunity : saveOpportunity}>
          <input name="opportunityId" type="hidden" value={opportunityId} />
          <button
            className="inline-flex min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-medium"
            type="submit"
          >
            {isSaved ? "Unsave" : "Save"}
          </button>
        </form>
      )}
    </>
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
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
        <div className="flex items-center gap-2 font-semibold text-emerald-800">
          <CheckCircle2
            aria-hidden="true"
            className="h-4 w-4 text-emerald-600"
          />
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
  if (state.kind === "unavailable")
    return (
      <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm font-medium text-muted-foreground">
        Applications are not currently open.
      </div>
    );
  if (state.kind === "workspace")
    return (
      <Link
        className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        href={`/dashboard/student/applications/${state.applicationId}`}
      >
        Continue application
      </Link>
    );

  if (state.kind === "needsProfile") {
    const applyPath = `/dashboard/student/opportunities/${opportunityId}/apply`;

    return (
      <Link
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        href={getStudentOpportunityOnboardingHref(applyPath)}
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
    <form action={startApplicationWorkspace}>
      <input name="opportunityId" type="hidden" value={opportunityId} />
      <button
        className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        type="submit"
      >
        Start application plan
      </button>
    </form>
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
