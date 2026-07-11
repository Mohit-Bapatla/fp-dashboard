import { auth } from "@clerk/nextjs/server";
import {
  ArrowRight,
  BellRing,
  ClipboardCheck,
  FileClock,
  GraduationCap,
  LifeBuoy,
  MapPin,
  Rocket,
  Target,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { StudentResumeManager } from "@/components/student/student-resume-manager";
import {
  RecommendationEventTracker,
  TrackedRecommendationLink,
} from "@/components/student/recommendation-event-tracker";
import { prisma } from "@/lib/db/prisma";
import { getRecommendationExplanation } from "@/lib/matching/explanations";
import { getRecommendedOpportunities } from "@/lib/matching/recommendations";
import { EligibilityBadge } from "@/components/opportunities/eligibility-badge";
import { OpportunityRelationshipBadge } from "@/components/opportunities/opportunity-relationship-badge";
import {
  dismissRecommendation,
  saveOpportunity,
} from "@/app/dashboard/student/saved/actions";
import { startApplicationWorkspace } from "@/app/dashboard/student/applications/workspace-actions";
import { cn } from "@/lib/utils";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getStudentProfileCompletion } from "@/lib/student/profile-completion";
import { getCurrentStudentProfile } from "@/lib/student/profile";

export default async function StudentDashboardPage() {
  const { redirectToSignIn, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const user = await getCurrentStudentProfile(userId);
  const profile = user.studentProfile;
  const completion = getStudentProfileCompletion(profile);
  const [
    resume,
    applicationCount,
    activeApplicationCount,
    acceptedApplicationCount,
    rejectedApplicationCount,
    withdrawnApplicationCount,
    placementRequestCount,
    verifiedServiceHours,
    certificateCount,
  ] = profile
    ? await Promise.all([
        prisma.resume.findFirst({
          where: {
            studentProfileId: profile.id,
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
        prisma.application.count({
          where: {
            studentProfileId: profile.id,
          },
        }),
        prisma.application.count({
          where: {
            studentProfileId: profile.id,
            status: {
              in: [
                "SUBMITTED",
                "UNDER_REVIEW",
                "INTERVIEW",
                "WAITLISTED",
                "ACCEPTED",
              ],
            },
          },
        }),
        prisma.application.count({
          where: {
            studentProfileId: profile.id,
            status: "ACCEPTED",
          },
        }),
        prisma.application.count({
          where: {
            studentProfileId: profile.id,
            status: "REJECTED",
          },
        }),
        prisma.application.count({
          where: {
            studentProfileId: profile.id,
            status: "WITHDRAWN",
          },
        }),
        prisma.placementRequest.count({
          where: {
            studentProfileId: profile.id,
          },
        }),
        prisma.serviceHourRecord.aggregate({
          where: {
            studentProfileId: profile.id,
            verificationStatus: "VERIFIED",
          },
          _sum: {
            hours: true,
          },
        }),
        prisma.serviceHourRecord.count({
          where: {
            studentProfileId: profile.id,
            certificateStatus: {
              in: ["APPROVED", "ISSUED"],
            },
          },
        }),
      ])
    : [null, 0, 0, 0, 0, 0, 0, { _sum: { hours: 0 } }, 0];
  const recommendedOpportunities = profile
    ? await getRecommendedOpportunities(profile.id)
    : [];
  const recentWorkspace = profile
    ? await prisma.application.findFirst({
        where: {
          studentProfileId: profile.id,
          status: {
            in: [
              "DRAFT",
              "SAVED",
              "PLANNING",
              "PREPARING",
              "WAITING_FOR_RECOMMENDATION",
              "READY_TO_SUBMIT",
            ],
          },
        },
        orderBy: { lastActivityAt: "desc" },
        select: {
          id: true,
          completionPercent: true,
          nextAction: true,
          opportunity: { select: { title: true, deadline: true } },
        },
      })
    : null;

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student")}
      role="student"
    >
      <div className="space-y-8">
        <section className="flex flex-col justify-between gap-5 rounded-xl border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <RoleBadge className="mb-5" role="student" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Learner workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Student Dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Manage your student profile and track readiness for future
              healthcare opportunity matching.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            href="/dashboard/student/onboarding"
          >
            {profile ? "Edit profile" : "Start onboarding"}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </section>

        <section
          aria-label="Student profile stats"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            helper={`${completion.completedFields} of ${completion.totalFields} required sections complete.`}
            label="Profile completion"
            value={`${completion.percent}%`}
          />
          <StatCard
            helper="All applications submitted from your student profile."
            label="Applications submitted"
            value={applicationCount.toString()}
          />
          <StatCard
            helper="Applications still submitted, under review, interviewing, or accepted."
            label="Active applications"
            value={activeApplicationCount.toString()}
          />
          <StatCard
            helper="Personalized requests submitted to the placement team."
            label="Placement requests"
            value={placementRequestCount.toString()}
          />
          <StatCard
            helper={`${rejectedApplicationCount} rejected and ${withdrawnApplicationCount} withdrawn.`}
            label="Accepted"
            value={acceptedApplicationCount.toString()}
          />
          <StatCard
            helper={
              resume
                ? "Your private resume file is uploaded."
                : "Upload a PDF or DOCX resume when your profile is ready."
            }
            label="Resume status"
            value={resume ? "Ready" : "Missing"}
          />
          <StatCard
            helper="Verified hours from accepted opportunities."
            label="Service hours"
            value={(verifiedServiceHours._sum.hours ?? 0).toString()}
          />
          <StatCard
            helper="Approved or issued certificate records."
            label="Certificates"
            value={certificateCount.toString()}
          />
        </section>

        {profile && !completion.isComplete && (
          <NextStepCallout
            href="/dashboard/student/onboarding"
            label="Finish profile"
            message={`Your profile is ${completion.percent}% complete — finish all sections to improve placement readiness.`}
          />
        )}
        {profile && completion.isComplete && !resume && (
          <NextStepCallout
            href="/dashboard/student"
            label="Upload resume"
            message="Profile complete. Upload your resume so you are ready to apply faster."
          />
        )}
        {profile &&
          completion.isComplete &&
          resume &&
          applicationCount === 0 && (
            <NextStepCallout
              href="/dashboard/student/opportunities"
              label="Browse opportunities"
              message="Ready to apply — browse open opportunities and submit your first application."
            />
          )}

        {profile ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Recommended opportunities
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Personalized suggestions use your profile, parsed resume data,
                and deterministic match scoring.
              </p>
            </div>
            {recommendedOpportunities.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <RecommendationEventTracker
                  events={recommendedOpportunities.map(
                    ({ match, opportunity }) => ({
                      eventType: "IMPRESSION",
                      matchScore: match.score,
                      opportunityId: opportunity.id,
                      source: "student_dashboard_recommendation",
                    }),
                  )}
                />
                {recommendedOpportunities.map(
                  ({ eligibility, match, opportunity, vectorSimilarity }) => (
                    <article
                      className="rounded-lg border border-border bg-background p-5 shadow-sm"
                      key={opportunity.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <EligibilityBadge category={eligibility.category} />
                        <OpportunityRelationshipBadge
                          relationshipType={opportunity.relationshipType}
                        />
                        <p className="text-xs font-medium text-muted-foreground">
                          {opportunity.organization.name}
                        </p>
                      </div>
                      {vectorSimilarity > 0 ? (
                        <p className="mt-3 text-xs font-medium text-muted-foreground">
                          Semantic similarity is helping rank this
                          recommendation.
                        </p>
                      ) : null}
                      <h3 className="mt-4 text-base font-semibold text-foreground">
                        {opportunity.title}
                      </h3>
                      <p className="mt-2 text-xs font-medium text-muted-foreground">
                        Why it may fit · ranking score {match.score}
                      </p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                        {getRecommendationExplanation(match)
                          .whyRecommended.slice(0, 2)
                          .map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                      </ul>
                      <p className="mt-3 text-xs font-medium text-muted-foreground">
                        Improve fit:{" "}
                        {getRecommendationExplanation(match).improvementTips.at(
                          0,
                        )}
                      </p>
                      <TrackedRecommendationLink
                        className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                        href={`/dashboard/student/opportunities/${opportunity.id}?source=recommendation`}
                        matchScore={match.score}
                        opportunityId={opportunity.id}
                        source="student_dashboard_recommendation"
                      >
                        View details
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </TrackedRecommendationLink>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <form action={saveOpportunity}>
                          <input
                            name="opportunityId"
                            type="hidden"
                            value={opportunity.id}
                          />
                          <button
                            className="rounded-md border border-border px-3 py-2 text-sm"
                            type="submit"
                          >
                            Save
                          </button>
                        </form>
                        <form action={dismissRecommendation}>
                          <input
                            name="opportunityId"
                            type="hidden"
                            value={opportunity.id}
                          />
                          <button
                            className="rounded-md border border-border px-3 py-2 text-sm"
                            type="submit"
                          >
                            Dismiss
                          </button>
                        </form>
                        <form action={startApplicationWorkspace}>
                          <input
                            name="opportunityId"
                            type="hidden"
                            value={opportunity.id}
                          />
                          <button
                            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                            type="submit"
                          >
                            Start application
                          </button>
                        </form>
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-background p-5 text-sm leading-6 text-muted-foreground">
                Recommendations will appear after published opportunities are
                available and your profile is complete enough to compare.
              </div>
            )}
          </section>
        ) : null}

        {recentWorkspace ? (
          <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Continue where you left off
            </p>
            <h2 className="mt-3 text-xl font-semibold">
              {recentWorkspace.opportunity.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {recentWorkspace.completionPercent}% complete ·{" "}
              {recentWorkspace.nextAction ??
                "Review your preparation checklist."}
            </p>
            <Link
              className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              href={`/dashboard/student/applications/${recentWorkspace.id}`}
            >
              Continue application
            </Link>
          </section>
        ) : null}

        {profile ? (
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-xl border border-border bg-background p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Profile summary
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    This is the information Future Physicians will use for
                    future matching workflows.
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    completion.isComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-border bg-muted/50 text-muted-foreground",
                  )}
                >
                  {completion.isComplete ? "Complete" : "In progress"}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <ProfileDetail
                  icon={GraduationCap}
                  label="School"
                  value={profile.school}
                />
                <ProfileDetail
                  icon={UserRound}
                  label="Grade year"
                  value={profile.gradeYear}
                />
                <ProfileDetail
                  icon={MapPin}
                  label="Location"
                  value={[profile.city, profile.state, profile.country]
                    .filter(Boolean)
                    .join(", ")}
                />
                <ProfileDetail
                  icon={Target}
                  label="Remote preference"
                  value={profile.remotePreference ?? "No preference set"}
                />
              </div>
            </article>

            <article className="rounded-xl border border-border bg-background p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground">
                Interests
              </h2>
              <div className="mt-5 space-y-4">
                <ProfileList
                  label="Specialties"
                  values={profile.interestedSpecialties}
                />
                <ProfileList
                  label="Opportunity types"
                  values={profile.opportunityTypes}
                />
                <ProfileList
                  label="Availability"
                  values={profile.availability}
                />
                <ProfileList label="Languages" values={profile.languages} />
              </div>
            </article>
          </section>
        ) : (
          <section className="rounded-xl border border-dashed border-border bg-background p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted text-primary">
              <ClipboardCheck aria-hidden="true" className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-foreground">
              Create your profile to get started
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Your dashboard is ready, but we need your school, location,
              interests, and goals before future matching workflows can use your
              profile.
            </p>
            <Link
              className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              href="/dashboard/student/onboarding"
            >
              Start onboarding
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-2">
          <StudentResumeManager
            hasProfile={Boolean(profile)}
            resume={
              resume
                ? {
                    extractedCertifications: resume.extractedCertifications,
                    extractedEducation: resume.extractedEducation,
                    extractedExperience: resume.extractedExperience,
                    extractedSkills: resume.extractedSkills,
                    id: resume.id,
                    fileName: resume.fileName,
                    parsedSummary: resume.parsedSummary,
                    parseStatus: resume.parseStatus,
                    updatedAt: resume.updatedAt,
                  }
                : null
            }
          />
          <article className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-muted text-primary">
              <ClipboardCheck aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-base font-semibold text-foreground">
              Application tracker
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {applicationCount === 0
                ? "Once you apply to opportunities, your submissions will appear here for tracking."
                : `${applicationCount} ${applicationCount === 1 ? "application" : "applications"} tracked${activeApplicationCount > 0 ? ` — ${activeApplicationCount} active` : ""}.`}
            </p>
            <Link
              className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              href="/dashboard/student/applications"
            >
              View applications
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </article>
          <article className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <FileClock aria-hidden="true" className="h-5 w-5 text-primary" />
            <h2 className="mt-4 text-base font-semibold text-foreground">
              Can&apos;t find an opportunity?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Submit a personalized placement request when the opportunity board
              does not have the right fit for your goals or availability.
            </p>
            <Link
              className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              href="/dashboard/student/placement-requests"
            >
              View placement requests
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </article>
          <article className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <Rocket aria-hidden="true" className="h-5 w-5 text-primary" />
            <h2 className="mt-4 text-base font-semibold text-foreground">
              Student beta guide
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Review the beta checklist for profile setup, resume upload,
              opportunity browsing, applications, notifications, and feedback.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/student/beta"
              >
                <BellRing aria-hidden="true" className="h-4 w-4" />
                Beta guide
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/support"
              >
                <LifeBuoy aria-hidden="true" className="h-4 w-4" />
                Support
              </Link>
            </div>
          </article>
        </section>
      </div>
    </DashboardShell>
  );
}

type NextStepCalloutProps = {
  message: string;
  href: string;
  label: string;
};

function NextStepCallout({ message, href, label }: NextStepCalloutProps) {
  return (
    <aside className="flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/[0.04] px-5 py-4">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link
        className="shrink-0 rounded text-sm font-medium text-primary transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        href={href}
      >
        {label} <span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
}

type ProfileDetailProps = {
  icon: typeof GraduationCap;
  label: string;
  value: string | null;
};

function ProfileDetail({ icon: Icon, label, value }: ProfileDetailProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
      <p className="mt-3 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">
        {value || "Not provided"}
      </p>
    </div>
  );
}

type ProfileListProps = {
  label: string;
  values: readonly string[];
};

function ProfileList({ label, values }: ProfileListProps) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {values.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
              key={value}
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Not provided</p>
      )}
    </div>
  );
}
