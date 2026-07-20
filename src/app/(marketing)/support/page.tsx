import {
  ArrowRight,
  Boxes,
  Building2,
  Gift,
  GraduationCap,
  HandHeart,
  Landmark,
  Mail,
  MonitorSmartphone,
  PackageOpen,
  Users,
} from "lucide-react";
import Link from "next/link";

import {
  emailLinkClass,
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
import { siteConfig } from "@/lib/site-config";

const description =
  "Support Future Physicians through grants, sponsorships, donations, institutional collaboration, program support, or in-kind contributions.";

export const metadata = createPublicMetadata({
  description,
  path: "/support",
  socialTitle: "Support Future Physicians",
  title: "Support Us",
});

const supportWays = [
  [
    "Grants",
    "Support organizational or program capacity through an appropriate funding opportunity.",
    Landmark,
  ],
  [
    "Corporate sponsorship",
    "Discuss a clearly labeled sponsorship aligned with student access or programming.",
    Building2,
  ],
  [
    "Institutional partnership",
    "Explore a program, opportunity, education, or infrastructure collaboration.",
    Users,
  ],
  [
    "Event or program support",
    "Help make a defined event or student program possible without implying broader partnership.",
    GraduationCap,
  ],
  [
    "In-kind support",
    "Offer useful goods, services, expertise, space, or technology that FP can responsibly use.",
    PackageOpen,
  ],
  ["Donations", "Contribute through the approved public donation route.", Gift],
] as const;

const enabledWork = [
  "Student programming",
  "Events",
  "Technology",
  "Chapter resources",
  "Opportunity development",
  "Outreach",
  "Participation support when applicable",
  "Program operations",
] as const;

export default function SupportPage() {
  return (
    <>
      <PageHero
        actions={
          <>
            <a
              className={primaryButtonClass}
              href={siteConfig.links.donation}
              rel="noopener noreferrer"
              target="_blank"
            >
              Donate
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
            <Link
              className={secondaryButtonClass}
              href={siteConfig.contact.fundraising.href}
            >
              Discuss funding
              <Mail aria-hidden="true" className="size-4" />
            </Link>
          </>
        }
        description="Grants, sponsorships, donations, institutional support, and in-kind contributions help Future Physicians create and maintain student programs and opportunity infrastructure."
        eyebrow="Support Future Physicians"
        title="Help expand access to healthcare careers."
      />

      <MarketingSection>
        <SectionHeading
          description="Choose the relationship that matches what you want to contribute. FP keeps funders, sponsors, partners, event recognition, and event promotion as separate categories."
          eyebrow="Ways to support"
          title="More than one kind of contribution can move the work forward."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {supportWays.map(([title, copy, Icon]) => (
            <FeatureCard
              icon={<Icon aria-hidden="true" className="size-5" />}
              key={title}
              title={title}
            >
              {copy}
            </FeatureCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <SectionHeading
              description="Support helps sustain the work around student access. Exact uses depend on the contribution, approved budget, and any documented restrictions."
              eyebrow="What support enables"
              title="Practical capacity across programs and infrastructure."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {enabledWork.map((item, index) => (
              <div
                className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm"
                key={item}
              >
                {index % 2 === 0 ? (
                  <MonitorSmartphone
                    aria-hidden="true"
                    className="size-5 shrink-0 text-primary"
                  />
                ) : (
                  <Boxes
                    aria-hidden="true"
                    className="size-5 shrink-0 text-teal-600"
                  />
                )}
                <p className="text-sm font-semibold text-brand-navy">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection id="grants">
        <SectionHeading
          description="Funding relationships are described according to their actual role. A grant, sponsorship, fiscal sponsor, host organization, or event supporter is not automatically an FP program partner."
          title="Funding disclosures"
        />
        <article className="mt-10 max-w-3xl rounded-3xl border border-border bg-white p-7 shadow-[0_14px_40px_rgba(16,33,58,0.07)]">
          <Landmark aria-hidden="true" className="size-7 text-primary" />
          <h2 className="mt-5 text-2xl font-semibold text-brand-navy">
            Fiscal sponsorship
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {siteConfig.fiscalSponsor.relationship}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {siteConfig.fiscalSponsor.donationNotice}
          </p>
          <a
            className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="https://hcb.hackclub.com/branding"
            rel="noopener noreferrer"
            target="_blank"
          >
            Review HCB fiscal-sponsorship information
          </a>
        </article>
      </MarketingSection>

      <MarketingSection id="donate" tone="blue">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8">
            <HandHeart aria-hidden="true" className="size-7 text-primary" />
            <h2 className="mt-5 text-2xl font-semibold text-brand-navy">
              Funding and donations
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              For grants, sponsorships, donations, and funding opportunities,
              email{" "}
              <a
                className={emailLinkClass}
                href={siteConfig.mailto.fundraising}
              >
                {siteConfig.emails.fundraising}
              </a>
              .
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8">
            <Building2 aria-hidden="true" className="size-7 text-primary" />
            <h2 className="mt-5 text-2xl font-semibold text-brand-navy">
              Program partnerships
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              For healthcare, education, community, or opportunity
              collaboration, email{" "}
              <a
                className={emailLinkClass}
                href={siteConfig.mailto.partnerships}
              >
                {siteConfig.emails.partnerships}
              </a>
              .
            </p>
          </div>
        </div>
      </MarketingSection>

      <PageCta
        actions={
          <>
            <a
              className={secondaryButtonClass}
              href={siteConfig.links.donation}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open the donation page
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
            <Link
              className={`${secondaryButtonClass} px-2 sm:px-5`}
              href={siteConfig.contact.fundraising.href}
            >
              Discuss funding
            </Link>
          </>
        }
        description="Use the approved donation route, or contact the fundraising team to discuss a grant, sponsorship, or other form of support."
        eyebrow="Support with clarity"
        title="Choose a contribution path that fits."
      />
    </>
  );
}
