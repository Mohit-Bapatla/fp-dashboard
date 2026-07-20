import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  canAccessDashboardPath,
  getDashboardPathForRole,
  getRoleFromSessionClaims,
} from "./lib/auth/roles";
import { buildContentSecurityPolicy } from "./lib/security/headers";

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isPartnerOnboardingRoute = createRouteMatcher(["/partner-onboarding"]);

export default clerkMiddleware(async (auth, req) => {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  const nextResponse = () => {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    return response;
  };
  const secureResponse = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    return response;
  };
  const isDashboard = isDashboardRoute(req);
  const isPartnerOnboarding = isPartnerOnboardingRoute(req);

  if (!isDashboard && !isPartnerOnboarding) {
    return nextResponse();
  }

  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return secureResponse(redirectToSignIn({ returnBackUrl: req.url }));
  }

  // Partner onboarding has its own server-side eligibility checks. It must be
  // reachable by newly signed-in STUDENT accounts without changing dashboard
  // role-based access control.
  if (isPartnerOnboarding) {
    return nextResponse();
  }

  const role = getRoleFromSessionClaims(sessionClaims);
  const dashboardPath = getDashboardPathForRole(role);
  const { pathname } = req.nextUrl;

  if (pathname === "/dashboard") {
    return secureResponse(
      NextResponse.redirect(new URL(dashboardPath, req.url)),
    );
  }

  if (!canAccessDashboardPath(role, pathname)) {
    return secureResponse(
      NextResponse.redirect(new URL(dashboardPath, req.url)),
    );
  }

  return nextResponse();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
