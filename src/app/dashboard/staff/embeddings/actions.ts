"use server";

import { revalidatePath } from "next/cache";

import type { EmbeddingEntityType } from "@/generated/prisma/enums";
import { createAuditLog } from "@/lib/audit/audit-log";
import { prisma } from "@/lib/db/prisma";
import {
  refreshEmbeddings,
  type EmbeddingRefreshResult,
  type EmbeddingRefreshScope,
} from "@/lib/matching/embedding-refresh";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";

export type EmbeddingRefreshActionState = {
  error: string | null;
  result: EmbeddingRefreshResult | null;
};

const scopes: EmbeddingRefreshScope[] = [
  "all",
  "OPPORTUNITY",
  "STUDENT_PROFILE",
  "RESUME",
  "PARTNER_ORGANIZATION",
];

function getScope(formData: FormData): EmbeddingRefreshScope {
  const scope = formData.get("scope");

  return typeof scope === "string" &&
    scopes.includes(scope as EmbeddingRefreshScope)
    ? (scope as EmbeddingEntityType | "all")
    : "all";
}

export async function refreshEmbeddingsAction(
  _previousState: EmbeddingRefreshActionState,
  formData: FormData,
): Promise<EmbeddingRefreshActionState> {
  const access = await assertPlacementQueueAccess();
  const scope = getScope(formData);
  const actor = await prisma.user.findUnique({
    where: {
      clerkUserId: access.userId,
    },
    select: {
      id: true,
    },
  });

  try {
    const result = await refreshEmbeddings(scope);

    await createAuditLog({
      action: "EMBEDDINGS_REFRESHED",
      actorId: actor?.id ?? null,
      entityType: "EmbeddingRecord",
      metadata: {
        result,
        scope,
      },
    });

    revalidatePath("/dashboard/staff/embeddings");
    revalidatePath("/dashboard/admin/recommendation-evaluation");

    return {
      error: null,
      result,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to refresh embeddings.",
      result: null,
    };
  }
}
