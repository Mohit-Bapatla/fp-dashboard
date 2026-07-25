import { describe, expect, it } from "vitest";

import {
  isExpectedProtectedPrefetchSignInCancellation,
  isExpectedServerActionRedirectCancellation,
  isExpectedSupersededChunkCancellation,
  toPageErrorIssue,
  type RequestFailureSignal,
} from "../e2e/runtime-monitor-policy";

const expectedCancellation: RequestFailureSignal = {
  errorText: "net::ERR_ABORTED",
  hasSupersedingMainFrameNavigation: true,
  method: "GET",
  resourceType: "script",
  url: "http://127.0.0.1:3000/_next/static/chunks/2nebd-18tc7g9.js",
};

describe("browser runtime monitor policy", () => {
  it("ignores only an aborted Next server action redirect", () => {
    expect(
      isExpectedServerActionRedirectCancellation({
        errorText: "net::ERR_ABORTED",
        hasNextActionHeader: true,
        method: "POST",
        resourceType: "fetch",
      }),
    ).toBe(true);
    expect(
      isExpectedServerActionRedirectCancellation({
        errorText: "net::ERR_FAILED",
        hasNextActionHeader: true,
        method: "POST",
        resourceType: "fetch",
      }),
    ).toBe(false);
    expect(
      isExpectedServerActionRedirectCancellation({
        errorText: "net::ERR_ABORTED",
        hasNextActionHeader: false,
        method: "POST",
        resourceType: "fetch",
      }),
    ).toBe(false);
  });

  it("ignores only an aborted same-origin protected-route prefetch redirect", () => {
    const signal = {
      errorText: "net::ERR_ABORTED",
      method: "GET",
      resourceType: "fetch",
      url: "http://localhost:3100/sign-in?redirect_url=http%3A%2F%2Flocalhost%3A3100%2Fdashboard%2Fstudent%2Fevents",
    };

    expect(isExpectedProtectedPrefetchSignInCancellation(signal)).toBe(true);
    expect(
      isExpectedProtectedPrefetchSignInCancellation({
        ...signal,
        errorText: "net::ERR_FAILED",
      }),
    ).toBe(false);
    expect(
      isExpectedProtectedPrefetchSignInCancellation({
        ...signal,
        url: "http://localhost:3100/sign-in?redirect_url=https%3A%2F%2Fevil.example%2Fdashboard%2Fstudent",
      }),
    ).toBe(false);
  });

  it("ignores only an expected chunk abort from a superseding navigation", () => {
    expect(isExpectedSupersededChunkCancellation(expectedCancellation)).toBe(
      true,
    );
  });

  it.each([
    {
      name: "no superseding navigation",
      signal: {
        ...expectedCancellation,
        hasSupersedingMainFrameNavigation: false,
      },
    },
    {
      name: "genuine chunk-load failure",
      signal: { ...expectedCancellation, errorText: "net::ERR_FAILED" },
    },
    {
      name: "failed document navigation",
      signal: { ...expectedCancellation, resourceType: "document" },
    },
    {
      name: "non-chunk application script",
      signal: {
        ...expectedCancellation,
        url: "http://127.0.0.1:3000/assets/application.js",
      },
    },
    {
      name: "HTTP failure without a browser cancellation",
      signal: { ...expectedCancellation, errorText: null },
    },
  ])("records $name", ({ signal }) => {
    expect(isExpectedSupersededChunkCancellation(signal)).toBe(false);
  });

  it("always preserves genuine page exceptions as runtime issues", () => {
    const issue = toPageErrorIssue(
      new Error("client render failed"),
      "http://127.0.0.1:3000/contact",
    );

    expect(issue.kind).toBe("page-error");
    expect(issue.detail).toContain("client render failed");
    expect(issue.url).toBe("http://127.0.0.1:3000/contact");
  });
});
