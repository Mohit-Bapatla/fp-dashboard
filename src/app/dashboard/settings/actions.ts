"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { getRoleFromSessionClaims } from "@/lib/auth/roles";
import { syncCurrentUserFromClerk } from "@/lib/auth/user-sync";
import { prisma } from "@/lib/db/prisma";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";

export type AccountSettingsActionState = {
  error: string | null;
  success: string | null;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function updateAccountDisplayName(
  _previousState: AccountSettingsActionState,
  formData: FormData,
): Promise<AccountSettingsActionState> {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const role = getRoleFromSessionClaims(sessionClaims);
  const user = await syncCurrentUserFromClerk({
    clerkUserId: userId,
    role,
  });
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");

  if (!firstName || !lastName) {
    return {
      error: "Enter both first and last name.",
      success: null,
    };
  }

  const rateLimit = await enforceRateLimit({
    action: "profile_settings_update",
    identifier: `user:${user.id}`,
    limit: 60,
    windowSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      error: formatRateLimitMessage(rateLimit),
      success: null,
    };
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      firstName,
      lastName,
    },
  });

  revalidatePath("/dashboard");

  return {
    error: null,
    success: "Display name updated.",
  };
}
