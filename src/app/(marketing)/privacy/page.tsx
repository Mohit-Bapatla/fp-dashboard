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
    "Privacy information for the Future Physicians website and FP Dashboard.",
  path: "/privacy",
  title: "Privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy"
        title="Privacy information"
        description="How the current FP Dashboard handles student profiles, applications, documents, partner access, and account data during beta."
      />
      <MarketingContainer className="py-14 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <article className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-7 text-sm leading-7 text-muted-foreground">
              <LegalSection title="Information used by the platform">
                Future Physicians uses the FP Dashboard to manage account
                details, student profiles, application materials, opportunity
                activity, partner records, and program operations.
                Authentication is provided through Clerk, and optional error
                monitoring may be provided through the application&apos;s
                configured Sentry integration.
              </LegalSection>
              <LegalSection title="Student and partner visibility">
                Student profiles are not public pages. Partner access is limited
                by role, organization membership, and the application or
                opportunity context authorized by the platform. Public
                opportunity pages do not expose student information or internal
                review notes.
              </LegalSection>
              <LegalSection title="Documents and external applications">
                Students should upload documents only through approved dashboard
                workflows. Some applications leave FP for an organization&apos;s
                official portal; that organization&apos;s privacy terms then
                also apply.
              </LegalSection>
              <LegalSection title="Questions and requests">
                Privacy, correction, access, or deletion questions can be sent
                to{" "}
                <a
                  className="font-semibold text-primary underline underline-offset-4"
                  href={`mailto:${siteConfig.emails.support}`}
                >
                  {siteConfig.emails.support}
                </a>
                . The team may need to verify a requester before acting on
                account data.
              </LegalSection>
            </div>
          </article>
          <aside className="h-fit rounded-2xl border border-warning/25 bg-accent-warm/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-warning">
              Human review required
            </p>
            <p className="mt-3 text-sm leading-6 text-brand-navy">
              This beta privacy summary is not a substitute for a
              counsel-reviewed privacy policy. It must be reviewed against
              actual data retention, vendors, consent requirements, and
              jurisdictional obligations before launch.
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
