import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getAppRole } from "@/lib/auth/roles";

export async function assertPlacementQueueAccess() {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const role = getAppRole(sessionClaims?.metadata?.role);

  if (role !== "STAFF" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return {
    role,
    userId,
  };
}
