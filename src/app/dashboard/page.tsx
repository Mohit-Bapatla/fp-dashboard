import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getAppRole, getDashboardPathForRole } from "@/lib/auth/roles";

export default async function DashboardRedirectPage() {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const role = getAppRole(sessionClaims?.metadata?.role);

  redirect(getDashboardPathForRole(role));
}
