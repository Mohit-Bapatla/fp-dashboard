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
import { publicMetrics, seminar } from "@/lib/site-config";

const description =
  "Review Future Physicians’ organization-reported community, partner, stipend, and event metrics with definitions and reporting limitations.";

export const metadata = createPublicMetadata({
  description,
  path: "/impact",
  title: "Impact",
});

const metricTerms = [
  {
    term: "Community members",
    meaning: "Students who joined FP programs, events, or community channels.",
    boundary:
      "Not the same as registered dashboard users, applicants, or placements.",
  },
  {
    term: "Registered users",
    meaning: "People with an FP account.",
    boundary:
      "No approved public total is currently supplied for this measure.",
  },
  {
    term: "Applicants",
    meaning: "Students with an application record for an opportunity.",
    boundary: "Application does not mean interview, acceptance, or placement.",
  },
  {
    term: "Students connected",
    meaning:
      "A broad relationship term that requires a specific program definition before reporting.",
    boundary: "FP does not use it here as a substitute for placements.",
  },
  {
    term: "Placements",
    meaning: "Confirmed student participation in a program position.",
    boundary: "No approved public placement total is currently supplied.",
  },
  {
    term: "Event registrants",
    meaning: "People who completed event registration.",
    boundary: "Not the same as live attendees or peak concurrent viewers.",
  },
  {
    term: "Event attendees",
    meaning: "People reported as attending the live event.",
    boundary:
      "Tracked separately from registrations, peak viewers, and watch minutes.",
  },
  {
    term: "Paid interns",
    meaning: "Students confirmed in paid internship positions.",
    boundary: "No approved public count is currently supplied.",
  },
  {
    term: "Partners",
    meaning: "Organizations recorded by FP as program or opportunity partners.",
    boundary:
      "Grant funders, event promoters, and recognition are separate categories.",
  },
  {
    term: "Grant or sponsorship revenue",
    meaning: "Funds received in those specific relationship categories.",
    boundary:
      "The stipend value below is not FP revenue, donations, or funding raised.",
  },
  {
    term: "Student stipends facilitated",
    meaning: "Student stipend value facilitated through partner programs.",
    boundary: "Not a count of placements and not money received by FP.",
  },
  {
    term: "Modeled program value",
    meaning:
      "An estimate based on stated assumptions rather than a direct transaction total.",
    boundary: "No modeled value is presented on this page.",
  },
] as const;

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
        <LimitationNote title="Reporting-period limitation">
          These cumulative community, partner, country, and stipend figures were
          supplied in the project brief, which did not provide a reporting
          period or an “as of” date. They are presented as organization-reported
          metrics, not audited outcomes. A dated reporting window should be
          added before these figures are used in formal reporting.
        </LimitationNote>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {publicMetrics.map((metric) => (
            <MetricCard
              definition={metric.definition}
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <SectionHeading
          description="These practices make rounded totals and different kinds of participation easier to interpret."
          eyebrow="Methodology"
          title="How to read the published figures."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon={<BarChart3 aria-hidden="true" className="size-5" />}
            title="Organization-reported"
          >
            Figures come from Future Physicians’ approved public reporting. This
            page does not claim an independent audit or third-party
            verification.
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
            icon={<FileCheck2 aria-hidden="true" className="size-5" />}
            title="Plus signs mean thresholds"
          >
            A value such as 2,000+ communicates a reported minimum, not an exact
            total. It should not be combined with another category without a
            documented method.
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
                key={metric.label}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </div>
        </div>
        <p className="mt-6 text-xs leading-5 text-muted-foreground">
          Seminar metrics are reported by Future Physicians for the September
          27, 2025 event. Registrations, live attendees, peak viewers, watch
          minutes, countries represented, and audience questions are distinct
          measures.
        </p>
      </MarketingSection>

      <MarketingSection tone="blue">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-white p-7 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-brand-navy">
              Program and community reach
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              FP reports more than 2,000 students across programs, events, or
              community channels and more than 50 countries represented across
              community and event participation. These are reach measures, not
              applicant, acceptance, paid-intern, or placement totals.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-white p-7 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-brand-navy">
              Partner-program value
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              FP reports more than $300,000 in student stipends facilitated
              through partner programs. This is student stipend value—not grant
              revenue, sponsorship revenue, donations, funding received by FP,
              modeled value, or a placement count.
            </p>
          </div>
        </div>
        <p className="mt-6 text-sm leading-6 text-muted-foreground">
          The approved public content does not provide aggregate acceptance,
          placement, paid-intern, or program-completion totals. Those outcomes
          are omitted rather than estimated.
        </p>
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
              {metricTerms.map((row) => (
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
