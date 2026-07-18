"use client";

import {
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  CalendarClock,
  Check,
  CircleCheckBig,
  ClipboardCheck,
  ExternalLink,
  FileText,
  MapPin,
  MousePointer2,
  Pause,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FocusEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type OpportunityCategory = "All" | "Research" | "Shadowing" | "Volunteering";

type PreviewOpportunity = {
  category: Exclude<OpportunityCategory, "All">;
  deadline: string;
  description: string;
  eligibility: readonly string[];
  highSchool: boolean;
  id: string;
  location: string;
  nextStep: string;
  program: string;
  remote: boolean;
  searchTerms: string;
  title: string;
  verified: boolean;
};

const opportunityCategories: readonly {
  count: number;
  label: OpportunityCategory;
}[] = [
  { label: "All", count: 12 },
  { label: "Research", count: 5 },
  { label: "Shadowing", count: 4 },
  { label: "Volunteering", count: 3 },
] as const;

const previewOpportunities: readonly PreviewOpportunity[] = [
  {
    id: "research-preview",
    category: "Research",
    program: "Healthcare research program",
    title: "Explore a guided research experience",
    description:
      "Review a sample program format, eligibility notes, and application path before deciding whether it fits.",
    location: "Remote option",
    deadline: "Deadline published",
    eligibility: ["High school students", "No prior research required"],
    nextStep: "Review the sample requirements and application route.",
    remote: true,
    highSchool: true,
    verified: true,
    searchTerms: "biology public health remote summer mentor",
  },
  {
    id: "shadowing-preview",
    category: "Shadowing",
    program: "Clinical observation program",
    title: "Prepare for a supervised shadowing experience",
    description:
      "Use an illustrative overview to compare the observation format, host expectations, and request process.",
    location: "In-person format",
    deadline: "Requests reviewed monthly",
    eligibility: ["High school students", "Guardian consent may be required"],
    nextStep: "Review the sample host requirements before requesting a spot.",
    remote: false,
    highSchool: true,
    verified: true,
    searchTerms: "clinic physician observation hospital in person",
  },
  {
    id: "volunteering-preview",
    category: "Volunteering",
    program: "Community health service program",
    title: "Support an illustrative community health project",
    description:
      "Explore a sample service role and see how schedules, requirements, and organizer details could appear.",
    location: "Hybrid format",
    deadline: "Rolling interest form",
    eligibility: ["Open education level", "Orientation may be required"],
    nextStep: "Review the sample schedule and confirm the organizer source.",
    remote: true,
    highSchool: false,
    verified: false,
    searchTerms: "community service outreach hybrid volunteer wellness",
  },
] as const;

type WalkthroughTarget =
  | "filters"
  | "listing"
  | "eligibility"
  | "action"
  | "tracking";

const walkthroughSteps: readonly {
  description: string;
  icon: LucideIcon;
  label: string;
  target: WalkthroughTarget;
}[] = [
  {
    label: "Select a type",
    description: "Start with research, shadowing, volunteering, or events.",
    icon: SlidersHorizontal,
    target: "filters",
  },
  {
    label: "Open a verified opportunity",
    description: "See the source, format, deadline, and application path.",
    icon: BadgeCheck,
    target: "listing",
  },
  {
    label: "Review eligibility",
    description: "Check education level, location, and published requirements.",
    icon: ClipboardCheck,
    target: "eligibility",
  },
  {
    label: "Save or apply",
    description: "Use the listed FP or external application route.",
    icon: Bookmark,
    target: "action",
  },
  {
    label: "Track the next step",
    description: "Keep the deadline and your next action in one workspace.",
    icon: CircleCheckBig,
    target: "tracking",
  },
] as const;

export function OpportunityDiscoveryPreview() {
  const [selectedCategory, setSelectedCategory] =
    useState<OpportunityCategory>("Research");
  const [query, setQuery] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [highSchoolOnly, setHighSchoolOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [expandedOpportunityId, setExpandedOpportunityId] = useState<
    string | null
  >(null);
  const [savedOpportunityIds, setSavedOpportunityIds] = useState<
    readonly string[]
  >([]);
  const [announcement, setAnnouncement] = useState(
    "Research category selected. One illustrative preview matches.",
  );

  const filteredOpportunities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return previewOpportunities.filter((opportunity) => {
      if (
        selectedCategory !== "All" &&
        opportunity.category !== selectedCategory
      ) {
        return false;
      }
      if (remoteOnly && !opportunity.remote) {
        return false;
      }
      if (highSchoolOnly && !opportunity.highSchool) {
        return false;
      }
      if (verifiedOnly && !opportunity.verified) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        opportunity.category,
        opportunity.program,
        opportunity.title,
        opportunity.description,
        opportunity.location,
        opportunity.searchTerms,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [highSchoolOnly, query, remoteOnly, selectedCategory, verifiedOnly]);

  const currentOpportunity = filteredOpportunities[0];
  const categoryCount =
    opportunityCategories.find(
      (category) => category.label === selectedCategory,
    )?.count ?? 0;
  const activeFilterCount = [remoteOnly, highSchoolOnly, verifiedOnly].filter(
    Boolean,
  ).length;

  function selectCategory(category: OpportunityCategory) {
    setSelectedCategory(category);
    setExpandedOpportunityId(null);
    setAnnouncement(`${category} category selected.`);
  }

  function toggleFilter(
    label: string,
    active: boolean,
    update: (nextValue: boolean) => void,
  ) {
    const nextValue = !active;
    update(nextValue);
    setExpandedOpportunityId(null);
    setAnnouncement(`${label} filter ${nextValue ? "applied" : "removed"}.`);
  }

  function clearSearchAndFilters() {
    setQuery("");
    setRemoteOnly(false);
    setHighSchoolOnly(false);
    setVerifiedOnly(false);
    setExpandedOpportunityId(null);
    setAnnouncement("Search and filters cleared.");
  }

  function toggleSaved(opportunity: PreviewOpportunity) {
    const isSaved = savedOpportunityIds.includes(opportunity.id);
    setSavedOpportunityIds((currentIds) =>
      isSaved
        ? currentIds.filter((id) => id !== opportunity.id)
        : [...currentIds, opportunity.id],
    );
    setAnnouncement(
      isSaved
        ? `${opportunity.category} illustrative preview removed from saved items.`
        : `${opportunity.category} illustrative preview saved locally for this demo.`,
    );
  }

  return (
    <ProductFrame label="Interactive illustrative opportunity preview — not a live listing">
      <div
        aria-label="Interactive opportunity explorer demo"
        className="grid min-h-[470px] md:grid-cols-[190px_1fr]"
        data-opportunity-category={selectedCategory.toLowerCase()}
        data-opportunity-result-count={filteredOpportunities.length}
        role="region"
      >
        <aside className="border-b border-border bg-slate-50/80 p-4 md:border-b-0 md:border-r">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Find your fit
          </p>
          <div
            aria-label="Opportunity categories"
            className="mt-3 grid grid-cols-2 gap-2 md:mt-4 md:grid-cols-1"
            role="group"
          >
            {opportunityCategories.map((category) => {
              const selected = selectedCategory === category.label;
              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "flex min-h-11 items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selected
                      ? "bg-primary text-white shadow-md shadow-primary/15"
                      : "text-muted-foreground hover:bg-white hover:text-brand-navy",
                  )}
                  key={category.label}
                  onClick={() => selectCategory(category.label)}
                  type="button"
                >
                  {category.label === "All"
                    ? "All opportunities"
                    : category.label}
                  <span className={selected ? "text-blue-100" : "text-primary"}>
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
                Opportunity explorer
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-navy">
                {selectedCategory === "All"
                  ? "All opportunities"
                  : `${selectedCategory} opportunities`}
              </h3>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                {categoryCount} illustrative listings represented ·{" "}
                {filteredOpportunities.length}{" "}
                {filteredOpportunities.length === 1
                  ? "preview matches"
                  : "previews match"}
              </p>
            </div>

            <div className="relative sm:w-64">
              <label className="sr-only" htmlFor="opportunity-demo-search">
                Search illustrative opportunities
              </label>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary"
              />
              <input
                className="min-h-11 w-full rounded-xl border border-border bg-white py-2 pl-9 pr-10 text-xs text-brand-navy shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                id="opportunity-demo-search"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setExpandedOpportunityId(null);
                }}
                placeholder="Search illustrative previews"
                type="search"
                value={query}
              />
              {query ? (
                <button
                  aria-label="Clear opportunity search"
                  className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-slate-100 hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    setQuery("");
                    setExpandedOpportunityId(null);
                    setAnnouncement("Opportunity search cleared.");
                  }}
                  type="button"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div
            aria-label="Opportunity preview filters"
            className="mt-5 flex flex-wrap gap-2"
            role="group"
          >
            <span className="inline-flex min-h-9 items-center rounded-full border border-primary bg-primary px-3 text-[11px] font-semibold text-white">
              {selectedCategory}
            </span>
            <FilterButton
              active={remoteOnly}
              label="Remote option"
              onClick={() =>
                toggleFilter("Remote option", remoteOnly, setRemoteOnly)
              }
            />
            <FilterButton
              active={highSchoolOnly}
              label="High school"
              onClick={() =>
                toggleFilter("High school", highSchoolOnly, setHighSchoolOnly)
              }
            />
            <FilterButton
              active={verifiedOnly}
              label="Verified only"
              onClick={() =>
                toggleFilter("Verified only", verifiedOnly, setVerifiedOnly)
              }
            />
          </div>

          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
            This local demo uses illustrative scenarios only. Searching, saving,
            and opening details do not send data or change your account.
          </p>

          {currentOpportunity ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_230px]">
              <article className="rounded-2xl border border-primary/20 bg-white p-5 shadow-[0_16px_45px_rgba(16,33,58,0.1)]">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold",
                      currentOpportunity.verified
                        ? "bg-success/10 text-success"
                        : "bg-slate-100 text-muted-foreground",
                    )}
                  >
                    <BadgeCheck aria-hidden="true" className="size-3.5" />
                    {currentOpportunity.verified
                      ? "Verified example"
                      : "Source review example"}
                  </span>
                  <span className="rounded-full bg-blue-surface px-2.5 py-1 text-[10px] font-bold text-primary">
                    {currentOpportunity.category}
                  </span>
                </div>
                <p className="mt-5 text-xs font-semibold text-muted-foreground">
                  {currentOpportunity.program}
                </p>
                <h4 className="mt-1 text-balance text-2xl font-semibold tracking-[-0.035em] text-brand-navy">
                  {currentOpportunity.title}
                </h4>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {currentOpportunity.description}
                </p>
                <div className="mt-5 grid gap-3 border-y border-border py-4 text-xs text-muted-foreground sm:grid-cols-2">
                  <span className="flex items-center gap-2">
                    <MapPin
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                    {currentOpportunity.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <CalendarClock
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                    {currentOpportunity.deadline}
                  </span>
                </div>

                {expandedOpportunityId === currentOpportunity.id ? (
                  <div
                    className="mt-4 rounded-xl border border-secondary/20 bg-secondary/5 p-4 text-xs leading-5 text-brand-navy"
                    id={`${currentOpportunity.id}-details`}
                  >
                    <p className="font-bold">Illustrative detail view</p>
                    <p className="mt-1 text-muted-foreground">
                      A live listing would show its source, requirements,
                      schedule, and authorized application route here. This
                      preview does not open or submit an application.
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    aria-controls={`${currentOpportunity.id}-details`}
                    aria-expanded={
                      expandedOpportunityId === currentOpportunity.id
                    }
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => {
                      const willExpand =
                        expandedOpportunityId !== currentOpportunity.id;
                      setExpandedOpportunityId(
                        willExpand ? currentOpportunity.id : null,
                      );
                      setAnnouncement(
                        willExpand
                          ? "Illustrative opportunity details expanded."
                          : "Illustrative opportunity details collapsed.",
                      );
                    }}
                    type="button"
                  >
                    {expandedOpportunityId === currentOpportunity.id
                      ? "Hide details"
                      : "View details"}
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    aria-pressed={savedOpportunityIds.includes(
                      currentOpportunity.id,
                    )}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      savedOpportunityIds.includes(currentOpportunity.id)
                        ? "border-secondary bg-secondary/5 text-secondary"
                        : "border-border text-brand-navy hover:border-primary/40 hover:bg-blue-surface",
                    )}
                    onClick={() => toggleSaved(currentOpportunity)}
                    type="button"
                  >
                    {savedOpportunityIds.includes(currentOpportunity.id) ? (
                      <Check aria-hidden="true" className="size-4" />
                    ) : (
                      <Bookmark aria-hidden="true" className="size-4" />
                    )}
                    {savedOpportunityIds.includes(currentOpportunity.id)
                      ? "Saved"
                      : "Save"}
                  </button>
                </div>
              </article>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <PreviewNote
                  icon={ClipboardCheck}
                  label="Eligibility"
                  text={currentOpportunity.eligibility.join(" · ")}
                />
                <PreviewNote
                  icon={CircleCheckBig}
                  label="Next step"
                  text={currentOpportunity.nextStep}
                />
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-primary/30 bg-blue-surface/50 p-6 text-center">
              <div className="mx-auto grid size-11 place-items-center rounded-xl bg-white text-primary shadow-sm">
                <Search aria-hidden="true" className="size-5" />
              </div>
              <h4 className="mt-4 text-base font-semibold text-brand-navy">
                No illustrative opportunity matches
              </h4>
              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                Try another search term or remove one of the local preview
                filters. No live opportunity data was queried.
              </p>
              <button
                className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-border bg-white px-4 text-xs font-semibold text-brand-navy transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={clearSearchAndFilters}
                type="button"
              >
                Clear search and filters
              </button>
            </div>
          )}

          <p
            aria-atomic="true"
            aria-live="polite"
            className="sr-only"
            role="status"
          >
            {announcement}
            {` Showing ${filteredOpportunities.length} illustrative ${filteredOpportunities.length === 1 ? "preview" : "previews"}.`}
            {activeFilterCount > 0
              ? ` ${activeFilterCount} additional ${activeFilterCount === 1 ? "filter is" : "filters are"} active.`
              : ""}
          </p>
        </div>
      </div>
    </ProductFrame>
  );
}

export function OpportunityWalkthrough() {
  const [activeStep, setActiveStep] = useState(0);
  const [inView, setInView] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [keyboardFocusWithin, setKeyboardFocusWithin] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setReducedMotion(media.matches);
      if (media.matches) {
        setActiveStep(2);
      }
    };
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) {
      return;
    }
    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const referenceHeight = Math.min(
          entry.boundingClientRect.height,
          window.innerHeight,
        );
        const visibleRatio =
          referenceHeight > 0
            ? entry.intersectionRect.height / referenceHeight
            : 0;
        setInView(entry.isIntersecting && visibleRatio >= 0.6);
      },
      { threshold: Array.from({ length: 11 }, (_, index) => index / 10) },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibility = () =>
      setPageVisible(document.visibilityState === "visible");
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const autoPaused =
    reducedMotion ||
    manualPaused ||
    keyboardFocusWithin ||
    !inView ||
    !pageVisible;

  useEffect(() => {
    if (autoPaused) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % walkthroughSteps.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [autoPaused]);

  const currentStep = walkthroughSteps[activeStep];

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (
      !(nextTarget instanceof Node) ||
      !event.currentTarget.contains(nextTarget)
    ) {
      setKeyboardFocusWithin(false);
    }
  }

  function toggleManualPause() {
    if (manualPaused) {
      setKeyboardFocusWithin(false);
    }
    setManualPaused((paused) => !paused);
  }

  return (
    <div
      aria-describedby="walkthrough-status"
      aria-label="Guided opportunity walkthrough"
      className="relative grid overflow-hidden rounded-[2rem] border border-indigo-200/70 bg-white shadow-[0_28px_80px_rgba(32,54,117,0.14)] lg:grid-cols-[310px_1fr]"
      data-walkthrough-status={
        reducedMotion
          ? "reduced-motion"
          : manualPaused
            ? "paused"
            : autoPaused
              ? "auto-paused"
              : "running"
      }
      data-walkthrough-step={currentStep.target}
      onBlurCapture={handleBlur}
      onFocusCapture={() => setKeyboardFocusWithin(true)}
      ref={rootRef}
      role="region"
    >
      <button
        aria-label={
          reducedMotion
            ? "Animation disabled by reduced-motion preference"
            : manualPaused
              ? "Resume animation"
              : "Pause animation"
        }
        className="absolute right-3 top-3 z-20 grid size-11 place-items-center rounded-full border border-indigo-200 bg-white/95 text-indigo-950 shadow-md backdrop-blur transition hover:border-indigo-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-70"
        disabled={reducedMotion}
        onClick={toggleManualPause}
        title={
          reducedMotion
            ? "Animation disabled by reduced-motion preference"
            : manualPaused
              ? "Resume animation"
              : "Pause animation"
        }
        type="button"
      >
        {manualPaused ? (
          <Play aria-hidden="true" className="size-4" />
        ) : (
          <Pause aria-hidden="true" className="size-4" />
        )}
      </button>

      <div className="border-b border-indigo-200/70 bg-[linear-gradient(155deg,#eef2ff_0%,#ecfeff_100%)] p-5 pr-16 sm:p-7 sm:pr-20 lg:border-b-0 lg:border-r lg:pr-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">
          Guided walkthrough
        </p>
        <ol className="mt-5 grid gap-2" aria-label="Walkthrough stages">
          {walkthroughSteps.map((step, index) => {
            const StepIcon = step.icon;
            const selected = index === activeStep;
            return (
              <li
                aria-current={selected ? "step" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-300 motion-reduce:transition-none",
                  selected
                    ? "bg-indigo-700 text-white shadow-md shadow-indigo-900/15"
                    : "text-indigo-950/70",
                )}
                key={step.label}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-300 motion-reduce:transition-none",
                    selected ? "bg-white/15" : "bg-white text-indigo-700",
                  )}
                >
                  <StepIcon aria-hidden="true" className="size-4" />
                </span>
                <span>
                  <span className="mr-2 text-[10px] opacity-70">
                    0{index + 1}
                  </span>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
        <div
          className="mt-5 rounded-xl border border-indigo-200/80 bg-white/80 p-4"
          id="walkthrough-status"
        >
          <p className="text-xs font-bold text-indigo-950">
            Step {activeStep + 1} of {walkthroughSteps.length}
          </p>
          <p className="mt-1 text-xs leading-5 text-indigo-950/70">
            {currentStep.description}
          </p>
          {reducedMotion ? (
            <p className="mt-2 text-[10px] font-semibold text-indigo-700">
              Static preview shown for reduced motion.
            </p>
          ) : manualPaused ? (
            <p className="mt-2 text-[10px] font-semibold text-indigo-700">
              Animation paused. Use Resume animation to continue.
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="relative bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_36%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] p-4 sm:p-7"
        id="opportunity-walkthrough-panel"
      >
        <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_20px_55px_rgba(16,33,58,0.14)] ring-1 ring-border">
          <div className="flex items-center justify-between border-b border-border py-3 pl-4 pr-16">
            <div className="flex items-center gap-2" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-error/50" />
              <span className="size-2.5 rounded-full bg-accent-warm/70" />
              <span className="size-2.5 rounded-full bg-success/60" />
            </div>
            <span className="rounded-full bg-blue-surface px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">
              Illustrative — not live data
            </span>
          </div>
          <div className="p-4 sm:p-5">
            <div
              className={targetClass("filters", currentStep.target)}
              data-demo-target="filters"
            >
              <span className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-white">
                <SlidersHorizontal aria-hidden="true" className="size-3.5" />
                Research
              </span>
              <span className="inline-flex min-h-10 items-center rounded-lg border border-border bg-white px-3 text-xs font-semibold text-brand-navy">
                Remote option
              </span>
              <span className="inline-flex min-h-10 items-center rounded-lg border border-border bg-white px-3 text-xs font-semibold text-brand-navy">
                Verified only
              </span>
              {currentStep.target === "filters" ? <TargetMarker /> : null}
            </div>

            <article
              className={cn(
                "relative mt-4 rounded-2xl border bg-white p-4 transition-[box-shadow,border-color,transform] duration-500 motion-reduce:transition-none sm:p-5",
                currentStep.target === "listing"
                  ? "border-primary shadow-[0_14px_40px_rgba(36,95,213,0.18)]"
                  : "border-border shadow-sm",
              )}
              data-demo-target="listing"
            >
              {currentStep.target === "listing" ? <TargetMarker /> : null}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success">
                  <BadgeCheck aria-hidden="true" className="size-3.5" />
                  Verified listing
                </span>
                <span className="rounded-full bg-blue-surface px-2.5 py-1 text-[10px] font-bold text-primary">
                  Research
                </span>
              </div>
              <p className="mt-4 text-[11px] font-semibold text-muted-foreground">
                Healthcare research program
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-brand-navy sm:text-xl">
                Guided research experience
              </h3>
              <div
                className={cn(
                  "relative mt-4 grid gap-2 rounded-xl border p-3 text-xs transition-[box-shadow,border-color,background-color] duration-500 motion-reduce:transition-none sm:grid-cols-2",
                  currentStep.target === "eligibility"
                    ? "border-secondary bg-secondary/5 shadow-[0_0_0_3px_rgba(11,113,110,0.12)]"
                    : "border-border bg-slate-50/70",
                )}
                data-demo-target="eligibility"
              >
                {currentStep.target === "eligibility" ? <TargetMarker /> : null}
                <span className="flex items-center gap-2 text-brand-navy">
                  <Check
                    aria-hidden="true"
                    className="size-3.5 text-secondary"
                  />
                  Education level published
                </span>
                <span className="flex items-center gap-2 text-brand-navy">
                  <MapPin
                    aria-hidden="true"
                    className="size-3.5 text-secondary"
                  />
                  Remote option
                </span>
              </div>
              <div
                className={cn(
                  "relative mt-4 flex flex-wrap gap-2 rounded-xl transition-[box-shadow] duration-500 motion-reduce:transition-none",
                  currentStep.target === "action" &&
                    "shadow-[0_0_0_4px_rgba(36,95,213,0.12)]",
                )}
                data-demo-target="action"
              >
                {currentStep.target === "action" ? <TargetMarker /> : null}
                <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white">
                  Review application
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </span>
                <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-xs font-semibold text-brand-navy">
                  <Bookmark aria-hidden="true" className="size-3.5" />
                  Save
                </span>
              </div>
            </article>

            <div
              className={cn(
                "relative mt-4 flex items-center gap-3 rounded-xl border p-3 transition-[box-shadow,border-color,background-color] duration-500 motion-reduce:transition-none",
                currentStep.target === "tracking"
                  ? "border-accent-warm bg-amber-50 shadow-[0_0_0_3px_rgba(242,184,75,0.2)]"
                  : "border-border bg-slate-50",
              )}
              data-demo-target="tracking"
            >
              {currentStep.target === "tracking" ? <TargetMarker /> : null}
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-warning shadow-sm">
                <FileText aria-hidden="true" className="size-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-warning">
                  Next step saved
                </p>
                <p className="mt-0.5 text-xs font-semibold text-brand-navy">
                  Review requirements before the deadline
                </p>
              </div>
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-5 right-5 hidden items-center gap-2 rounded-full border border-white bg-brand-navy px-3 py-2 text-[10px] font-semibold text-white shadow-xl lg:flex"
        >
          <Sparkles className="size-3.5 text-cyan-300" />
          Guided state
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-9 items-center rounded-full border px-3 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "border-secondary bg-secondary text-white"
          : "border-border bg-white text-brand-navy hover:border-primary/40 hover:bg-blue-surface",
      )}
      onClick={onClick}
      type="button"
    >
      {active ? <Check aria-hidden="true" className="mr-1.5 size-3" /> : null}
      {label}
    </button>
  );
}

function ProductFrame({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <figure className="relative mx-auto w-full">
      <figcaption className="sr-only">{label}</figcaption>
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[3rem] bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.26),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(79,70,229,0.2),transparent_40%)] blur-2xl"
      />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white p-2 shadow-[0_30px_90px_rgba(16,33,58,0.22)] ring-1 ring-white/80">
        <div className="overflow-hidden rounded-[1.3rem] border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-error/55" />
              <span className="size-2.5 rounded-full bg-accent-warm/70" />
              <span className="size-2.5 rounded-full bg-success/60" />
            </div>
            <span className="rounded-full bg-blue-surface px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary sm:text-[10px]">
              Illustrative preview
            </span>
          </div>
          {children}
        </div>
      </div>
    </figure>
  );
}

function PreviewNote({
  icon: Icon,
  label,
  text,
}: {
  icon: LucideIcon;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-slate-50/80 p-4">
      <div className="grid size-9 place-items-center rounded-lg bg-white text-secondary shadow-sm">
        <Icon aria-hidden="true" className="size-4" />
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-brand-navy">
        {label}
      </p>
      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}

function TargetMarker() {
  return (
    <span
      aria-hidden="true"
      className="absolute -right-2 -top-2 hidden size-8 place-items-center rounded-full border-2 border-white bg-brand-navy text-white shadow-lg motion-safe:animate-pulse lg:grid"
    >
      <MousePointer2 className="size-3.5" />
    </span>
  );
}

function targetClass(
  target: WalkthroughTarget,
  activeTarget: WalkthroughTarget,
) {
  return cn(
    "relative flex flex-wrap gap-2 rounded-xl p-1.5 transition-[box-shadow,background-color] duration-500 motion-reduce:transition-none",
    target === activeTarget &&
      "bg-primary/5 shadow-[0_0_0_3px_rgba(36,95,213,0.12)]",
  );
}
