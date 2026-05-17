"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getAppRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import type { StudentOnboardingActionState } from "@/lib/student/onboarding-state";
import { getOrCreateCurrentStudentUser } from "@/lib/student/profile";
import { validateStudentProfileForm } from "@/lib/student/profile-validation";

export async function saveStudentProfile(
  _previousState: StudentOnboardingActionState,
  formData: FormData,
): Promise<StudentOnboardingActionState> {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  if (getAppRole(sessionClaims?.metadata?.role) !== "STUDENT") {
    redirect("/dashboard");
  }

  const validation = validateStudentProfileForm(formData);

  if (!validation.success) {
    return {
      fieldErrors: validation.errors,
      formError: "Please fix the highlighted fields.",
      values: validation.values,
    };
  }

  const user = await getOrCreateCurrentStudentUser(userId);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      firstName: validation.data.firstName,
      lastName: validation.data.lastName,
    },
  });

  await prisma.studentProfile.upsert({
    where: {
      userId: user.id,
    },
    update: {
      school: validation.data.school,
      gradeYear: validation.data.gradeYear,
      city: validation.data.city,
      state: validation.data.state,
      country: validation.data.country,
      locationPreference: validation.data.locationPreference,
      remotePreference: validation.data.remotePreference,
      interestedSpecialties: validation.data.interestedSpecialties,
      opportunityTypes: validation.data.opportunityTypes,
      availability: validation.data.availability,
      languages: validation.data.languages,
      careerGoals: validation.data.careerGoals,
      experienceLevel: validation.data.experienceLevel,
      linkedinUrl: validation.data.linkedinUrl,
      githubUrl: validation.data.githubUrl,
      portfolioUrl: validation.data.portfolioUrl,
    },
    create: {
      userId: user.id,
      school: validation.data.school,
      gradeYear: validation.data.gradeYear,
      city: validation.data.city,
      state: validation.data.state,
      country: validation.data.country,
      locationPreference: validation.data.locationPreference,
      remotePreference: validation.data.remotePreference,
      interestedSpecialties: validation.data.interestedSpecialties,
      opportunityTypes: validation.data.opportunityTypes,
      availability: validation.data.availability,
      languages: validation.data.languages,
      careerGoals: validation.data.careerGoals,
      experienceLevel: validation.data.experienceLevel,
      linkedinUrl: validation.data.linkedinUrl,
      githubUrl: validation.data.githubUrl,
      portfolioUrl: validation.data.portfolioUrl,
    },
  });

  redirect("/dashboard/student");
}
