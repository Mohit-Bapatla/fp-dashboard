export type RequestFailureSignal = {
  errorText: string | null;
  hasSupersedingMainFrameNavigation: boolean;
  method: string;
  resourceType: string;
  url: string;
};

export function isExpectedServerActionRedirectCancellation({
  errorText,
  hasNextActionHeader,
  method,
  resourceType,
}: {
  errorText: string | null;
  hasNextActionHeader: boolean;
  method: string;
  resourceType: string;
}) {
  return (
    errorText === "net::ERR_ABORTED" &&
    hasNextActionHeader &&
    method === "POST" &&
    ["fetch", "xhr"].includes(resourceType)
  );
}

export function isExpectedProtectedPrefetchSignInCancellation({
  errorText,
  method,
  resourceType,
  url,
}: Pick<
  RequestFailureSignal,
  "errorText" | "method" | "resourceType" | "url"
>) {
  if (
    errorText !== "net::ERR_ABORTED" ||
    method !== "GET" ||
    !["fetch", "xhr"].includes(resourceType)
  ) {
    return false;
  }

  try {
    const signInUrl = new URL(url);
    const returnTo = new URL(
      signInUrl.searchParams.get("redirect_url") ?? "",
      signInUrl.origin,
    );
    return (
      signInUrl.pathname === "/sign-in" &&
      returnTo.origin === signInUrl.origin &&
      returnTo.pathname.startsWith("/dashboard/")
    );
  } catch {
    return false;
  }
}

export function isExpectedSupersededChunkCancellation({
  errorText,
  hasSupersedingMainFrameNavigation,
  method,
  resourceType,
  url,
}: RequestFailureSignal) {
  if (
    !hasSupersedingMainFrameNavigation ||
    method !== "GET" ||
    resourceType !== "script" ||
    errorText !== "net::ERR_ABORTED"
  ) {
    return false;
  }

  try {
    return /^\/_next\/static\/chunks\/[A-Za-z0-9_-]+\.js$/.test(
      new URL(url).pathname,
    );
  } catch {
    return false;
  }
}

export function toPageErrorIssue(error: Error, url: string) {
  return {
    detail: error.stack ?? error.message,
    kind: "page-error" as const,
    url,
  };
}
