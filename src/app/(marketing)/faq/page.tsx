import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";

import {
  PageHero,
  SectionHeading,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/marketing/page-shell";
import {
  MarketingSection,
  PageCta,
} from "@/components/marketing/supporting-page-sections";
import { createPublicMetadata } from "@/lib/public-metadata";
import { allFaqItems, faqGroups, siteConfig } from "@/lib/site-config";

const description =
  "Get clear answers about Future Physicians student accounts, opportunities, applications, partners, chapters, events, privacy, and support.";

export const metadata = createPublicMetadata({
  description,
  path: "/faq",
  title: "Frequently Asked Questions",
});

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: allFaqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        type="application/ld+json"
      />
      <PageHero
        actions={
          <>
            <Link className={primaryButtonClass} href="/contact">
              Contact support
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link className={secondaryButtonClass} href="/opportunities">
              Explore opportunities
            </Link>
          </>
        }
        description={description}
        eyebrow="Frequently asked questions"
        title="Understand the workflow before your next step."
      />

      <MarketingSection>
        <nav
          aria-label="FAQ categories"
          className="rounded-3xl border border-border bg-blue-surface/45 p-6 sm:p-8"
        >
          <p className="text-sm font-semibold text-brand-navy">
            Jump to a category
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {faqGroups.map((group) => (
              <a
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-brand-navy transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`#${group.id}`}
                key={group.id}
              >
                {group.title}
              </a>
            ))}
          </div>
        </nav>

        <div className="mt-12 space-y-12">
          {faqGroups.map((group) => (
            <section className="scroll-mt-28" id={group.id} key={group.id}>
              <div className="grid gap-6 lg:grid-cols-[0.42fr_1fr]">
                <div>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-blue-surface text-primary">
                    <HelpCircle aria-hidden="true" className="size-5" />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-brand-navy">
                    {group.title}
                  </h2>
                </div>
                <div className="divide-y divide-border rounded-2xl border border-border bg-white px-5 shadow-sm sm:px-7">
                  {group.items.map((item) => (
                    <details className="group py-5" key={item.question}>
                      <summary className="cursor-pointer list-none pr-8 font-semibold text-brand-navy marker:content-none">
                        {item.question}
                      </summary>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <SectionHeading
          description="The FAQ explains general platform behavior. A published opportunity’s official requirements and source remain specific to that program."
          eyebrow="Still deciding?"
          title="Choose the most direct next step."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            [
              "Student platform",
              "Learn what goes in a profile and how applications are organized.",
              "/students",
            ],
            [
              "Partner workflow",
              "Review opportunity, applicant, privacy, and reporting boundaries.",
              "/partners",
            ],
            [
              "General support",
              `Email ${siteConfig.emails.support} for account, application, opportunity, or general questions.`,
              "/contact",
            ],
          ].map(([title, copy, href]) => (
            <article
              className="rounded-2xl border border-border bg-white p-6 shadow-sm"
              key={title}
            >
              <h3 className="text-lg font-semibold text-brand-navy">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {copy}
              </p>
              <Link
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                href={href}
              >
                Learn more
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </MarketingSection>

      <PageCta
        actions={
          <Link className={secondaryButtonClass} href="/contact">
            Contact Future Physicians
          </Link>
        }
        description="Send account, application, opportunity, partnership, or funding questions to the contact route that matches your request."
        eyebrow="Need a human answer?"
        title="We will help you find the right channel."
      />
    </>
  );
}
