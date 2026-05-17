import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getAppRole } from "@/lib/auth/roles";

export async function assertStudentAccess() {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  if (getAppRole(sessionClaims?.metadata?.role) !== "STUDENT") {
    redirect("/dashboard");
  }

  return {
    userId,
  };
}
