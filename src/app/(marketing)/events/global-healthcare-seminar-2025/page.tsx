import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Globe2,
  PlayCircle,
  Users,
} from "lucide-react";

import {
  PageHero,
  SectionHeading,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/marketing/page-shell";
import {
  MarketingSection,
  MetricCard,
  PageCta,
} from "@/components/marketing/supporting-page-sections";
import { createPublicMetadata } from "@/lib/public-metadata";
import { seminar, siteConfig } from "@/lib/site-config";

const description =
  "Watch the completed 2025 Future Physicians Global Healthcare Seminar and review its organization-reported participation metrics.";

export const metadata = createPublicMetadata({
  description,
  path: `/events/${seminar.slug}`,
  title: "Global Healthcare Seminar 2025",
});

const recordingId = new URL(siteConfig.links.seminarRecording).searchParams.get(
  "v",
);
const privacyEnhancedEmbed = recordingId
  ? `https://www.youtube-nocookie.com/embed/${recordingId}?rel=0`
  : undefined;
const countriesRepresented = seminar.metrics.find(
  (metric) => metric.label === "Countries represented",
);

const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: seminar.title,
  description: seminar.description,
  startDate: seminar.isoDate,
  endDate: seminar.isoDate,
  url: `${siteConfig.url}/events/${seminar.slug}`,
  organizer: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
  },
  subjectOf: {
    "@type": "VideoObject",
    name: `${seminar.title} recording`,
    contentUrl: siteConfig.links.seminarRecording,
    embedUrl: privacyEnhancedEmbed,
  },
};

export default function GlobalHealthcareSeminarPage() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        type="application/ld+json"
      />
      <PageHero
        actions={
          <>
            <a
              className={primaryButtonClass}
              href={siteConfig.links.seminarRecording}
              rel="noopener noreferrer"
              target="_blank"
            >
              Watch the recording
              <PlayCircle aria-hidden="true" className="size-4" />
            </a>
            <Link className={secondaryButtonClass} href="/events">
              View all events
            </Link>
          </>
        }
        description={seminar.description}
        eyebrow={seminar.status}
        title={seminar.title}
      />

      <MarketingSection>
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div className="rounded-3xl border border-border bg-blue-surface/55 p-6 sm:p-8">
            <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-teal-800">
              Completed event
            </span>
            <div className="mt-6 flex items-start gap-3">
              <CalendarDays
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-primary"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Date
                </p>
                <p className="mt-1 font-semibold text-brand-navy">
                  <time dateTime={seminar.isoDate}>{seminar.date}</time>
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-start gap-3">
              <Users
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-primary"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Program focus
                </p>
                <p className="mt-1 text-sm leading-6 text-brand-navy">
                  {seminar.description}
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-start gap-3">
              <Globe2
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-primary"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Global participation
                </p>
                <p className="mt-1 text-sm leading-6 text-brand-navy">
                  {countriesRepresented
                    ? `FP reports participation representing ${countriesRepresented.value} countries for this event.`
                    : "FP reports global participation for this event."}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="overflow-hidden rounded-3xl border border-border bg-brand-navy p-2 shadow-[0_24px_60px_rgba(16,33,58,0.18)]">
              <div className="aspect-video overflow-hidden rounded-[1.25rem] bg-black">
                {privacyEnhancedEmbed ? (
                  <iframe
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="size-full border-0"
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={privacyEnhancedEmbed}
                    title={`${seminar.title} recording`}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center p-6 text-center text-sm text-white">
                    The embedded player is unavailable. Use the recording link
                    above.
                  </div>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Privacy-enhanced YouTube player. The recording does not autoplay;
              loading or playing the player may connect to YouTube under its
              privacy terms.
            </p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <SectionHeading
          description="The figures below are event metrics reported by Future Physicians for this completed seminar. Registrations, live attendees, and peak viewers describe different measures."
          eyebrow="Event recap"
          title="Reported participation and engagement."
        />
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {seminar.metrics.map((metric) => (
            <MetricCard
              definition={metric.definition}
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </div>
        <p className="mt-6 text-xs leading-5 text-muted-foreground">
          These event-specific figures are reported by Future Physicians as of{" "}
          <time dateTime={seminar.metricsAsOf.isoDate}>
            {seminar.metricsAsOf.date}
          </time>
          . They are not organization-wide totals.
        </p>
      </MarketingSection>

      <MarketingSection>
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            description="Future Physicians reports institutional recognition connected with this seminar from the organizations listed below."
            title="Institutional recognition"
          />
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {seminar.recognition.map((organization) => (
              <div
                className="rounded-2xl border border-border bg-white p-5 shadow-sm"
                key={organization}
              >
                <p className="text-sm font-semibold text-brand-navy">
                  {organization}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Institutional recognition reported for this event
                </p>
              </div>
            ))}
          </div>
        </div>
      </MarketingSection>

      <PageCta
        actions={
          <>
            <Link className={secondaryButtonClass} href="/events">
              See future events
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <a
              className={secondaryButtonClass}
              href={siteConfig.links.newsletter}
              rel="noopener noreferrer"
              target="_blank"
            >
              Subscribe to the newsletter
            </a>
          </>
        }
        description="Future event details will appear only after the schedule, audience, format, and registration route are confirmed."
        eyebrow="Keep learning"
        title="Follow the next Future Physicians program."
      />
    </>
  );
}
