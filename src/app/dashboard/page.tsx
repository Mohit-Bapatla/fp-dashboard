import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  getDashboardPathForRole,
  getRoleFromSessionClaims,
} from "@/lib/auth/roles";
import { syncCurrentUserFromClerk } from "@/lib/auth/user-sync";

export default async function DashboardRedirectPage() {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const role = getRoleFromSessionClaims(sessionClaims);
  await syncCurrentUserFromClerk({
    clerkUserId: userId,
    role,
  });

  redirect(getDashboardPathForRole(role));
}
