import Link from "next/link";
import {
  BarChart3,
  Building2,
  FileUp,
  ListChecks,
  LockKeyhole,
  Mail,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { FaqList } from "@/components/marketing/faq-list";
import {
  emailLinkClass,
  PageHero,
  SectionHeading,
  primaryButtonClass,
  secondaryButtonClass,
  textLinkClass,
} from "@/components/marketing/page-shell";
import {
  FeatureCard,
  LimitationNote,
  MarketingSection,
  NumberedStep,
  PageCta,
} from "@/components/marketing/supporting-page-sections";
import { createPublicMetadata } from "@/lib/public-metadata";
import { faqGroups, siteConfig } from "@/lib/site-config";

const description =
  "Hospitals, clinics, universities, research programs, schools, and community organizations can contact Future Physicians to discuss an approved partnership.";

export const metadata = createPublicMetadata({
  description,
  path: "/partners",
  title: "For Partners",
});

const partnerAudiences = [
  "Hospitals",
  "Clinics",
  "Research laboratories",
  "Universities and medical schools",
  "Schools",
  "Nonprofits",
  "Community organizations",
  "Healthcare associations",
  "Workforce programs",
] as const;

export default function PartnersPage() {
  return (
    <>
      <PageHero
        actions={
          <>
            <a
              className={primaryButtonClass}
              href={siteConfig.mailto.partnerships}
            >
              Contact Our Outreach Team
              <Mail aria-hidden="true" className="size-4" />
            </a>
            <Link
              className={secondaryButtonClass}
              href="/sign-in?redirect_url=%2Fdashboard%2Fpartner"
            >
              Already an approved partner? Sign in
            </Link>
          </>
        }
        description={description}
        eyebrow="For healthcare and education partners"
        title="Work with Future Physicians to reach students."
      />

      <MarketingSection>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <SectionHeading
              description="Bring opportunity details, applicant review, status updates, placements, and outcome reporting into a shared workflow."
              eyebrow="Partner workspace"
              title="A clearer operating view for student programs."
            />
            <p className="mt-6 text-sm leading-6 text-muted-foreground">
              The preview is illustrative and contains no real organization,
              applicant, placement, or performance data.
            </p>
          </div>
          <figure className="overflow-hidden rounded-3xl border border-border bg-brand-navy p-2 shadow-[0_24px_60px_rgba(16,33,58,0.18)]">
            <figcaption className="sr-only">
              Illustrative partner dashboard preview
            </figcaption>
            <div className="rounded-[1.25rem] bg-slate-50 p-4 sm:p-6">
              <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Partner dashboard preview
                  </p>
                  <p className="mt-1 text-xl font-semibold text-brand-navy">
                    Program workspace
                  </p>
                </div>
                <span className="w-fit rounded-full border border-primary/20 bg-blue-surface px-3 py-1 text-xs font-semibold text-primary">
                  Illustrative interface
                </span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  ["Opportunity", "Published"],
                  ["Applicant review", "In progress"],
                  ["Outcome report", "Not started"],
                ].map(([label, value]) => (
                  <div
                    className="rounded-2xl border border-border bg-white p-4"
                    key={label}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-brand-navy">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-border bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-brand-navy">
                    Applicant pipeline
                  </p>
                  <span className="text-xs text-muted-foreground">
                    Example stages
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  {["Submitted", "In review", "Decision", "Placed"].map(
                    (stage, index) => (
                      <div
                        className="rounded-xl bg-blue-surface/70 p-3"
                        key={stage}
                      >
                        <span className="text-xs font-semibold text-primary">
                          0{index + 1}
                        </span>
                        <p className="mt-1 text-xs font-medium text-brand-navy">
                          {stage}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </figure>
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <SectionHeading
          description="Use structured information to reduce rework while preserving human review and program-specific decisions."
          eyebrow="From listing to outcome"
          title="A consistent workflow without a one-size-fits-all program."
        />
        <ol className="mt-10 grid gap-x-8 lg:grid-cols-2">
          <NumberedStep number={1} title="Create or coordinate an import">
            Enter opportunity details in a structured form. When an import path
            is supported, coordinate with FP rather than rebuilding every record
            by hand.
          </NumberedStep>
          <NumberedStep number={2} title="Set eligibility, dates, and capacity">
            Define the education levels, locations, experience, schedule,
            deadlines, and available space that actually govern the program.
          </NumberedStep>
          <NumberedStep
            number={3}
            title="Review authorized applicant information"
          >
            Compare consistent student information within the relevant
            application context. Access does not extend to the unrestricted
            student directory.
          </NumberedStep>
          <NumberedStep number={4} title="Manage decisions and placements">
            Keep statuses, communications, placement progress, and next actions
            visible to the people responsible for the workflow.
          </NumberedStep>
          <NumberedStep number={5} title="Share updates">
            Communicate supported changes and next steps through the program
            workflow while keeping sensitive details scoped to authorized users.
          </NumberedStep>
          <NumberedStep number={6} title="Report outcomes">
            Use available analytics or exports to understand activity and
            outcomes without treating an application, connection, or placement
            as the same measure.
          </NumberedStep>
        </ol>
      </MarketingSection>

      <MarketingSection>
        <SectionHeading
          description="Future Physicians works with organizations that can provide accurate, responsible healthcare-career experiences or program collaborations."
          eyebrow="Who can inquire"
          title="Built for healthcare, education, and community programs."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          {partnerAudiences.map((audience) => (
            <span
              className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm"
              key={audience}
            >
              {audience}
            </span>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <SectionHeading
          description="The platform supports the work around a program; it does not replace your organization’s decisions, safeguards, or responsibilities."
          eyebrow="Operational value"
          title="Less coordination overhead, more process clarity."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <FeatureCard
            icon={<FileUp aria-hidden="true" className="size-5" />}
            title="Structured listings"
          >
            Keep eligibility, dates, capacity, location, and application methods
            in consistent fields.
          </FeatureCard>
          <FeatureCard
            icon={<SlidersHorizontal aria-hidden="true" className="size-5" />}
            title="Eligibility configuration"
          >
            Make requirements clear enough for students to self-review and for
            FP to support relevant discovery.
          </FeatureCard>
          <FeatureCard
            icon={<Users aria-hidden="true" className="size-5" />}
            title="Applicant review"
          >
            Work from consistent application information within the
            organization’s authorized scope.
          </FeatureCard>
          <FeatureCard
            icon={<ListChecks aria-hidden="true" className="size-5" />}
            title="Status management"
          >
            Keep applicant decisions, waitlists, next steps, and placements
            distinct and current.
          </FeatureCard>
          <FeatureCard
            icon={<MessageSquare aria-hidden="true" className="size-5" />}
            title="Supported communication"
          >
            Send or coordinate updates without exposing private profile
            information outside the workflow.
          </FeatureCard>
          <FeatureCard
            icon={<BarChart3 aria-hidden="true" className="size-5" />}
            title="Outcome reporting"
          >
            Review available activity and outcome measures with clear
            definitions and appropriate access.
          </FeatureCard>
        </div>
      </MarketingSection>

      <MarketingSection>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-white p-7 shadow-sm sm:p-8">
            <LockKeyhole aria-hidden="true" className="size-7 text-primary" />
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-navy">
              Access follows role and application context.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Partners may see only student information authorized for
              opportunities and workflows they manage. Private profiles are not
              a browsable public directory, and client-side visibility is not
              the only access control.
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-brand-navy">
              <ShieldCheck
                aria-hidden="true"
                className="size-5 text-teal-600"
              />
              Organization and opportunity review precede student publication.
            </div>
          </div>
          <div>
            <LimitationNote title="What a partnership does not promise">
              <ul className="space-y-2">
                <li>• A guaranteed number or quality of applicants</li>
                <li>• Guaranteed program fill, interviews, or placements</li>
                <li>• Automatic verification or publication</li>
                <li>• Unrestricted access to student profiles</li>
              </ul>
            </LimitationNote>
            <div className="mt-5 rounded-2xl border border-border bg-blue-surface/55 p-5">
              <div className="flex items-center gap-2 font-semibold text-brand-navy">
                <Building2 aria-hidden="true" className="size-5 text-primary" />
                Start with a specific program or collaboration.
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Email{" "}
                <a
                  className={emailLinkClass}
                  href={siteConfig.mailto.partnerships}
                >
                  {siteConfig.emails.partnerships}
                </a>{" "}
                with your organization, opportunity type, audience, dates, and
                the support you need.
              </p>
            </div>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <SectionHeading
          eyebrow="Partner FAQ"
          title="Clear boundaries before you begin."
        />
        <div className="mt-8">
          <FaqList items={faqGroups[3].items} />
        </div>
        <div className="mt-6">
          <Link className={textLinkClass} href="/faq">
            Read the full FAQ
          </Link>
        </div>
      </MarketingSection>

      <PageCta
        actions={
          <>
            <a
              className={secondaryButtonClass}
              href={siteConfig.mailto.partnerships}
            >
              Contact Our Outreach Team
              <Mail aria-hidden="true" className="size-4" />
            </a>
            <Link
              className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-blue-100 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
              href="/sign-in?redirect_url=%2Fdashboard%2Fpartner"
            >
              Already approved? Sign in
            </Link>
          </>
        }
        description="Hospitals, clinics, universities, research programs, schools, and community organizations can work with FP to reach students and manage opportunities."
        eyebrow="Partnership inquiries"
        title="Interested in becoming a Future Physicians partner?"
      />
    </>
  );
}
