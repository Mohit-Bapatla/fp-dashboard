import { describe, expect, it, vi } from "vitest";

import { verifyOpportunityUrl } from "@/lib/opportunities/url-verifier";

const resolvePublic = vi
  .fn()
  .mockResolvedValue([{ address: "203.0.113.10", family: 4 as const }]);

describe("opportunity URL verifier", () => {
  it("reports healthy responses and content changes without mutating data", async () => {
    const request = vi.fn().mockResolvedValue({
      body: new TextEncoder().encode("current public page"),
      location: undefined,
      statusCode: 200,
    });
    const first = await verifyOpportunityUrl(
      "https://health.example.edu/apply",
      null,
      {
        request,
        resolve: resolvePublic,
      },
    );
    expect(first.status).toBe("HEALTHY");
    expect(first.contentHash).toHaveLength(64);

    const changed = await verifyOpportunityUrl(
      "https://health.example.edu/apply",
      "0".repeat(64),
      { request, resolve: resolvePublic },
    );
    expect(changed.status).toBe("CONTENT_CHANGED");
  });

  it("revalidates and reports redirects", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        body: new Uint8Array(),
        location: "https://apply.health.example.edu/start",
        statusCode: 302,
      })
      .mockResolvedValueOnce({
        body: new TextEncoder().encode("application"),
        location: undefined,
        statusCode: 200,
      });
    const result = await verifyOpportunityUrl(
      "https://health.example.edu/apply",
      null,
      {
        request,
        resolve: resolvePublic,
      },
    );
    expect(result).toMatchObject({ redirectCount: 1, status: "REDIRECTED" });
    expect(resolvePublic).toHaveBeenCalledWith("apply.health.example.edu");
  });

  it("blocks reserved hosts before making a request", async () => {
    const request = vi.fn();
    const result = await verifyOpportunityUrl(
      "https://example.org/apply",
      null,
      {
        request,
        resolve: resolvePublic,
      },
    );
    expect(result).toMatchObject({
      errorCode: "UNSAFE_DESTINATION",
      status: "BLOCKED",
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("blocks restricted ports and private DNS answers", async () => {
    const request = vi.fn();
    const restrictedPort = await verifyOpportunityUrl(
      "https://health.example.edu:8443/apply",
      null,
      { request, resolve: resolvePublic },
    );
    expect(restrictedPort).toMatchObject({
      errorCode: "UNSAFE_DESTINATION",
      status: "BLOCKED",
    });

    const privateAddress = await verifyOpportunityUrl(
      "https://health.example.edu/apply",
      null,
      {
        request,
        resolve: vi
          .fn()
          .mockResolvedValue([{ address: "169.254.169.254", family: 4 }]),
      },
    );
    expect(privateAddress).toMatchObject({
      errorCode: "NO_PUBLIC_ADDRESS",
      status: "BLOCKED",
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("classifies access restrictions as bot protected, not closed", async () => {
    const result = await verifyOpportunityUrl(
      "https://health.example.edu/apply",
      null,
      {
        request: vi.fn().mockResolvedValue({
          body: new Uint8Array(),
          location: undefined,
          statusCode: 403,
        }),
        resolve: resolvePublic,
      },
    );

    expect(result).toMatchObject({
      errorCode: "ACCESS_RESTRICTED",
      httpStatus: 403,
      status: "BOT_PROTECTED",
    });
  });

  it("reports likely closures and reopening signals for human review", async () => {
    const resolve = resolvePublic;
    const closed = await verifyOpportunityUrl(
      "https://health.example.edu/apply",
      null,
      {
        request: vi.fn().mockResolvedValue({
          body: new TextEncoder().encode(
            "<html><main>Applications are closed for this cycle.</main></html>",
          ),
          location: undefined,
          statusCode: 200,
        }),
        resolve,
      },
    );
    expect(closed.status).toBe("LIKELY_CLOSED");

    const reopened = await verifyOpportunityUrl(
      "https://health.example.edu/apply",
      closed.contentHash,
      {
        previousStatus: "LIKELY_CLOSED",
        request: vi.fn().mockResolvedValue({
          body: new TextEncoder().encode(
            "<html><main>Applications are now open.</main></html>",
          ),
          location: undefined,
          statusCode: 200,
        }),
        resolve,
      },
    );
    expect(reopened.status).toBe("LIKELY_REOPENED");
  });
});
