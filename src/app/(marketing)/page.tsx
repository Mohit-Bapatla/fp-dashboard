import {
  ArrowRight,
  BadgeCheck,
  Check,
  ClipboardList,
  ExternalLink,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  MapPin,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

import { DashboardEntryButton } from "@/components/marketing/dashboard-entry-button";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { FaqList } from "@/components/marketing/faq-list";
import {
  MarketingContainer,
  SectionHeading,
  primaryButtonClass,
  secondaryButtonClass,
  textLinkClass,
} from "@/components/marketing/page-shell";
import { PublicOpportunityCard } from "@/components/opportunities/public-opportunity-card";
import { getMarketingViewer } from "@/lib/auth/marketing-viewer";
import { getFeaturedPublicOpportunities } from "@/lib/public/opportunities";
import { createPublicMetadata } from "@/lib/public-metadata";
import { allFaqItems, grants, seminar, siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

const description =
  "Discover verified internships, research, shadowing, volunteering, and events matched to your interests—and keep everything organized in one dashboard.";

export const metadata = createPublicMetadata({
  description,
  path: "/",
  socialTitle: "Future Physicians | Build your path into healthcare",
  title: "Build your path into healthcare",
});

const productBenefits = [
  {
    icon: Sparkles,
    title: "Personalized recommendations",
    description:
      "Rank opportunities using education level, location, interests, experience, published eligibility, and preferences.",
  },
  {
    icon: UserRoundCheck,
    title: "One reusable profile",
    description:
      "Keep education, experience, interests, availability, common information, and documents ready for your next application.",
  },
  {
    icon: ClipboardList,
    title: "Application workspace",
    description:
      "Save opportunities, track deadlines and status, store notes, manage materials, and see the next required step.",
  },
  {
    icon: ShieldCheck,
    title: "Verified information",
    description:
      "FP reviews sources, deadlines, eligibility, application paths, and publication status before students see a listing.",
  },
] as const;

const howItWorks = [
  {
    title: "Build your profile",
    description:
      "Add your interests, goals, location, availability, education level, and experience once.",
  },
  {
    title: "Find the right opportunities",
    description:
      "Browse verified listings, filter the directory, and see eligibility-aware recommendations in your dashboard.",
  },
  {
    title: "Apply and stay organized",
    description:
      "Use the correct FP, partner-site, introduction, interest, or waitlist path—and track progress in one place.",
  },
] as const;

export default async function HomePage() {
  const [viewer, opportunityResult] = await Promise.all([
    getMarketingViewer(),
    getFeaturedPublicOpportunities(6).then(
      (opportunities) => ({ opportunities, opportunityLoadFailed: false }),
      () => ({
        opportunities: [] as Awaited<
          ReturnType<typeof getFeaturedPublicOpportunities>
        >,
        opportunityLoadFailed: true,
      }),
    ),
  ]);
  const viewerRole = viewer.role;
  const { opportunities, opportunityLoadFailed } = opportunityResult;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    sameAs: [
      siteConfig.links.instagram,
      siteConfig.links.tiktok,
      siteConfig.links.linkedin,
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: siteConfig.emails.support,
      },
      {
        "@type": "ContactPoint",
        contactType: "partnerships",
        email: siteConfig.emails.partnerships,
      },
    ],
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        type="application/ld+json"
      />

      <section className="relative overflow-hidden border-b border-border bg-[linear-gradient(180deg,#ffffff_0%,#f2f7ff_100%)] py-14 sm:py-20 lg:py-24">
        <div
          aria-hidden="true"
          className="pathway-grid absolute inset-0 opacity-65"
        />
        <MarketingContainer className="relative grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
              <BadgeCheck aria-hidden="true" className="size-4" />
              Healthcare opportunities, organized around you
            </div>
            <h1 className="mt-6 text-balance text-[2.65rem] font-semibold leading-[1.03] tracking-[-0.055em] text-brand-navy sm:text-6xl lg:text-[4rem]">
              Build your path into healthcare.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
              Discover verified internships, research, shadowing, volunteering,
              and events matched to your interests—and keep everything organized
              in one dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <DashboardEntryButton className="sm:min-w-48" />
              <Link className={secondaryButtonClass} href="/opportunities">
                Explore Opportunities
                <Search aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
              {[
                "Free for students",
                "Verified opportunities",
                "One reusable profile",
              ].map((item) => (
                <span className="inline-flex items-center gap-1.5" key={item}>
                  <Check
                    aria-hidden="true"
                    className="size-3.5 text-secondary"
                  />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <DashboardPreview />
        </MarketingContainer>
      </section>

      <section
        aria-label={`${seminar.title} impact snapshot`}
        className="border-b border-border bg-white"
      >
        <MarketingContainer className="py-3">
          <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            {seminar.metrics.slice(0, 4).map((metric) => (
              <Link
                className="group px-4 py-5 first:pl-0 last:pr-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/impact"
                key={metric.label}
              >
                <span className="block text-2xl font-semibold tracking-[-0.03em] text-brand-navy group-hover:text-primary">
                  {metric.value}
                </span>
                <span className="mt-1 block text-xs font-medium leading-5 text-muted-foreground">
                  {metric.label}
                </span>
              </Link>
            ))}
          </div>
          <p className="border-t border-border px-1 py-3 text-xs leading-5 text-muted-foreground">
            These figures apply only to the completed seminar and are reported
            as of{" "}
            <time dateTime={seminar.metricsAsOf.isoDate}>
              {seminar.metricsAsOf.date}
            </time>
            . Organization-wide totals are withheld pending dated source
            approval.{" "}
            <Link
              className="font-semibold text-primary underline underline-offset-4"
              href="/impact"
            >
              Review definitions and limitations.
            </Link>
          </p>
        </MarketingContainer>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <MarketingContainer className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="A working platform"
              title="One profile. Better opportunities."
              description="Public pages help you understand what is available. Your private dashboard turns discovery into a practical, personalized workflow."
            />
            <Link className={`${textLinkClass} mt-6`} href="/students">
              See the student experience
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {productBenefits.map((benefit, index) => (
              <article
                className={`rounded-2xl border p-6 ${index === 0 ? "border-primary/20 bg-blue-surface" : "border-border bg-background"}`}
                key={benefit.title}
              >
                <div className="grid size-11 place-items-center rounded-xl bg-white text-primary shadow-sm">
                  <benefit.icon aria-hidden="true" className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-brand-navy">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </MarketingContainer>
      </section>

      <section className="border-y border-border bg-page py-16 sm:py-24">
        <MarketingContainer>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="Explore now"
              title="Current verified opportunities"
              description="The same publication, verification, deadline, and availability rules power both this preview and the student dashboard."
            />
            <Link className={secondaryButtonClass} href="/opportunities">
              View all opportunities
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          {opportunityLoadFailed ? (
            <div className="mt-10 rounded-2xl border border-error/20 bg-error/5 p-6 text-sm text-brand-navy">
              The opportunity directory is temporarily unavailable. Please try
              again shortly or open the dashboard if you already have an
              account.
            </div>
          ) : opportunities.length > 0 ? (
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {opportunities.map((opportunity) => (
                <PublicOpportunityCard
                  compact
                  key={opportunity.id}
                  opportunity={opportunity}
                  viewerRole={viewerRole}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-border bg-white p-8 text-center">
              <Search
                aria-hidden="true"
                className="mx-auto size-6 text-primary"
              />
              <h3 className="mt-4 text-lg font-semibold text-brand-navy">
                No public listings are open right now
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                FP shows only published, verified, currently available
                opportunities. Create a profile to be ready when new listings
                open.
              </p>
              <DashboardEntryButton className="mt-5" />
            </div>
          )}
        </MarketingContainer>
      </section>

      <section className="bg-white py-16 sm:py-24" id="how-it-works">
        <MarketingContainer>
          <SectionHeading
            align="center"
            eyebrow="How FP works"
            title="From discovery to your next step"
            description="A clear path for multiple application methods—without promising acceptance, interviews, partner response, or placement."
          />
          <div className="relative mt-12">
            <div
              aria-hidden="true"
              className="absolute left-[16.5%] right-[16.5%] top-7 hidden border-t border-dashed border-primary/30 lg:block"
            />
            <ol className="grid gap-5 lg:grid-cols-3">
              {howItWorks.map((step, index) => (
                <li
                  className="relative rounded-2xl border border-border bg-background p-6 text-center"
                  key={step.title}
                >
                  <span className="relative mx-auto grid size-14 place-items-center rounded-full border-4 border-white bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20">
                    0{index + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-brand-navy">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </MarketingContainer>
      </section>

      <section className="border-y border-border bg-page py-16 sm:py-24">
        <MarketingContainer className="grid gap-5 lg:grid-cols-2">
          <article className="relative overflow-hidden rounded-3xl border border-primary/15 bg-[linear-gradient(145deg,#ebf3ff_0%,#ffffff_75%)] p-7 sm:p-9">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-12 size-48 rounded-full bg-primary/10 blur-2xl"
            />
            <Users
              aria-hidden="true"
              className="relative size-7 text-primary"
            />
            <h2 className="relative mt-5 max-w-lg text-3xl font-semibold tracking-[-0.035em] text-brand-navy">
              Stop searching across dozens of websites.
            </h2>
            <ul className="relative mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                "Personalized opportunities",
                "Verified eligibility details",
                "Application tracking",
                "Saved documents",
                "Reusable profile",
                "Events and chapters",
              ].map((item) => (
                <li className="flex items-center gap-2" key={item}>
                  <Check aria-hidden="true" className="size-4 text-secondary" />
                  {item}
                </li>
              ))}
            </ul>
            <DashboardEntryButton className="relative mt-7" />
          </article>
          <article className="relative overflow-hidden rounded-3xl border border-secondary/20 bg-[linear-gradient(145deg,#eafaf8_0%,#ffffff_75%)] p-7 sm:p-9">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-12 size-48 rounded-full bg-secondary/10 blur-2xl"
            />
            <HeartHandshake
              aria-hidden="true"
              className="relative size-7 text-secondary"
            />
            <h2 className="relative mt-5 max-w-lg text-3xl font-semibold tracking-[-0.035em] text-brand-navy">
              Reach qualified students without scattered forms and spreadsheets.
            </h2>
            <ul className="relative mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                "Configure eligibility",
                "Manage capacity",
                "Review authorized profiles",
                "Track applicant status",
                "Coordinate placements",
                "Export outcomes",
              ].map((item) => (
                <li className="flex items-center gap-2" key={item}>
                  <Check aria-hidden="true" className="size-4 text-secondary" />
                  {item}
                </li>
              ))}
            </ul>
            <DashboardEntryButton
              className="relative mt-7"
              intent="partner"
              returnTo="/dashboard/partner"
            />
          </article>
        </MarketingContainer>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <MarketingContainer className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-3xl border border-border bg-brand-navy p-3 shadow-[0_24px_70px_rgba(16,33,58,0.16)]">
            <div className="aspect-video overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(47,111,237,0.75),transparent_38%),linear-gradient(135deg,#12284b,#0b1729)]">
              <iframe
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
                loading="lazy"
                src="https://www.youtube-nocookie.com/embed/6U2EA3O12YY"
                title="Future Physicians Global Healthcare Seminar recording"
              />
            </div>
          </div>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
              <Check aria-hidden="true" className="size-3.5" />
              {seminar.status}
            </span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Featured event · {seminar.date}
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.04em] text-brand-navy sm:text-4xl">
              {seminar.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {seminar.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                className={primaryButtonClass}
                href={siteConfig.links.seminarRecording}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Play aria-hidden="true" className="size-4" />
                Watch full recording
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
              <Link
                className={secondaryButtonClass}
                href={`/events/${seminar.slug}`}
              >
                View event impact
              </Link>
            </div>
          </div>
        </MarketingContainer>
      </section>

      <section className="border-y border-border bg-page py-16 sm:py-24">
        <MarketingContainer className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-border bg-white p-7 shadow-sm sm:p-9">
            <MapPin aria-hidden="true" className="size-7 text-primary" />
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-brand-navy">
              Bring Future Physicians to your school.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Host healthcare-career events, share verified opportunities, build
              a local student community, and connect with national FP programs.
              Approval, funding, and institutional access are not automatic.
            </p>
            <a
              className={`${primaryButtonClass} mt-7`}
              href={siteConfig.links.chapterApplication}
              rel="noopener noreferrer"
              target="_blank"
            >
              Start or join a chapter
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          </article>
          <article className="rounded-3xl border border-border bg-blue-surface p-7 sm:p-9">
            <FileText aria-hidden="true" className="size-7 text-primary" />
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-brand-navy">
              Measurable access, with definitions.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Community reach, event attendance, partner programs, grants, and
              student stipends are different measures. The impact page defines
              each one and avoids treating modeled value as revenue.
            </p>
            <Link className={`${secondaryButtonClass} mt-7`} href="/impact">
              Read the methodology
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </article>
        </MarketingContainer>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <MarketingContainer>
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <SectionHeading
              eyebrow="Support the mission"
              title="Help expand access to healthcare careers."
              description="Grants, sponsorships, donations, institutional support, and in-kind contributions help FP maintain student programs and opportunity infrastructure."
            />
            <div className="grid gap-3 sm:grid-cols-3" id="grants">
              {grants.map((grant) => (
                <article
                  className="rounded-2xl border border-border bg-background p-5"
                  key={grant.funder}
                >
                  <p className="text-2xl font-semibold tracking-[-0.03em] text-primary">
                    {grant.amount}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-5 text-brand-navy">
                    {grant.funder}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Grant award
                  </p>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className={secondaryButtonClass} href="/support">
              View support details
            </Link>
            <a
              className={primaryButtonClass}
              href={siteConfig.links.donation}
              rel="noopener noreferrer"
              target="_blank"
            >
              Donate securely
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          </div>
        </MarketingContainer>
      </section>

      <section className="border-t border-border bg-page py-16 sm:py-24">
        <MarketingContainer>
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <SectionHeading
                eyebrow="Questions, answered"
                title="Start with the honest version."
                description="Recommendations help you prioritize, but eligibility and outcomes remain with each program and reviewer."
              />
              <Link className={`${textLinkClass} mt-6`} href="/faq">
                Browse every FAQ{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <FaqList items={allFaqItems.slice(0, 7)} />
          </div>
        </MarketingContainer>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <MarketingContainer>
          <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-[linear-gradient(120deg,#eaf2ff_0%,#ffffff_68%,#eafaf8_100%)] px-6 py-12 text-center sm:px-10 sm:py-16">
            <div
              aria-hidden="true"
              className="pathway-grid absolute inset-0 opacity-40"
            />
            <LayoutDashboard
              aria-hidden="true"
              className="relative mx-auto size-8 text-primary"
            />
            <h2 className="relative mx-auto mt-5 max-w-3xl text-balance text-3xl font-semibold tracking-[-0.04em] text-brand-navy sm:text-5xl">
              Your next healthcare opportunity could already be here.
            </h2>
            <p className="relative mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Create one profile, browse verified listings, and keep every
              application path organized.
            </p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <DashboardEntryButton />
              <Link className={secondaryButtonClass} href="/opportunities">
                Explore Opportunities
              </Link>
            </div>
          </div>
        </MarketingContainer>
      </section>
    </>
  );
}
