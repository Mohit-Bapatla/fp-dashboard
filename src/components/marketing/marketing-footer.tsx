import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { siteConfig } from "@/lib/site-config";

import { MarketingContainer } from "./page-shell";
import { SocialIcon } from "./social-icons";
import { SubstackNewsletterLink } from "./substack-newsletter-link";

const footerGroups = [
  {
    title: "Explore",
    links: [
      { href: "/opportunities", label: "Opportunities" },
      { href: "/events", label: "Events" },
      { href: "/students", label: "For Students" },
    ],
  },
  {
    title: "Get involved",
    links: [
      { href: "/partners", label: "Partners" },
      { href: "/chapters", label: "Chapters" },
      { href: "/support", label: "Support Us" },
    ],
  },
  {
    title: "Organization",
    links: [
      { href: "/about", label: "About" },
      { href: "/impact", label: "Impact" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-in", label: "Sign In" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/accessibility", label: "Accessibility" },
      { href: "/data-deletion", label: "Data requests" },
    ],
  },
] as const;

const socialLinks = [
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

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <MarketingContainer className="py-12 sm:py-16">
        <div className="grid gap-10 rounded-3xl border border-border bg-[linear-gradient(135deg,#ebf3ff_0%,#ffffff_65%)] p-6 sm:p-9 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Stay connected
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-brand-navy sm:text-3xl">
              New opportunities, events, and FP updates.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Get practical healthcare-career updates without sharing private
              profile or application details.
            </p>
          </div>
          <SubstackNewsletterLink className="lg:justify-self-end" />
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <BrandMark />
            <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
              Helping students discover, apply to, and manage verified
              healthcare opportunities from one profile.
            </p>
            <p className="mt-4 max-w-sm text-xs leading-5 text-muted-foreground">
              {siteConfig.fiscalSponsor.relationship}
            </p>
            <div
              aria-label="Future Physicians social channels"
              className="mt-5 flex flex-wrap gap-3"
              role="group"
            >
              {socialLinks.map((socialLink) => (
                <a
                  aria-label={socialLink.ariaLabel}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-white text-brand-navy shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-blue-surface hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  data-social-link={socialLink.platform}
                  href={socialLink.href}
                  key={socialLink.platform}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <SocialIcon
                    className="size-[22px]"
                    platform={socialLink.platform}
                  />
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-semibold text-brand-navy">
                  {group.title}
                </h2>
                <ul className="mt-4 space-y-3">
                  {group.links.map((item) => (
                    <li key={item.href}>
                      <Link
                        className="rounded text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        href={item.href}
                        prefetch={
                          item.href.startsWith("/dashboard") ? false : undefined
                        }
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Future Physicians. All rights reserved.
          </p>
          <p>
            Opportunity details can change. Always review the official source
            before applying.
          </p>
        </div>
      </MarketingContainer>
    </footer>
  );
}
