import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  FileCheck2,
  Scale,
} from "lucide-react";

import {
  PageHero,
  SectionHeading,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/marketing/page-shell";
import {
  FeatureCard,
  LimitationNote,
  MarketingSection,
  MetricCard,
  PageCta,
} from "@/components/marketing/supporting-page-sections";
import { createPublicMetadata } from "@/lib/public-metadata";
import {
  impactMetricDefinitions,
  organizationImpactReporting,
  seminar,
} from "@/lib/site-config";

const description =
  "Review Future Physicians’ verified event metrics, public metric definitions, and reporting requirements.";

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
            <Link className={primaryButtonClass} href="#definitions">
              Read metric definitions
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link className={secondaryButtonClass} href="/support">
              View grants and support
            </Link>
          </>
        }
        description={description}
        eyebrow="Impact and methodology"
        title="Public numbers should explain what they measure."
      />

      <MarketingSection>
        <LimitationNote title="Organization-wide totals are not published">
          {organizationImpactReporting.disclosure} Future reporting must
          identify the evidence owner, metric definition, deduplication method,
          and “as of” date before a cumulative total appears here.
        </LimitationNote>
      </MarketingSection>

      <MarketingSection tone="blue">
        <SectionHeading
          description="These practices make rounded totals and different kinds of participation easier to interpret."
          eyebrow="Methodology"
          title="How to read the published figures."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon={<FileCheck2 aria-hidden="true" className="size-5" />}
            title="Evidence before publication"
          >
            A public total needs an approved source record that supports the
            exact value, scope, and wording shown.
          </FeatureCard>
          <FeatureCard
            icon={<Scale aria-hidden="true" className="size-5" />}
            title="Categories stay separate"
          >
            Community members, account holders, applicants, attendees,
            placements, partners, funders, and stipend value are not
            interchangeable.
          </FeatureCard>
          <FeatureCard
            icon={<BarChart3 aria-hidden="true" className="size-5" />}
            title="Dated reporting"
          >
            Every published figure needs an “as of” date or reporting window so
            readers know when and where it applies.
          </FeatureCard>
        </div>
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
                  <time dateTime={seminar.isoDate}>{seminar.date}</time> ·
                  Completed event
                </p>
              </div>
            </div>
            <Link
              className="mt-6 inline-flex items-center gap-2 font-semibold text-primary hover:underline"
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

      <MarketingSection tone="blue">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <SectionHeading
            description="No dated, approved source is currently available for cumulative community, partner, country, stipend, acceptance, placement, paid-intern, or completion totals. Those figures are omitted rather than estimated."
            eyebrow="Organization-wide reporting status"
            title="Publish a total only when its evidence is ready."
          />
          <LimitationNote title="Human content approval required">
            An authorized reviewer must approve each source, definition,
            reporting period, and public label. Legal or financial review is
            also required for claims about fiscal sponsorship, tax treatment,
            donations, grants, or money received by Future Physicians.
          </LimitationNote>
        </div>
      </MarketingSection>

      <MarketingSection id="definitions">
        <SectionHeading
          description="Use these boundaries whenever comparing public claims or building future reports."
          eyebrow="Metric glossary"
          title="Similar words can describe very different outcomes."
        />
        <div
          aria-label="Metric glossary table; scroll horizontally to view all columns"
          className="mt-9 overflow-x-auto rounded-2xl border border-border bg-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          role="region"
          tabIndex={0}
        >
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-blue-surface/70">
              <tr>
                <th
                  className="px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-brand-navy"
                  scope="col"
                >
                  Term
                </th>
                <th
                  className="px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-brand-navy"
                  scope="col"
                >
                  Working definition
                </th>
                <th
                  className="px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-brand-navy"
                  scope="col"
                >
                  Important boundary
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {impactMetricDefinitions.map((row) => (
                <tr key={row.term}>
                  <th
                    className="px-5 py-4 align-top text-sm font-semibold text-brand-navy"
                    scope="row"
                  >
                    {row.term}
                  </th>
                  <td className="px-5 py-4 align-top text-sm leading-6 text-muted-foreground">
                    {row.meaning}
                  </td>
                  <td className="px-5 py-4 align-top text-sm leading-6 text-muted-foreground">
                    {row.boundary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        description="Future reporting should add dated periods, evidence links, and clearly separated program outcomes as approved data becomes available."
        eyebrow="Build the next chapter responsibly"
        title="Help Future Physicians expand access—and measure it clearly."
      />
    </>
  );
}
