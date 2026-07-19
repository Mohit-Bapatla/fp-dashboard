"use client";

import {
  Bookmark,
  CheckCircle2,
  ClipboardList,
  Compass,
  FileText,
  MapPin,
  UserRoundCheck,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const studentViews = ["Discover", "Saved", "Applications", "Profile"] as const;
const opportunityCategories = ["All", "Research", "Service", "Events"] as const;

type StudentView = (typeof studentViews)[number];
type OpportunityCategory = (typeof opportunityCategories)[number];

const previewOpportunities = [
  {
    id: "research-experience",
    title: "Guided research experience",
    category: "Research",
    deadline: "August 18",
    format: "Remote option",
    eligibility: [
      "College or graduate",
      "Research interest",
      "Remote availability",
    ],
  },
  {
    id: "community-service",
    title: "Community health service",
    category: "Service",
    deadline: "Rolling timeline",
    format: "Local program",
    eligibility: [
      "High school or college",
      "Weekend availability",
      "Local travel",
    ],
  },
  {
    id: "career-event",
    title: "Clinical career event",
    category: "Events",
    deadline: "September 9",
    format: "Virtual event",
    eligibility: [
      "Open education level",
      "Registration required",
      "Virtual access",
    ],
  },
] as const;

type PreviewOpportunityId = (typeof previewOpportunities)[number]["id"];

type PreviewApplication = {
  id: PreviewOpportunityId;
  status: "Preparing" | "Submitted";
};

export function InteractiveStudentPreview() {
  const [activeView, setActiveView] = useState<StudentView>("Discover");
  const [category, setCategory] = useState<OpportunityCategory>("All");
  const [savedFilter, setSavedFilter] = useState<OpportunityCategory>("All");
  const [selectedOpportunityId, setSelectedOpportunityId] =
    useState<PreviewOpportunityId>(previewOpportunities[0].id);
  const [savedIds, setSavedIds] = useState<PreviewOpportunityId[]>([
    "community-service",
  ]);
  const [applications, setApplications] = useState<PreviewApplication[]>([
    { id: "community-service", status: "Submitted" },
  ]);
  const [statusMessage, setStatusMessage] = useState(
    "Choose a view to explore this local demonstration.",
  );

  const selectedOpportunity =
    previewOpportunities.find(
      (opportunity) => opportunity.id === selectedOpportunityId,
    ) ?? previewOpportunities[0];
  const visibleOpportunities = previewOpportunities.filter(
    (opportunity) => category === "All" || opportunity.category === category,
  );
  const visibleSaved = previewOpportunities.filter(
    (opportunity) =>
      savedIds.includes(opportunity.id) &&
      (savedFilter === "All" || opportunity.category === savedFilter),
  );

  function toggleSaved(id: PreviewOpportunityId) {
    const isSaved = savedIds.includes(id);
    setSavedIds(
      isSaved
        ? savedIds.filter((savedId) => savedId !== id)
        : [...savedIds, id],
    );
    setStatusMessage(
      isSaved
        ? "Opportunity removed from Saved in this demonstration."
        : "Opportunity added to Saved in this demonstration.",
    );
  }

  function startApplication(id: PreviewOpportunityId) {
    if (applications.some((application) => application.id === id)) {
      setStatusMessage(
        "This illustrative application is already in your workspace. Nothing was submitted or sent.",
      );
      setActiveView("Applications");
      return;
    }
    setApplications([...applications, { id, status: "Preparing" }]);
    setStatusMessage(
      "Illustrative application added. Nothing was submitted or sent.",
    );
    setActiveView("Applications");
  }

  return (
    <section
      aria-label="Interactive student workspace preview"
      className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-border bg-brand-navy p-1 shadow-[0_24px_60px_rgba(16,33,58,0.18)] sm:rounded-3xl sm:p-2"
      data-active-view={activeView.toLowerCase()}
    >
      <div className="min-w-0 rounded-[1rem] bg-slate-50 p-3 sm:rounded-[1.25rem] sm:p-6">
        <div className="flex min-w-0 flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary sm:text-xs sm:tracking-[0.16em]">
              <span className="lg:hidden">Student workspace demo</span>
              <span className="hidden lg:inline">
                Interactive student dashboard demonstration
              </span>
            </p>
            <h3 className="mt-1 text-lg font-semibold text-brand-navy sm:text-xl">
              Your opportunity workspace
            </h3>
          </div>
          <span className="w-fit shrink-0 rounded-full border border-primary/20 bg-blue-surface px-2.5 py-1 text-[11px] font-semibold text-primary sm:px-3 sm:text-xs">
            <span className="lg:hidden">Local preview</span>
            <span className="hidden lg:inline">Illustrative local preview</span>
          </span>
        </div>

        <div
          aria-label="Student preview views"
          className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-4"
          role="group"
        >
          {studentViews.map((view) => (
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

        {activeView === "Discover" ? (
          <div data-preview-panel="discover">
            <div className="mt-4 space-y-3 lg:hidden">
              <div
                aria-label="Opportunity categories"
                className="grid grid-cols-2 gap-2"
                role="group"
              >
                {opportunityCategories.map((option) => (
                  <button
                    aria-pressed={category === option}
                    className={cn(
                      "min-h-11 min-w-0 rounded-xl border px-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      category === option
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-white text-brand-navy",
                    )}
                    key={option}
                    onClick={() => {
                      setCategory(option);
                      const firstMatch = previewOpportunities.find(
                        (opportunity) =>
                          option === "All" || opportunity.category === option,
                      );
                      if (firstMatch) {
                        setSelectedOpportunityId(firstMatch.id);
                      }
                    }}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>

              <article className="min-w-0 rounded-2xl border border-border bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                    Eligibility summary
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {selectedOpportunity.category}
                  </span>
                </div>
                <h4 className="mt-3 text-base font-semibold text-brand-navy">
                  {selectedOpportunity.title}
                </h4>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin aria-hidden="true" className="size-4 shrink-0" />
                    {selectedOpportunity.format}
                  </span>
                  <span>{selectedOpportunity.deadline}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-brand-navy">
                  {selectedOpportunity.eligibility.slice(0, 2).join(" · ")}
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => toggleSaved(selectedOpportunity.id)}
                    type="button"
                  >
                    <Bookmark aria-hidden="true" className="size-4 shrink-0" />
                    {savedIds.includes(selectedOpportunity.id)
                      ? "Unsave opportunity"
                      : "Save opportunity"}
                  </button>
                  <button
                    className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-center text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => startApplication(selectedOpportunity.id)}
                    type="button"
                  >
                    <FileText aria-hidden="true" className="size-4 shrink-0" />
                    Start application
                  </button>
                </div>
              </article>
            </div>

            <div className="mt-5 hidden space-y-4 lg:block">
              <div
                aria-label="Opportunity categories"
                className="flex flex-wrap gap-2"
                role="group"
              >
                {opportunityCategories.map((option) => (
                  <button
                    aria-pressed={category === option}
                    className={cn(
                      "min-h-10 rounded-full border px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      category === option
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-white text-brand-navy",
                    )}
                    key={option}
                    onClick={() => {
                      setCategory(option);
                      const firstMatch = previewOpportunities.find(
                        (opportunity) =>
                          option === "All" || opportunity.category === option,
                      );
                      if (firstMatch) {
                        setSelectedOpportunityId(firstMatch.id);
                      }
                    }}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="space-y-2">
                  {visibleOpportunities.map((opportunity) => (
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
                        {opportunity.category} · {opportunity.deadline}
                      </span>
                    </button>
                  ))}
                </div>

                <article className="rounded-2xl border border-border bg-white p-5">
                  <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                    Eligibility summary available
                  </span>
                  <h4 className="mt-4 text-lg font-semibold text-brand-navy">
                    {selectedOpportunity.title}
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin aria-hidden="true" className="size-3.5" />
                      {selectedOpportunity.format}
                    </span>
                    <span>{selectedOpportunity.deadline}</span>
                  </div>
                  <ul className="mt-5 space-y-2">
                    {selectedOpportunity.eligibility.map((item) => (
                      <li
                        className="flex items-center gap-2 text-sm text-brand-navy"
                        key={item}
                      >
                        <CheckCircle2
                          aria-hidden="true"
                          className="size-4 shrink-0 text-teal-600"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <button
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-brand-navy hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => toggleSaved(selectedOpportunity.id)}
                      type="button"
                    >
                      <Bookmark aria-hidden="true" className="size-4" />
                      {savedIds.includes(selectedOpportunity.id)
                        ? "Unsave opportunity"
                        : "Save opportunity"}
                    </button>
                    <button
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => startApplication(selectedOpportunity.id)}
                      type="button"
                    >
                      <FileText aria-hidden="true" className="size-4" />
                      Start illustrative application
                    </button>
                  </div>
                </article>
              </div>
            </div>
          </div>
        ) : null}

        {activeView === "Saved" ? (
          <div data-preview-panel="saved">
            <div className="mt-4 space-y-3 lg:hidden">
              <div
                aria-label="Saved opportunity type filters"
                className="grid grid-cols-2 gap-2"
                role="group"
              >
                {opportunityCategories.map((option) => (
                  <button
                    aria-pressed={savedFilter === option}
                    className={cn(
                      "min-h-11 min-w-0 rounded-xl border px-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      savedFilter === option
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-white text-brand-navy",
                    )}
                    key={option}
                    onClick={() => setSavedFilter(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
              {visibleSaved.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {visibleSaved.slice(0, 2).map((opportunity) => (
                    <article
                      className="min-w-0 rounded-2xl border border-border bg-white p-4"
                      key={opportunity.id}
                    >
                      <p className="text-sm font-semibold text-primary">
                        {opportunity.category}
                      </p>
                      <h4 className="mt-1 text-sm font-semibold text-brand-navy">
                        {opportunity.title}
                      </h4>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Deadline: {opportunity.deadline}
                      </p>
                      <button
                        className="mt-3 min-h-11 rounded-xl border border-border px-3 text-sm font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => toggleSaved(opportunity.id)}
                        type="button"
                      >
                        Remove from Saved
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-border bg-white p-4 text-sm leading-6 text-muted-foreground">
                  No saved opportunities match this type in the demonstration.
                </p>
              )}
            </div>

            <div className="mt-5 hidden space-y-4 lg:block">
              <div
                aria-label="Saved opportunity type filters"
                className="flex flex-wrap gap-2"
                role="group"
              >
                {opportunityCategories.map((option) => (
                  <button
                    aria-pressed={savedFilter === option}
                    className={cn(
                      "min-h-10 rounded-full border px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      savedFilter === option
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-white text-brand-navy",
                    )}
                    key={option}
                    onClick={() => setSavedFilter(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
              {visibleSaved.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {visibleSaved.map((opportunity) => (
                    <article
                      className="rounded-2xl border border-border bg-white p-5"
                      key={opportunity.id}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                        {opportunity.category}
                      </p>
                      <h4 className="mt-2 font-semibold text-brand-navy">
                        {opportunity.title}
                      </h4>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Deadline: {opportunity.deadline}
                      </p>
                      <button
                        className="mt-4 min-h-10 rounded-lg border border-border px-3 text-xs font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => toggleSaved(opportunity.id)}
                        type="button"
                      >
                        Remove from Saved
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-border bg-white p-6 text-sm text-muted-foreground">
                  No saved opportunities match this type in the demonstration.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {activeView === "Applications" ? (
          <div data-preview-panel="applications">
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:hidden">
              {applications.slice(-2).map((application) => {
                const opportunity =
                  previewOpportunities.find(
                    (item) => item.id === application.id,
                  ) ?? previewOpportunities[0];
                const isPreparing = application.status === "Preparing";
                return (
                  <article
                    className="min-w-0 rounded-2xl border border-border bg-white p-4"
                    key={application.id}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary">
                          Status: {application.status}
                        </p>
                        <h4 className="mt-1 text-sm font-semibold text-brand-navy">
                          Application: {opportunity.title}
                        </h4>
                      </div>
                      <ClipboardList
                        aria-hidden="true"
                        className="size-5 shrink-0 text-primary"
                      />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Next:{" "}
                      {isPreparing
                        ? "Review requirements"
                        : "Watch for an update"}
                    </p>
                    <div
                      aria-label="Application checklist progress"
                      aria-valuemax={isPreparing ? 5 : 4}
                      aria-valuemin={0}
                      aria-valuenow={isPreparing ? 2 : 3}
                      className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                    >
                      <div
                        className="h-full rounded-full bg-teal-600"
                        style={{ width: isPreparing ? "40%" : "75%" }}
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-5 hidden gap-4 lg:grid lg:grid-cols-2">
              {applications.map((application) => {
                const opportunity =
                  previewOpportunities.find(
                    (item) => item.id === application.id,
                  ) ?? previewOpportunities[0];
                const isPreparing = application.status === "Preparing";
                return (
                  <article
                    className="rounded-2xl border border-border bg-white p-5"
                    key={application.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                          {application.status}
                        </p>
                        <h4 className="mt-2 font-semibold text-brand-navy">
                          {opportunity.title}
                        </h4>
                      </div>
                      <ClipboardList
                        aria-hidden="true"
                        className="size-5 text-primary"
                      />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Next action:{" "}
                      {isPreparing
                        ? "Review requirements"
                        : "Watch for an update"}
                    </p>
                    <div
                      aria-label={`${opportunity.title} checklist progress`}
                      aria-valuemax={isPreparing ? 5 : 4}
                      aria-valuemin={0}
                      aria-valuenow={isPreparing ? 2 : 3}
                      className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                    >
                      <div
                        className="h-full rounded-full bg-teal-600"
                        style={{ width: isPreparing ? "40%" : "75%" }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {isPreparing
                        ? "2 of 5 checklist items"
                        : "3 of 4 checklist items"}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeView === "Profile" ? (
          <div data-preview-panel="profile">
            <article className="mt-4 rounded-2xl border border-border bg-white p-4 lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <UserRoundCheck
                    aria-hidden="true"
                    className="size-5 shrink-0 text-primary"
                  />
                  <h4 className="font-semibold text-brand-navy">
                    Profile completion
                  </h4>
                </div>
                <span className="text-xl font-semibold text-brand-navy">
                  75%
                </span>
              </div>
              <div
                aria-label="Illustrative profile completion"
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={75}
                className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
              >
                <div className="h-full w-3/4 rounded-full bg-primary" />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Add one document and confirm availability to complete this
                illustrative profile.
              </p>
              <dl className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-sm text-muted-foreground">Interests</dt>
                  <dd className="mt-1 text-sm font-semibold text-brand-navy">
                    Research · Community health
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-sm text-muted-foreground">Documents</dt>
                  <dd className="mt-1 text-sm font-semibold text-brand-navy">
                    2 of 3 ready
                  </dd>
                </div>
              </dl>
            </article>

            <div className="mt-5 hidden gap-4 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-2xl border border-border bg-white p-5">
                <div className="flex items-center gap-2">
                  <UserRoundCheck
                    aria-hidden="true"
                    className="size-5 text-primary"
                  />
                  <h4 className="font-semibold text-brand-navy">
                    Profile completion
                  </h4>
                </div>
                <p className="mt-5 text-3xl font-semibold text-brand-navy">
                  75%
                </p>
                <div
                  aria-label="Illustrative profile completion"
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={75}
                  className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                >
                  <div className="h-full w-3/4 rounded-full bg-primary" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Add one document and confirm availability to complete this
                  illustrative profile.
                </p>
              </article>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <article className="rounded-2xl border border-border bg-white p-4">
                  <Compass aria-hidden="true" className="size-5 text-primary" />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Interests
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-navy">
                    Research · Community health
                  </p>
                </article>
                <article className="rounded-2xl border border-border bg-white p-4">
                  <FileText
                    aria-hidden="true"
                    className="size-5 text-primary"
                  />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Documents
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-navy">
                    Checklist: 2 of 3 ready
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
