"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";

import {
  demoOpportunities,
  demoOrganization,
  type DemoApplicant,
  type DemoApplicantStatus,
} from "@/lib/demo/recruiter-fixtures";

import { DemoShell } from "./demo-shell";
import { useDemoState } from "./demo-state-provider";

const buttonPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const buttonSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-brand-navy transition hover:border-primary/25 hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const card =
  "rounded-2xl border border-border/90 bg-card shadow-[0_8px_28px_rgba(16,33,58,0.055)]";

const partnerOpportunityIds = [
  "demo-opportunity-shadowing",
  "demo-opportunity-wellness-program",
];

function partnerOpportunity(id: string) {
  return demoOpportunities.find((opportunity) => opportunity.id === id);
}

function PageHeading({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-brand-navy sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  );
}

function MetricCard({
  helper,
  icon: Icon,
  label,
  value,
}: {
  helper: string;
  icon: typeof UsersRound;
  label: string;
  value: number;
}) {
  return (
    <article className={`${card} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-brand-navy">
            {value}
          </p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-blue-surface text-primary">
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
        {helper}
      </p>
    </article>
  );
}

function ApplicantStatus({ status }: { status: DemoApplicantStatus }) {
  const styles = {
    Finalist: "border-success/20 bg-success/10 text-success",
    Interview: "border-secondary/20 bg-secondary/10 text-secondary",
    "In review": "border-primary/20 bg-blue-surface text-primary",
    New: "border-warning/20 bg-warning/10 text-warning",
  }[status];

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}

function AuthorizationNotice() {
  return (
    <div className="flex gap-3 rounded-2xl border border-secondary/15 bg-secondary/5 p-4 text-sm leading-6 text-muted-foreground">
      <ShieldCheck
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-secondary"
      />
      <p>
        <strong className="text-brand-navy">Organization isolation:</strong>{" "}
        Partner accounts can access only applicants and opportunities belonging
        to their authorized organization. This demo does not grant or simulate
        production authorization.
      </p>
    </div>
  );
}

function PartnerOverview() {
  const { state } = useDemoState();
  const statusCounts = (
    ["New", "In review", "Interview", "Finalist"] as const
  ).map((status) => ({
    count: state.partnerApplicants.filter(
      (applicant) => applicant.status === status,
    ).length,
    status,
  }));
  const maxStatusCount = Math.max(...statusCounts.map(({ count }) => count), 1);

  return (
    <div className="space-y-8">
      <PageHeading
        description="Review program activity, applicant progress, and opportunity performance from one fictional organization workspace."
        eyebrow="Partner dashboard"
        title={demoOrganization.name}
      />
      <AuthorizationNotice />
      <section
        aria-label="Partner demo metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          helper="Currently accepting interest"
          icon={Building2}
          label="Active opportunities"
          value={2}
        />
        <MetricCard
          helper="Across both programs"
          icon={UsersRound}
          label="Applicants"
          value={state.partnerApplicants.length}
        />
        <MetricCard
          helper="Awaiting an initial decision"
          icon={ClipboardList}
          label="In review"
          value={
            state.partnerApplicants.filter(
              (item) => item.status === "In review",
            ).length
          }
        />
        <MetricCard
          helper="Moving to conversations"
          icon={CalendarDays}
          label="Interviews"
          value={
            state.partnerApplicants.filter(
              (item) => item.status === "Interview",
            ).length
          }
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className={`${card} p-5 sm:p-6`}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Recent applications
              </p>
              <h2 className="mt-2 text-xl font-semibold text-brand-navy">
                Applicant review queue
              </h2>
            </div>
            <Link
              className="text-sm font-semibold text-primary hover:underline"
              href="/demo/partner/applicants"
            >
              View all
            </Link>
          </div>
          <div className="mt-5 divide-y divide-border">
            {state.partnerApplicants.slice(0, 5).map((applicant) => {
              const opportunity = partnerOpportunity(applicant.opportunityId);
              return (
                <Link
                  className="group flex min-h-20 items-center gap-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/demo/partner/applicants/${applicant.id}`}
                  key={applicant.id}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-surface text-sm font-bold text-primary">
                    {applicant.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-brand-navy">
                      {applicant.name}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {opportunity?.title}
                    </span>
                  </span>
                  <ApplicantStatus status={applicant.status} />
                  <ArrowRight
                    aria-hidden="true"
                    className="hidden size-4 text-muted-foreground group-hover:text-primary sm:block"
                  />
                </Link>
              );
            })}
          </div>
        </section>

        <section className={`${card} p-5 sm:p-6`}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-surface text-primary">
              <BarChart3 aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Pipeline
              </p>
              <h2 className="mt-1 text-xl font-semibold text-brand-navy">
                Status distribution
              </h2>
            </div>
          </div>
          <div className="mt-6 space-y-5">
            {statusCounts.map(({ count, status }) => (
              <div key={status}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-brand-navy">{status}</span>
                  <span className="font-semibold text-muted-foreground">
                    {count}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function PartnerOpportunities() {
  const opportunities = partnerOpportunityIds
    .map(partnerOpportunity)
    .filter((opportunity) => opportunity !== undefined);
  const { state } = useDemoState();

  return (
    <div className="space-y-7">
      <PageHeading
        description="Synthetic program listings and their applicant pipelines for Northstar Health Collaborative."
        eyebrow="Partner workspace"
        title="Manage opportunities"
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {opportunities.map((opportunity) => {
          const applicants = state.partnerApplicants.filter(
            (applicant) => applicant.opportunityId === opportunity.id,
          );
          return (
            <article className={`${card} p-5 sm:p-6`} key={opportunity.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                  Active
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Synthetic opportunity
                </span>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                {opportunity.category}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-brand-navy">
                {opportunity.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {opportunity.description}
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">
                    Applicants
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-brand-navy">
                    {applicants.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">
                    Deadline
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-brand-navy">
                    {opportunity.deadline}
                  </dd>
                </div>
              </dl>
              <Link
                className={`${buttonSecondary} mt-5 w-full`}
                href="/demo/partner/applicants"
              >
                Review applicants
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ApplicantList() {
  const { state } = useDemoState();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const applicants = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return state.partnerApplicants.filter((applicant) => {
      const opportunity = partnerOpportunity(applicant.opportunityId);
      const matchesStatus =
        status === "All statuses" || applicant.status === status;
      const matchesQuery =
        !normalized ||
        [
          applicant.name,
          applicant.education,
          applicant.location,
          opportunity?.title ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, state.partnerApplicants, status]);

  return (
    <div className="space-y-7">
      <PageHeading
        description="Search and review fictional applicants without exposing any real student identity or record."
        eyebrow="Partner workspace"
        title="Applicants"
      />
      <AuthorizationNotice />
      <section className={`${card} grid gap-4 p-4 sm:grid-cols-[1fr_220px]`}>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <label className="sr-only" htmlFor="demo-applicant-search">
            Search synthetic applicants
          </label>
          <input
            className="min-h-12 w-full rounded-xl border border-border bg-white pl-11 pr-4 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            id="demo-applicant-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search applicants"
            type="search"
            value={query}
          />
        </div>
        <div>
          <label className="sr-only" htmlFor="demo-applicant-status-filter">
            Filter applicant status
          </label>
          <select
            className="min-h-12 w-full rounded-xl border border-border bg-white px-4 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            id="demo-applicant-status-filter"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option>All statuses</option>
            <option>New</option>
            <option>In review</option>
            <option>Interview</option>
            <option>Finalist</option>
          </select>
        </div>
      </section>
      <p
        aria-live="polite"
        className="text-sm text-muted-foreground"
        role="status"
      >
        Showing {applicants.length} synthetic{" "}
        {applicants.length === 1 ? "applicant" : "applicants"}
      </p>
      <div className={`${card} overflow-hidden`}>
        <div className="hidden grid-cols-[1.1fr_1fr_0.8fr_auto] gap-4 border-b border-border bg-page/70 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground md:grid">
          <span>Applicant</span>
          <span>Opportunity</span>
          <span>Status</span>
          <span className="sr-only">Action</span>
        </div>
        <div className="divide-y divide-border">
          {applicants.map((applicant) => {
            const opportunity = partnerOpportunity(applicant.opportunityId);
            return (
              <article
                className="grid gap-4 p-5 md:grid-cols-[1.1fr_1fr_0.8fr_auto] md:items-center"
                key={applicant.id}
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-surface text-sm font-bold text-primary">
                    {applicant.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-brand-navy">
                      {applicant.name}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {applicant.education}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {opportunity?.title}
                </p>
                <div>
                  <ApplicantStatus status={applicant.status} />
                </div>
                <Link
                  className={buttonSecondary}
                  href={`/demo/partner/applicants/${applicant.id}`}
                >
                  Review<span className="sr-only"> {applicant.name}</span>
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ApplicantDetail({ applicant }: { applicant: DemoApplicant }) {
  const { setApplicantComment, setApplicantStatus } = useDemoState();
  const opportunity = partnerOpportunity(applicant.opportunityId);

  function saveComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const comment = new FormData(event.currentTarget).get("comment");
    if (typeof comment === "string") setApplicantComment(applicant.id, comment);
  }

  return (
    <div className="space-y-6">
      <Link className={buttonSecondary} href="/demo/partner/applicants">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to applicants
      </Link>
      <AuthorizationNotice />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className={`${card} p-5 sm:p-7`}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-blue-surface text-base font-bold text-primary">
                  {applicant.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Synthetic applicant
                  </p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-brand-navy">
                    {applicant.name}
                  </h1>
                </div>
              </div>
              <ApplicantStatus status={applicant.status} />
            </div>
            <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">
                  Education
                </dt>
                <dd className="mt-1 text-sm font-semibold text-brand-navy">
                  {applicant.education}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">
                  Location
                </dt>
                <dd className="mt-1 text-sm font-semibold text-brand-navy">
                  {applicant.location}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">
                  Profile
                </dt>
                <dd className="mt-1 text-sm font-semibold text-brand-navy">
                  {applicant.profileCompletion}% complete
                </dd>
              </div>
            </dl>
            <h2 className="mt-7 text-lg font-semibold text-brand-navy">
              Permitted profile interests
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {applicant.interests.map((interest) => (
                <span
                  className="rounded-full border border-primary/15 bg-blue-surface px-3 py-1.5 text-sm font-medium text-primary"
                  key={interest}
                >
                  {interest}
                </span>
              ))}
            </div>
          </section>
          <section className={`${card} p-5 sm:p-6`}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Application for
            </p>
            <h2 className="mt-2 text-xl font-semibold text-brand-navy">
              {opportunity?.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {applicant.applicationSummary}
            </p>
          </section>
          <section className={`${card} p-5 sm:p-6`}>
            <h2 className="text-xl font-semibold text-brand-navy">
              Readiness checklist
            </h2>
            <div className="mt-4 space-y-3">
              {applicant.checklist.map((item) => (
                <div
                  className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-page/60 px-4 text-sm font-medium text-brand-navy"
                  key={item}
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="size-4 shrink-0 text-success"
                  />
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="space-y-5">
          <section className={`${card} p-5`}>
            <label
              className="text-sm font-semibold text-brand-navy"
              htmlFor="demo-partner-status"
            >
              Review status
            </label>
            <select
              className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              id="demo-partner-status"
              onChange={(event) =>
                setApplicantStatus(
                  applicant.id,
                  event.target.value as DemoApplicantStatus,
                )
              }
              value={applicant.status}
            >
              <option>New</option>
              <option>In review</option>
              <option>Interview</option>
              <option>Finalist</option>
            </select>
          </section>
          <form className={`${card} p-5`} onSubmit={saveComment}>
            <label
              className="text-sm font-semibold text-brand-navy"
              htmlFor="demo-partner-comment"
            >
              Partner comment
            </label>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Visible only in this synthetic browser session.
            </p>
            <textarea
              className="mt-3 min-h-32 w-full rounded-xl border border-border bg-white p-3 text-base leading-6 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              defaultValue={applicant.comment}
              id="demo-partner-comment"
              key={applicant.comment}
              name="comment"
              placeholder="Add a demo review comment…"
            />
            <button className={`${buttonPrimary} mt-3 w-full`} type="submit">
              Save demo comment
            </button>
          </form>
          <section className="rounded-2xl border border-secondary/15 bg-secondary/5 p-5">
            <Sparkles aria-hidden="true" className="size-5 text-secondary" />
            <h2 className="mt-3 text-base font-semibold text-brand-navy">
              Synthetic review only
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Status and comment changes never reach an API, database, or real
              applicant.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function MissingApplicant() {
  return (
    <section className={`${card} p-8 text-center`}>
      <h1 className="text-2xl font-semibold text-brand-navy">
        Synthetic applicant not found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Reset the demo to restore the original applicant list.
      </p>
      <Link className={`${buttonPrimary} mt-6`} href="/demo/partner/applicants">
        Return to applicants
      </Link>
    </section>
  );
}

export function PartnerDemo({ view }: { view: string[] }) {
  const { state } = useDemoState();
  const section = view[0] ?? "overview";
  let content: React.ReactNode;

  if (section === "opportunities") {
    content = <PartnerOpportunities />;
  } else if (section === "applicants") {
    const applicant = view[1]
      ? state.partnerApplicants.find((item) => item.id === view[1])
      : undefined;
    content = view[1] ? (
      applicant ? (
        <ApplicantDetail applicant={applicant} />
      ) : (
        <MissingApplicant />
      )
    ) : (
      <ApplicantList />
    );
  } else {
    content = <PartnerOverview />;
  }

  return <DemoShell role="partner">{content}</DemoShell>;
}
