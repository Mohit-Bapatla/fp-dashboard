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
        description="Important rules and limitations for the website, opportunity directory, and FP Dashboard. Last reviewed July 19, 2026."
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
              <LegalSection title="Student age and authority">
                The student dashboard is not intended for children under 13. A
                student creating a profile must confirm they are at least 13. If
                law or a program requires parent or guardian involvement, the
                user is responsible for obtaining it. Organization users must be
                authorized to act for the organization they select.
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
              <LegalSection title="Third-party services and links">
                External application portals, host organizations, fiscal sponsor
                services, and other linked websites operate under their own
                terms and privacy practices. A listing or link is not an
                endorsement, partnership, or guarantee unless FP expressly says
                otherwise.
              </LegalSection>
              <LegalSection title="Uploaded materials">
                Users must have permission to submit the content they upload and
                must not upload malware, unlawful material, or information they
                are not authorized to share. Resume parsing and other automated
                assistance can be inaccurate and requires user review.
              </LegalSection>
              <LegalSection title="Availability and changes">
                FP may correct, suspend, or remove content and access to protect
                users and service integrity. Beta functionality may change or be
                unavailable. These terms do not create a promise of
                uninterrupted service or a particular program outcome.
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
              but are not a complete legal agreement. Draft for review — not
              legal advice and not attorney approved. Counsel should review
              eligibility, minors, liability, intellectual property, third-party
              links, governing law, and dispute provisions.
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
