import {
  ArrowRight,
  BadgeCheck,
  Building2,
  HandCoins,
  HelpCircle,
  LayoutDashboard,
  LogIn,
  Mail,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { DashboardEntryButton } from "@/components/marketing/dashboard-entry-button";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { FaqList } from "@/components/marketing/faq-list";
import {
  OpportunityDiscoveryPreview,
  OpportunityWalkthrough,
} from "@/components/marketing/opportunity-product-demo";
import {
  MarketingContainer,
  secondaryButtonClass,
  textLinkClass,
} from "@/components/marketing/page-shell";
import { createPublicMetadata } from "@/lib/public-metadata";
import {
  homepageFaqItems,
  organizationMetrics,
  siteConfig,
} from "@/lib/site-config";

const description =
  "Discover verified healthcare opportunities, save what fits, and keep your next steps organized in one place.";

export const metadata = createPublicMetadata({
  description,
  path: "/",
  socialTitle: "Future Physicians | Build your path into healthcare",
  title: "Build your path into healthcare",
});

const metricIcons = [Users, Building2, HandCoins] as const;

export default function HomePage() {
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

      <section className="relative flex min-h-[calc(82svh-4.5rem)] items-center overflow-hidden border-b border-border bg-[linear-gradient(180deg,#ffffff_0%,#eef5ff_100%)] py-16 sm:py-20 lg:py-24">
        <div
          aria-hidden="true"
          className="pathway-grid absolute inset-0 opacity-70"
        />
        <div
          aria-hidden="true"
          className="absolute right-[8%] top-[12%] size-60 rounded-full bg-cyan-300/20 blur-3xl sm:size-96"
        />
        <MarketingContainer className="relative grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/85 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
              <BadgeCheck aria-hidden="true" className="size-4" />
              Healthcare opportunities, organized around you
            </div>
            <h1 className="mt-6 text-balance text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.055em] text-brand-navy sm:text-6xl lg:text-[4.5rem]">
              Build your path into healthcare.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
              {description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <DashboardEntryButton />
              <Link className={secondaryButtonClass} href="/opportunities">
                Explore Opportunities
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <p className="mt-5 text-sm font-medium text-muted-foreground">
              Free for students
              <span aria-hidden="true" className="mx-2 text-secondary">
                •
              </span>
              Verified listings
              <span aria-hidden="true" className="mx-2 text-secondary">
                •
              </span>
              One organized profile
            </p>
          </div>
          <div className="lg:scale-[1.03]">
            <DashboardPreview />
          </div>
        </MarketingContainer>
      </section>

      <section
        aria-label="Future Physicians organization metrics"
        className="border-b border-border bg-white py-12 sm:py-16"
      >
        <MarketingContainer>
          <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {organizationMetrics.map((metric, index) => {
              const MetricIcon = metricIcons[index] ?? Sparkles;
              return (
                <article
                  className="flex gap-4 py-6 first:pt-0 last:pb-0 sm:px-7 sm:py-2 sm:first:pl-0 sm:last:pr-0"
                  key={metric.label}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-surface text-primary">
                    <MetricIcon aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <p className="text-3xl font-semibold tracking-[-0.045em] text-brand-navy sm:text-4xl">
                      {metric.value}
                    </p>
                    <p className="mt-1.5 max-w-xs text-sm font-medium leading-5 text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </MarketingContainer>
      </section>

      <section
        className="relative overflow-hidden bg-[linear-gradient(135deg,#0c2445_0%,#164b94_55%,#087b82_125%)] py-20 sm:py-24 lg:py-28"
        id="opportunity-showcase"
      >
        <div
          aria-hidden="true"
          className="absolute -right-24 top-10 size-96 rounded-full bg-cyan-300/15 blur-3xl"
        />
        <MarketingContainer className="relative grid items-center gap-12 lg:w-[96vw] lg:max-w-[1520px] lg:grid-cols-[minmax(240px,0.3fr)_minmax(0,0.7fr)] lg:gap-10 lg:px-0 xl:gap-12">
          <div className="max-w-lg text-white">
            <Sparkles aria-hidden="true" className="size-8 text-cyan-300" />
            <h2 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Find opportunities that actually fit.
            </h2>
            <p className="mt-5 text-pretty text-lg leading-8 text-blue-100">
              Search verified programs, understand eligibility, and move from
              discovery to application without juggling dozens of websites.
            </p>
            <Link
              className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-950 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950"
              href="/opportunities"
            >
              Explore Opportunities
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <OpportunityDiscoveryPreview />
        </MarketingContainer>
      </section>

      <section
        className="border-y border-indigo-100 bg-[linear-gradient(180deg,#f7f8ff_0%,#eefbff_100%)] py-20 sm:py-24 lg:py-28"
        id="how-it-works"
      >
        <MarketingContainer>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-4xl font-semibold tracking-[-0.045em] text-brand-navy sm:text-5xl">
              From discovery to your next step.
            </h2>
            <p className="mt-5 text-pretty text-lg leading-8 text-muted-foreground">
              Follow one opportunity from the first filter to a saved next
              action in a guided product walkthrough.
            </p>
          </div>
          <div className="mt-12">
            <OpportunityWalkthrough />
          </div>
        </MarketingContainer>
      </section>

      <section
        className="bg-[#fbfaf7] py-20 sm:py-24 lg:py-28"
        id="homepage-faq"
      >
        <MarketingContainer>
          <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:gap-16">
            <div className="max-w-lg">
              <HelpCircle aria-hidden="true" className="size-8 text-primary" />
              <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.045em] text-brand-navy sm:text-5xl">
                Questions before you begin?
              </h2>
              <p className="mt-5 text-pretty text-lg leading-8 text-muted-foreground">
                Get the clear version of eligibility, verification,
                applications, placements, and partnership review.
              </p>
              <Link className={`${textLinkClass} mt-6`} href="/faq">
                Browse every FAQ
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <FaqList items={homepageFaqItems} />
          </div>

          <div className="relative mt-16 overflow-hidden rounded-[2rem] border border-primary/15 bg-[linear-gradient(120deg,#eaf2ff_0%,#ffffff_58%,#e5fbfa_100%)] px-6 py-12 text-center shadow-[0_20px_60px_rgba(16,33,58,0.08)] sm:px-10 sm:py-16">
            <div
              aria-hidden="true"
              className="pathway-grid absolute inset-0 opacity-35"
            />
            <LayoutDashboard
              aria-hidden="true"
              className="relative mx-auto size-8 text-primary"
            />
            <h2 className="relative mx-auto mt-5 max-w-3xl text-balance text-3xl font-semibold tracking-[-0.04em] text-brand-navy sm:text-5xl">
              Keep your next opportunity within reach.
            </h2>
            <p className="relative mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Create one free profile, explore verified listings, and organize
              every application path in the FP Dashboard.
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

      <section
        className="bg-brand-navy py-16 text-white sm:py-20"
        id="partner-inquiry"
      >
        <MarketingContainer className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Interested in becoming a Future Physicians partner?
            </h2>
            <p className="mt-4 text-pretty text-base leading-7 text-blue-100 sm:text-lg">
              Hospitals, clinics, universities, research programs, schools, and
              community organizations can contact our team to discuss
              opportunities for students.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-navy shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
              href={siteConfig.contact.partnerships.href}
            >
              <Mail aria-hidden="true" className="size-4 text-primary" />
              Contact Our Outreach Team
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-blue-100 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              href="/sign-in"
            >
              <LogIn aria-hidden="true" className="size-4" />
              Current partner? Sign in
            </Link>
          </div>
        </MarketingContainer>
      </section>
    </>
  );
}
