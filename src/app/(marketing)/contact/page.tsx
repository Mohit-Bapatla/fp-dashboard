import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  Mail,
  MessageCircleQuestion,
} from "lucide-react";

import {
  emailLinkClass,
  PageHero,
  SectionHeading,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/marketing/page-shell";
import {
  MarketingSection,
  PageCta,
} from "@/components/marketing/supporting-page-sections";
import { SocialIcon } from "@/components/marketing/social-icons";
import { SubstackNewsletterLink } from "@/components/marketing/substack-newsletter-link";
import { createPublicMetadata } from "@/lib/public-metadata";
import { siteConfig } from "@/lib/site-config";

const description =
  "Contact Future Physicians for account and opportunity support, healthcare or education partnerships, grants, sponsorships, donations, and funding questions.";

const socialChannels = [
  {
    ariaLabel: "Follow Future Physicians on Instagram",
    href: siteConfig.links.instagram,
    platform: "instagram",
  },
  {
    ariaLabel: "Follow Future Physicians on TikTok",
    href: siteConfig.links.tiktok,
    platform: "tiktok",
  },
  {
    ariaLabel: "Follow Future Physicians on LinkedIn",
    href: siteConfig.links.linkedin,
    platform: "linkedin",
  },
] as const;

export const metadata = createPublicMetadata({
  description,
  path: "/contact",
  title: "Contact",
});

const contactRoutes = [
  {
    id: siteConfig.contact.generalSupport.id,
    title: "General Support",
    email: siteConfig.emails.support,
    href: siteConfig.mailto.support,
    description: "Account, application, opportunity, or general questions.",
    icon: MessageCircleQuestion,
  },
  {
    id: siteConfig.contact.partnerships.id,
    title: "Partnerships",
    email: siteConfig.emails.partnerships,
    href: siteConfig.mailto.partnerships,
    description:
      "Hospitals, clinics, laboratories, universities, schools, nonprofits, and program collaborations.",
    icon: Building2,
  },
  {
    id: siteConfig.contact.fundraising.id,
    title: "Fundraising",
    email: siteConfig.emails.fundraising,
    href: siteConfig.mailto.fundraising,
    description: "Grants, sponsorships, donations, and funding opportunities.",
    icon: CircleDollarSign,
  },
] as const;

export default function ContactPage() {
  return (
    <>
      <PageHero
        actions={
          <>
            <a
              className={primaryButtonClass}
              href={`#${siteConfig.contact.generalSupport.id}`}
            >
              Email general support
              <Mail aria-hidden="true" className="size-4" />
            </a>
            <Link className={secondaryButtonClass} href="/faq">
              Read the FAQ
            </Link>
          </>
        }
        description={description}
        eyebrow="Contact Future Physicians"
        title="Start with the team closest to your question."
      />

      <MarketingSection>
        <SectionHeading
          description="Using the right address helps route your message without asking you to put private profile or application details in a public form."
          eyebrow="Three inquiry paths"
          title="Choose the category that best matches your request."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {contactRoutes.map(
            ({
              description: routeDescription,
              email,
              href,
              id,
              icon: Icon,
              title,
            }) => (
              <article
                className="flex h-full scroll-mt-28 flex-col rounded-3xl border border-border bg-white p-5 shadow-[0_14px_40px_rgba(16,33,58,0.07)] transition-[border-color,box-shadow,background-color] target:border-primary/50 target:bg-blue-surface/20 target:ring-4 target:ring-primary/10 sm:p-7"
                id={id}
                key={title}
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-surface text-primary">
                  <Icon aria-hidden="true" className="size-6" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-brand-navy">
                  {title}
                </h2>
                <p className="mt-3 flex-1 text-base leading-7 text-muted-foreground">
                  {routeDescription}
                </p>
                <a className={`${emailLinkClass} mt-6`} href={href}>
                  {email}
                  <ArrowRight
                    aria-hidden="true"
                    className="ml-2 inline size-4 shrink-0 align-middle"
                  />
                </a>
              </article>
            ),
          )}
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHeading
              description="A little context helps FP understand the request while keeping sensitive information in the appropriate authenticated workflow."
              eyebrow="What to include"
              title="Send enough detail to route the question safely."
            />
            <ul className="mt-7 space-y-3 text-sm leading-6 text-muted-foreground sm:text-base">
              <li>
                • The category of your request and the relevant page or program
              </li>
              <li>
                • Your organization and proposed collaboration, when applicable
              </li>
              <li>
                • The opportunity title or link when reporting inaccurate public
                information
              </li>
              <li>
                • A concise description of the issue—without unnecessary
                documents or private data
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-amber-300/70 bg-amber-50 p-7 sm:p-8">
            <h2 className="text-xl font-semibold text-amber-950">
              Protect private information
            </h2>
            <p className="mt-3 text-sm leading-6 text-amber-900/85 sm:text-base">
              Do not email passwords, full identification documents, private
              student records, or application materials unless an authorized FP
              workflow specifically requests them. Signed-in students can report
              opportunity issues from the relevant workspace when that action is
              available.
            </p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection>
        <SectionHeading
          description="Follow public updates without sharing private profile or application information."
          eyebrow="Stay connected"
          title="News, events, and public social channels."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-brand-navy">Newsletter</h2>
            <SubstackNewsletterLink className="mt-3" />
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-brand-navy">
              Public social channels
            </h2>
            <div
              aria-label="Future Physicians public social channels"
              className="mt-3 flex flex-wrap gap-3"
              role="group"
            >
              {socialChannels.map((channel) => (
                <a
                  aria-label={channel.ariaLabel}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-white text-brand-navy shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-blue-surface hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  data-social-link={channel.platform}
                  href={channel.href}
                  key={channel.platform}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <SocialIcon
                    className="size-[22px]"
                    platform={channel.platform}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </MarketingSection>

      <PageCta
        actions={<SubstackNewsletterLink />}
        description="The newsletter is the best route for public opportunity, event, and organization updates."
        eyebrow="Prefer updates to an inquiry?"
        title="Stay informed through the newsletter."
      />
    </>
  );
}
