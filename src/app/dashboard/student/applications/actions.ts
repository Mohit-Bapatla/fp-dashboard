"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getCurrentStudentProfile } from "@/lib/student/profile";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function withdrawStudentApplication(formData: FormData) {
  const { userId } = await assertStudentAccess();
  const applicationId = getString(formData, "applicationId");

  if (!applicationId) {
    return;
  }

  const user = await getCurrentStudentProfile(userId);

  if (!user.studentProfile) {
    return;
  }

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      studentProfileId: user.studentProfile.id,
      status: {
        in: ["SUBMITTED", "UNDER_REVIEW"],
      },
    },
    select: {
      id: true,
    },
  });

  if (!application) {
    return;
  }

  await prisma.application.update({
    where: {
      id: application.id,
    },
    data: {
      status: "WITHDRAWN",
    },
  });

  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/applications");
}
