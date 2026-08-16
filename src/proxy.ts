import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";

import {
  isRecruiterDemoRoute,
  requiresClerkMiddleware,
} from "./lib/auth/middleware-routing";
import { isPublicOnlyBrowserTest } from "./lib/auth/public-only-browser-test";
import {
  canAccessDashboardPath,
  getDashboardPathForRole,
  getRoleFromSessionClaims,
} from "./lib/auth/roles";
import {
  buildContentSecurityPolicy,
  privateDemoHeaders,
} from "./lib/security/headers";

function matchesRoute(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

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

async function authenticatedProxy(req: NextRequest, event: NextFetchEvent) {
  // Load and initialize Clerk only after independent public/demo seams have
  // declined the request. A recruiter-demo request never executes this import.
  const { clerkMiddleware } = await import("@clerk/nextjs/server");
  const middleware = clerkMiddleware(async (auth, authenticatedRequest) => {
    const req = authenticatedRequest;
    const { nextResponse, secureResponse } = secureRequest(req);
    const isDashboard = matchesRoute(req.nextUrl.pathname, "/dashboard");
    const isPartnerOnboarding = matchesRoute(
      req.nextUrl.pathname,
      "/partner-onboarding",
    );

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

  return middleware(req, event);
}

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  // The recruiter demo has an independent, privilege-free session boundary.
  // Bypass Clerk entirely while retaining the normal CSP and security headers.
  if (isRecruiterDemoRoute(req.nextUrl.pathname)) {
    const response = secureRequest(req).nextResponse();
    privateDemoHeaders.forEach(({ key, value }) =>
      response.headers.set(key, value),
    );
    return response;
  }

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
