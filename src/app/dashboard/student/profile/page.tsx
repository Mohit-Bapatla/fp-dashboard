import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StudentOnboardingForm } from "@/components/student/student-onboarding-form";
import { StudentResumeManager } from "@/components/student/student-resume-manager";
import { prisma } from "@/lib/db/prisma";
import {
  initialStudentOnboardingActionState,
  type StudentOnboardingActionState,
} from "@/lib/student/onboarding-state";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { assertStudentAccess } from "@/lib/student/authorization";

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

export default async function StudentProfilePage() {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const profile = user.studentProfile;
  const gradeYearValues = getGradeYearValues(profile?.gradeYear);
  const resume = profile
    ? await prisma.resume.findFirst({
        where: {
          studentProfileId: profile.id,
        },
        orderBy: {
          updatedAt: "desc",
        },
      })
    : null;
  const initialState: StudentOnboardingActionState = {
    ...initialStudentOnboardingActionState,
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
      navItems={getStudentNavItems("/dashboard/student/profile")}
      role="student"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="student" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Student profile
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
            Profile and Resume
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Keep your profile, interests, availability, and resume current so FP
            can match you to relevant opportunities.
          </p>
        </header>

        <StudentOnboardingForm initialState={initialState} />
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
      </div>
    </DashboardShell>
  );
}
