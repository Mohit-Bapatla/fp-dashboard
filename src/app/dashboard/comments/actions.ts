"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type {
  RecordCommentEntityType,
  RecordCommentVisibility,
} from "@/generated/prisma/enums";
import { createAuditLog } from "@/lib/audit/audit-log";
import { assertCanCreateRecordComment } from "@/lib/comments/record-comments";
import { prisma } from "@/lib/db/prisma";

const entityTypes: RecordCommentEntityType[] = [
  "APPLICATION",
  "PLACEMENT_REQUEST",
  "OUTREACH_TASK",
];
const visibilities: RecordCommentVisibility[] = [
  "INTERNAL",
  "PARTNER_VISIBLE",
  "STUDENT_VISIBLE",
];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getSafeRedirect(formData: FormData) {
  const redirectTo = getString(formData, "redirectTo");

  return redirectTo.startsWith("/dashboard") ? redirectTo : "/dashboard";
}

export async function addRecordComment(formData: FormData) {
  const entityId = getString(formData, "entityId");
  const entityType = getString(
    formData,
    "entityType",
  ) as RecordCommentEntityType;
  const visibility = getString(
    formData,
    "visibility",
  ) as RecordCommentVisibility;
  const body = getString(formData, "body");
  const redirectTo = getSafeRedirect(formData);

  if (
    !entityId ||
    !body ||
    !entityTypes.includes(entityType) ||
    !visibilities.includes(visibility)
  ) {
    redirect(redirectTo);
  }

  const user = await assertCanCreateRecordComment({
    entityId,
    entityType,
    visibility,
  });

  if (!user) {
    redirect(redirectTo);
  }

  const comment = await prisma.recordComment.create({
    data: {
      authorId: user.id,
      body,
      entityId,
      entityType,
      visibility,
    },
    select: {
      id: true,
    },
  });

  await createAuditLog({
    action: "RECORD_COMMENT_CREATED",
    actorId: user.id,
    entityId,
    entityType,
    metadata: {
      commentId: comment.id,
      visibility,
    },
  });

  revalidatePath(redirectTo);
  redirect(redirectTo);
}
