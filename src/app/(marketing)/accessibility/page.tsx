import Link from "next/link";

import {
  MarketingContainer,
  PageHero,
  secondaryButtonClass,
} from "@/components/marketing/page-shell";
import { createPublicMetadata } from "@/lib/public-metadata";
import { siteConfig } from "@/lib/site-config";

export const metadata = createPublicMetadata({
  description:
    "Future Physicians accessibility goals, known limitations, and support options.",
  path: "/accessibility",
  title: "Accessibility",
});

const reviewDate = "July 19, 2026";

export default function AccessibilityPage() {
  return (
    <>
      <PageHero
        description="Our current accessibility goals, testing approach, known limitations, and ways to request help or an accommodation."
        eyebrow="Accessibility"
        title="Access should not be a barrier."
      />
      <MarketingContainer className="py-14 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <article className="space-y-8 rounded-2xl border border-border bg-white p-6 text-sm leading-7 text-muted-foreground shadow-sm sm:p-8">
            <StatementSection title="Our target">
              Future Physicians aims to meet WCAG 2.2 Level AA across public
              pages and core dashboard workflows. This is an ongoing target, not
              a claim of certification or complete conformance.
            </StatementSection>
            <StatementSection title="How we review access">
              We use keyboard-only checks, automated accessibility scans,
              responsive reflow checks, zoom testing, and selected screen reader
              checks. Automated tools cannot establish conformance on their own,
              and independent expert review remains recommended.
            </StatementSection>
            <StatementSection title="Known limitations">
              Some third-party authentication and external opportunity pages are
              controlled by their providers. Uploaded resumes and other source
              documents may retain inaccessible formatting from the original
              file. Comprehensive VoiceOver and NVDA coverage of every
              authenticated workflow is still in progress.
            </StatementSection>
            <StatementSection title="Help and accommodations">
              If you cannot access a page, application step, document, or
              opportunity, email{" "}
              <a
                className="font-semibold text-primary underline underline-offset-4"
                href={`mailto:${siteConfig.emails.support}?subject=Accessibility%20request`}
              >
                {siteConfig.emails.support}
              </a>
              . Describe the page or task and the format or assistance you need.
              Do not include sensitive health, identity, profile, or resume
              information in the first email.
            </StatementSection>
          </article>
          <aside className="h-fit rounded-2xl border border-border bg-blue-surface/45 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Last reviewed
            </p>
            <p className="mt-3 text-sm font-semibold text-brand-navy">
              {reviewDate}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This statement is a transparent product-status summary. It is not
              an ADA or WCAG certification.
            </p>
            <Link
              className={`${secondaryButtonClass} mt-5 w-full`}
              href="/contact#general-support"
            >
              Contact support
            </Link>
          </aside>
        </div>
      </MarketingContainer>
    </>
  );
}

function StatementSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-brand-navy">{title}</h2>
      <p className="mt-2">{children}</p>
    </section>
  );
}
