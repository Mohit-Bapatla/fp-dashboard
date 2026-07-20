import { SignIn } from "@clerk/nextjs";
import { headers } from "next/headers";

import { BrandMark } from "@/components/shared/brand-mark";
import { safeInternalPath, safeRequestOrigin } from "@/lib/security/safe-url";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const [query, requestHeaders] = await Promise.all([searchParams, headers()]);
  const requested = Array.isArray(query.redirect_url)
    ? query.redirect_url[0]
    : query.redirect_url;
  const requestOrigin = safeRequestOrigin(
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"),
    requestHeaders.get("x-forwarded-proto"),
  );
  const destination = safeInternalPath(requested, "/dashboard", [
    requestOrigin,
  ]);

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12"
      id="auth-main"
    >
      <div
        aria-hidden="true"
        className="pathway-grid absolute inset-0 opacity-70"
      />
      <div className="relative mb-8 text-center">
        <BrandMark />
        <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-brand-navy">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Access your FP Dashboard — manage opportunities, applications, and
          placements.
        </p>
      </div>
      <div className="relative">
        <SignIn
          fallbackRedirectUrl="/dashboard"
          forceRedirectUrl={destination}
          path="/sign-in"
          routing="path"
          signUpUrl={`/sign-up?redirect_url=${encodeURIComponent(destination)}`}
        />
      </div>
    </main>
  );
}
