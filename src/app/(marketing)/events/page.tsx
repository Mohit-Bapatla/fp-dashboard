import Link from "next/link";
import { ArrowRight, CalendarDays, PlayCircle } from "lucide-react";

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
import { SubstackNewsletterLink } from "@/components/marketing/substack-newsletter-link";
import { createPublicMetadata } from "@/lib/public-metadata";
import { seminar, siteConfig } from "@/lib/site-config";

const description =
  "Find published Future Physicians events and watch approved recordings from completed healthcare-career programs.";

export const metadata = createPublicMetadata({
  description,
  path: "/events",
  title: "Events",
});

export default function EventsPage() {
  return (
    <>
      <PageHero
        actions={<SubstackNewsletterLink />}
        description={description}
        eyebrow="Future Physicians events"
        title="Join what is next. Revisit what is complete."
      />

      <MarketingSection>
        <SectionHeading
          description="Only events with current, approved details appear here. Registration actions are shown only while an event is active."
          eyebrow="Upcoming first"
          title="Upcoming events"
        />
        <div className="mt-8 rounded-3xl border border-dashed border-primary/30 bg-blue-surface/45 p-8 sm:p-10">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
            <CalendarDays aria-hidden="true" className="size-6" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-navy">
            No upcoming event is currently published.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Future dates, time zones, formats, audiences, and registration links
            will appear here after they are confirmed. Subscribe for new program
            announcements in the meantime.
          </p>
          <div className="mt-6">
            <SubstackNewsletterLink />
          </div>
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <SectionHeading
          description="Completed events keep their true status and offer a recording only when one is approved."
          eyebrow="On demand"
          title="Completed events"
        />
        <article className="mt-9 overflow-hidden rounded-3xl border border-border bg-white shadow-[0_18px_50px_rgba(16,33,58,0.08)]">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative flex min-h-64 items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#10213a_0%,#2f6fed_100%)] p-8 text-white">
              <div
                aria-hidden="true"
                className="pathway-grid absolute inset-0 opacity-20"
              />
              <div className="relative max-w-sm text-center">
                <PlayCircle
                  aria-hidden="true"
                  className="mx-auto size-14 text-blue-100"
                />
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  Recording available
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  Global perspectives on medicine
                </p>
              </div>
            </div>
            <div className="p-7 sm:p-9">
              <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-teal-800">
                {seminar.status}
              </span>
              <p className="mt-5 text-sm font-semibold text-primary">
                <time dateTime={seminar.isoDate}>{seminar.date}</time>
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-brand-navy">
                {seminar.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {seminar.description}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  className={primaryButtonClass}
                  href={`/events/${seminar.slug}`}
                >
                  View event recap
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <a
                  className={secondaryButtonClass}
                  href={siteConfig.links.seminarRecording}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Watch on YouTube
                </a>
              </div>
            </div>
          </div>
        </article>
      </MarketingSection>

      <PageCta
        actions={
          <>
            <SubstackNewsletterLink />
            <Link className={secondaryButtonClass} href="/students">
              Explore the student platform
            </Link>
          </>
        }
        description="Upcoming events will include the confirmed date, time zone, format, audience, and registration action when those details are ready."
        eyebrow="Stay connected"
        title="Be first to know when the next event is published."
      />
    </>
  );
}
