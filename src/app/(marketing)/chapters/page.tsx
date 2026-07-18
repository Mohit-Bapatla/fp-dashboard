import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  HeartHandshake,
  School,
  Users,
} from "lucide-react";

import {
  PageHero,
  SectionHeading,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/marketing/page-shell";
import {
  FeatureCard,
  MarketingSection,
  NumberedStep,
  PageCta,
} from "@/components/marketing/supporting-page-sections";
import { createPublicMetadata } from "@/lib/public-metadata";
import { siteConfig } from "@/lib/site-config";

const description =
  "Learn what a Future Physicians chapter does, what student leaders are responsible for, and how to apply to start or join one.";

export const metadata = createPublicMetadata({
  description,
  path: "/chapters",
  title: "Chapters",
});

export default function ChaptersPage() {
  return (
    <>
      <PageHero
        actions={
          <>
            <a
              className={primaryButtonClass}
              href={siteConfig.links.chapterApplication}
              rel="noopener noreferrer"
              target="_blank"
            >
              Start or join a chapter
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
            <Link className={secondaryButtonClass} href="/contact">
              Ask a chapter question
            </Link>
          </>
        }
        description={description}
        eyebrow="Student-led local community"
        title="Bring thoughtful healthcare-career exploration to your school."
      />

      <MarketingSection>
        <div className="mx-auto max-w-4xl rounded-3xl border border-primary/15 bg-blue-surface/55 p-7 sm:p-9">
          <School aria-hidden="true" className="size-8 text-primary" />
          <h2 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-brand-navy">
            What a chapter is
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            A Future Physicians chapter is a student-led school community that
            organizes accurate, responsible healthcare-career learning and stays
            connected with the national organization. It gives student leaders a
            structure for local activity—not ownership of the national platform
            or its relationships.
          </p>
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <SectionHeading
          description="Strong chapters are active, accurate, inclusive, and dependable. The work is led locally while staying aligned with Future Physicians guidance."
          eyebrow="Leadership expectations"
          title="A chapter is a responsibility, not just a title."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            icon={<Users aria-hidden="true" className="size-5" />}
            title="Build an active team"
          >
            Recruit dependable student leaders, divide responsibilities, and
            create a welcoming path for members to participate.
          </FeatureCard>
          <FeatureCard
            icon={<CalendarCheck aria-hidden="true" className="size-5" />}
            title="Plan useful activity"
          >
            Organize career exploration, service, speaker, or skill-building
            activities that fit your school and the guidance currently
            available.
          </FeatureCard>
          <FeatureCard
            icon={<BookOpenCheck aria-hidden="true" className="size-5" />}
            title="Communicate accurately"
          >
            Use correct opportunity and event information. Do not imply
            relationships, access, or guarantees that Future Physicians has not
            confirmed.
          </FeatureCard>
          <FeatureCard
            icon={<HeartHandshake aria-hidden="true" className="size-5" />}
            title="Stay coordinated"
          >
            Maintain contact with the national organization and follow current
            expectations for chapter identity, reporting, and responsible
            conduct.
          </FeatureCard>
        </div>
      </MarketingSection>

      <MarketingSection>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            description="The application begins the review; it does not create an approved chapter automatically."
            eyebrow="Approval process"
            title="From interest to an active chapter."
          />
          <ol className="space-y-1">
            <NumberedStep number={1} title="Submit the chapter application">
              Share your school, leadership interest, and proposed chapter
              context through the approved form.
            </NumberedStep>
            <NumberedStep
              number={2}
              title="Future Physicians reviews the request"
            >
              FP evaluates whether the information is complete and whether the
              chapter can responsibly operate within current expectations.
            </NumberedStep>
            <NumberedStep
              number={3}
              title="Confirm responsibilities and next steps"
            >
              Approved applicants coordinate the current onboarding, leadership,
              communication, and activity requirements with the national
              organization.
            </NumberedStep>
            <NumberedStep
              number={4}
              title="Keep the chapter active and accurate"
            >
              Leaders maintain communication and deliver appropriate local
              activities. Available resources can vary by time, program, and
              school context.
            </NumberedStep>
          </ol>
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHeading
              description="Approved chapters can connect local student leadership with the programs and guidance that Future Physicians is currently able to provide."
              eyebrow="Connection and resources"
              title="Local initiative, national coordination."
            />
            <p className="mt-6 text-base leading-7 text-muted-foreground">
              Resources may include current chapter guidance, communication
              materials, program updates, and ways to participate in eligible
              national initiatives. Availability is not uniform, and chapter
              approval does not guarantee funding, events, placements, or
              external access.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-white p-7 shadow-sm sm:p-8">
            <ClipboardCheck
              aria-hidden="true"
              className="size-7 text-primary"
            />
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-navy">
              Before you apply
            </h2>
            <ul className="mt-5 space-y-3">
              {[
                "Identify dependable student leadership",
                "Understand your school’s club or organization rules",
                "Be ready to communicate accurately and consistently",
                "Plan realistic activity without assuming funding or access",
              ].map((item) => (
                <li
                  className="flex gap-3 text-sm leading-6 text-muted-foreground"
                  key={item}
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-teal-600"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </MarketingSection>

      <PageCta
        actions={
          <a
            className={secondaryButtonClass}
            href={siteConfig.links.chapterApplication}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open the chapter application
            <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        }
        description="Use the approved form to share your interest. Submission starts a review and does not guarantee approval or resources."
        eyebrow="Lead with purpose"
        title="Ready to build a responsible student chapter?"
      />
    </>
  );
}
