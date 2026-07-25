import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getRoleFromSessionClaims } from "@/lib/auth/roles";
import { syncCurrentUserFromClerk } from "@/lib/auth/user-sync";

export async function assertPartnerAccess() {
  const { sessionClaims, userId } = await auth();

  if (!userId) {
    return redirect("/sign-in?redirect_url=%2Fdashboard%2Fpartner");
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
