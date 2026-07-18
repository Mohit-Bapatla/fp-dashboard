import Link from "next/link";
import {
  BellRing,
  Bookmark,
  CheckCircle2,
  ClipboardList,
  Compass,
  FileText,
  LockKeyhole,
  Search,
  ShieldCheck,
} from "lucide-react";

import { DashboardEntryButton } from "@/components/marketing/dashboard-entry-button";
import { FaqList } from "@/components/marketing/faq-list";
import { InteractiveStudentPreview } from "@/components/marketing/interactive-student-preview";
import {
  FeatureCard,
  MarketingSection,
  PageCta,
} from "@/components/marketing/supporting-page-sections";
import {
  PageHero,
  SectionHeading,
  secondaryButtonClass,
  textLinkClass,
} from "@/components/marketing/page-shell";
import { createPublicMetadata } from "@/lib/public-metadata";
import { studentFaqItems } from "@/lib/site-config";

const description =
  "Discover verified healthcare opportunities, understand your next steps, and keep applications organized in one free student dashboard.";

export const metadata = createPublicMetadata({
  description,
  path: "/students",
  title: "For Students",
});

export default function StudentsPage() {
  return (
    <>
      <PageHero
        actions={
          <>
            <DashboardEntryButton returnTo="/dashboard/student/onboarding" />
            <Link className={secondaryButtonClass} href="/opportunities">
              Explore opportunities
              <Search aria-hidden="true" className="size-4" />
            </Link>
          </>
        }
        description={description}
        eyebrow="For students"
        title="Your healthcare path, organized in one place."
      />

      <MarketingSection>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <SectionHeading
              description="Public pages help you explore. Your private dashboard brings recommendations, saved opportunities, applications, documents, and deadlines together."
              eyebrow="One working home"
              title="Move from discovery to next step without losing context."
            />
          </div>

          <InteractiveStudentPreview />
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <SectionHeading
          description="Different opportunities have different requirements and application routes. FP helps you understand the path before you act."
          eyebrow="Explore and apply"
          title="Useful tools across the full opportunity journey."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <FeatureCard
            icon={<Search aria-hidden="true" className="size-5" />}
            title="Discover verified listings"
          >
            Browse internships, research, shadowing, volunteering, and events.
            Published details are reviewed, but you should still confirm
            requirements on the official source.
          </FeatureCard>
          <FeatureCard
            icon={<Compass aria-hidden="true" className="size-5" />}
            title="See relevant recommendations"
          >
            Recommendations can use education level, location, interests,
            experience, eligibility, and preferences. A recommendation is not an
            eligibility decision or acceptance.
          </FeatureCard>
          <FeatureCard
            icon={<Bookmark aria-hidden="true" className="size-5" />}
            title="Save what matters"
          >
            Keep listings easy to revisit. Reopening or deadline alerts appear
            only when that feature and source information are available.
          </FeatureCard>
          <FeatureCard
            icon={<FileText aria-hidden="true" className="size-5" />}
            title="Use the right application path"
          >
            Some opportunities use an FP-managed application. Others send you to
            an official external portal or use an introduction or interest
            workflow.
          </FeatureCard>
          <FeatureCard
            icon={<ClipboardList aria-hidden="true" className="size-5" />}
            title="Track every application"
          >
            Organize status, notes, materials, deadlines, and next steps—even
            when the final submission happens outside FP.
          </FeatureCard>
          <FeatureCard
            icon={<BellRing aria-hidden="true" className="size-5" />}
            title="Keep dates visible"
          >
            Bring deadlines and supported notifications into one workspace.
            Dates can change, so the official program source remains
            authoritative.
          </FeatureCard>
        </div>
      </MarketingSection>

      <MarketingSection>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHeading
              description="Enter reusable information once, then decide what to submit for a specific workflow."
              eyebrow="Profile and materials"
              title="Your information stays connected to your work."
            />
            <ul className="mt-7 space-y-4">
              {[
                "Education level, location, interests, experience, availability, and preferences",
                "Reusable application information and documents you choose to upload",
                "Saved listings, application records, notes, and required next steps",
              ].map((item) => (
                <li
                  className="flex gap-3 text-sm leading-6 text-muted-foreground sm:text-base"
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

          <div className="rounded-3xl border border-border bg-blue-surface/55 p-6 sm:p-8">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
              <LockKeyhole aria-hidden="true" className="size-6" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-navy">
              Private by default, shared by context.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Your profile is not a public page. Partners can access only
              applicant or student information authorized for an opportunity and
              workflow; they do not receive unrestricted access to the student
              directory.
            </p>
            <div className="mt-6 rounded-2xl border border-primary/15 bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                <ShieldCheck
                  aria-hidden="true"
                  className="size-5 text-primary"
                />
                Verification has a defined scope
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                FP reviews sources, deadlines, eligibility, application paths,
                and publication status. Verification does not guarantee program
                quality, acceptance, or placement.
              </p>
            </div>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection tone="blue">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <SectionHeading
            description="Learn through FP events, connect locally through chapters, and get clear answers before you create a profile."
            eyebrow="Beyond listings"
            title="Community alongside the platform."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <FeatureCard
              icon={<BellRing aria-hidden="true" className="size-5" />}
              title="Events"
            >
              Find published upcoming programs and approved recordings of
              completed events.
              <div className="mt-4">
                <Link className={textLinkClass} href="/events">
                  Explore events
                </Link>
              </div>
            </FeatureCard>
            <FeatureCard
              icon={<Compass aria-hidden="true" className="size-5" />}
              title="Chapters"
            >
              Apply to build student-led healthcare career activity at your
              school. Approval and resources are not automatic.
              <div className="mt-4">
                <Link className={textLinkClass} href="/chapters">
                  Learn about chapters
                </Link>
              </div>
            </FeatureCard>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection>
        <SectionHeading
          eyebrow="Student FAQ"
          title="Know what the platform can—and cannot—do."
        />
        <FaqList className="mt-8" items={studentFaqItems} />
        <div className="mt-6">
          <Link className={textLinkClass} href="/faq">
            Read all frequently asked questions
          </Link>
        </div>
      </MarketingSection>

      <PageCta
        actions={
          <>
            <DashboardEntryButton returnTo="/dashboard/student/onboarding" />
            <Link className={secondaryButtonClass} href="/opportunities">
              Browse first
            </Link>
          </>
        }
        description="Build your reusable profile, explore verified opportunities, and keep your next steps together. Creating a student profile is free."
        eyebrow="Start when you are ready"
        title="Make your next opportunity easier to manage."
      />
    </>
  );
}
