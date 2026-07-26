import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getRoleFromSessionClaims } from "@/lib/auth/roles";
import { syncCurrentUserFromClerk } from "@/lib/auth/user-sync";

export async function assertStudentAccess() {
  const { sessionClaims, userId } = await auth();

  if (!userId) {
    return redirect("/sign-in?redirect_url=%2Fdashboard%2Fstudent");
  }

  const role = getRoleFromSessionClaims(sessionClaims);

  if (role !== "STUDENT") {
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
