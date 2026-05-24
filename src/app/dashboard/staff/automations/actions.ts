"use server";

import { revalidatePath } from "next/cache";

import type { OperationalWorkflowRunResult } from "@/lib/jobs/operational-workflows";
import { runOperationalWorkflows } from "@/lib/jobs/operational-workflows";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";

export type AutomationRunActionState = {
  error: string | null;
  result: OperationalWorkflowRunResult | null;
};

export async function runOperationalWorkflowsAction(
  previousState: AutomationRunActionState,
): Promise<AutomationRunActionState> {
  void previousState;

  const { userId } = await assertPlacementQueueAccess();
  const actor = await prisma.user.findUnique({
    where: {
      clerkUserId: userId,
    },
    select: {
      id: true,
    },
  });

  try {
    const result = await runOperationalWorkflows({
      actorId: actor?.id ?? null,
      source: "manual",
    });

    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard/staff/automations");
    revalidatePath("/dashboard/staff/outreach");
    revalidatePath("/dashboard/staff/tasks");
    revalidatePath("/dashboard/staff/placement-requests");
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/audit-logs");
    revalidatePath("/dashboard/notifications");

    return {
      error: null,
      result,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to run operational workflows.",
      result: null,
    };
  }
}
