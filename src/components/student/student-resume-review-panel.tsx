"use client";

import { CheckCircle2, ChevronDown, Lightbulb, Target } from "lucide-react";
import { useState } from "react";

import {
  getSentencePreview,
  type ResumeOpportunityAlignment,
  type ResumeReview,
  type ResumeReviewCategoryStatus,
} from "@/lib/student/resume-review";
import { formatResumeAnalyzedDateTime } from "@/lib/student/resume-date";
import type { StructuredResumeSections } from "@/lib/student/resume-structure";
import { cn } from "@/lib/utils";

export function StudentResumeReviewPanel({
  alignments,
  extractedSections,
  review,
}: {
  alignments: ResumeOpportunityAlignment[];
  extractedSections: StructuredResumeSections;
  review: ResumeReview;
}) {
  const [selectedAlignmentId, setSelectedAlignmentId] = useState(
    alignments.at(0)?.id ?? "",
  );
  const selectedAlignment =
    alignments.find((alignment) => alignment.id === selectedAlignmentId) ??
    alignments.at(0) ??
    null;

  return (
    <div className="mt-6 space-y-5">
      <section className="rounded-xl border border-border bg-background p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          Review overview
        </p>
        <h3 className="mt-2 text-lg font-semibold text-foreground">
          Actionable feedback, grounded in your resume
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          FP analyzes your resume to improve opportunity matching and help you
          prepare stronger applications. FP does not modify your original file,
          and this analysis does not predict acceptance.
        </p>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Last analyzed {formatResumeAnalyzedDateTime(review.generatedAt)} ·
          Review version {review.version}
        </p>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Automated and AI-assisted feedback may be imperfect. Review every
          suggestion against your original resume before using it. AI-assisted
          wording is always labeled “Suggested edit — review before using”.
        </div>
        {review.summary ? <ExpandableSummary value={review.summary} /> : null}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2
              aria-hidden="true"
              className="h-5 w-5 text-emerald-600"
            />
            <h3 className="text-base font-semibold text-foreground">
              Strengths
            </h3>
          </div>
          <ul className="mt-4 space-y-3">
            {review.strengths.map((strength) => (
              <li
                className="flex gap-3 text-sm leading-6 text-muted-foreground"
                key={strength}
              >
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="min-w-0 break-words">{strength}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center gap-2">
            <Lightbulb aria-hidden="true" className="h-5 w-5 text-amber-600" />
            <h3 className="text-base font-semibold text-foreground">
              Highest-priority improvements
            </h3>
          </div>
          <ol className="mt-4 space-y-4">
            {review.improvements.map((improvement, index) => (
              <li
                className="rounded-lg border border-border bg-muted/20 p-4"
                key={improvement.detected}
              >
                <p className="text-sm font-semibold text-foreground">
                  {index + 1}. {improvement.detected}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Why it matters:{" "}
                  </span>
                  {improvement.whyItMatters}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Next action:{" "}
                  </span>
                  {improvement.action}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-background p-5">
        <h3 className="text-base font-semibold text-foreground">
          Review categories
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {review.categories.map((category) => (
            <article
              className="min-w-0 rounded-lg border border-border p-4"
              key={category.name}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {formatLabel(category.name)}
                </p>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium",
                    categoryStatusClass(category.status),
                  )}
                >
                  {formatLabel(category.status)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {category.explanation}
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground">
                {category.action}
              </p>
            </article>
          ))}
        </div>
      </section>

      {review.sectionFeedback.length > 0 ? (
        <section className="rounded-xl border border-border bg-background p-5">
          <h3 className="text-base font-semibold text-foreground">
            Section review
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Concise observations are shown here; extracted details remain
            secondary below.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {review.sectionFeedback.map((section) => (
              <article
                className="rounded-lg border border-border p-4"
                key={section.key}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {section.label}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {section.entryCount}{" "}
                    {section.entryCount === 1 ? "entry" : "entries"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {section.summary}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {alignments.length > 0 ? (
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center gap-2">
            <Target aria-hidden="true" className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Resume alignment for this opportunity
            </h3>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Compare only facts already present in your resume with verified
            opportunity details or an active application. This is not an
            acceptance score or applicant ranking.
          </p>
          <label className="mt-4 block max-w-xl text-sm font-medium text-foreground">
            Opportunity
            <select
              className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onChange={(event) => setSelectedAlignmentId(event.target.value)}
              value={selectedAlignment?.id ?? ""}
            >
              {alignments.map((alignment) => (
                <option key={alignment.id} value={alignment.id}>
                  {alignment.title} · {alignment.organizationName}
                </option>
              ))}
            </select>
          </label>
          {selectedAlignment ? (
            <OpportunityAlignment alignment={selectedAlignment} />
          ) : null}
        </section>
      ) : null}

      <details className="group rounded-xl border border-border bg-background p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          <span>Automatically extracted details — review for accuracy.</span>
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 shrink-0 transition group-open:rotate-180"
          />
        </summary>
        <ExtractedDetails sections={extractedSections} />
      </details>
    </div>
  );
}

function ExpandableSummary({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = getSentencePreview(value);
  const visible = expanded || !preview.truncated ? value : preview.text;

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-sm font-semibold text-foreground">Resume summary</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
        {visible}
      </p>
      {preview.truncated ? (
        <button
          aria-expanded={expanded}
          className="mt-3 min-h-10 rounded-md px-2 text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}

function OpportunityAlignment({
  alignment,
}: {
  alignment: ResumeOpportunityAlignment;
}) {
  const groups = [
    {
      label: "Relevant resume evidence",
      values: alignment.relevantResumeEvidence,
    },
    {
      label: "Requirements reflected",
      values: alignment.requirementsReflected,
    },
    {
      label: "Missing or unclear evidence",
      values: alignment.missingOrUnclearEvidence,
    },
    {
      label: "Skills worth emphasizing",
      values: alignment.skillsWorthEmphasizing,
    },
    {
      label: "Experiences worth moving higher",
      values: alignment.experiencesWorthMovingHigher,
    },
    {
      label: "Suggested tailoring actions",
      values: alignment.tailoringActions,
    },
  ];

  return (
    <div className="mt-5 grid gap-3 lg:grid-cols-2">
      {groups.map((group) => (
        <article
          className="min-w-0 rounded-lg border border-border bg-muted/20 p-4"
          key={group.label}
        >
          <h4 className="text-sm font-semibold text-foreground">
            {group.label}
          </h4>
          {group.values.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              {group.values.map((value) => (
                <li className="flex gap-2" key={value}>
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="min-w-0 break-words">{value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              No supported evidence detected.
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function ExtractedDetails({
  sections,
}: {
  sections: StructuredResumeSections;
}) {
  const labels: Record<keyof StructuredResumeSections, string> = {
    activities: "Activities",
    certifications: "Certifications",
    education: "Education",
    experience: "Experience",
    honors: "Honors and Awards",
    leadership: "Leadership",
    projects: "Projects",
    research: "Research",
    school: "School or Campus Involvement",
    skills: "Skills",
    summary: "Summary",
    volunteering: "Volunteering",
  };
  const visibleSections = Object.entries(sections).filter(
    ([, values]) => values.length > 0,
  ) as Array<[keyof StructuredResumeSections, string[]]>;

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      {visibleSections.map(([key, values]) => (
        <section
          className="min-w-0 rounded-lg border border-border bg-muted/20 p-4"
          key={key}
        >
          <h4 className="text-sm font-semibold text-foreground">
            {labels[key]}
          </h4>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            {values.map((value) => (
              <li className="flex gap-2" key={value}>
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="min-w-0 whitespace-normal break-words">
                  {value}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function categoryStatusClass(status: ResumeReviewCategoryStatus) {
  switch (status) {
    case "STRONG":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "MISSING":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}
