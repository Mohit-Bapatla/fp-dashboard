import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, type ReactNode } from "react";

import { DashboardEntryButton } from "@/components/marketing/dashboard-entry-button";
import {
  MarketingContainer,
  primaryButtonClass,
  secondaryButtonClass,
  textLinkClass,
} from "@/components/marketing/page-shell";
import { EligibilityBadge } from "@/components/opportunities/eligibility-badge";
import {
  formatOpportunityDate,
  formatOpportunityEnum,
  getApplicationMethodLabel,
  getPublicApplicationMethod,
  PublicOpportunityCard,
} from "@/components/opportunities/public-opportunity-card";
import { getMarketingViewer } from "@/lib/auth/marketing-viewer";
import { prisma } from "@/lib/db/prisma";
import { formatGradeLevelCode } from "@/lib/matching/grade-levels";
import {
  evaluateOpportunityEligibility,
  type EligibilityResult,
} from "@/lib/matching/opportunity-eligibility";
import {
  getPublicOpportunities,
  getPublicOpportunity,
  type PublicOpportunity,
} from "@/lib/public/opportunities";
import { isOpportunitySubmittable } from "@/lib/opportunities/student-visibility";
import { getPublicOpportunityRelationshipLabel } from "@/lib/opportunities/public-relationship";
import { createPublicMetadata } from "@/lib/public-metadata";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

type PublicOpportunityPageProps = {
  params: Promise<{ opportunityId: string }>;
};

const getOpportunity = cache(getPublicOpportunity);

function metadataDescription(opportunity: PublicOpportunity) {
  const description =
    opportunity.shortDescription ||
    opportunity.description ||
    `Review this verified ${formatOpportunityEnum(opportunity.type).toLowerCase()} opportunity from ${opportunity.organization.name}.`;
  return description.length > 160
    ? `${description.slice(0, 157).trim()}...`
    : description;
}

export async function generateMetadata({
  params,
}: PublicOpportunityPageProps): Promise<Metadata> {
  const { opportunityId } = await params;
  const opportunity = await getOpportunity(opportunityId);

  if (!opportunity) {
    return {
      ...createPublicMetadata({
        description: "This Future Physicians opportunity could not be found.",
        path: `/opportunities/${opportunityId}`,
        title: "Opportunity not found",
      }),
      robots: { follow: false, index: false },
    };
  }

  const canonicalPath = `/opportunities/${opportunity.id}` as const;
  const description = metadataDescription(opportunity);
  return createPublicMetadata({
    description,
    path: canonicalPath,
    title: opportunity.title,
  });
}

function getLocation(opportunity: PublicOpportunity) {
  return (
    opportunity.location ||
    [opportunity.city, opportunity.state, opportunity.country]
      .filter(Boolean)
      .join(", ") ||
    "Not specified"
  );
}

function getDeadline(opportunity: PublicOpportunity) {
  if (opportunity.isRolling || opportunity.availabilityStatus === "ROLLING") {
    return "Rolling applications";
  }
  return formatOpportunityDate(opportunity.deadline) || "Not specified";
}

function getGradeLevels(opportunity: PublicOpportunity) {
  return opportunity.acceptedGradeLevels.length > 0
    ? opportunity.acceptedGradeLevels.map(formatGradeLevelCode).join(", ")
    : "Not specified";
}

function getApplicationActionLabel(
  opportunity: PublicOpportunity,
  submissionAllowed: boolean,
) {
  if (!submissionAllowed) return "Prepare in Future Physicians";

  const method = getPublicApplicationMethod(opportunity);
  return method === "FP_INTERNAL"
    ? "Apply through Future Physicians"
    : method === "FP_REFERRAL"
      ? "Request an introduction"
      : "Continue to the official application";
}

function getRelationshipLabel(opportunity: PublicOpportunity) {
  return getPublicOpportunityRelationshipLabel({
    organizationStatus: opportunity.organization.status,
    relationshipType: opportunity.relationshipType,
  });
}

export default async function PublicOpportunityPage({
  params,
}: PublicOpportunityPageProps) {
  const { opportunityId } = await params;
  const [opportunity, viewer] = await Promise.all([
    getOpportunity(opportunityId),
    getMarketingViewer(),
  ]);

  if (!opportunity) notFound();

  const role = viewer.role;
  const isSignedInStudent = Boolean(viewer.userId && role === "STUDENT");
  const [student, related] = await Promise.all([
    isSignedInStudent && viewer.userId
      ? prisma.user.findUnique({
          select: {
            studentProfile: {
              select: {
                ageYears: true,
                certifications: true,
                city: true,
                country: true,
                gradeYear: true,
                interestedSpecialties: true,
                opportunityTypes: true,
                state: true,
              },
            },
          },
          where: { clerkUserId: viewer.userId },
        })
      : Promise.resolve(null),
    getPublicOpportunities({ limit: 4, type: opportunity.type }),
  ]);
  const profile = student?.studentProfile ?? null;
  const eligibility = profile
    ? evaluateOpportunityEligibility({ opportunity, student: profile })
    : null;
  const eligibilityRank = {
    STRONG_MATCH: 0,
    POSSIBLE_MATCH: 1,
    NOT_ELIGIBLE: 2,
  } as const;
  const relatedOpportunities = related
    .filter(({ id }) => id !== opportunity.id)
    .map((item) => ({
      eligibility: profile
        ? evaluateOpportunityEligibility({
            opportunity: item,
            student: profile,
          })
        : null,
      opportunity: item,
    }))
    .sort(
      (first, second) =>
        (first.eligibility ? eligibilityRank[first.eligibility.category] : 1) -
        (second.eligibility ? eligibilityRank[second.eligibility.category] : 1),
    )
    .slice(0, 3);
  const applyPath = `/dashboard/student/opportunities/${opportunity.id}/apply`;
  const dashboardDetailPath = `/dashboard/student/opportunities/${opportunity.id}`;
  const submissionAllowed = isOpportunitySubmittable(opportunity);
  const dashboardActionPath = submissionAllowed
    ? applyPath
    : dashboardDetailPath;
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(dashboardActionPath)}`;
  const signUpHref = `/sign-up?redirect_url=${encodeURIComponent(dashboardActionPath)}`;

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-[linear-gradient(180deg,#ffffff_0%,#f2f7ff_100%)] py-10 sm:py-14">
        <div
          aria-hidden="true"
          className="pathway-grid absolute inset-0 opacity-40"
        />
        <MarketingContainer className="relative">
          <Link className={textLinkClass} href="/opportunities">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to opportunities
          </Link>
          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                  <CheckCircle2 aria-hidden="true" className="size-3.5" />
                  Verified listing
                </span>
                <span className="rounded-full border border-primary/20 bg-blue-surface px-3 py-1.5 text-xs font-semibold text-primary">
                  {formatOpportunityEnum(opportunity.type)}
                </span>
                <span className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  {formatOpportunityEnum(opportunity.availabilityStatus)}
                </span>
                {eligibility ? (
                  <EligibilityBadge category={eligibility.category} />
                ) : null}
              </div>
              <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.045em] text-brand-navy sm:text-5xl lg:text-6xl">
                {opportunity.title}
              </h1>
              <p className="mt-4 text-lg font-semibold text-muted-foreground">
                {opportunity.organization.name}
              </p>
              {opportunity.shortDescription ? (
                <p className="mt-5 max-w-3xl text-pretty text-lg leading-8 text-muted-foreground">
                  {opportunity.shortDescription}
                </p>
              ) : null}
            </div>

            <aside className="rounded-2xl border border-border bg-white p-5 shadow-[0_12px_32px_rgba(16,33,58,0.08)] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Application path
              </p>
              <h2 className="mt-2 text-xl font-semibold text-brand-navy">
                {submissionAllowed
                  ? getApplicationMethodLabel(opportunity)
                  : "Prepare before applications open"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {getPublicApplicationMethod(opportunity) === "EXTERNAL_PORTAL"
                  ? "Use your dashboard to review the requirements, then continue to the organization's official portal."
                  : getPublicApplicationMethod(opportunity) === "FP_REFERRAL"
                    ? "Start in your dashboard so Future Physicians can manage the introduction workflow."
                    : "Prepare and manage this application through your Future Physicians workspace."}
              </p>
              <div className="mt-5 grid gap-3">
                {isSignedInStudent ? (
                  <>
                    <Link
                      className={primaryButtonClass}
                      href={dashboardActionPath}
                    >
                      {getApplicationActionLabel(
                        opportunity,
                        submissionAllowed,
                      )}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                    <Link
                      className={secondaryButtonClass}
                      href={dashboardDetailPath}
                    >
                      Save or review in dashboard
                    </Link>
                  </>
                ) : viewer.userId ? (
                  <DashboardEntryButton className="w-full" />
                ) : (
                  <>
                    <Link className={primaryButtonClass} href={signUpHref}>
                      {getPublicApplicationMethod(opportunity) ===
                      "EXTERNAL_PORTAL"
                        ? "Create profile to continue"
                        : getApplicationActionLabel(
                            opportunity,
                            submissionAllowed,
                          )}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                    <Link className={secondaryButtonClass} href={signInHref}>
                      Sign in and return here
                    </Link>
                  </>
                )}
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Creating a student profile is free. Eligibility and acceptance
                are determined by the published requirements and reviewing
                organization.
              </p>
            </aside>
          </div>
        </MarketingContainer>
      </section>

      <MarketingContainer className="py-10 sm:py-12">
        <section
          aria-label="Opportunity facts"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <DetailFact
            icon={<MapPin />}
            label="Location"
            value={getLocation(opportunity)}
          />
          <DetailFact
            icon={<BriefcaseBusiness />}
            label="Format"
            value={opportunity.remoteType || "Not specified"}
          />
          <DetailFact
            icon={<GraduationCap />}
            label="Grade / education level"
            value={getGradeLevels(opportunity)}
          />
          <DetailFact
            icon={<CalendarDays />}
            label="Applications open"
            value={
              formatOpportunityDate(opportunity.opensAt) ||
              (submissionAllowed ? "Open now" : "Date not specified")
            }
          />
          <DetailFact
            icon={<CalendarDays />}
            label="Deadline"
            value={getDeadline(opportunity)}
          />
          <DetailFact
            icon={<ShieldCheck />}
            label="Verification"
            value={
              opportunity.lastVerifiedAt
                ? `Reviewed ${formatOpportunityDate(opportunity.lastVerifiedAt)}`
                : "Verified by Future Physicians"
            }
          />
          <DetailFact
            icon={<FileText />}
            label="Application method"
            value={getApplicationMethodLabel(opportunity)}
          />
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="space-y-7">
            <ContentSection title="About this opportunity">
              <p className="whitespace-pre-line">
                {opportunity.description ||
                  "The organization has not published a full description yet."}
              </p>
            </ContentSection>

            <ContentSection title="Published eligibility requirements">
              {opportunity.eligibilityRequirements ? (
                <p className="whitespace-pre-line">
                  {opportunity.eligibilityRequirements}
                </p>
              ) : null}
              <RequirementList opportunity={opportunity} />
              {opportunity.eligibilityUnknowns.length > 0 ? (
                <div className="mt-5 rounded-xl border border-warning/20 bg-warning/10 p-4">
                  <h3 className="text-sm font-semibold text-brand-navy">
                    Details to confirm
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {opportunity.eligibilityUnknowns.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </ContentSection>

            <ContentSection title="Schedule and program dates">
              <dl className="grid gap-4 sm:grid-cols-2">
                <InlineFact
                  label="Starts"
                  value={
                    formatOpportunityDate(opportunity.startsAt) ||
                    "Not specified"
                  }
                />
                <InlineFact
                  label="Ends"
                  value={
                    formatOpportunityDate(opportunity.endsAt) || "Not specified"
                  }
                />
                <InlineFact
                  label="Weekly commitment"
                  value={
                    opportunity.estimatedWeeklyHours != null
                      ? `${opportunity.estimatedWeeklyHours} hours per week`
                      : "Not specified"
                  }
                />
                <InlineFact
                  label="Schedule requirements"
                  value={opportunity.scheduleRequirements || "Not specified"}
                />
              </dl>
            </ContentSection>
          </div>

          <aside className="space-y-6">
            <EligibilityPanel
              eligibility={eligibility}
              isSignedInStudent={isSignedInStudent}
              opportunityId={opportunity.id}
              profileExists={Boolean(profile)}
            />

            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <Clock3 aria-hidden="true" className="size-5 text-primary" />
              <h2 className="mt-4 text-lg font-semibold text-brand-navy">
                Application details
              </h2>
              <dl className="mt-4 space-y-4">
                <InlineFact
                  label="Estimated time"
                  value={
                    opportunity.estimatedApplicationMinutes != null
                      ? `${opportunity.estimatedApplicationMinutes} minutes`
                      : "Not specified"
                  }
                />
                <InlineFact
                  label="Essay questions"
                  value={
                    opportunity.essayQuestionCount != null
                      ? opportunity.essayQuestionCount.toString()
                      : "Not specified"
                  }
                />
                <InlineFact
                  label="Compensation"
                  value={opportunity.paidStatus || "Not specified"}
                />
                <InlineFact
                  label="Capacity"
                  value={
                    opportunity.capacity != null
                      ? `${opportunity.capacity} participants`
                      : "Not specified"
                  }
                />
              </dl>
              <h3 className="mt-6 text-sm font-semibold text-brand-navy">
                Required documents
              </h3>
              {opportunity.requiredDocuments.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {opportunity.requiredDocuments.map((document) => (
                    <li
                      className="rounded-xl bg-muted px-3 py-2.5"
                      key={document}
                    >
                      {document}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  No required documents are listed.
                </p>
              )}
              {opportunity.applicationInstructions ? (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-brand-navy">
                    Instructions
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                    {opportunity.applicationInstructions}
                  </p>
                </>
              ) : null}
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <ShieldCheck aria-hidden="true" className="size-5 text-success" />
              <h2 className="mt-4 text-lg font-semibold text-brand-navy">
                Source and verification
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {getRelationshipLabel(opportunity)}. FP checks publication,
                availability, application paths, and source links before a
                listing appears here.
              </p>
              <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
                <p>
                  Opportunity information is sourced from the host or its
                  published materials. Details, deadlines, and availability can
                  change, so confirm them with the official source before
                  applying.
                </p>
                <p className="mt-3">
                  A listing does not by itself establish an FP partnership or
                  endorsement. Future Physicians does not control a third
                  party&apos;s eligibility rules, interviews, acceptance,
                  placement, pay, or other outcomes. Eligibility information and
                  recommendations are not guarantees. External applications are
                  submitted to and handled by the host organization.
                </p>
              </div>
              <div className="mt-4 grid gap-2">
                {opportunity.officialSourceUrl ? (
                  <a
                    className={secondaryButtonClass}
                    href={opportunity.officialSourceUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View official source
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </a>
                ) : opportunity.organization.website ? (
                  <a
                    className={secondaryButtonClass}
                    href={opportunity.organization.website}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Visit organization website
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </a>
                ) : null}
                <a
                  className={textLinkClass}
                  href={`mailto:${siteConfig.emails.support}?subject=${encodeURIComponent(
                    `Opportunity correction: ${opportunity.title} (${opportunity.id})`,
                  )}`}
                >
                  Report incorrect listing information
                </a>
              </div>
            </section>
          </aside>
        </div>

        {relatedOpportunities.length > 0 ? (
          <section
            className="mt-14 border-t border-border pt-10"
            aria-labelledby="related-heading"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Keep exploring
                </p>
                <h2
                  className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-brand-navy"
                  id="related-heading"
                >
                  Related opportunities
                </h2>
              </div>
              <Link className={textLinkClass} href="/opportunities">
                View the full directory
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {relatedOpportunities.map(
                ({ eligibility, opportunity: item }) => (
                  <PublicOpportunityCard
                    compact
                    eligibility={eligibility}
                    key={item.id}
                    opportunity={item}
                    viewerRole={role}
                  />
                ),
              )}
            </div>
          </section>
        ) : null}
      </MarketingContainer>
    </>
  );
}

function DetailFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground [&_svg]:size-4 [&_svg]:text-primary">
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-brand-navy">
        {value}
      </p>
    </div>
  );
}

function ContentSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6 text-base leading-7 text-muted-foreground shadow-sm sm:p-8">
      <h2 className="text-2xl font-semibold tracking-[-0.025em] text-brand-navy">
        {title}
      </h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function InlineFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium leading-6 text-brand-navy">
        {value}
      </dd>
    </div>
  );
}

function RequirementList({ opportunity }: { opportunity: PublicOpportunity }) {
  const ageRange =
    opportunity.minimumAge != null || opportunity.maximumAge != null
      ? opportunity.minimumAge != null && opportunity.maximumAge != null
        ? `Ages ${opportunity.minimumAge}-${opportunity.maximumAge}`
        : opportunity.minimumAge != null
          ? `Age ${opportunity.minimumAge} or older`
          : `Age ${opportunity.maximumAge} or younger`
      : null;
  const requirements = [
    { label: "Accepted levels", value: getGradeLevels(opportunity) },
    { label: "Age", value: ageRange },
    {
      label: "Minimum GPA",
      value:
        opportunity.minimumGpa != null
          ? opportunity.minimumGpa.toFixed(1)
          : null,
    },
    { label: "Required experience", value: opportunity.requiredExperience },
    {
      label: "Certifications",
      value:
        opportunity.requiredCertifications.length > 0
          ? opportunity.requiredCertifications.join(", ")
          : null,
    },
    { label: "Residency", value: opportunity.residencyRequirement },
    { label: "Citizenship", value: opportunity.citizenshipRequirement },
    { label: "Geographic scope", value: opportunity.geographicScope },
    {
      label: "Parent permission",
      value:
        opportunity.parentPermissionRequired == null
          ? null
          : opportunity.parentPermissionRequired
            ? "Required"
            : "Not required",
    },
    {
      label: "Work authorization",
      value:
        opportunity.workAuthorizationRequired == null
          ? null
          : opportunity.workAuthorizationRequired
            ? "Required"
            : "Not required",
    },
  ].filter((item): item is { label: string; value: string } =>
    Boolean(item.value),
  );

  return requirements.length > 0 ? (
    <dl className="grid gap-4 rounded-xl bg-muted p-4 sm:grid-cols-2">
      {requirements.map((requirement) => (
        <InlineFact key={requirement.label} {...requirement} />
      ))}
    </dl>
  ) : (
    <p>No additional structured requirements are published.</p>
  );
}

function EligibilityPanel({
  eligibility,
  isSignedInStudent,
  opportunityId,
  profileExists,
}: {
  eligibility: EligibilityResult | null;
  isSignedInStudent: boolean;
  opportunityId: string;
  profileExists: boolean;
}) {
  if (eligibility) {
    const concerns = [
      ...eligibility.blockingReasons,
      ...eligibility.concerns,
      ...eligibility.unknowns,
    ];
    return (
      <section className="rounded-2xl border border-primary/20 bg-blue-surface p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Profile-based check
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-brand-navy">
            Why this may fit you
          </h2>
          <EligibilityBadge category={eligibility.category} />
        </div>
        {eligibility.confirmedMatches.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm text-brand-navy">
            {eligibility.confirmedMatches.map((match) => (
              <li className="flex gap-2" key={match}>
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-success"
                />
                {match}
              </li>
            ))}
          </ul>
        ) : null}
        {concerns.length > 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-white/80 p-4">
            <h3 className="text-sm font-semibold text-brand-navy">
              Review before applying
            </h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
              {concerns.map((concern) => (
                <li key={concern}>{concern}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          This check uses available profile and listing data. It does not
          guarantee eligibility, an interview, or acceptance.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <GraduationCap aria-hidden="true" className="size-5 text-primary" />
      <h2 className="mt-4 text-lg font-semibold text-brand-navy">
        Check why this may fit you
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {isSignedInStudent && !profileExists
          ? "Complete your student profile to compare your grade, age, location, interests, and certifications with the published requirements."
          : "Create a free student profile to compare your information with the published requirements."}
      </p>
      {isSignedInStudent ? (
        <Link
          className={`${secondaryButtonClass} mt-5 w-full`}
          href={`/dashboard/student/onboarding?returnTo=${encodeURIComponent(
            `/opportunities/${opportunityId}`,
          )}`}
        >
          Complete student profile
        </Link>
      ) : (
        <div className="mt-5">
          <DashboardEntryButton
            className="w-full"
            returnTo={`/dashboard/student/opportunities/${opportunityId}`}
          />
        </div>
      )}
    </section>
  );
}
