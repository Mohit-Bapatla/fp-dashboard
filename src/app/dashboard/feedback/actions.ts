"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type {
  FeedbackEntityType,
  FeedbackType,
  UserRole,
} from "@/generated/prisma/enums";
import { createAuditLog } from "@/lib/audit/audit-log";
import { getRoleFromSessionClaims } from "@/lib/auth/roles";
import { syncCurrentUserFromClerk } from "@/lib/auth/user-sync";
import { prisma } from "@/lib/db/prisma";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";

const feedbackTypes: FeedbackType[] = [
  "STUDENT_APPLICATION_EXPERIENCE",
  "STUDENT_PLACEMENT_REQUEST",
  "PARTNER_APPLICANT_QUALITY",
  "PARTNER_REVIEW_USEFULNESS",
  "STAFF_MATCH_QUALITY",
  "STAFF_PLACEMENT_DIFFICULTY",
];
const entityTypes: FeedbackEntityType[] = [
  "APPLICATION",
  "OPPORTUNITY",
  "PLACEMENT_REQUEST",
  "USER",
];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getSafeRedirect(formData: FormData) {
  const redirectTo = getString(formData, "redirectTo");

  return redirectTo.startsWith("/dashboard") ? redirectTo : "/dashboard";
}

function isStaffRole(role: UserRole) {
  return role === "STAFF" || role === "ADMIN" || role === "SUPER_ADMIN";
}

async function canSubmitFeedback({
  entityId,
  entityType,
  feedbackType,
  role,
  userId,
}: {
  entityId: string;
  entityType: FeedbackEntityType;
  feedbackType: FeedbackType;
  role: UserRole;
  userId: string;
}) {
  if (
    role === "STUDENT" &&
    feedbackType === "STUDENT_APPLICATION_EXPERIENCE" &&
    entityType === "APPLICATION"
  ) {
    return Boolean(
      await prisma.application.findFirst({
        where: {
          id: entityId,
          studentProfile: {
            userId,
          },
        },
        select: {
          id: true,
        },
      }),
    );
  }

  if (
    role === "STUDENT" &&
    feedbackType === "STUDENT_PLACEMENT_REQUEST" &&
    entityType === "PLACEMENT_REQUEST"
  ) {
    return Boolean(
      await prisma.placementRequest.findFirst({
        where: {
          id: entityId,
          studentProfile: {
            userId,
          },
        },
        select: {
          id: true,
        },
      }),
    );
  }

  if (
    role === "PARTNER" &&
    (feedbackType === "PARTNER_APPLICANT_QUALITY" ||
      feedbackType === "PARTNER_REVIEW_USEFULNESS") &&
    entityType === "APPLICATION"
  ) {
    return Boolean(
      await prisma.application.findFirst({
        where: {
          id: entityId,
          opportunity: {
            organization: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        },
        select: {
          id: true,
        },
      }),
    );
  }

  if (
    isStaffRole(role) &&
    (feedbackType === "STAFF_MATCH_QUALITY" ||
      feedbackType === "STAFF_PLACEMENT_DIFFICULTY") &&
    entityType === "PLACEMENT_REQUEST"
  ) {
    return Boolean(
      await prisma.placementRequest.findUnique({
        where: {
          id: entityId,
        },
        select: {
          id: true,
        },
      }),
    );
  }

  return false;
}

export async function submitFeedback(formData: FormData) {
  const { redirectToSignIn, sessionClaims, userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return redirectToSignIn();
  }

  const role = getRoleFromSessionClaims(sessionClaims);
  const user = await syncCurrentUserFromClerk({
    clerkUserId,
    role,
  });
  const redirectTo = getSafeRedirect(formData);
  const entityId = getString(formData, "entityId");
  const entityType = getString(formData, "entityType") as FeedbackEntityType;
  const feedbackType = getString(formData, "feedbackType") as FeedbackType;
  const notes = getString(formData, "notes");
  const rating = Number.parseInt(getString(formData, "rating"), 10);

  if (
    !user ||
    !entityId ||
    !feedbackTypes.includes(feedbackType) ||
    !entityTypes.includes(entityType) ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    redirect(redirectTo);
  }

  const allowed = await canSubmitFeedback({
    entityId,
    entityType,
    feedbackType,
    role,
    userId: user.id,
  });

  if (!allowed) {
    redirect(redirectTo);
  }

  const rateLimit = await enforceRateLimit({
    action: "feedback_submit",
    identifier: `user:${user.id}`,
    limit: 30,
    windowSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    redirect(
      `${redirectTo}?error=${encodeURIComponent(formatRateLimitMessage(rateLimit))}`,
    );
  }

  const feedback = await prisma.feedback.upsert({
    where: {
      authorId_feedbackType_entityType_entityId: {
        authorId: user.id,
        entityId,
        entityType,
        feedbackType,
      },
    },
    update: {
      notes: notes || null,
      rating,
    },
    create: {
      authorId: user.id,
      entityId,
      entityType,
      feedbackType,
      notes: notes || null,
      rating,
    },
    select: {
      id: true,
    },
  });

  await createAuditLog({
    action: "FEEDBACK_SUBMITTED",
    actorId: user.id,
    entityId,
    entityType,
    metadata: {
      feedbackId: feedback.id,
      feedbackType,
      rating,
    },
  });

  revalidatePath(redirectTo);
  revalidatePath("/dashboard/admin/feedback");
  redirect(redirectTo);
}
