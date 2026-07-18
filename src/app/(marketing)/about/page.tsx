import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Handshake,
  Layers3,
  SearchCheck,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  PageHero,
  SectionHeading,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/marketing/page-shell";
import {
  FeatureCard,
  MarketingSection,
  PageCta,
} from "@/components/marketing/supporting-page-sections";
import { createPublicMetadata } from "@/lib/public-metadata";

const description =
  "Learn how Future Physicians combines community, verified opportunity information, responsible partnerships, and practical technology to expand healthcare-career access.";

export const metadata = createPublicMetadata({
  description,
  path: "/about",
  title: "About",
});

const values = [
  [
    "Access",
    "Make useful healthcare-career information easier to find and navigate.",
  ],
  [
    "Trust",
    "Label sources, relationships, limitations, and outcomes honestly.",
  ],
  [
    "Service",
    "Build programs and tools around practical student and partner needs.",
  ],
  [
    "Student agency",
    "Give students information and organization tools without making decisions for them.",
  ],
  [
    "Responsible partnership",
    "Protect student information and respect each program’s real requirements.",
  ],
  [
    "Accuracy",
    "Review details, correct errors, and avoid claims that cannot be substantiated.",
  ],
  [
    "Opportunity transparency",
    "Keep eligibility, deadlines, application paths, and status understandable.",
  ],
] as const;

export default function AboutPage() {
  return (
    <>
      <PageHero
        actions={
          <>
            <Link className={primaryButtonClass} href="/impact">
              See our reported impact
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link className={secondaryButtonClass} href="/contact">
              Contact Future Physicians
            </Link>
          </>
        }
        description={description}
        eyebrow="About Future Physicians"
        title="Healthcare-career access should be easier to understand and act on."
      />

      <MarketingSection>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHeading
              description="Future Physicians helps students discover, apply to, and manage verified healthcare opportunities from one profile."
              eyebrow="Our mission"
              title="Turn scattered opportunity information into a usable path."
            />
            <p className="mt-6 text-base leading-7 text-muted-foreground">
              Students often piece together deadlines, eligibility rules,
              application portals, documents, and follow-up across unrelated
              websites and spreadsheets. That fragmentation can make a promising
              opportunity harder to evaluate and manage—especially for students
              without an established network in healthcare.
            </p>
          </div>
          <div className="rounded-3xl border border-primary/15 bg-blue-surface/55 p-7 sm:p-9">
            <Compass aria-hidden="true" className="size-8 text-primary" />
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-navy">
              The problem we work on
            </h2>
            <ul className="mt-5 space-y-4">
              {[
                "Opportunities are distributed across many sources",
                "Eligibility and application paths are not always easy to compare",
                "Students must repeatedly organize similar information and materials",
                "Partners may manage applicant workflows across disconnected tools",
              ].map((item) => (
                <li
                  className="flex gap-3 text-sm leading-6 text-muted-foreground sm:text-base"
                  key={item}
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-teal-600"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <SectionHeading
          description="No single feature solves access. The organization connects several parts of the journey while keeping their boundaries clear."
          eyebrow="How FP works"
          title="Community, opportunities, partnerships, and technology—working together."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            icon={<Users aria-hidden="true" className="size-5" />}
            title="Community"
          >
            Events and chapters create places to learn, lead, and connect around
            healthcare-career exploration.
          </FeatureCard>
          <FeatureCard
            icon={<SearchCheck aria-hidden="true" className="size-5" />}
            title="Opportunities"
          >
            FP reviews sources, deadlines, eligibility, application paths, and
            publication status before student visibility.
          </FeatureCard>
          <FeatureCard
            icon={<Handshake aria-hidden="true" className="size-5" />}
            title="Partnerships"
          >
            Healthcare, education, and community organizations can structure
            opportunities and manage authorized applicant workflows.
          </FeatureCard>
          <FeatureCard
            icon={<Layers3 aria-hidden="true" className="size-5" />}
            title="Technology"
          >
            The FP Dashboard helps students reuse profile information and
            organize discovery, applications, documents, and next steps.
          </FeatureCard>
        </div>
      </MarketingSection>

      <MarketingSection>
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <SectionHeading
            description="These principles guide how public claims, opportunity information, student access, and partner relationships are presented."
            eyebrow="Values"
            title="Credibility comes from operating choices."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {values.map(([title, copy]) => (
              <article
                className="rounded-2xl border border-border bg-white p-5 shadow-sm"
                key={title}
              >
                <h3 className="font-semibold text-brand-navy">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <SectionHeading
              description="The current public content does not include a verified organizational timeline or current team roster, so this page does not invent either."
              eyebrow="Public accountability"
              title="Accuracy matters more than a polished origin story."
            />
            <p className="mt-6 text-base leading-7 text-muted-foreground">
              FP avoids fabricated testimonials, placements, partner logos, team
              biographies, and milestone dates. Public numbers are defined on
              the Impact page, and funders, partners, event recognition, and
              promotional relationships are treated as separate categories.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-white p-7 shadow-sm sm:p-8">
            <ShieldCheck aria-hidden="true" className="size-7 text-primary" />
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-navy">
              Explore the work by context
            </h2>
            <div className="mt-6 grid gap-3">
              {[
                ["Impact and definitions", "/impact"],
                ["Partner workflows", "/partners"],
                ["Student-led chapters", "/chapters"],
                ["Questions and contact", "/contact"],
              ].map(([label, href]) => (
                <Link
                  className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-semibold text-brand-navy transition hover:border-primary/30 hover:bg-blue-surface"
                  href={href}
                  key={href}
                >
                  {label}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 text-primary"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </MarketingSection>

      <PageCta
        actions={
          <>
            <Link className={secondaryButtonClass} href="/students">
              For students
            </Link>
            <Link className={secondaryButtonClass} href="/partners">
              For partners
            </Link>
          </>
        }
        description="See how the public website connects discovery and program information with the private FP Dashboard workflows."
        eyebrow="Choose your path"
        title="Explore Future Physicians from the work you want to do."
      />
    </>
  );
}
