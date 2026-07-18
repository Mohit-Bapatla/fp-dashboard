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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

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
  return (
    <ProductFrame label="Illustrative opportunity preview — not a live listing">
      <div className="grid min-h-[470px] md:grid-cols-[190px_1fr]">
        <aside className="hidden border-r border-border bg-slate-50/80 p-4 md:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Find your fit
          </p>
          <div className="mt-4 space-y-2">
            {[
              ["All opportunities", "12"],
              ["Research", "5"],
              ["Shadowing", "4"],
              ["Volunteering", "3"],
            ].map(([label, count], index) => (
              <div
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold",
                  index === 1
                    ? "bg-primary text-white shadow-md shadow-primary/15"
                    : "text-muted-foreground",
                )}
                key={label}
              >
                {label}
                <span
                  className={index === 1 ? "text-blue-100" : "text-primary"}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </aside>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
                Opportunity explorer
              </p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-navy">
                Research opportunities
              </p>
            </div>
            <div className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-3 text-xs text-muted-foreground shadow-sm sm:w-56">
              <Search aria-hidden="true" className="size-4 text-primary" />
              Search opportunities
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Research", "Remote option", "High school", "Verified only"].map(
              (filter, index) => (
                <span
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-semibold",
                    index === 0
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white text-brand-navy",
                  )}
                  key={filter}
                >
                  {filter}
                </span>
              ),
            )}
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_230px]">
            <article className="rounded-2xl border border-primary/20 bg-white p-5 shadow-[0_16px_45px_rgba(16,33,58,0.1)]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success">
                  <BadgeCheck aria-hidden="true" className="size-3.5" />
                  Verified listing
                </span>
                <span className="rounded-full bg-blue-surface px-2.5 py-1 text-[10px] font-bold text-primary">
                  Research
                </span>
              </div>
              <p className="mt-5 text-xs font-semibold text-muted-foreground">
                Healthcare research program
              </p>
              <h3 className="mt-1 text-balance text-2xl font-semibold tracking-[-0.035em] text-brand-navy">
                Explore a guided research experience
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Review the published format, eligibility, and application path
                before deciding whether it fits.
              </p>
              <div className="mt-5 grid gap-3 border-y border-border py-4 text-xs text-muted-foreground sm:grid-cols-2">
                <span className="flex items-center gap-2">
                  <MapPin aria-hidden="true" className="size-4 text-primary" />
                  Remote option
                </span>
                <span className="flex items-center gap-2">
                  <CalendarClock
                    aria-hidden="true"
                    className="size-4 text-primary"
                  />
                  Deadline published
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white">
                  View details
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </span>
                <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-xs font-semibold text-brand-navy">
                  <Bookmark aria-hidden="true" className="size-4" />
                  Save
                </span>
              </div>
            </article>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <PreviewNote
                icon={ClipboardCheck}
                label="Eligibility"
                text="Requirements are easy to review before applying."
              />
              <PreviewNote
                icon={CircleCheckBig}
                label="Next step"
                text="Save the deadline and application route."
              />
            </div>
          </div>
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
  const [reducedMotion, setReducedMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
        setInView(entry.isIntersecting && visibleRatio >= 0.7);
      },
      { threshold: Array.from({ length: 21 }, (_, index) => index / 20) },
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

  const autoPaused = reducedMotion || manualPaused || !inView || !pageVisible;

  useEffect(() => {
    if (autoPaused) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % walkthroughSteps.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [autoPaused]);

  const currentStep = walkthroughSteps[activeStep];

  return (
    <div
      aria-describedby="walkthrough-status"
      aria-label="Guided opportunity walkthrough"
      className="grid overflow-hidden rounded-[2rem] border border-indigo-200/70 bg-white shadow-[0_28px_80px_rgba(32,54,117,0.14)] lg:grid-cols-[310px_1fr]"
      ref={rootRef}
      role="region"
    >
      <div className="border-b border-indigo-200/70 bg-[linear-gradient(155deg,#eef2ff_0%,#ecfeff_100%)] p-5 sm:p-7 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">
            Guided walkthrough
          </p>
          <button
            aria-label={
              reducedMotion
                ? "Automatic animation disabled by reduced-motion preference"
                : manualPaused
                  ? "Play product walkthrough"
                  : "Pause product walkthrough"
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 text-xs font-semibold text-indigo-950 shadow-sm transition hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-70"
            disabled={reducedMotion}
            onClick={() => setManualPaused((paused) => !paused)}
            type="button"
          >
            {manualPaused ? (
              <Play aria-hidden="true" className="size-3.5" />
            ) : (
              <Pause aria-hidden="true" className="size-3.5" />
            )}
            {reducedMotion ? "Motion reduced" : manualPaused ? "Play" : "Pause"}
          </button>
        </div>
        <ol className="mt-5 grid gap-2">
          {walkthroughSteps.map((step, index) => {
            const StepIcon = step.icon;
            const selected = index === activeStep;
            return (
              <li key={step.label}>
                <button
                  aria-controls="opportunity-walkthrough-panel"
                  aria-pressed={selected}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "bg-indigo-700 text-white shadow-md shadow-indigo-900/15"
                      : "text-indigo-950 hover:bg-white/80",
                  )}
                  onClick={() => {
                    setActiveStep(index);
                    setManualPaused(true);
                  }}
                  type="button"
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg",
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
                </button>
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
          {manualPaused && !reducedMotion ? (
            <p className="mt-2 text-[10px] font-semibold text-indigo-700">
              Paused. Select Play to resume automatic steps.
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="relative bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_36%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] p-4 sm:p-7"
        id="opportunity-walkthrough-panel"
      >
        <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_20px_55px_rgba(16,33,58,0.14)] ring-1 ring-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
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
                "relative mt-4 rounded-2xl border bg-white p-4 transition-[box-shadow,border-color,transform] duration-500 sm:p-5",
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
                  "relative mt-4 grid gap-2 rounded-xl border p-3 text-xs transition-[box-shadow,border-color,background-color] duration-500 sm:grid-cols-2",
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
                  "relative mt-4 flex flex-wrap gap-2 rounded-xl transition-[box-shadow] duration-500",
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
                "relative mt-4 flex items-center gap-3 rounded-xl border p-3 transition-[box-shadow,border-color,background-color] duration-500",
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
      className="absolute -right-2 -top-2 hidden size-8 place-items-center rounded-full border-2 border-white bg-brand-navy text-white shadow-lg lg:grid"
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
    "relative flex flex-wrap gap-2 rounded-xl p-1.5 transition-[box-shadow,background-color] duration-500",
    target === activeTarget &&
      "bg-primary/5 shadow-[0_0_0_3px_rgba(36,95,213,0.12)]",
  );
}
