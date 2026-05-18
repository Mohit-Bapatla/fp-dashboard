import { auth } from "@clerk/nextjs/server";
import {
  ArrowRight,
  ClipboardCheck,
  FileClock,
  GraduationCap,
  MapPin,
  Target,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { StudentResumeManager } from "@/components/student/student-resume-manager";
import { prisma } from "@/lib/db/prisma";
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
    placementRequestCount,
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
              in: ["SUBMITTED", "UNDER_REVIEW", "INTERVIEW", "ACCEPTED"],
            },
          },
        }),
        prisma.placementRequest.count({
          where: {
            studentProfileId: profile.id,
          },
        }),
      ])
    : [null, 0, 0, 0];

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student")}
      role="student"
    >
      <div className="space-y-8">
        <section className="flex flex-col justify-between gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start">
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
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
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
            helper={`${activeApplicationCount} active ${activeApplicationCount === 1 ? "application" : "applications"} in progress or accepted.`}
            label="Applications"
            value={applicationCount.toString()}
          />
          <StatCard
            helper="Personalized requests submitted to the placement team."
            label="Placement requests"
            value={placementRequestCount.toString()}
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
        </section>

        {profile ? (
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-lg border border-border bg-background p-6 shadow-sm">
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
                <div className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium text-muted-foreground">
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
                  label="Experience level"
                  value={profile.experienceLevel}
                />
              </div>
            </article>

            <article className="rounded-lg border border-border bg-background p-6 shadow-sm">
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
          <section className="rounded-lg border border-dashed border-border bg-background p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-muted text-primary">
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
              className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
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
                    id: resume.id,
                    fileName: resume.fileName,
                    updatedAt: resume.updatedAt,
                  }
                : null
            }
          />
          <article className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <ClipboardCheck
              aria-hidden="true"
              className="h-5 w-5 text-primary"
            />
            <h2 className="mt-4 text-base font-semibold text-foreground">
              Application tracker
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Review submitted applications, attached resumes, status updates,
              and withdrawal options for active submissions.
            </p>
            <Link
              className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
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
        </section>
      </div>
    </DashboardShell>
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
