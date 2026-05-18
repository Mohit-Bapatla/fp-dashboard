"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ApplicationStatus } from "@/generated/prisma/enums";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { prisma } from "@/lib/db/prisma";

const adminUpdateStatuses: ApplicationStatus[] = [
  "UNDER_REVIEW",
  "INTERVIEW",
  "ACCEPTED",
  "REJECTED",
];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getSafeRedirectTo(formData: FormData) {
  const redirectTo = getString(formData, "redirectTo");

  return redirectTo.startsWith("/dashboard/admin/applications")
    ? redirectTo
    : "/dashboard/admin/applications";
}

function revalidateApplicationStatusPaths() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/applications");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/applications");
  revalidatePath("/dashboard/partner");
  revalidatePath("/dashboard/partner/applicants");
}

export async function updateAdminApplicationStatus(formData: FormData) {
  await assertAdminAccess();

  const applicationId = getString(formData, "applicationId");
  const status = getString(formData, "status") as ApplicationStatus;
  const redirectTo = getSafeRedirectTo(formData);

  if (!applicationId || !adminUpdateStatuses.includes(status)) {
    redirect(redirectTo);
  }

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      status: {
        not: "WITHDRAWN",
      },
    },
    select: {
      id: true,
    },
  });

  if (application) {
    await prisma.application.update({
      where: {
        id: application.id,
      },
      data: {
        reviewedAt: new Date(),
        status,
      },
    });
  }

  revalidateApplicationStatusPaths();
  redirect(redirectTo);
}
