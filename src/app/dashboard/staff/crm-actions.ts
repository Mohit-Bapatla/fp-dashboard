"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAuditLog,
  getActorIdFromClerkUserId,
} from "@/lib/audit/audit-log";
import { prisma } from "@/lib/db/prisma";
import { outreachTaskAssignedEmail } from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { createNotifications } from "@/lib/notifications/notifications";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import {
  getNullableString,
  getOptionalDate,
  getSafeStaffRedirect,
  getString,
  isOutreachTaskPriority,
  isOutreachTaskStatus,
  isPartnerStatus,
} from "@/lib/staff/crm-validation";

function revalidateStaffCrmPaths() {
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/staff/partners");
  revalidatePath("/dashboard/staff/contacts");
  revalidatePath("/dashboard/staff/outreach");
  revalidatePath("/dashboard/staff/tasks");
  revalidatePath("/dashboard/notifications");
}

export async function updatePartnerOutreach(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();

  const organizationId = getString(formData, "organizationId");
  const status = getString(formData, "status");
  const redirectTo = getSafeStaffRedirect(
    formData,
    "/dashboard/staff/partners",
  );

  if (!organizationId || !isPartnerStatus(status)) {
    redirect(redirectTo);
  }

  const organization = await prisma.partnerOrganization.findFirst({
    where: {
      id: organizationId,
      isSystemPlaceholder: false,
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  if (!organization) {
    redirect(redirectTo);
  }

  await prisma.partnerOrganization.update({
    where: {
      id: organization.id,
    },
    data: {
      description: getNullableString(formData, "description"),
      lastContactedAt: getOptionalDate(formData, "lastContactedAt"),
      nextFollowUpAt: getOptionalDate(formData, "nextFollowUpAt"),
      status,
    },
  });
  const actorId = await getActorIdFromClerkUserId(userId);

  await createAuditLog({
    action: "PARTNER_OUTREACH_UPDATED",
    actorId,
    entityId: organization.id,
    entityType: "PartnerOrganization",
    metadata: {
      newStatus: status,
      organizationName: organization.name,
      previousStatus: organization.status,
    },
  });

  revalidateStaffCrmPaths();
  redirect(redirectTo);
}

export async function saveOutreachContact(formData: FormData) {
  const { userId } = await assertPlacementQueueAccess();

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

  const organization = await prisma.partnerOrganization.findFirst({
    where: {
      id: organizationId,
      isSystemPlaceholder: false,
    },
    select: {
      id: true,
    },
  });

  if (!organization) {
    redirect(redirectTo);
  }

  if (contactId) {
    const existingContact = await prisma.outreachContact.findFirst({
      where: {
        id: contactId,
        organization: { isSystemPlaceholder: false },
      },
      select: { id: true },
    });
    if (!existingContact) redirect(redirectTo);
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
    await createAuditLog({
      action: "OUTREACH_CONTACT_UPDATED",
      actorId: await getActorIdFromClerkUserId(userId),
      entityId: contactId,
      entityType: "OutreachContact",
      metadata: {
        firstName,
        organizationId: organization.id,
      },
    });
  } else {
    const contact = await prisma.outreachContact.create({
      data,
      select: {
        id: true,
      },
    });
    await createAuditLog({
      action: "OUTREACH_CONTACT_CREATED",
      actorId: await getActorIdFromClerkUserId(userId),
      entityId: contact.id,
      entityType: "OutreachContact",
      metadata: {
        firstName,
        organizationId: organization.id,
      },
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
  const priorityValue = getString(formData, "priority");
  const priority = isOutreachTaskPriority(priorityValue)
    ? priorityValue
    : "NORMAL";
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
              email: true,
              id: true,
            },
          })
        : Promise.resolve(null),
      getString(formData, "partnerOrganizationId")
        ? prisma.partnerOrganization.findFirst({
            where: {
              id: getString(formData, "partnerOrganizationId"),
              isSystemPlaceholder: false,
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),
      getString(formData, "contactId")
        ? prisma.outreachContact.findFirst({
            where: {
              id: getString(formData, "contactId"),
              organization: { isSystemPlaceholder: false },
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
    priority,
    status,
    title,
  };
  const existingTask = taskId
    ? await prisma.outreachTask.findFirst({
        where: {
          id: taskId,
          AND: [
            {
              OR: [
                { partnerOrganizationId: null },
                { partnerOrganization: { isSystemPlaceholder: false } },
              ],
            },
            {
              OR: [
                { contactId: null },
                {
                  contact: {
                    organization: { isSystemPlaceholder: false },
                  },
                },
              ],
            },
          ],
        },
        select: {
          assignedToId: true,
          status: true,
          title: true,
        },
      })
    : null;

  if (taskId && !existingTask) redirect(redirectTo);

  if (taskId) {
    await prisma.outreachTask.update({
      where: {
        id: taskId,
      },
      data,
    });
    const assignedChanged = existingTask?.assignedToId !== assignedTo?.id;
    const shouldNotifyAssignee = assignedTo && assignedChanged;
    const email = outreachTaskAssignedEmail(title);
    const emailResult = shouldNotifyAssignee
      ? await sendTransactionalEmail({
          ...email,
          to: assignedTo.email,
        })
      : null;

    await Promise.all([
      shouldNotifyAssignee
        ? createNotifications([assignedTo.id], {
            body: `${title} was assigned to you.`,
            title: "Outreach task assigned",
          })
        : Promise.resolve(0),
      createAuditLog({
        action: "OUTREACH_TASK_UPDATED",
        actorId: creator?.id ?? null,
        entityId: taskId,
        entityType: "OutreachTask",
        metadata: {
          emailSent: emailResult?.sent ?? false,
          emailSkipped: emailResult?.skipped ?? true,
          newAssignedToId: assignedTo?.id ?? null,
          newStatus: status,
          previousAssignedToId: existingTask?.assignedToId ?? null,
          previousStatus: existingTask?.status ?? null,
          title,
        },
      }),
    ]);
  } else {
    const task = await prisma.outreachTask.create({
      data: {
        ...data,
        createdById: creator?.id ?? null,
      },
      select: {
        id: true,
      },
    });
    const email = outreachTaskAssignedEmail(title);
    const emailResult = assignedTo
      ? await sendTransactionalEmail({
          ...email,
          to: assignedTo.email,
        })
      : null;

    await Promise.all([
      assignedTo
        ? createNotifications([assignedTo.id], {
            body: `${title} was assigned to you.`,
            title: "Outreach task assigned",
          })
        : Promise.resolve(0),
      createAuditLog({
        action: "OUTREACH_TASK_CREATED",
        actorId: creator?.id ?? null,
        entityId: task.id,
        entityType: "OutreachTask",
        metadata: {
          assignedToId: assignedTo?.id ?? null,
          emailSent: emailResult?.sent ?? false,
          emailSkipped: emailResult?.skipped ?? true,
          status,
          title,
        },
      }),
    ]);
  }

  revalidateStaffCrmPaths();
  redirect(redirectTo);
}
