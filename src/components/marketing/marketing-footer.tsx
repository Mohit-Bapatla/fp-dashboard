import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { siteConfig } from "@/lib/site-config";

import { MarketingContainer, primaryButtonClass } from "./page-shell";

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
    ],
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
          <a
            className={primaryButtonClass}
            href={siteConfig.links.newsletter}
            rel="noopener noreferrer"
            target="_blank"
          >
            Subscribe to the newsletter
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <BrandMark />
            <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
              Helping students discover, apply to, and manage verified
              healthcare opportunities from one profile.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
              <ExternalFooterLink
                href={siteConfig.links.instagram}
                label="Instagram"
              />
              <ExternalFooterLink
                href={siteConfig.links.tiktok}
                label="TikTok"
              />
              <ExternalFooterLink
                href={siteConfig.links.linkedin}
                label="LinkedIn"
              />
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

function ExternalFooterLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      aria-label={`${label} (opens in a new tab)`}
      className="inline-flex items-center gap-1 rounded text-brand-navy hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {label}
      <ArrowUpRight aria-hidden="true" className="size-3.5" />
    </a>
  );
}
