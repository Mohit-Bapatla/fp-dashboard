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
import { faqGroups } from "@/lib/site-config";

const description =
  "Discover verified healthcare opportunities, understand your next steps, and keep applications organized in one free student dashboard.";

export const metadata = createPublicMetadata({
  description,
  path: "/students",
  title: "For Students",
});

const studentFaqs = [
  faqGroups[0].items[0],
  faqGroups[1].items[1],
  faqGroups[2].items[2],
];

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
            <p className="mt-6 text-sm leading-6 text-muted-foreground">
              This interface preview uses illustrative labels only. It does not
              show a real student, organization, acceptance, or placement.
            </p>
          </div>

          <figure className="overflow-hidden rounded-3xl border border-border bg-brand-navy p-2 shadow-[0_24px_60px_rgba(16,33,58,0.18)]">
            <figcaption className="sr-only">
              Illustrative student dashboard preview
            </figcaption>
            <div className="rounded-[1.25rem] bg-slate-50 p-4 sm:p-6">
              <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Dashboard preview
                  </p>
                  <p className="mt-1 text-xl font-semibold text-brand-navy">
                    Your next steps
                  </p>
                </div>
                <span className="w-fit rounded-full border border-primary/20 bg-blue-surface px-3 py-1 text-xs font-semibold text-primary">
                  Illustrative interface
                </span>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-white p-5 md:row-span-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                    <Compass
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                    Recommended for you
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      ["Research experience", "Review eligibility"],
                      ["Community health service", "Rolling timeline"],
                      ["Clinical career event", "Recording available"],
                    ].map(([title, status]) => (
                      <div
                        className="rounded-xl border border-border p-3"
                        key={title}
                      >
                        <p className="text-sm font-semibold text-brand-navy">
                          {title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                    <Bookmark
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                    Saved opportunities
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Keep promising listings together while you compare
                    requirements and dates.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                    <ClipboardList
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                    Application workspace
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-2/3 rounded-full bg-teal-500" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Example progress state
                  </p>
                </div>
              </div>
            </div>
          </figure>
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
        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-white px-5 sm:px-7">
          {studentFaqs.map((item) => (
            <details className="group py-5" key={item.question}>
              <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-md pr-8 font-semibold text-brand-navy marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                {item.question}
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
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
