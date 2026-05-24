"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ApplicationOnboardingItemStatus } from "@/generated/prisma/enums";
import { createAuditLog } from "@/lib/audit/audit-log";
import { getAppRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";

const reviewerStatuses: ApplicationOnboardingItemStatus[] = [
  "APPROVED",
  "NEEDS_CHANGES",
  "WAIVED",
];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getSafeRedirect(formData: FormData) {
  const redirectTo = getString(formData, "redirectTo");

  return redirectTo.startsWith("/dashboard") ? redirectTo : "/dashboard";
}

async function getCurrentUser() {
  const { sessionClaims, userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkUserId: userId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  return user
    ? {
        ...user,
        claimRole: getAppRole(sessionClaims?.metadata?.role),
      }
    : null;
}

async function canReviewApplication(applicationId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      partnerMemberships: {
        select: {
          organizationId: true,
        },
      },
      role: true,
    },
  });

  if (!user) {
    return false;
  }

  if (["STAFF", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return true;
  }

  const organizationIds = user.partnerMemberships.map(
    (membership) => membership.organizationId,
  );

  if (organizationIds.length === 0) {
    return false;
  }

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      opportunity: {
        organizationId: {
          in: organizationIds,
        },
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(application);
}

export async function submitOnboardingItemConfirmation(formData: FormData) {
  const itemId = getString(formData, "itemId");
  const studentNotes = getString(formData, "studentNotes");
  const redirectTo = getSafeRedirect(formData);
  const user = await getCurrentUser();

  if (!itemId || !user || user.claimRole !== "STUDENT") {
    redirect(redirectTo);
  }

  const item = await prisma.applicationOnboardingItem.findFirst({
    where: {
      id: itemId,
      application: {
        status: "ACCEPTED",
        studentProfile: {
          userId: user.id,
        },
      },
      status: {
        notIn: ["APPROVED", "WAIVED"],
      },
    },
    select: {
      applicationId: true,
      id: true,
      title: true,
    },
  });

  if (!item) {
    redirect(redirectTo);
  }

  await prisma.applicationOnboardingItem.update({
    where: {
      id: item.id,
    },
    data: {
      status: "SUBMITTED",
      studentNotes: studentNotes || null,
      submittedAt: new Date(),
    },
  });

  await createAuditLog({
    action: "ONBOARDING_ITEM_SUBMITTED",
    actorId: user.id,
    entityId: item.applicationId,
    entityType: "Application",
    metadata: {
      itemId: item.id,
      title: item.title,
    },
  });

  revalidatePath(redirectTo);
  redirect(redirectTo);
}

export async function reviewOnboardingItem(formData: FormData) {
  const itemId = getString(formData, "itemId");
  const reviewerNotes = getString(formData, "reviewerNotes");
  const status = getString(
    formData,
    "status",
  ) as ApplicationOnboardingItemStatus;
  const redirectTo = getSafeRedirect(formData);
  const user = await getCurrentUser();

  if (!itemId || !user || !reviewerStatuses.includes(status)) {
    redirect(redirectTo);
  }

  const item = await prisma.applicationOnboardingItem.findUnique({
    where: {
      id: itemId,
    },
    select: {
      applicationId: true,
      id: true,
      title: true,
    },
  });

  if (!item || !(await canReviewApplication(item.applicationId, user.id))) {
    redirect(redirectTo);
  }

  await prisma.applicationOnboardingItem.update({
    where: {
      id: item.id,
    },
    data: {
      completedAt:
        status === "APPROVED" || status === "WAIVED" ? new Date() : null,
      reviewedAt: new Date(),
      reviewerId: user.id,
      reviewerNotes: reviewerNotes || null,
      status,
    },
  });

  await createAuditLog({
    action: "ONBOARDING_ITEM_REVIEWED",
    actorId: user.id,
    entityId: item.applicationId,
    entityType: "Application",
    metadata: {
      itemId: item.id,
      status,
      title: item.title,
    },
  });

  revalidatePath(redirectTo);
  redirect(redirectTo);
}

export async function addOnboardingItem(formData: FormData) {
  const applicationId = getString(formData, "applicationId");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const redirectTo = getSafeRedirect(formData);
  const user = await getCurrentUser();

  if (!applicationId || !title || !user) {
    redirect(redirectTo);
  }

  if (!(await canReviewApplication(applicationId, user.id))) {
    redirect(redirectTo);
  }

  const item = await prisma.applicationOnboardingItem.upsert({
    where: {
      applicationId_title: {
        applicationId,
        title,
      },
    },
    create: {
      applicationId,
      description: description || null,
      title,
    },
    update: {
      description: description || null,
    },
    select: {
      id: true,
    },
  });

  await createAuditLog({
    action: "ONBOARDING_ITEM_ADDED",
    actorId: user.id,
    entityId: applicationId,
    entityType: "Application",
    metadata: {
      itemId: item.id,
      title,
    },
  });

  revalidatePath(redirectTo);
  redirect(redirectTo);
}
