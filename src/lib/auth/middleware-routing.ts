const clerkRoutePrefixes = [
  "/dashboard",
  "/partner-onboarding",
  "/sign-in",
  "/sign-up",
  "/__clerk",
  "/api",
  "/trpc",
] as const;

export function requiresClerkMiddleware(pathname: string): boolean {
  return clerkRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isRecruiterDemoRoute(pathname: string): boolean {
  return pathname === "/demo" || pathname.startsWith("/demo/");
}
