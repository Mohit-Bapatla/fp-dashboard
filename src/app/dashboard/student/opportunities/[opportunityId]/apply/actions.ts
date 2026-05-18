"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { assertStudentAccess } from "@/lib/student/authorization";
import type { StudentApplicationActionState } from "@/lib/student/application-validation";
import { validateStudentApplicationForm } from "@/lib/student/application-validation";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { redirect } from "next/navigation";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function submitStudentApplication(
  _previousState: StudentApplicationActionState,
  formData: FormData,
): Promise<StudentApplicationActionState> {
  const { userId } = await assertStudentAccess();
  const opportunityId = getString(formData, "opportunityId");
  const validation = validateStudentApplicationForm(formData);

  if (!validation.success) {
    return {
      fieldErrors: validation.errors,
      formError: "Please fix the highlighted fields.",
      values: validation.values,
    };
  }

  if (!opportunityId) {
    return {
      fieldErrors: {},
      formError: "Opportunity could not be found.",
      values: validation.values,
    };
  }

  const user = await getCurrentStudentProfile(userId);

  if (!user.studentProfile) {
    redirect("/dashboard/student/onboarding");
  }

  const [opportunity, resume, existingApplication] = await Promise.all([
    prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
      },
    }),
    prisma.resume.findFirst({
      where: {
        id: validation.data.resumeId,
        studentProfileId: user.studentProfile.id,
      },
      select: {
        id: true,
      },
    }),
    prisma.application.findUnique({
      where: {
        studentProfileId_opportunityId: {
          studentProfileId: user.studentProfile.id,
          opportunityId,
        },
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!opportunity) {
    return {
      fieldErrors: {},
      formError: "This opportunity is no longer accepting applications.",
      values: validation.values,
    };
  }

  if (!resume) {
    return {
      fieldErrors: {
        resumeId: "Choose one of your uploaded resumes.",
      },
      formError: "Resume could not be found.",
      values: validation.values,
    };
  }

  if (existingApplication) {
    redirect(
      `/dashboard/student/opportunities/${opportunityId}/apply?alreadyApplied=1`,
    );
  }

  try {
    await prisma.application.create({
      data: {
        studentProfileId: user.studentProfile.id,
        opportunityId,
        resumeId: resume.id,
        status: "SUBMITTED",
        statement: validation.data.statement,
        submittedAt: new Date(),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect(
        `/dashboard/student/opportunities/${opportunityId}/apply?alreadyApplied=1`,
      );
    }

    return {
      fieldErrors: {},
      formError: "Application could not be submitted. Please try again.",
      values: validation.values,
    };
  }

  redirect(`/dashboard/student/opportunities/${opportunityId}/apply?success=1`);
}
