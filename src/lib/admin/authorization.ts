import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getAppRole } from "@/lib/auth/roles";

export async function assertAdminAccess() {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const role = getAppRole(sessionClaims?.metadata?.role);

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return {
    role,
    userId,
  };
}
