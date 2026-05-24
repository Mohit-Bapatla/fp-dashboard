import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { StudentOnboardingForm } from "@/components/student/student-onboarding-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { roleNavigation } from "@/components/dashboard/role-config";
import { getRoleFromSessionClaims } from "@/lib/auth/roles";
import {
  initialStudentOnboardingActionState,
  type StudentOnboardingActionState,
} from "@/lib/student/onboarding-state";
import { getOrCreateCurrentStudentUser } from "@/lib/student/profile";

function listToText(value: string[]) {
  return value.join(", ");
}

export default async function StudentOnboardingPage() {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  if (getRoleFromSessionClaims(sessionClaims) !== "STUDENT") {
    redirect("/dashboard");
  }

  const user = await getOrCreateCurrentStudentUser(userId);
  const profile = user.studentProfile;
  const initialState: StudentOnboardingActionState = {
    ...initialStudentOnboardingActionState,
    values: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      school: profile?.school ?? "",
      gradeYear: profile?.gradeYear ?? "",
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
      experienceLevel: profile?.experienceLevel ?? "",
      linkedinUrl: profile?.linkedinUrl ?? "",
      githubUrl: profile?.githubUrl ?? "",
      portfolioUrl: profile?.portfolioUrl ?? "",
    },
  };

  return (
    <DashboardShell navItems={roleNavigation.student} role="student">
      <div className="space-y-8">
        <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="student" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Student onboarding
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            {profile ? "Edit your profile" : "Create your student profile"}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Share your goals, availability, location preferences, and interests
            so Future Physicians can match you with the right healthcare
            opportunities later.
          </p>
        </section>

        <StudentOnboardingForm initialState={initialState} />
      </div>
    </DashboardShell>
  );
}
