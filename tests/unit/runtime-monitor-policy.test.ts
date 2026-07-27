import { describe, expect, it } from "vitest";

import {
  isBrowserNavigationCancellation,
  isExpectedSupersededChunkCancellation,
  isExpectedVercelSecurityScriptCancellation,
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
  it("ignores only an expected chunk abort from a superseding navigation", () => {
    expect(isExpectedSupersededChunkCancellation(expectedCancellation)).toBe(
      true,
    );
  });

  it("recognizes Chromium and WebKit navigation cancellation signals", () => {
    expect(isBrowserNavigationCancellation("net::ERR_ABORTED")).toBe(true);
    expect(isBrowserNavigationCancellation("cancelled")).toBe(true);
    expect(isBrowserNavigationCancellation("Load request cancelled")).toBe(
      true,
    );
    expect(isBrowserNavigationCancellation("net::ERR_FAILED")).toBe(false);
    expect(isBrowserNavigationCancellation(null)).toBe(false);
  });

  it("recognizes the same expected superseded chunk cancellation in WebKit", () => {
    expect(
      isExpectedSupersededChunkCancellation({
        ...expectedCancellation,
        errorText: "cancelled",
      }),
    ).toBe(true);
  });

  it("recognizes only the exact cancelled Vercel security script shape", () => {
    const vercelSecurityScript = {
      ...expectedCancellation,
      hasSupersedingMainFrameNavigation: false,
      url: "https://preview.example.com/b325571d24134398/script.js",
    };

    expect(
      isExpectedVercelSecurityScriptCancellation(vercelSecurityScript),
    ).toBe(true);
    expect(
      isExpectedVercelSecurityScriptCancellation({
        ...vercelSecurityScript,
        errorText: "net::ERR_FAILED",
      }),
    ).toBe(false);
    expect(
      isExpectedVercelSecurityScriptCancellation({
        ...vercelSecurityScript,
        url: "https://preview.example.com/assets/script.js",
      }),
    ).toBe(false);
    expect(
      isExpectedVercelSecurityScriptCancellation({
        ...vercelSecurityScript,
        resourceType: "document",
      }),
    ).toBe(false);
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
