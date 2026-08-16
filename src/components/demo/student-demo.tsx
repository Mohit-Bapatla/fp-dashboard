"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  HeartPulse,
  MapPin,
  Search,
  Sparkles,
  Target,
  UserRoundCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import {
  demoOpportunities,
  demoStudent,
  type DemoApplication,
  type DemoApplicationStatus,
  type DemoOpportunity,
} from "@/lib/demo/recruiter-fixtures";

import { DemoShell } from "./demo-shell";
import { useDemoState } from "./demo-state-provider";

const buttonPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const buttonSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-brand-navy transition hover:border-primary/25 hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const card =
  "rounded-2xl border border-border/90 bg-card shadow-[0_8px_28px_rgba(16,33,58,0.055)]";

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  action?: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
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
      {action}
    </div>
  );
}

function MetricCard({
  helper,
  label,
  value,
}: {
  helper: string;
  label: string;
  value: string | number;
}) {
  return (
    <article className={`${card} p-5`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-brand-navy">
        {value}
      </p>
      <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
        {helper}
      </p>
    </article>
  );
}

function StatusBadge({ status }: { status: DemoApplicationStatus }) {
  const styles = {
    Planning: "border-warning/20 bg-warning/10 text-warning",
    "In progress": "border-primary/20 bg-blue-surface text-primary",
    Submitted: "border-success/20 bg-success/10 text-success",
  }[status];
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}

function getOpportunity(id: string) {
  return demoOpportunities.find((opportunity) => opportunity.id === id);
}

function StudentOverview() {
  const { state } = useDemoState();
  const upcoming = state.applications.filter(
    (application) => application.status !== "Submitted",
  ).length;
  const recommended = demoOpportunities.filter((opportunity) =>
    ["Research", "Public health", "Biotechnology"].includes(
      opportunity.category,
    ),
  );

  return (
    <div className="space-y-8">
      <PageHeading
        action={
          <Link className={buttonSecondary} href="/demo/student/onboarding">
            <Sparkles aria-hidden="true" className="size-4" />
            Preview Student Onboarding
          </Link>
        }
        description="A personalized command center for discovering healthcare pathways and keeping every application moving."
        eyebrow="Student dashboard"
        title={`Welcome back, ${demoStudent.name.split(" ")[0]}`}
      />

      <section
        aria-label="Student demo metrics"
        className="grid gap-4 sm:grid-cols-3"
      >
        <MetricCard
          helper="Curated in this browser session"
          label="Saved opportunities"
          value={state.savedOpportunityIds.length}
        />
        <MetricCard
          helper="Planning through submission"
          label="Active applications"
          value={state.applications.length}
        />
        <MetricCard
          helper="Deadlines needing attention"
          label="Upcoming deadlines"
          value={upcoming}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className={`${card} p-5 sm:p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                What needs your attention
              </p>
              <h2 className="mt-2 text-xl font-semibold text-brand-navy">
                Application momentum
              </h2>
            </div>
            <Link
              className="rounded-lg text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/demo/student/applications"
            >
              View all
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {state.applications.slice(0, 3).map((application) => {
              const opportunity = getOpportunity(application.opportunityId);
              if (!opportunity) return null;
              const completed = application.tasks.filter(
                (task) => task.completed,
              ).length;
              return (
                <Link
                  className="group flex min-h-16 items-center gap-4 rounded-xl border border-border bg-page/60 p-3 transition hover:border-primary/25 hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/demo/student/applications/${application.id}`}
                  key={application.id}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-primary shadow-sm">
                    <BriefcaseBusiness aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-brand-navy">
                      {opportunity.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {completed}/{application.tasks.length} checklist items ·
                      Due {application.deadline}
                    </span>
                  </span>
                  <StatusBadge status={application.status} />
                  <ChevronRight
                    aria-hidden="true"
                    className="hidden size-4 text-muted-foreground group-hover:text-primary sm:block"
                  />
                </Link>
              );
            })}
          </div>
        </section>

        <section className={`${card} overflow-hidden`}>
          <div className="bg-[linear-gradient(135deg,#10213a,#245fd5)] p-6 text-white">
            <span className="grid size-11 place-items-center rounded-xl bg-white/12">
              <UserRoundCheck aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-5 text-sm font-semibold text-white/75">
              Profile readiness
            </p>
            <div className="mt-2 flex items-end gap-3">
              <p className="text-4xl font-semibold tracking-[-0.04em]">
                {demoStudent.profileCompletion}%
              </p>
              <p className="pb-1 text-sm text-white/75">complete</p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-full rounded-full bg-white" />
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm leading-6 text-muted-foreground">
              {demoStudent.summary}
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/demo/student/profile"
            >
              Review synthetic profile
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>
      </div>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Recommended for Alex
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-brand-navy">
              Relevant opportunities
            </h2>
          </div>
          <Link
            className="text-sm font-semibold text-primary hover:underline"
            href="/demo/student/opportunities"
          >
            Explore all
          </Link>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {recommended.slice(0, 3).map((opportunity) => (
            <CompactOpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CompactOpportunityCard({
  opportunity,
}: {
  opportunity: DemoOpportunity;
}) {
  return (
    <Link
      className={`${card} group flex min-h-48 flex-col p-5 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_14px_34px_rgba(16,33,58,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      href={`/demo/student/opportunities/${opportunity.id}`}
    >
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
        {opportunity.category}
      </span>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-brand-navy">
        {opportunity.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {opportunity.organization}
      </p>
      <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-primary">
        View details
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

function OpportunityDirectory() {
  const { saveOpportunity, state } = useDemoState();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const categories = [
    "All categories",
    ...new Set(demoOpportunities.map((opportunity) => opportunity.category)),
  ];
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return demoOpportunities.filter((opportunity) => {
      const matchesCategory =
        category === "All categories" || opportunity.category === category;
      const haystack = [
        opportunity.title,
        opportunity.organization,
        opportunity.description,
        opportunity.location,
        ...opportunity.skills,
      ]
        .join(" ")
        .toLowerCase();
      return matchesCategory && (!normalized || haystack.includes(normalized));
    });
  }, [category, query]);

  return (
    <div className="space-y-7">
      <PageHeading
        description="Search, filter, save, and start applications across a fictional opportunity catalog."
        eyebrow="Student workspace"
        title="Explore opportunities"
      />
      <section className={`${card} grid gap-4 p-4 sm:grid-cols-[1fr_260px]`}>
        <div>
          <label className="sr-only" htmlFor="demo-opportunity-search">
            Search demo opportunities
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="min-h-12 w-full rounded-xl border border-border bg-white pl-11 pr-4 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              id="demo-opportunity-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by program, organization, or skill"
              type="search"
              value={query}
            />
          </div>
        </div>
        <div>
          <label className="sr-only" htmlFor="demo-opportunity-category">
            Filter by category
          </label>
          <select
            className="min-h-12 w-full rounded-xl border border-border bg-white px-4 text-base text-brand-navy outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            id="demo-opportunity-category"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </section>

      <p
        aria-live="polite"
        className="text-sm text-muted-foreground"
        role="status"
      >
        Showing {results.length} synthetic{" "}
        {results.length === 1 ? "opportunity" : "opportunities"}
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        {results.map((opportunity) => {
          const saved = state.savedOpportunityIds.includes(opportunity.id);
          return (
            <article
              className={`${card} flex flex-col p-5 sm:p-6`}
              key={opportunity.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-primary/15 bg-blue-surface px-2.5 py-1 text-xs font-semibold text-primary">
                  {opportunity.category}
                </span>
                <span className="rounded-full border border-border bg-page px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  {opportunity.format}
                </span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-brand-navy">
                {opportunity.title}
              </h2>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                {opportunity.organization}
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                {opportunity.description}
              </p>
              <dl className="mt-5 grid gap-2 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-primary"
                  />
                  <dt className="sr-only">Location</dt>
                  <dd>{opportunity.location}</dd>
                </div>
                <div className="flex gap-2">
                  <CalendarDays
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-primary"
                  />
                  <dt className="sr-only">Deadline</dt>
                  <dd>Due {opportunity.deadline}</dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                <Link
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/demo/student/opportunities/${opportunity.id}`}
                >
                  View details
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <button
                  aria-pressed={saved}
                  className={buttonSecondary}
                  onClick={() => saveOpportunity(opportunity.id)}
                  type="button"
                >
                  {saved ? (
                    <Check aria-hidden="true" className="size-4" />
                  ) : (
                    <Bookmark aria-hidden="true" className="size-4" />
                  )}
                  {saved ? "Saved" : "Save"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function OpportunityDetail({ opportunity }: { opportunity: DemoOpportunity }) {
  const router = useRouter();
  const { saveOpportunity, startApplication, state } = useDemoState();
  const saved = state.savedOpportunityIds.includes(opportunity.id);
  const existingApplication = state.applications.find(
    (application) => application.opportunityId === opportunity.id,
  );

  function handleStart() {
    const applicationId = startApplication(
      opportunity.id,
      opportunity.deadline,
    );
    router.push(`/demo/student/applications/${applicationId}`);
  }

  return (
    <div className="space-y-6">
      <Link className={buttonSecondary} href="/demo/student/opportunities">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to opportunities
      </Link>
      <article className={`${card} overflow-hidden`}>
        <div className="bg-[linear-gradient(135deg,#10213a,#245fd5)] p-6 text-white sm:p-8">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold">
              {opportunity.category}
            </span>
            <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold">
              {opportunity.format}
            </span>
          </div>
          <p className="mt-7 text-sm font-semibold text-white/75">
            {opportunity.organization}
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            {opportunity.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/80">
            {opportunity.description}
          </p>
        </div>
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_300px]">
          <div>
            <h2 className="text-xl font-semibold text-brand-navy">
              What you will explore
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              This synthetic listing demonstrates the structured detail view
              students use to understand program expectations, fit, and next
              steps before beginning an application.
            </p>
            <h2 className="mt-7 text-xl font-semibold text-brand-navy">
              Skills and interests
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {opportunity.skills.map((skill) => (
                <span
                  className="rounded-full border border-border bg-page px-3 py-1.5 text-sm font-medium text-brand-navy"
                  key={skill}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <aside className="rounded-2xl border border-border bg-page/70 p-5">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-brand-navy">Location</dt>
                <dd className="mt-1 text-muted-foreground">
                  {opportunity.location}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-brand-navy">Deadline</dt>
                <dd className="mt-1 text-muted-foreground">
                  {opportunity.deadline}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-brand-navy">Format</dt>
                <dd className="mt-1 text-muted-foreground">
                  {opportunity.format}
                </dd>
              </div>
            </dl>
            <div className="mt-6 grid gap-3">
              {existingApplication ? (
                <Link
                  className={buttonPrimary}
                  href={`/demo/student/applications/${existingApplication.id}`}
                >
                  Open application workspace
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              ) : (
                <button
                  className={buttonPrimary}
                  onClick={handleStart}
                  type="button"
                >
                  Start application
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              )}
              <button
                aria-pressed={saved}
                className={buttonSecondary}
                onClick={() => saveOpportunity(opportunity.id)}
                type="button"
              >
                <Bookmark aria-hidden="true" className="size-4" />
                {saved ? "Remove from saved" : "Save opportunity"}
              </button>
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}

function ApplicationsList() {
  const { state } = useDemoState();
  return (
    <div className="space-y-7">
      <PageHeading
        action={
          <Link className={buttonSecondary} href="/demo/student/opportunities">
            <Search aria-hidden="true" className="size-4" />
            Find an opportunity
          </Link>
        }
        description="Move from planning to submission with one organized workspace for every application."
        eyebrow="Student workspace"
        title="Applications"
      />
      <div className="grid gap-4">
        {state.applications.map((application) => {
          const opportunity = getOpportunity(application.opportunityId);
          if (!opportunity) return null;
          const completed = application.tasks.filter(
            (task) => task.completed,
          ).length;
          return (
            <article className={`${card} p-5 sm:p-6`} key={application.id}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={application.status} />
                    <span className="text-xs font-medium text-muted-foreground">
                      Due {application.deadline}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-brand-navy">
                    {opportunity.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {opportunity.organization}
                  </p>
                </div>
                <Link
                  className={buttonPrimary}
                  href={`/demo/student/applications/${application.id}`}
                >
                  Open workspace
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
              <div className="mt-5 border-t border-border pt-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-brand-navy">
                    Checklist progress
                  </span>
                  <span className="text-muted-foreground">
                    {completed} of {application.tasks.length}
                  </span>
                </div>
                <div
                  aria-label={`${completed} of ${application.tasks.length} checklist tasks complete`}
                  className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuemax={application.tasks.length}
                  aria-valuemin={0}
                  aria-valuenow={completed}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{
                      width: `${(completed / application.tasks.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function OfficialApplicationDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className={buttonPrimary}>
        <ExternalLink aria-hidden="true" className="size-4" />
        Official application
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-brand-navy/45 backdrop-blur-sm" />
        <Dialog.Viewport className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
          <Dialog.Popup className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl outline-none sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-xl font-semibold text-brand-navy">
                  External application preview
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                  In the live platform, this opens the organization&apos;s
                  official application. No external site is opened in this
                  synthetic demo.
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Close official application preview"
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-border text-brand-navy hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="size-4" />
              </Dialog.Close>
            </div>
            <Dialog.Close className={`${buttonSecondary} mt-6 w-full`}>
              Return to workspace
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ApplicationWorkspace({
  application,
}: {
  application: DemoApplication;
}) {
  const { setApplicationNote, setApplicationStatus, toggleApplicationTask } =
    useDemoState();
  const opportunity = getOpportunity(application.opportunityId);
  if (!opportunity) return <MissingDemoRecord label="application" />;
  const completed = application.tasks.filter((task) => task.completed).length;
  const progress = Math.round((completed / application.tasks.length) * 100);

  function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const note = formData.get("note");
    if (typeof note === "string") setApplicationNote(application.id, note);
  }

  return (
    <div className="space-y-6">
      <Link className={buttonSecondary} href="/demo/student/applications">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to applications
      </Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className={`${card} p-5 sm:p-7`}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Application workspace
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-brand-navy">
                  {opportunity.title}
                </h1>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {opportunity.organization}
                </p>
              </div>
              <StatusBadge status={application.status} />
            </div>
            <div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
              <div className="flex gap-3">
                <CalendarDays
                  aria-hidden="true"
                  className="size-5 shrink-0 text-primary"
                />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Deadline
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-navy">
                    {application.deadline}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin
                  aria-hidden="true"
                  className="size-5 shrink-0 text-primary"
                />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Location
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-navy">
                    {opportunity.location}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <FileCheck2
                  aria-hidden="true"
                  className="size-5 shrink-0 text-primary"
                />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Document
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-navy">
                    {application.resumeAttached
                      ? "Resume attached"
                      : "No resume required"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={`${card} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-navy">
                  Application checklist
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Each change stays in this browser tab.
                </p>
              </div>
              <span className="text-sm font-semibold text-primary">
                {progress}%
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-5 space-y-3">
              {application.tasks.map((task) => (
                <label
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-page/60 px-4 text-sm font-medium text-brand-navy transition has-[:checked]:border-success/25 has-[:checked]:bg-success/5"
                  key={task.id}
                >
                  <input
                    checked={task.completed}
                    className="size-4 accent-primary"
                    onChange={() =>
                      toggleApplicationTask(application.id, task.id)
                    }
                    type="checkbox"
                  />
                  <span
                    className={
                      task.completed ? "text-muted-foreground line-through" : ""
                    }
                  >
                    {task.label}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <form className={`${card} p-5 sm:p-6`} onSubmit={saveNote}>
            <label
              className="text-xl font-semibold text-brand-navy"
              htmlFor="demo-private-note"
            >
              Private note
            </label>
            <p className="mt-1 text-sm text-muted-foreground">
              Synthetic notes are stored only for this demo tab.
            </p>
            <textarea
              className="mt-4 min-h-32 w-full rounded-xl border border-border bg-white p-4 text-base leading-6 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              defaultValue={application.note}
              id="demo-private-note"
              key={application.note}
              name="note"
              placeholder="Add a private planning note…"
            />
            <button className={`${buttonSecondary} mt-3`} type="submit">
              Save note
            </button>
          </form>
        </div>

        <aside className="space-y-5">
          <section className={`${card} p-5`}>
            <label
              className="text-sm font-semibold text-brand-navy"
              htmlFor="demo-application-status"
            >
              Application status
            </label>
            <select
              className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              id="demo-application-status"
              onChange={(event) =>
                setApplicationStatus(
                  application.id,
                  event.target.value as DemoApplicationStatus,
                )
              }
              value={application.status}
            >
              <option>Planning</option>
              <option>In progress</option>
              <option>Submitted</option>
            </select>
            <div className="mt-4">
              <OfficialApplicationDialog />
            </div>
          </section>
          <section className="rounded-2xl border border-secondary/15 bg-secondary/5 p-5">
            <HeartPulse aria-hidden="true" className="size-5 text-secondary" />
            <h2 className="mt-3 text-base font-semibold text-brand-navy">
              Demo-safe workflow
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              These controls never submit an application or contact an
              organization. They update synthetic session state only.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

const onboardingSteps = [
  { label: "Education", icon: GraduationCap },
  { label: "Interests", icon: HeartPulse },
  { label: "Preferences", icon: Target },
  { label: "Location & availability", icon: Clock3 },
  { label: "Profile completion", icon: BookOpenCheck },
] as const;

function OnboardingPreview() {
  const { resetOnboarding, setOnboarding, state } = useDemoState();
  const [error, setError] = useState("");
  const onboarding = state.onboarding;
  const step = Math.min(onboarding.step, onboardingSteps.length - 1);
  const progress = onboarding.completed
    ? 100
    : ((step + 1) / onboardingSteps.length) * 100;

  function validateStep() {
    if (step === 0 && !onboarding.data.education.trim())
      return "Enter an education level to continue.";
    if (step === 1 && onboarding.data.interests.length === 0)
      return "Choose at least one interest to continue.";
    if (step === 2 && onboarding.data.opportunityTypes.length === 0)
      return "Choose at least one opportunity type to continue.";
    if (
      step === 3 &&
      (!onboarding.data.location.trim() || !onboarding.data.availability.trim())
    ) {
      return "Add both a location and availability to continue.";
    }
    return "";
  }

  function continueOnboarding() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    if (step === onboardingSteps.length - 1) {
      setOnboarding({ completed: true });
      return;
    }
    setOnboarding({ step: step + 1 });
  }

  function updateData(update: Partial<typeof onboarding.data>) {
    setOnboarding({ data: { ...onboarding.data, ...update } });
  }

  function toggleListValue(
    field: "interests" | "opportunityTypes",
    value: string,
  ) {
    const current = onboarding.data[field];
    updateData({
      [field]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    });
  }

  if (onboarding.completed) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <section className={`${card} p-7 text-center sm:p-10`}>
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success/10 text-success">
            <CheckCircle2 aria-hidden="true" className="size-7" />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Onboarding complete
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-brand-navy">
            Profile ready for matching
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            This completion is synthetic. The live workflow saves each section
            server-side and resumes at the first incomplete step.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link className={buttonPrimary} href="/demo/student">
              Return to dashboard
            </Link>
            <button
              className={buttonSecondary}
              onClick={resetOnboarding}
              type="button"
            >
              Reset Onboarding Demo
            </button>
          </div>
        </section>
      </div>
    );
  }

  const interests = [
    "Medicine",
    "Clinical research",
    "Public health",
    "Biotechnology",
  ];
  const types = [
    "Research",
    "Clinical volunteering",
    "Internship",
    "Shadowing",
  ];

  return (
    <div className="space-y-7">
      <PageHeading
        action={
          <button
            className={buttonSecondary}
            onClick={resetOnboarding}
            type="button"
          >
            Reset Onboarding Demo
          </button>
        }
        description="A demo-only walkthrough of the progressive profile flow. Progress survives refresh in this browser tab."
        eyebrow="Student onboarding showcase"
        title="Build a profile step by step"
      />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className={`${card} h-fit p-4`}>
          <div className="mb-5">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>
                Step {step + 1} of {onboardingSteps.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <ol className="space-y-2">
            {onboardingSteps.map((item, index) => {
              const Icon = item.icon;
              return (
                <li
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${index === step ? "bg-primary text-primary-foreground" : index < step ? "bg-success/5 text-success" : "text-muted-foreground"}`}
                  key={item.label}
                >
                  {index < step ? (
                    <Check aria-hidden="true" className="size-4" />
                  ) : (
                    <Icon aria-hidden="true" className="size-4" />
                  )}
                  {item.label}
                </li>
              );
            })}
          </ol>
        </aside>

        <section className={`${card} overflow-hidden`}>
          <div className="border-b border-border p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Step {step + 1}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-brand-navy">
              {onboardingSteps[step].label}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Representative synthetic fields mirror the shape of the live
              onboarding experience.
            </p>
          </div>
          <div className="min-h-64 p-5 sm:p-7">
            {step === 0 ? (
              <div>
                <label
                  className="text-sm font-semibold text-brand-navy"
                  htmlFor="demo-education"
                >
                  Current education level
                </label>
                <input
                  className="mt-2 min-h-12 w-full rounded-xl border border-border px-4 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  id="demo-education"
                  onChange={(event) =>
                    updateData({ education: event.target.value })
                  }
                  value={onboarding.data.education}
                />
              </div>
            ) : null}
            {step === 1 ? (
              <fieldset>
                <legend className="text-sm font-semibold text-brand-navy">
                  Healthcare interests
                </legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {interests.map((interest) => (
                    <label
                      className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-blue-surface"
                      key={interest}
                    >
                      <input
                        checked={onboarding.data.interests.includes(interest)}
                        className="size-4 accent-primary"
                        onChange={() => toggleListValue("interests", interest)}
                        type="checkbox"
                      />
                      {interest}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {step === 2 ? (
              <fieldset>
                <legend className="text-sm font-semibold text-brand-navy">
                  Opportunity preferences
                </legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {types.map((type) => (
                    <label
                      className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-blue-surface"
                      key={type}
                    >
                      <input
                        checked={onboarding.data.opportunityTypes.includes(
                          type,
                        )}
                        className="size-4 accent-primary"
                        onChange={() =>
                          toggleListValue("opportunityTypes", type)
                        }
                        type="checkbox"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {step === 3 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    className="text-sm font-semibold text-brand-navy"
                    htmlFor="demo-location"
                  >
                    Location
                  </label>
                  <input
                    className="mt-2 min-h-12 w-full rounded-xl border border-border px-4 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    id="demo-location"
                    onChange={(event) =>
                      updateData({ location: event.target.value })
                    }
                    value={onboarding.data.location}
                  />
                </div>
                <div>
                  <label
                    className="text-sm font-semibold text-brand-navy"
                    htmlFor="demo-availability"
                  >
                    Availability
                  </label>
                  <input
                    className="mt-2 min-h-12 w-full rounded-xl border border-border px-4 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    id="demo-availability"
                    onChange={(event) =>
                      updateData({ availability: event.target.value })
                    }
                    value={onboarding.data.availability}
                  />
                </div>
              </div>
            ) : null}
            {step === 4 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Education", onboarding.data.education],
                  ["Interests", onboarding.data.interests.join(", ")],
                  ["Preferences", onboarding.data.opportunityTypes.join(", ")],
                  ["Location", onboarding.data.location],
                  ["Availability", onboarding.data.availability],
                ].map(([label, value]) => (
                  <div
                    className="rounded-xl border border-border bg-page/60 p-4"
                    key={label}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-brand-navy">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            {error ? (
              <p
                aria-live="polite"
                className="mt-5 text-sm font-medium text-error"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col-reverse justify-between gap-3 border-t border-border p-5 sm:flex-row sm:p-6">
            <button
              className={buttonSecondary}
              disabled={step === 0}
              onClick={() => {
                setError("");
                setOnboarding({ step: Math.max(0, step - 1) });
              }}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              Back
            </button>
            <button
              className={buttonPrimary}
              onClick={continueOnboarding}
              type="button"
            >
              {step === onboardingSteps.length - 1
                ? "Complete onboarding"
                : "Save and continue"}
              {step === onboardingSteps.length - 1 ? (
                <Check aria-hidden="true" className="size-4" />
              ) : (
                <ChevronRight aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function StudentProfile() {
  return (
    <div className="space-y-7">
      <PageHeading
        description="A completed fictional profile used only to illustrate student matching and readiness."
        eyebrow="Student profile"
        title={demoStudent.name}
      />
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className={`${card} p-6`}>
          <span className="grid size-16 place-items-center rounded-2xl bg-blue-surface text-xl font-bold text-primary">
            AM
          </span>
          <h2 className="mt-5 text-xl font-semibold text-brand-navy">
            Profile summary
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {demoStudent.summary}
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-brand-navy">
            <MapPin aria-hidden="true" className="size-4 text-primary" />
            {demoStudent.location}
          </div>
        </section>
        <section className={`${card} p-6`}>
          <h2 className="text-xl font-semibold text-brand-navy">
            Interests and goals
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {demoStudent.interests.map((item) => (
              <span
                className="rounded-full border border-primary/15 bg-blue-surface px-3 py-1.5 text-sm font-medium text-primary"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
          <h2 className="mt-7 text-xl font-semibold text-brand-navy">
            Seeking
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {demoStudent.seeking.map((item) => (
              <div
                className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-4 text-sm font-medium text-brand-navy"
                key={item}
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="size-4 text-success"
                />
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MissingDemoRecord({ label }: { label: string }) {
  return (
    <section className={`${card} p-8 text-center`}>
      <Circle
        aria-hidden="true"
        className="mx-auto size-8 text-muted-foreground"
      />
      <h1 className="mt-4 text-2xl font-semibold text-brand-navy">
        Synthetic {label} not found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Reset the demo to restore the original fixture set.
      </p>
      <Link className={`${buttonPrimary} mt-6`} href="/demo/student">
        Return to student dashboard
      </Link>
    </section>
  );
}

export function StudentDemo({ view }: { view: string[] }) {
  const { state } = useDemoState();
  const section = view[0] ?? "overview";
  let content: React.ReactNode;

  if (section === "opportunities") {
    const opportunity = view[1] ? getOpportunity(view[1]) : undefined;
    content = view[1] ? (
      opportunity ? (
        <OpportunityDetail opportunity={opportunity} />
      ) : (
        <MissingDemoRecord label="opportunity" />
      )
    ) : (
      <OpportunityDirectory />
    );
  } else if (section === "applications") {
    const application = view[1]
      ? state.applications.find((item) => item.id === view[1])
      : undefined;
    content = view[1] ? (
      application ? (
        <ApplicationWorkspace application={application} />
      ) : (
        <MissingDemoRecord label="application" />
      )
    ) : (
      <ApplicationsList />
    );
  } else if (section === "onboarding") {
    content = <OnboardingPreview />;
  } else if (section === "profile") {
    content = <StudentProfile />;
  } else {
    content = <StudentOverview />;
  }

  return <DemoShell role="student">{content}</DemoShell>;
}
