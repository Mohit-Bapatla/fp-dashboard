import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { StudentOnboardingForm } from "@/components/student/student-onboarding-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { getRoleFromSessionClaims } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { safeInternalPath } from "@/lib/security/safe-url";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getStudentOnboardingProgress } from "@/lib/student/onboarding-progress";
import {
  initialStudentOnboardingActionState,
  type StudentOnboardingActionState,
} from "@/lib/student/onboarding-state";
import { getOrCreateCurrentStudentUser } from "@/lib/student/profile";

function listToText(value: string[]) {
  return value.join(", ");
}

const gradeYearOptions = new Set([
  "High school freshman",
  "High school sophomore",
  "High school junior",
  "High school senior",
  "College freshman",
  "College sophomore",
  "College junior",
  "College senior",
  "Graduate student",
  "Medical student",
  "Gap year / post-baccalaureate",
  "Other",
]);

function getGradeYearValues(value: string | null | undefined) {
  if (!value || gradeYearOptions.has(value)) {
    return {
      gradeYear: value ?? "",
      gradeYearCustom: "",
    };
  }

  return {
    gradeYear: "Other",
    gradeYearCustom: value,
  };
}

export default async function StudentOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  if (getRoleFromSessionClaims(sessionClaims) !== "STUDENT") {
    redirect("/dashboard");
  }

  const user = await getOrCreateCurrentStudentUser(userId);
  const query = await searchParams;
  const requestedReturnTo = Array.isArray(query.returnTo)
    ? query.returnTo[0]
    : query.returnTo;
  const returnTo = safeInternalPath(requestedReturnTo, "/dashboard/student");
  const profile = user.studentProfile;
  const progress = getStudentOnboardingProgress({
    firstName: user.firstName,
    lastName: user.lastName,
    profile,
  });
  const minimumAgeAffirmation =
    profile && !progress.isComplete
      ? await prisma.auditLog.findFirst({
          where: {
            action: "STUDENT_ONBOARDING_AGE_AFFIRMED",
            actorId: user.id,
            entityId: profile.id,
            entityType: "StudentProfile",
          },
          select: { id: true },
        })
      : null;
  const gradeYearValues = getGradeYearValues(profile?.gradeYear);
  const initialState: StudentOnboardingActionState = {
    ...initialStudentOnboardingActionState,
    resumeStep: progress.firstIncompleteStep,
    values: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      school: profile?.school ?? "",
      gradeYear: gradeYearValues.gradeYear,
      gradeYearCustom: gradeYearValues.gradeYearCustom,
      city: profile?.city ?? "",
      state: profile?.state ?? "",
      country: profile?.country ?? "",
      locationPreference: profile?.locationPreference ?? "",
      remotePreference: profile?.remotePreference ?? "",
      interestedSpecialties: listToText(profile?.interestedSpecialties ?? []),
      opportunityTypes: profile?.opportunityTypes ?? [],
      availability: listToText(profile?.availability ?? []),
      languages: listToText(profile?.languages ?? []),
      careerGoals: profile?.careerGoals ?? "",
      linkedinUrl: profile?.linkedinUrl ?? "",
      githubUrl: profile?.githubUrl ?? "",
      portfolioUrl: profile?.portfolioUrl ?? "",
      ageYears: profile?.ageYears?.toString() ?? "",
      maximumTravelMiles: profile?.maximumTravelMiles?.toString() ?? "",
      paidOnlyPreference:
        profile?.paidOnlyPreference == null
          ? ""
          : String(profile.paidOnlyPreference),
      preferredSeasons: listToText(profile?.preferredSeasons ?? []),
      certifications: listToText(profile?.certifications ?? []),
      transportationNotes: profile?.transportationNotes ?? "",
    },
  };

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/onboarding")}
      role="student"
    >
      <div className="space-y-8">
        <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="student" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Student onboarding
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            {progress.isComplete
              ? "Edit your profile"
              : profile
                ? "Continue your student profile"
                : "Create your student profile"}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Share your goals, availability, location preferences, and interests
            so Future Physicians can match you with the right healthcare
            opportunities as soon as you finish. Fields marked with an asterisk
            are required; you can add a resume later from your dashboard.
          </p>
        </section>

        <StudentOnboardingForm
          initialStep={progress.firstIncompleteStep}
          initialState={initialState}
          requiresMinimumAgeAffirmation={
            !progress.isComplete && !minimumAgeAffirmation
          }
          returnTo={returnTo}
        />
      </div>
    </DashboardShell>
  );
}
