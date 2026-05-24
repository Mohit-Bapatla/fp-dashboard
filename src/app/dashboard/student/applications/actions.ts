"use server";

import { revalidatePath } from "next/cache";

import { createAuditLog } from "@/lib/audit/audit-log";
import { prisma } from "@/lib/db/prisma";
import {
  createNotifications,
  getUsersByRoles,
} from "@/lib/notifications/notifications";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getCurrentStudentProfile } from "@/lib/student/profile";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function revalidateStudentApplicationPaths() {
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/applications");
  revalidatePath("/dashboard/partner");
  revalidatePath("/dashboard/partner/applicants");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/applications");
  revalidatePath("/dashboard/notifications");
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
      opportunity: {
        select: {
          title: true,
          organization: {
            select: {
              members: {
                select: {
                  userId: true,
                },
              },
              name: true,
            },
          },
        },
      },
      status: true,
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
  const adminUsers = await getUsersByRoles(["ADMIN", "SUPER_ADMIN"]);
  const studentName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  await Promise.all([
    createNotifications(
      [
        ...application.opportunity.organization.members.map(
          (member) => member.userId,
        ),
        ...adminUsers.map((adminUser) => adminUser.id),
      ],
      {
        body: `${studentName} withdrew from ${application.opportunity.title}.`,
        title: "Application withdrawn",
      },
    ),
    createAuditLog({
      action: "APPLICATION_WITHDRAWN",
      actorId: user.id,
      entityId: application.id,
      entityType: "Application",
      metadata: {
        newStatus: "WITHDRAWN",
        opportunityTitle: application.opportunity.title,
        previousStatus: application.status,
      },
    }),
  ]);

  revalidateStudentApplicationPaths();
}
