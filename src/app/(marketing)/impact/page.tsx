import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

import {
  PageHero,
  SectionHeading,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/marketing/page-shell";
import {
  MarketingSection,
  MetricCard,
  PageCta,
} from "@/components/marketing/supporting-page-sections";
import { createPublicMetadata } from "@/lib/public-metadata";
import {
  impactMethodologyNote,
  organizationMetrics,
  seminar,
} from "@/lib/site-config";

const description =
  "Explore a dated directory snapshot and separately reported program measures, with clear definitions and limitations.";

export const metadata = createPublicMetadata({
  description,
  path: "/impact",
  title: "Impact",
});

export default function ImpactPage() {
  return (
    <>
      <PageHero
        actions={
          <>
            <Link className={primaryButtonClass} href="#organization-impact">
              View the impact snapshot
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link className={secondaryButtonClass} href="/support">
              View grants and support
            </Link>
          </>
        }
        description={description}
        eyebrow="Impact"
        title="Growing access, measured with care."
      />

      <MarketingSection id="organization-impact" tone="blue">
        <SectionHeading
          description="These current, auditable figures describe the public opportunity directory and student access. They do not claim student placements, active membership, or confirmed partnerships."
          eyebrow="Directory snapshot"
          title="Healthcare opportunities with clearly scoped counts."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {organizationMetrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </div>
        <p className="mt-6 max-w-4xl text-sm leading-6 text-muted-foreground">
          {impactMethodologyNote}
        </p>
      </MarketingSection>

      <MarketingSection>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <SectionHeading
              description="The Global Healthcare Seminar is the completed event with approved public outcome measures in the current content set."
              eyebrow="Event outcomes"
              title="A dated case study, measured in several ways."
            />
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-blue-surface/45 p-5">
              <CalendarDays
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-primary"
              />
              <div>
                <p className="font-semibold text-brand-navy">{seminar.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <time dateTime={seminar.isoDate}>{seminar.date}</time>
                  {" · "}Completed event
                </p>
              </div>
            </div>
            <Link
              className="mt-6 inline-flex items-center gap-2 rounded-md font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={`/events/${seminar.slug}`}
            >
              View the seminar recap
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {seminar.metrics.map((metric) => (
              <MetricCard
                definition={metric.definition}
                key={metric.label}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </div>
        </div>
        <p className="mt-6 text-xs leading-5 text-muted-foreground">
          Seminar metrics are reported by Future Physicians as of{" "}
          <time dateTime={seminar.metricsAsOf.isoDate}>
            {seminar.metricsAsOf.date}
          </time>
          . Registrations, live attendees, peak viewers, watch minutes,
          countries represented, and audience questions are distinct measures.
        </p>
      </MarketingSection>

      <PageCta
        actions={
          <>
            <Link className={secondaryButtonClass} href="/support">
              Support the work
            </Link>
            <Link className={secondaryButtonClass} href="/partners">
              Explore partnership
            </Link>
          </>
        }
        description="Support student programs or work with Future Physicians to create clear, responsible pathways into healthcare."
        eyebrow="Build the next chapter"
        title="Help expand the next set of opportunities."
      />
    </>
  );
}
