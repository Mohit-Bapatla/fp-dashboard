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
        description="How the FP website and Dashboard collect, use, share, protect, retain, and respond to requests about account information. Last reviewed July 19, 2026."
      />
      <MarketingContainer className="py-14 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <article className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-7 text-sm leading-7 text-muted-foreground">
              <LegalSection title="Information used by the platform">
                FP processes account identifiers, profile information,
                opportunity activity, application materials, uploaded resumes,
                notification preferences, support messages, and operational
                security records that users choose to provide or that are needed
                to operate the service. Public pages may collect limited device,
                performance, and request information.
              </LegalSection>
              <LegalSection title="Why information is used">
                Information is used to authenticate users, provide requested
                dashboard features, recommend and track opportunities, support
                applications, communicate service updates, protect the service,
                investigate errors, and comply with applicable obligations. FP
                does not sell student profiles or make them public.
              </LegalSection>
              <LegalSection title="Service providers">
                Current infrastructure may use Clerk for authentication,
                Supabase and PostgreSQL for data and private file storage,
                Vercel for hosting and privacy-aware performance analytics,
                Sentry for configured error monitoring, and Resend for service
                email. OpenAI may be used only for optional resume enrichment
                when configured; deterministic parsing remains available without
                it. Providers process information under their own terms and
                FP&apos;s configuration.
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
              <LegalSection title="Automated assistance and human review">
                Resume extraction and opportunity recommendations may use
                deterministic or optional AI-assisted processing and can be
                incomplete or inaccurate. These tools do not make admission,
                employment, interview, acceptance, or placement decisions. Users
                should review generated information before relying on it.
              </LegalSection>
              <LegalSection title="Retention and security">
                FP retains information only for documented service, security,
                legal, and operational needs, with periods varying by record
                type. Access controls, private storage, encrypted transport,
                logging controls, and backups reduce risk but no system can
                guarantee absolute security. See the data request page for
                access, correction, export, and deletion options.
              </LegalSection>
              <LegalSection title="Students under 13">
                The student dashboard is not intended for children under 13. A
                person under 13 should not create a student profile or upload
                personal information. A parent or guardian may contact FP to
                discuss an appropriate support path.
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
              counsel-reviewed privacy policy. Draft for review — not legal
              advice and not attorney approved. Counsel must review retention,
              vendors, minors, consent, and jurisdictional obligations.
            </p>
            <Link
              className={`${secondaryButtonClass} mt-5 w-full`}
              href="/contact"
            >
              Contact FP
            </Link>
            <Link
              className={`${secondaryButtonClass} mt-3 w-full`}
              href="/data-deletion"
            >
              Data requests
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
