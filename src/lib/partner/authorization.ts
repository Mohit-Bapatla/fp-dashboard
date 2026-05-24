import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getRoleFromSessionClaims } from "@/lib/auth/roles";
import { syncCurrentUserFromClerk } from "@/lib/auth/user-sync";

export async function assertPartnerAccess() {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const role = getRoleFromSessionClaims(sessionClaims);

  if (role !== "PARTNER") {
    redirect("/dashboard");
  }

  await syncCurrentUserFromClerk({
    clerkUserId: userId,
    role,
  });

  return {
    role,
    userId,
  };
}

export async function getOrCreateCurrentPartnerUser(clerkUserId: string) {
  const { sessionClaims } = await auth();

  return syncCurrentUserFromClerk({
    clerkUserId,
    role: getRoleFromSessionClaims(sessionClaims),
  });
}
