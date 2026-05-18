"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import {
  getNullableString,
  getOptionalDate,
  getSafeStaffRedirect,
  getString,
  isOutreachTaskStatus,
  isPartnerStatus,
} from "@/lib/staff/crm-validation";

function revalidateStaffCrmPaths() {
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/staff/partners");
  revalidatePath("/dashboard/staff/contacts");
  revalidatePath("/dashboard/staff/outreach");
}

export async function updatePartnerOutreach(formData: FormData) {
  await assertPlacementQueueAccess();

  const organizationId = getString(formData, "organizationId");
  const status = getString(formData, "status");
  const redirectTo = getSafeStaffRedirect(
    formData,
    "/dashboard/staff/partners",
  );

  if (!organizationId || !isPartnerStatus(status)) {
    redirect(redirectTo);
  }

  await prisma.partnerOrganization.update({
    where: {
      id: organizationId,
    },
    data: {
      description: getNullableString(formData, "description"),
      lastContactedAt: getOptionalDate(formData, "lastContactedAt"),
      nextFollowUpAt: getOptionalDate(formData, "nextFollowUpAt"),
      status,
    },
  });

  revalidateStaffCrmPaths();
  redirect(redirectTo);
}

export async function saveOutreachContact(formData: FormData) {
  await assertPlacementQueueAccess();

  const contactId = getString(formData, "contactId");
  const organizationId = getString(formData, "organizationId");
  const firstName = getString(formData, "firstName");
  const redirectTo = getSafeStaffRedirect(
    formData,
    "/dashboard/staff/contacts",
  );

  if (!organizationId || !firstName) {
    redirect(redirectTo);
  }

  const organization = await prisma.partnerOrganization.findUnique({
    where: {
      id: organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!organization) {
    redirect(redirectTo);
  }

  const data = {
    email: getNullableString(formData, "email"),
    firstName,
    lastContactedAt: getOptionalDate(formData, "lastContactedAt"),
    lastName: getNullableString(formData, "lastName"),
    nextFollowUpAt: getOptionalDate(formData, "nextFollowUpAt"),
    notes: getNullableString(formData, "notes"),
    organizationId: organization.id,
    phone: getNullableString(formData, "phone"),
    title: getNullableString(formData, "title"),
  };

  if (contactId) {
    await prisma.outreachContact.update({
      where: {
        id: contactId,
      },
      data,
    });
  } else {
    await prisma.outreachContact.create({
      data,
    });
  }

  revalidateStaffCrmPaths();
  redirect(redirectTo);
}

export async function saveOutreachTask(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();

  const taskId = getString(formData, "taskId");
  const title = getString(formData, "title");
  const status = getString(formData, "status");
  const redirectTo = getSafeStaffRedirect(
    formData,
    "/dashboard/staff/outreach",
  );

  if (!title || !isOutreachTaskStatus(status)) {
    redirect(redirectTo);
  }

  const [creator, assignedTo, organization, contact, placementRequest] =
    await Promise.all([
      prisma.user.findUnique({
        where: {
          clerkUserId: userId,
        },
        select: {
          id: true,
        },
      }),
      getString(formData, "assignedToId")
        ? prisma.user.findFirst({
            where: {
              id: getString(formData, "assignedToId"),
              role: {
                in: ["STAFF", "ADMIN", "SUPER_ADMIN"],
              },
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),
      getString(formData, "partnerOrganizationId")
        ? prisma.partnerOrganization.findUnique({
            where: {
              id: getString(formData, "partnerOrganizationId"),
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),
      getString(formData, "contactId")
        ? prisma.outreachContact.findUnique({
            where: {
              id: getString(formData, "contactId"),
            },
            select: {
              id: true,
              organizationId: true,
            },
          })
        : Promise.resolve(null),
      getString(formData, "placementRequestId")
        ? prisma.placementRequest.findUnique({
            where: {
              id: getString(formData, "placementRequestId"),
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),
    ]);

  const effectiveOrganizationId =
    organization?.id ?? contact?.organizationId ?? null;
  const completedAt = status === "COMPLETED" ? new Date() : null;
  const data = {
    assignedToId: assignedTo?.id ?? null,
    completedAt,
    contactId: contact?.id ?? null,
    description: getNullableString(formData, "description"),
    dueAt: getOptionalDate(formData, "dueAt"),
    notes: getNullableString(formData, "notes"),
    partnerOrganizationId: effectiveOrganizationId,
    placementRequestId: placementRequest?.id ?? null,
    status,
    title,
  };

  if (taskId) {
    await prisma.outreachTask.update({
      where: {
        id: taskId,
      },
      data,
    });
  } else {
    await prisma.outreachTask.create({
      data: {
        ...data,
        createdById: creator?.id ?? null,
      },
    });
  }

  revalidateStaffCrmPaths();
  redirect(redirectTo);
}
