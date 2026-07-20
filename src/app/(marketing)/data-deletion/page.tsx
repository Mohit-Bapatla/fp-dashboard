import {
  MarketingContainer,
  PageHero,
} from "@/components/marketing/page-shell";
import { createPublicMetadata } from "@/lib/public-metadata";
import { siteConfig } from "@/lib/site-config";

export const metadata = createPublicMetadata({
  description:
    "How to request access, correction, export, or deletion of Future Physicians account data.",
  path: "/data-deletion",
  title: "Data Requests",
});

const requestTypes = [
  "Access to the account information associated with you",
  "Correction of inaccurate account or profile information",
  "A portable copy of eligible information",
  "Deletion of eligible account-associated information",
] as const;

export default function DataDeletionPage() {
  return (
    <>
      <PageHero
        description="Request access, correction, export, or deletion of information associated with your FP account."
        eyebrow="Data rights"
        title="Data request process"
      />
      <MarketingContainer className="py-14 sm:py-20">
        <article className="mx-auto max-w-3xl space-y-8 rounded-2xl border border-border bg-white p-6 text-sm leading-7 text-muted-foreground shadow-sm sm:p-8">
          <section>
            <h2 className="text-xl font-semibold text-brand-navy">
              Available requests
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {requestTypes.map((requestType) => (
                <li key={requestType}>{requestType}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-brand-navy">
              How to submit a request
            </h2>
            <p className="mt-2">
              Email{" "}
              <a
                className="font-semibold text-primary underline underline-offset-4"
                href={`mailto:${siteConfig.emails.support}?subject=Data%20request`}
              >
                {siteConfig.emails.support}
              </a>{" "}
              from the address associated with your account when possible. State
              the request type, but do not send passwords, resume contents,
              identity documents, or other sensitive information in the initial
              message.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-brand-navy">
              Identity verification and response
            </h2>
            <p className="mt-2">
              FP must verify that the requester is authorized before disclosing
              or changing account information. The team will confirm receipt,
              explain any additional verification needed, and provide a status
              update. Timing may depend on request scope and applicable law.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-brand-navy">
              Deletion and retention limits
            </h2>
            <p className="mt-2">
              Eligible information will be deleted or de-identified from active
              systems. Limited records may be retained when reasonably needed
              for security, fraud prevention, legal obligations, dispute
              handling, or documented program operations. Backup copies expire
              under the provider&apos;s retention cycle rather than being edited
              individually. FP will explain material exceptions that apply to a
              request.
            </p>
          </section>
          <p className="rounded-xl border border-warning/25 bg-accent-warm/10 p-4 text-brand-navy">
            Self-service account deletion is not currently available. This
            manual process requires human review and is not a promise that every
            record can be removed immediately.
          </p>
        </article>
      </MarketingContainer>
    </>
  );
}
