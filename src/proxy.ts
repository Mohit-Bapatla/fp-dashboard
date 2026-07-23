import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";

import { requiresClerkMiddleware } from "./lib/auth/middleware-routing";
import { isPublicOnlyBrowserTest } from "./lib/auth/public-only-browser-test";
import {
  canAccessDashboardPath,
  getDashboardPathForRole,
  getRoleFromSessionClaims,
} from "./lib/auth/roles";
import { buildContentSecurityPolicy } from "./lib/security/headers";

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isPartnerOnboardingRoute = createRouteMatcher(["/partner-onboarding"]);

function secureRequest(req: NextRequest) {
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

  return { nextResponse, secureResponse };
}

const authenticatedProxy = clerkMiddleware(async (auth, req) => {
  const { nextResponse, secureResponse } = secureRequest(req);
  const isDashboard = isDashboardRoute(req);
  const isPartnerOnboarding = isPartnerOnboardingRoute(req);

  if (!isDashboard && !isPartnerOnboarding) {
    return nextResponse();
  }

  const { redirectToSignIn, sessionClaims, sessionStatus, userId } =
    await auth();

  if (sessionStatus === "pending") {
    const pendingTaskUrl = req.nextUrl.clone();
    pendingTaskUrl.pathname = "/sign-in";
    pendingTaskUrl.searchParams.set("redirect_url", req.url);
    return secureResponse(NextResponse.redirect(pendingTaskUrl));
  }

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

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  const publicOnlyBrowserTest = isPublicOnlyBrowserTest();

  // CI exercises signed-out marketing pages without real Clerk credentials.
  // The seam never bypasses dashboards, auth pages, onboarding, APIs, TRPC, or
  // Clerk sync routes, and the helper additionally requires GitHub Actions
  // markers while rejecting every Vercel environment.
  if (publicOnlyBrowserTest && !requiresClerkMiddleware(req.nextUrl.pathname)) {
    return secureRequest(req).nextResponse();
  }

  return authenticatedProxy(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
