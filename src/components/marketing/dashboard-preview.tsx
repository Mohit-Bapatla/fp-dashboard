"use client";

import {
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  FileCheck2,
  LayoutDashboard,
  Pause,
  Play,
  Search,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type StudentPreviewTab =
  | "overview"
  | "discover"
  | "saved"
  | "applications"
  | "events"
  | "profile";

const studentPreviewTabs: readonly {
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  id: StudentPreviewTab;
  label: string;
  title: string;
}[] = [
  {
    id: "overview",
    label: "Overview",
    eyebrow: "Your next step",
    title: "Welcome back",
    description: "See recommended opportunities and the next deadline.",
    icon: LayoutDashboard,
  },
  {
    id: "discover",
    label: "Discover",
    eyebrow: "Opportunity explorer",
    title: "Find a path that fits",
    description: "Search published programs and compare their requirements.",
    icon: Search,
  },
  {
    id: "saved",
    label: "Saved",
    eyebrow: "Your shortlist",
    title: "Keep strong matches close",
    description: "Return to promising opportunities when you are ready.",
    icon: Bookmark,
  },
  {
    id: "applications",
    label: "Applications",
    eyebrow: "Application workspace",
    title: "Know what comes next",
    description: "Organize application steps without losing the source link.",
    icon: FileCheck2,
  },
  {
    id: "events",
    label: "Events",
    eyebrow: "Upcoming events",
    title: "Plan time to learn and connect",
    description: "Review saved sessions and the details published by hosts.",
    icon: CalendarDays,
  },
  {
    id: "profile",
    label: "Profile",
    eyebrow: "Your interests",
    title: "Shape more useful matches",
    description: "Keep interests and preferences organized in one profile.",
    icon: CircleUserRound,
  },
] as const;

const INITIAL_AUTOPLAY_DELAY_MS = 800;
const AUTOPLAY_STEP_DELAY_MS = 1550;

export function DashboardPreview({
  variant = "student",
}: {
  variant?: "student" | "partner";
}) {
  if (variant === "partner") {
    return <PartnerDashboardPreview />;
  }

  return <StudentDashboardPreview />;
}

function StudentDashboardPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [automaticAdvances, setAutomaticAdvances] = useState(0);
  const [automaticPaused, setAutomaticPaused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [inView, setInView] = useState(false);
  const [manualInteraction, setManualInteraction] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const instanceId = useId();

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
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
        setInView(entry.isIntersecting && visibleRatio >= 0.55);
      },
      { threshold: [0, 0.35, 0.55, 0.75, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updatePageVisibility = () => setPageVisible(!document.hidden);
    updatePageVisibility();
    document.addEventListener("visibilitychange", updatePageVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updatePageVisibility);
  }, []);

  const autoplayFinished =
    automaticAdvances >= studentPreviewTabs.length || manualInteraction;
  const autoplayPaused =
    reducedMotion ||
    automaticPaused ||
    !inView ||
    !pageVisible ||
    autoplayFinished;
  const autoplayStatus = reducedMotion
    ? "reduced-motion"
    : manualInteraction
      ? "manual"
      : automaticAdvances >= studentPreviewTabs.length
        ? "complete"
        : automaticPaused
          ? "paused"
          : inView && pageVisible
            ? "running"
            : "waiting";

  useEffect(() => {
    if (autoplayPaused) {
      return;
    }

    const delay =
      automaticAdvances === 0
        ? INITIAL_AUTOPLAY_DELAY_MS
        : AUTOPLAY_STEP_DELAY_MS;
    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % studentPreviewTabs.length);
      setAutomaticAdvances((current) => current + 1);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [automaticAdvances, autoplayPaused]);

  const selectTab = (index: number, moveFocus = false, refs = tabRefs) => {
    setManualInteraction(true);
    setActiveIndex(index);
    setAnnouncement(
      `Showing ${studentPreviewTabs[index].label}: ${studentPreviewTabs[index].description}`,
    );
    if (moveFocus) {
      refs.current[index]?.focus();
    }
  };

  const replayAvailable =
    manualInteraction || automaticAdvances >= studentPreviewTabs.length;
  const animationControlLabel = reducedMotion
    ? "Automatic dashboard preview disabled by reduced-motion preference"
    : replayAvailable
      ? "Replay dashboard preview"
      : automaticPaused
        ? "Resume dashboard preview"
        : "Pause dashboard preview";

  const toggleAutomaticPreview = () => {
    if (reducedMotion) {
      return;
    }

    if (replayAvailable) {
      setActiveIndex(0);
      setAutomaticAdvances(0);
      setAutomaticPaused(false);
      setManualInteraction(false);
      setAnnouncement("Automatic dashboard preview restarted.");
      return;
    }

    const willPause = !automaticPaused;
    setAutomaticPaused(willPause);
    setAnnouncement(
      willPause
        ? "Automatic dashboard preview paused."
        : "Automatic dashboard preview resumed.",
    );
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
    refs = tabRefs,
  ) => {
    const tabCount = window.matchMedia("(max-width: 639px)").matches
      ? 4
      : studentPreviewTabs.length;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % tabCount;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + tabCount) % tabCount;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabCount - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      selectTab(nextIndex, true, refs);
    }
  };

  const activeTab = studentPreviewTabs[activeIndex];

  return (
    <figure
      aria-label="Interactive student dashboard preview"
      className="relative mx-auto w-full min-w-0 max-w-[680px]"
      data-active-tab={activeTab.id}
      data-autoplay-status={autoplayStatus}
      ref={rootRef}
    >
      <figcaption className="sr-only">
        Interactive illustrative student dashboard preview
      </figcaption>
      <p aria-atomic="true" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <div
        aria-hidden="true"
        className="absolute -inset-3 rounded-[2rem] bg-[radial-gradient(circle_at_top_right,rgba(22,166,161,0.22),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(47,111,237,0.2),transparent_40%)] blur-2xl sm:-inset-5 sm:rounded-[2.5rem]"
      />
      <div className="relative max-w-full overflow-hidden rounded-[1.35rem] border border-white/80 bg-white p-1.5 shadow-[0_24px_65px_rgba(16,33,58,0.15)] ring-1 ring-border/70 sm:rounded-[1.6rem] sm:p-2 sm:shadow-[0_28px_80px_rgba(16,33,58,0.16)]">
        <div className="max-w-full overflow-hidden rounded-[1rem] border border-border bg-background sm:rounded-[1.2rem]">
          <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border bg-white px-3 py-2.5 sm:px-5 sm:py-3">
            <div
              aria-hidden="true"
              className="flex shrink-0 items-center gap-1.5 sm:gap-2"
            >
              <span className="size-2 rounded-full bg-error/55 sm:size-2.5" />
              <span className="size-2 rounded-full bg-accent-warm/70 sm:size-2.5" />
              <span className="size-2 rounded-full bg-success/60 sm:size-2.5" />
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate rounded-full bg-blue-surface px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary sm:px-3 sm:text-[10px] sm:tracking-[0.14em]">
                Interactive preview
              </span>
              <button
                aria-label={animationControlLabel}
                className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-white text-primary shadow-sm transition hover:border-primary/40 hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60"
                disabled={reducedMotion}
                onClick={toggleAutomaticPreview}
                title={animationControlLabel}
                type="button"
              >
                {automaticPaused || replayAvailable || reducedMotion ? (
                  <Play aria-hidden="true" className="size-3.5" />
                ) : (
                  <Pause aria-hidden="true" className="size-3.5" />
                )}
              </button>
            </div>
          </div>

          <div
            className="grid min-w-0 sm:min-h-[390px] sm:grid-cols-[142px_minmax(0,1fr)]"
            data-mobile-dashboard="compact"
          >
            <div className="border-b border-border bg-white p-2 sm:border-b-0 sm:border-r sm:p-3">
              <div
                aria-label="Dashboard preview tabs"
                className="grid grid-cols-2 gap-2 sm:flex sm:flex-col sm:gap-1"
                role="group"
              >
                {studentPreviewTabs.map((tab, index) => {
                  const TabIcon = tab.icon;
                  const selected = index === activeIndex;
                  return (
                    <button
                      aria-controls={`${instanceId}-active-panel`}
                      aria-pressed={selected}
                      className={cn(
                        "min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2 text-center text-sm font-semibold leading-5 transition-colors sm:w-full sm:justify-start sm:px-3 sm:text-left sm:text-[11px] sm:leading-4",
                        index > 3 ? "hidden sm:inline-flex" : "flex",
                        selected
                          ? "bg-primary text-white shadow-sm"
                          : "text-muted-foreground hover:bg-blue-surface hover:text-brand-navy",
                      )}
                      id={`${instanceId}-${tab.id}-tab`}
                      key={tab.id}
                      onClick={() => selectTab(index)}
                      onFocus={() => setManualInteraction(true)}
                      onKeyDown={(event) => handleTabKeyDown(event, index)}
                      ref={(node) => {
                        tabRefs.current[index] = node;
                      }}
                      type="button"
                    >
                      <TabIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0"
                      />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="min-w-0 p-3 min-[360px]:p-4 sm:min-h-[390px] sm:p-5">
              <div className="mb-3 flex min-w-0 items-center justify-between gap-3 sm:hidden">
                <p className="truncate text-xs font-semibold text-brand-navy">
                  {activeTab.label}
                </p>
                <div
                  aria-label={`${activeIndex + 1} of ${studentPreviewTabs.length}`}
                  className="flex shrink-0 gap-1"
                  role="img"
                >
                  {studentPreviewTabs.map((tab, index) => (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-1.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none",
                        index === activeIndex
                          ? "w-4 bg-primary"
                          : "w-1.5 bg-border",
                      )}
                      key={tab.id}
                    />
                  ))}
                </div>
              </div>
              <section
                aria-label={`${activeTab.label} dashboard preview`}
                className="mobile-preview-state min-h-[330px] sm:min-h-0"
                id={`${instanceId}-active-panel`}
                key={activeTab.id}
                role="region"
              >
                <div className="sm:hidden">
                  <MobileStudentPreviewPanel tab={activeTab} />
                </div>
                <div className="hidden sm:block">
                  <StudentPreviewPanel tab={activeTab} />
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

function MobileStudentPreviewPanel({
  tab,
}: {
  tab: (typeof studentPreviewTabs)[number];
}) {
  const TabIcon = tab.icon;

  return (
    <div className="min-w-0" data-mobile-dashboard-panel={tab.id}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
            {tab.eyebrow}
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-6 tracking-[-0.02em] text-brand-navy">
            {tab.title}
          </h3>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {tab.description}
          </p>
        </div>
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-surface text-primary">
          <TabIcon aria-hidden="true" className="size-4" />
        </div>
      </div>

      {tab.id === "overview" ? (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Matches", "6"],
              ["Saved", "3"],
              ["In progress", "1"],
            ].map(([label, value]) => (
              <div
                className="rounded-xl border border-border bg-white p-2.5 text-center shadow-sm"
                key={label}
              >
                <p className="text-lg font-semibold text-brand-navy">{value}</p>
                <p className="mt-0.5 text-[11px] font-medium leading-4 text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <article className="rounded-xl border border-primary/15 bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-brand-navy">
                Recommended opportunity
              </p>
              <span className="rounded-full bg-success/10 px-2 py-1 text-[11px] font-bold text-success">
                Verified
              </span>
            </div>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Community health research · Remote option
            </p>
          </article>
        </div>
      ) : null}

      {tab.id === "discover" ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white">
              Research
            </span>
            <span className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-navy">
              Remote
            </span>
          </div>
          <article className="rounded-xl border border-primary/20 bg-white p-4 shadow-sm">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
              <BadgeCheck aria-hidden="true" className="size-4" />
              Eligibility published
            </span>
            <p className="mt-3 text-base font-semibold leading-6 text-brand-navy">
              Community health research program
            </p>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              One clear match with a remote option and a published application
              route.
            </p>
          </article>
        </div>
      ) : null}

      {tab.id === "saved" ? (
        <div className="mt-4 space-y-2.5">
          {[
            ["Community health project", "Deadline Aug 18"],
            ["Clinical careers panel", "Registration saved"],
          ].map(([title, detail]) => (
            <article
              className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-white p-3.5 shadow-sm"
              key={title}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-5 text-brand-navy">
                  {title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
              </div>
              <BookmarkCheck
                aria-hidden="true"
                className="size-5 shrink-0 text-secondary"
              />
            </article>
          ))}
        </div>
      ) : null}

      {tab.id === "applications" ? (
        <article className="mt-4 rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 text-brand-navy">
                Research program application
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Current status and next action
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-surface px-2.5 py-1 text-[11px] font-bold text-primary">
              In progress
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <PreviewChecklistItem complete label="Eligibility reviewed" />
            <PreviewChecklistItem label="Submit through published route" />
          </div>
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-medium leading-5 text-warning">
            Next: confirm materials before the deadline.
          </p>
        </article>
      ) : null}

      {tab.id === "events" ? (
        <div className="mt-4 space-y-3">
          <article className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-surface text-center text-primary">
              <span className="text-[10px] font-bold leading-none">AUG</span>
              <span className="text-base font-bold leading-none">18</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-navy">
                Clinical careers Q&amp;A
              </p>
              <p className="mt-1 text-xs leading-4 text-muted-foreground">
                Online · Host details published
              </p>
            </div>
          </article>
        </div>
      ) : null}

      {tab.id === "profile" ? (
        <article className="mt-4 rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-brand-navy">
              Match preferences
            </p>
            <span className="text-base font-bold text-primary">82%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-surface">
            <div className="h-full w-[82%] rounded-full bg-primary" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Interests
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Research", "Public health", "Patient care"].map((interest) => (
              <span
                className="rounded-full bg-blue-surface px-3 py-1.5 text-xs font-semibold text-primary"
                key={interest}
              >
                {interest}
              </span>
            ))}
          </div>
        </article>
      ) : null}
    </div>
  );
}

function StudentPreviewPanel({
  tab,
}: {
  tab: (typeof studentPreviewTabs)[number];
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            {tab.eyebrow}
          </p>
          <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-brand-navy">
            {tab.title}
          </h3>
          <p className="mt-1 max-w-sm text-[10px] leading-4 text-muted-foreground">
            {tab.description}
          </p>
        </div>
        {tab.id === "overview" ? (
          <div className="grid size-11 shrink-0 place-items-center rounded-full border-[5px] border-primary/20 border-r-primary text-[9px] font-bold text-primary">
            82%
          </div>
        ) : (
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-surface text-primary">
            <tab.icon aria-hidden="true" className="size-4" />
          </div>
        )}
      </div>
      <div className="mt-4">
        <StudentPreviewPanelBody tab={tab.id} />
      </div>
    </>
  );
}

function StudentPreviewPanelBody({ tab }: { tab: StudentPreviewTab }) {
  if (tab === "discover") {
    return (
      <div className="space-y-3">
        <div className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] text-muted-foreground shadow-sm">
          <Search aria-hidden="true" className="size-3.5 text-primary" />
          Search programs, events, or specialties
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            ["Research", true],
            ["Remote option", false],
            ["Published details", false],
          ].map(([label, active]) => (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[9px] font-semibold",
                active
                  ? "bg-primary text-white"
                  : "border border-border bg-white text-muted-foreground",
              )}
              key={String(label)}
            >
              {label}
            </span>
          ))}
        </div>
        <PreviewOpportunityRow
          detail="Published eligibility · Remote option"
          title="Community health research program"
        />
        <PreviewOpportunityRow
          detail="Host details available · In person"
          title="Student hospital observer session"
        />
      </div>
    );
  }

  if (tab === "saved") {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <PreviewStat icon={BookmarkCheck} label="Saved matches" value="3" />
          <PreviewStat icon={CalendarClock} label="Deadline soon" value="1" />
        </div>
        <PreviewOpportunityRow
          detail="Research · Review requirements"
          title="Community health project"
        />
        <PreviewOpportunityRow
          detail="Event · Registration details saved"
          title="Clinical careers panel"
        />
      </div>
    );
  }

  if (tab === "applications") {
    return (
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-brand-navy">
              Research program application
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Illustrative progress checklist
            </p>
          </div>
          <span className="rounded-full bg-blue-surface px-2 py-1 text-[9px] font-bold text-primary">
            In progress
          </span>
        </div>
        <div className="mt-4 space-y-2.5">
          <PreviewChecklistItem complete label="Review eligibility" />
          <PreviewChecklistItem complete label="Prepare experience summary" />
          <PreviewChecklistItem label="Submit through published route" />
        </div>
        <p className="mt-4 border-t border-border pt-3 text-[10px] font-medium text-muted-foreground">
          Source link and deadline stay attached to this workspace.
        </p>
      </div>
    );
  }

  if (tab === "events") {
    return (
      <div className="space-y-3">
        <PreviewEventRow
          date="18"
          detail="Online · Host details published"
          month="AUG"
          title="Clinical careers Q&A"
        />
        <PreviewEventRow
          date="27"
          detail="In person · Registration saved"
          month="AUG"
          title="Community health workshop"
        />
        <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-blue-surface p-3 text-[10px] font-medium text-primary">
          <CalendarClock aria-hidden="true" className="size-4 shrink-0" />
          Event details come from each published host listing.
        </div>
      </div>
    );
  }

  if (tab === "profile") {
    return (
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-brand-navy">
              Match preferences
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              A concise profile can make discovery more useful.
            </p>
          </div>
          <span className="text-sm font-bold text-primary">82%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-surface">
          <div className="h-full w-[82%] rounded-full bg-primary" />
        </div>
        <div className="mt-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Interests
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Research", "Public health", "Patient care"].map((interest) => (
              <span
                className="rounded-full bg-blue-surface px-2.5 py-1 text-[9px] font-semibold text-primary"
                key={interest}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <PreviewProfileField label="Preferred format" value="Flexible" />
          <PreviewProfileField label="Education level" value="High school" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <PreviewStat icon={Sparkles} label="Matches" value="6" />
        <PreviewStat icon={BookmarkCheck} label="Saved" value="3" />
        <PreviewStat icon={FileCheck2} label="In progress" value="1" />
      </div>
      <div className="mt-4 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-brand-navy">
              Recommended for you
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Based on interests and published requirements
            </p>
          </div>
          <span className="rounded-full bg-success/10 px-2 py-1 text-[9px] font-bold text-success">
            Verified
          </span>
        </div>
        <div className="mt-3 rounded-lg border border-border bg-background p-3">
          <p className="text-xs font-semibold text-brand-navy">
            Healthcare research opportunity
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Research", "Remote option", "Eligibility published"].map(
              (label, index) => (
                <span
                  className={cn(
                    "rounded-md px-2 py-1 text-[9px] font-medium",
                    index === 0
                      ? "bg-blue-surface text-primary"
                      : "bg-white text-muted-foreground",
                  )}
                  key={label}
                >
                  {label}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function PreviewOpportunityRow({
  detail,
  title,
}: {
  detail: string;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-3 shadow-sm">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold text-brand-navy">
          {title}
        </p>
        <p className="mt-1 truncate text-[9px] text-muted-foreground">
          {detail}
        </p>
      </div>
      <BadgeCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
    </div>
  );
}

function PreviewChecklistItem({
  complete = false,
  label,
}: {
  complete?: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-[10px] font-medium text-brand-navy">
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border",
          complete
            ? "border-success bg-success text-white"
            : "border-border bg-background text-muted-foreground",
        )}
      >
        {complete ? (
          <CheckCircle2 aria-hidden="true" className="size-3" />
        ) : (
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-border"
          />
        )}
      </span>
      {label}
    </div>
  );
}

function PreviewEventRow({
  date,
  detail,
  month,
  title,
}: {
  date: string;
  detail: string;
  month: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-surface text-center text-primary">
        <span className="text-[8px] font-bold leading-none">{month}</span>
        <span className="text-sm font-bold leading-none">{date}</span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold text-brand-navy">
          {title}
        </p>
        <p className="mt-1 truncate text-[9px] text-muted-foreground">
          {detail}
        </p>
      </div>
    </div>
  );
}

function PreviewProfileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-2.5">
      <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[10px] font-semibold text-brand-navy">{value}</p>
    </div>
  );
}

function PartnerDashboardPreview() {
  return (
    <figure className="overflow-hidden rounded-3xl border border-border bg-white p-2 shadow-[0_24px_70px_rgba(16,33,58,0.13)]">
      <figcaption className="sr-only">
        Illustrative partner dashboard preview
      </figcaption>
      <div className="rounded-[1.25rem] border border-border bg-background p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
              Partner overview
            </p>
            <h3 className="mt-2 text-xl font-semibold text-brand-navy">
              Applicant pipeline
            </h3>
          </div>
          <span className="rounded-full border border-border bg-white px-3 py-1 text-[10px] font-semibold text-muted-foreground">
            Illustrative preview
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <PreviewStat icon={FileCheck2} label="New applicants" value="12" />
          <PreviewStat icon={CalendarClock} label="Need review" value="4" />
          <PreviewStat icon={CheckCircle2} label="Placed" value="7" />
        </div>
        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-white">
          {["Application received", "Under review", "Interview requested"].map(
            (label, index) => (
              <div
                className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-0"
                key={label}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`size-2.5 rounded-full ${index === 0 ? "bg-primary" : index === 1 ? "bg-accent-warm" : "bg-secondary"}`}
                  />
                  <span className="text-xs font-semibold text-brand-navy">
                    {label}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  Authorized profile
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </figure>
  );
}

function PreviewStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <Icon aria-hidden="true" className="size-3.5 text-primary" />
        <span className="text-base font-semibold text-brand-navy">{value}</span>
      </div>
      <p className="mt-2 text-[10px] font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
