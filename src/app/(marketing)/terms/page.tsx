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
    "Beta terms and important platform limitations for Future Physicians.",
  path: "/terms",
  title: "Terms of Use",
});

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Terms"
        title="Terms of use"
        description="Important limitations for using the Future Physicians website, opportunity directory, and FP Dashboard during beta."
      />
      <MarketingContainer className="py-14 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <article className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-7 text-sm leading-7 text-muted-foreground">
              <LegalSection title="Platform use">
                The FP Dashboard supports approved student, partner,
                opportunity, and program workflows. Users are responsible for
                providing accurate information and keeping account access
                secure.
              </LegalSection>
              <LegalSection title="Opportunity information">
                Future Physicians reviews public listings, but deadlines,
                eligibility, availability, and third-party links can change.
                Users should confirm requirements with the official source
                before applying.
              </LegalSection>
              <LegalSection title="No guaranteed outcome">
                A recommendation does not guarantee eligibility. An introduction
                does not guarantee a response. An application does not guarantee
                acceptance, interview, placement, compensation, or program
                access.
              </LegalSection>
              <LegalSection title="Human decisions">
                The platform does not make automated acceptance, rejection, or
                placement decisions. Authorized reviewers remain responsible for
                decisions and communications.
              </LegalSection>
              <LegalSection title="Questions">
                Questions about these terms can be sent to{" "}
                <a
                  className="font-semibold text-primary underline underline-offset-4"
                  href={`mailto:${siteConfig.emails.support}`}
                >
                  {siteConfig.emails.support}
                </a>
                .
              </LegalSection>
            </div>
          </article>
          <aside className="h-fit rounded-2xl border border-warning/25 bg-accent-warm/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-warning">
              Human review required
            </p>
            <p className="mt-3 text-sm leading-6 text-brand-navy">
              These beta terms preserve the project&apos;s existing limitations
              but are not a complete legal agreement. Counsel should review
              eligibility, minors, liability, third-party links, and dispute
              provisions before public launch.
            </p>
            <Link
              className={`${secondaryButtonClass} mt-5 w-full`}
              href="/contact"
            >
              Contact FP
            </Link>
          </aside>
        </div>
      </MarketingContainer>
    </>
  );
}

function LegalSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-brand-navy">{title}</h2>
      <p className="mt-2">{children}</p>
    </section>
  );
}
