export type RequestFailureSignal = {
  errorText: string | null;
  hasSupersedingMainFrameNavigation: boolean;
  method: string;
  resourceType: string;
  url: string;
};

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
