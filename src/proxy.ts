import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  canAccessDashboardPath,
  getDashboardPathForRole,
  getRoleFromSessionClaims,
} from "./lib/auth/roles";

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isPartnerOnboardingRoute = createRouteMatcher(["/partner-onboarding"]);

export default clerkMiddleware(async (auth, req) => {
  const isDashboard = isDashboardRoute(req);
  const isPartnerOnboarding = isPartnerOnboardingRoute(req);

  if (!isDashboard && !isPartnerOnboarding) {
    return NextResponse.next();
  }

  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Partner onboarding has its own server-side eligibility checks. It must be
  // reachable by newly signed-in STUDENT accounts without changing dashboard
  // role-based access control.
  if (isPartnerOnboarding) {
    return NextResponse.next();
  }

  const role = getRoleFromSessionClaims(sessionClaims);
  const dashboardPath = getDashboardPathForRole(role);
  const { pathname } = req.nextUrl;

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(dashboardPath, req.url));
  }

  if (!canAccessDashboardPath(role, pathname)) {
    return NextResponse.redirect(new URL(dashboardPath, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
