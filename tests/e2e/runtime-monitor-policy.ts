export type RequestFailureSignal = {
  errorText: string | null;
  hasSupersedingMainFrameNavigation: boolean;
  method: string;
  resourceType: string;
  url: string;
};

export type PageErrorSignal = {
  browserName: string;
  error: Error;
  pageUrl: string;
};

export function isBrowserNavigationCancellation(errorText: string | null) {
  return (
    errorText === "net::ERR_ABORTED" ||
    errorText === "cancelled" ||
    errorText === "Load request cancelled"
  );
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
    !isBrowserNavigationCancellation(errorText)
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

export function isExpectedVercelSecurityScriptCancellation({
  errorText,
  method,
  resourceType,
  url,
}: RequestFailureSignal) {
  if (
    method !== "GET" ||
    resourceType !== "script" ||
    !isBrowserNavigationCancellation(errorText)
  ) {
    return false;
  }

  try {
    return /^\/[a-f0-9]{16}\/script\.js$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

export function isExpectedWebKitRscFetchCancellation({
  browserName,
  error,
  pageUrl,
}: PageErrorSignal) {
  if (browserName !== "webkit") return false;

  const match = error.message.match(
    /^Fetch API cannot load (\S+) due to access control checks\.$/,
  );
  if (!match) return false;

  try {
    const fetchUrl = new URL(match[1]);
    const currentUrl = new URL(pageUrl);

    // WebKit reports an intentionally superseded Next.js RSC fetch as a
    // CORS-like page error. A genuine cross-origin access-control failure,
    // ordinary fetch failure, or non-RSC application exception must remain
    // visible to the runtime monitor.
    return (
      fetchUrl.origin === currentUrl.origin && fetchUrl.searchParams.has("_rsc")
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
