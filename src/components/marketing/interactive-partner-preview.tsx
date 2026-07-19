"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Users,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const partnerViews = [
  "Overview",
  "Opportunities",
  "Applicants",
  "Placements",
] as const;

type PartnerView = (typeof partnerViews)[number];
type ApplicantStatus = "New" | "Reviewing" | "Interview" | "Accepted";

type PreviewApplicant = {
  education: string;
  id: string;
  interest: string;
  opportunityId: string;
  status: ApplicantStatus;
};

const applicantStatuses: readonly ApplicantStatus[] = [
  "New",
  "Reviewing",
  "Interview",
  "Accepted",
];

const previewOpportunities = [
  {
    id: "community-clinic",
    title: "Community clinic experience",
    status: "Accepting applicants",
    capacity: 8,
    deadline: "August 18",
    eligibility: "High school or college; local or hybrid",
  },
  {
    id: "research-cohort",
    title: "Research skills cohort",
    status: "Review in progress",
    capacity: 12,
    deadline: "September 3",
    eligibility: "College or graduate; remote option",
  },
  {
    id: "career-series",
    title: "Healthcare career series",
    status: "Draft",
    capacity: 40,
    deadline: "October 1",
    eligibility: "Open education level; virtual",
  },
] as const;

type PreviewOpportunityId = (typeof previewOpportunities)[number]["id"];

const initialApplicants: PreviewApplicant[] = [
  {
    id: "Student 01",
    education: "College",
    interest: "Community health",
    opportunityId: "community-clinic",
    status: "New",
  },
  {
    id: "Student 02",
    education: "High school",
    interest: "Patient support",
    opportunityId: "community-clinic",
    status: "Reviewing",
  },
  {
    id: "Student 03",
    education: "Graduate",
    interest: "Clinical research",
    opportunityId: "research-cohort",
    status: "Interview",
  },
  {
    id: "Student 04",
    education: "College",
    interest: "Health education",
    opportunityId: "community-clinic",
    status: "Accepted",
  },
];

export function InteractivePartnerPreview() {
  const [activeView, setActiveView] = useState<PartnerView>("Overview");
  const [applicants, setApplicants] =
    useState<PreviewApplicant[]>(initialApplicants);
  const [applicantFilter, setApplicantFilter] = useState<
    ApplicantStatus | "All"
  >("All");
  const [selectedApplicantId, setSelectedApplicantId] = useState(
    initialApplicants[0].id,
  );
  const [selectedOpportunityId, setSelectedOpportunityId] =
    useState<PreviewOpportunityId>(previewOpportunities[0].id);
  const [statusMessage, setStatusMessage] = useState(
    "Choose a view to explore this local demonstration.",
  );

  const selectedOpportunity =
    previewOpportunities.find(
      (opportunity) => opportunity.id === selectedOpportunityId,
    ) ?? previewOpportunities[0];
  const selectedApplicant =
    applicants.find((applicant) => applicant.id === selectedApplicantId) ??
    applicants[0];
  const filteredApplicants = applicants.filter(
    (applicant) =>
      applicantFilter === "All" || applicant.status === applicantFilter,
  );
  const reviewingCount = applicants.filter((applicant) =>
    ["Reviewing", "Interview"].includes(applicant.status),
  ).length;
  const selectedAcceptedCount = applicants.filter(
    (applicant) =>
      applicant.opportunityId === selectedOpportunity.id &&
      applicant.status === "Accepted",
  ).length;
  const selectedReviewingCount = applicants.filter(
    (applicant) =>
      applicant.opportunityId === selectedOpportunity.id &&
      ["Reviewing", "Interview"].includes(applicant.status),
  ).length;

  function selectApplicantFilter(filter: ApplicantStatus | "All") {
    setApplicantFilter(filter);
    const firstMatch = applicants.find(
      (applicant) => filter === "All" || applicant.status === filter,
    );
    if (firstMatch) {
      setSelectedApplicantId(firstMatch.id);
    }
  }

  function updateApplicantStatus(status: ApplicantStatus) {
    setApplicants((current) =>
      current.map((applicant) =>
        applicant.id === selectedApplicant.id
          ? { ...applicant, status }
          : applicant,
      ),
    );
    setApplicantFilter("All");
    setStatusMessage(
      `${selectedApplicant.id} moved to ${status} in this demonstration.`,
    );
  }

  return (
    <section
      aria-label="Interactive partner workspace preview"
      className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-border bg-brand-navy p-1 shadow-[0_24px_60px_rgba(16,33,58,0.18)] sm:rounded-3xl sm:p-2"
      data-active-view={activeView.toLowerCase()}
    >
      <div className="min-w-0 rounded-[1rem] bg-slate-50 p-3 sm:rounded-[1.25rem] sm:p-6">
        <div className="flex min-w-0 flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary sm:text-xs sm:tracking-[0.16em]">
              <span className="lg:hidden">Partner workspace demo</span>
              <span className="hidden lg:inline">
                Interactive partner dashboard demonstration
              </span>
            </p>
            <h3 className="mt-1 text-lg font-semibold text-brand-navy sm:text-xl">
              Program workspace
            </h3>
          </div>
          <span className="w-fit shrink-0 rounded-full border border-primary/20 bg-blue-surface px-2.5 py-1 text-[11px] font-semibold text-primary sm:px-3 sm:text-xs">
            <span className="lg:hidden">Local preview</span>
            <span className="hidden lg:inline">Illustrative local preview</span>
          </span>
        </div>

        <div
          aria-label="Partner preview views"
          className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-4"
          role="group"
        >
          {partnerViews.map((view) => (
            <button
              aria-pressed={activeView === view}
              className={cn(
                "min-h-11 min-w-0 rounded-xl border px-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-3",
                activeView === view
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-border bg-white text-brand-navy hover:border-primary/35 hover:bg-blue-surface",
              )}
              key={view}
              onClick={() => {
                setActiveView(view);
                setStatusMessage(`${view} view selected.`);
              }}
              type="button"
            >
              {view}
            </button>
          ))}
        </div>

        <p
          aria-live="polite"
          className="sr-only lg:not-sr-only lg:mt-4 lg:text-xs lg:text-muted-foreground"
        >
          {statusMessage}
        </p>

        {activeView === "Overview" ? (
          <div
            className="mt-4 space-y-3 sm:mt-5 sm:space-y-4"
            data-preview-panel="overview"
          >
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Active opportunities",
                  value: "2",
                  icon: BriefcaseBusiness,
                },
                {
                  label: "New applicants",
                  value: String(
                    applicants.filter((applicant) => applicant.status === "New")
                      .length,
                  ),
                  icon: Users,
                },
                {
                  label: "Awaiting review",
                  value: String(reviewingCount),
                  icon: ClipboardList,
                },
                {
                  label: "Upcoming deadlines",
                  value: "2",
                  icon: CalendarClock,
                },
              ].map(({ icon: Icon, label, value }) => (
                <article
                  className="min-w-0 rounded-2xl border border-border bg-white p-2.5 sm:p-4"
                  key={label}
                >
                  <Icon aria-hidden="true" className="size-5 text-primary" />
                  <p className="mt-2 text-xl font-semibold text-brand-navy sm:mt-4 sm:text-2xl">
                    {value}
                  </p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {label}
                  </p>
                </article>
              ))}
            </div>
            <article className="rounded-2xl border border-border bg-white p-3 lg:hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-semibold text-brand-navy">
                    Next deadline
                  </h4>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Community clinic experience
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary">
                  Aug 18
                </span>
              </div>
              <p className="mt-3 border-t border-border pt-3 text-sm leading-6 text-muted-foreground">
                One applicant moved to interview in this local preview.
              </p>
            </article>
            <div className="hidden gap-4 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-2xl border border-border bg-white p-5">
                <h4 className="font-semibold text-brand-navy">
                  Upcoming deadlines
                </h4>
                <ul className="mt-4 space-y-3 text-sm">
                  <li className="flex items-center justify-between gap-4">
                    <span>Community clinic experience</span>
                    <span className="font-semibold text-primary">Aug 18</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span>Research skills cohort</span>
                    <span className="font-semibold text-primary">Sep 3</span>
                  </li>
                </ul>
              </article>
              <article className="rounded-2xl border border-border bg-white p-5">
                <h4 className="font-semibold text-brand-navy">
                  Recent activity
                </h4>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  One applicant moved to interview and a program deadline was
                  reviewed in this illustrative workspace.
                </p>
              </article>
            </div>
          </div>
        ) : null}

        {activeView === "Opportunities" ? (
          <div data-preview-panel="opportunities">
            <div className="mt-4 space-y-3 lg:hidden">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-navy">
                  Program
                </span>
                <select
                  className="min-h-11 w-full min-w-0 rounded-xl border border-border bg-white px-3 text-base text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) =>
                    setSelectedOpportunityId(
                      event.target.value as PreviewOpportunityId,
                    )
                  }
                  value={selectedOpportunity.id}
                >
                  {previewOpportunities.map((opportunity) => (
                    <option key={opportunity.id} value={opportunity.id}>
                      {opportunity.title}
                    </option>
                  ))}
                </select>
              </label>
              <article className="min-w-0 rounded-2xl border border-border bg-white p-4">
                <span className="inline-flex rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                  {selectedOpportunity.status}
                </span>
                <h4 className="mt-3 text-base font-semibold text-brand-navy">
                  {selectedOpportunity.title}
                </h4>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">Capacity</dt>
                    <dd className="mt-1 font-semibold text-brand-navy">
                      {selectedOpportunity.capacity} students
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">Applicants</dt>
                    <dd className="mt-1 font-semibold text-brand-navy">
                      {
                        applicants.filter(
                          (applicant) =>
                            applicant.opportunityId === selectedOpportunity.id,
                        ).length
                      }
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">Deadline</dt>
                    <dd className="mt-1 font-semibold text-brand-navy">
                      {selectedOpportunity.deadline}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">Eligibility</dt>
                    <dd className="mt-1 font-semibold text-brand-navy">
                      {selectedOpportunity.eligibility}
                    </dd>
                  </div>
                </dl>
              </article>
            </div>

            <div className="mt-5 hidden gap-4 lg:grid lg:grid-cols-[0.8fr_1.2fr]">
              <div className="min-w-0 space-y-2">
                {previewOpportunities.map((opportunity) => (
                  <button
                    aria-pressed={selectedOpportunity.id === opportunity.id}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selectedOpportunity.id === opportunity.id
                        ? "border-primary bg-blue-surface"
                        : "border-border bg-white hover:border-primary/30",
                    )}
                    key={opportunity.id}
                    onClick={() => setSelectedOpportunityId(opportunity.id)}
                    type="button"
                  >
                    <span className="block text-sm font-semibold text-brand-navy">
                      {opportunity.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {opportunity.status}
                    </span>
                  </button>
                ))}
              </div>
              <article className="rounded-2xl border border-border bg-white p-5">
                <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                  {selectedOpportunity.status}
                </span>
                <h4 className="mt-4 text-lg font-semibold text-brand-navy">
                  {selectedOpportunity.title}
                </h4>
                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Capacity
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-brand-navy">
                      {selectedOpportunity.capacity} students
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Applicant count
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-brand-navy">
                      {
                        applicants.filter(
                          (applicant) =>
                            applicant.opportunityId === selectedOpportunity.id,
                        ).length
                      }
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Deadline
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-brand-navy">
                      {selectedOpportunity.deadline}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Eligibility
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-brand-navy">
                      {selectedOpportunity.eligibility}
                    </dd>
                  </div>
                </dl>
              </article>
            </div>
          </div>
        ) : null}

        {activeView === "Applicants" ? (
          <div
            className="mt-4 space-y-3 sm:mt-5 sm:space-y-4"
            data-preview-panel="applicants"
          >
            <div
              aria-label="Applicant status filters"
              className="flex flex-wrap gap-2"
              role="group"
            >
              {(["All", ...applicantStatuses] as const).map((status) => (
                <button
                  aria-pressed={applicantFilter === status}
                  className={cn(
                    "min-h-11 rounded-full border px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-h-10 lg:text-xs",
                    applicantFilter === status
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white text-brand-navy",
                  )}
                  key={status}
                  onClick={() => selectApplicantFilter(status)}
                  type="button"
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="space-y-3 lg:hidden">
              {filteredApplicants.length > 0 ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-brand-navy">
                      Applicant
                    </span>
                    <select
                      aria-label="Illustrative applicant"
                      className="min-h-11 w-full min-w-0 rounded-xl border border-border bg-white px-3 text-base text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) =>
                        setSelectedApplicantId(event.target.value)
                      }
                      value={selectedApplicant.id}
                    >
                      {filteredApplicants.map((applicant) => (
                        <option key={applicant.id} value={applicant.id}>
                          {applicant.id} · {applicant.status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <article className="min-w-0 rounded-2xl border border-border bg-white p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary">
                          Applicant summary
                        </p>
                        <h4 className="mt-1 font-semibold text-brand-navy">
                          {selectedApplicant.id}
                        </h4>
                      </div>
                      <span className="rounded-full bg-blue-surface px-2.5 py-1 text-[11px] font-semibold text-primary">
                        {selectedApplicant.status}
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="min-w-0">
                        <dt className="text-muted-foreground">Education</dt>
                        <dd className="mt-1 font-semibold text-brand-navy">
                          {selectedApplicant.education}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-muted-foreground">Interest</dt>
                        <dd className="mt-1 font-semibold text-brand-navy">
                          {selectedApplicant.interest}
                        </dd>
                      </div>
                    </dl>
                    <div
                      aria-label={"Update " + selectedApplicant.id + " status"}
                      className="mt-3 grid grid-cols-2 gap-2"
                      role="group"
                    >
                      {applicantStatuses.map((status) => (
                        <button
                          aria-pressed={selectedApplicant.status === status}
                          className={cn(
                            "min-h-11 min-w-0 rounded-xl border px-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selectedApplicant.status === status
                              ? "border-teal-700 bg-teal-700 text-white"
                              : "border-border bg-white text-brand-navy",
                          )}
                          key={status}
                          onClick={() => updateApplicantStatus(status)}
                          type="button"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </article>
                </>
              ) : (
                <p className="rounded-2xl border border-dashed border-border bg-white p-4 text-sm leading-6 text-muted-foreground">
                  No applicants match this illustrative status.
                </p>
              )}
            </div>
            <div className="hidden gap-4 lg:grid lg:grid-cols-[0.75fr_1.25fr]">
              <div className="min-w-0 space-y-2">
                {filteredApplicants.length > 0 ? (
                  filteredApplicants.map((applicant) => (
                    <button
                      aria-pressed={selectedApplicant.id === applicant.id}
                      className={cn(
                        "w-full rounded-xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selectedApplicant.id === applicant.id
                          ? "border-primary bg-blue-surface"
                          : "border-border bg-white",
                      )}
                      key={applicant.id}
                      onClick={() => setSelectedApplicantId(applicant.id)}
                      type="button"
                    >
                      <span className="block text-sm font-semibold text-brand-navy">
                        {applicant.id}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {applicant.status}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-border bg-white p-4 text-sm text-muted-foreground">
                    No illustrative applicants are in this status.
                  </p>
                )}
              </div>
              {filteredApplicants.length > 0 ? (
                <article className="rounded-2xl border border-border bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                        Example applicant summary
                      </p>
                      <h4 className="mt-2 text-lg font-semibold text-brand-navy">
                        {selectedApplicant.id}
                      </h4>
                    </div>
                    <span className="rounded-full bg-blue-surface px-3 py-1 text-xs font-semibold text-primary">
                      {selectedApplicant.status}
                    </span>
                  </div>
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Education
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-brand-navy">
                        {selectedApplicant.education}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Interest
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-brand-navy">
                        {selectedApplicant.interest}
                      </dd>
                    </div>
                  </dl>
                  <div
                    aria-label={`Update ${selectedApplicant.id} status`}
                    className="mt-5 flex flex-wrap gap-2"
                    role="group"
                  >
                    {applicantStatuses.map((status) => (
                      <button
                        aria-pressed={selectedApplicant.status === status}
                        className={cn(
                          "min-h-10 rounded-lg border px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selectedApplicant.status === status
                            ? "border-teal-700 bg-teal-700 text-white"
                            : "border-border bg-white text-brand-navy hover:border-teal-500",
                        )}
                        key={status}
                        onClick={() => updateApplicantStatus(status)}
                        type="button"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </article>
              ) : (
                <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-border bg-white p-5 text-center text-sm text-muted-foreground">
                  Choose another status to inspect an illustrative applicant.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeView === "Placements" ? (
          <div data-preview-panel="placements">
            <article className="mt-4 rounded-2xl border border-border bg-white p-4 lg:hidden">
              <div className="flex min-w-0 items-center gap-2">
                <BarChart3
                  aria-hidden="true"
                  className="size-5 shrink-0 text-primary"
                />
                <h4 className="font-semibold text-brand-navy">
                  Placement progress
                </h4>
              </div>
              <div
                aria-label="Selected program placement progress"
                aria-valuemax={selectedOpportunity.capacity}
                aria-valuemin={0}
                aria-valuenow={selectedAcceptedCount}
                className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-teal-600"
                  style={{
                    width: `${Math.min(
                      100,
                      (selectedAcceptedCount / selectedOpportunity.capacity) *
                        100,
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {selectedAcceptedCount} confirmed of{" "}
                {selectedOpportunity.capacity} places for{" "}
                {selectedOpportunity.title.toLowerCase()}.
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <div className="min-w-0">
                  <dt className="text-sm text-muted-foreground">Confirmed</dt>
                  <dd className="mt-1 text-xl font-semibold text-brand-navy">
                    {selectedAcceptedCount}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-sm text-muted-foreground">
                    Pending actions
                  </dt>
                  <dd className="mt-1 text-xl font-semibold text-brand-navy">
                    {selectedReviewingCount}
                  </dd>
                </div>
              </dl>
            </article>

            <div className="mt-5 hidden gap-4 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-2xl border border-border bg-white p-5">
                <div className="flex items-center gap-2">
                  <BarChart3
                    aria-hidden="true"
                    className="size-5 text-primary"
                  />
                  <h4 className="font-semibold text-brand-navy">
                    Placement progress
                  </h4>
                </div>
                <div
                  aria-label={`${selectedOpportunity.title} placement progress`}
                  aria-valuemax={selectedOpportunity.capacity}
                  aria-valuemin={0}
                  aria-valuenow={selectedAcceptedCount}
                  className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                >
                  <div
                    className="h-full rounded-full bg-teal-600"
                    style={{
                      width: `${Math.min(100, (selectedAcceptedCount / selectedOpportunity.capacity) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {selectedAcceptedCount} confirmed of{" "}
                  {selectedOpportunity.capacity} available places for{" "}
                  {selectedOpportunity.title.toLowerCase()}.
                </p>
              </article>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <article className="rounded-2xl border border-border bg-white p-4">
                  <CheckCircle2
                    aria-hidden="true"
                    className="size-5 text-teal-600"
                  />
                  <p className="mt-3 text-2xl font-semibold text-brand-navy">
                    {selectedAcceptedCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Confirmed placements
                  </p>
                </article>
                <article className="rounded-2xl border border-border bg-white p-4">
                  <ClipboardList
                    aria-hidden="true"
                    className="size-5 text-primary"
                  />
                  <p className="mt-3 text-2xl font-semibold text-brand-navy">
                    {selectedReviewingCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pending actions
                  </p>
                </article>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
