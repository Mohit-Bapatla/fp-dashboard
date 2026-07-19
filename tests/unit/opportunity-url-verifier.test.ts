import { describe, expect, it, vi } from "vitest";

import {
  isPublicIpAddress,
  verifyOpportunityUrl,
  verifyOpportunityUrls,
  type VerifierDependencies,
} from "@/lib/opportunities/import/verifier";

const publicAddress = { address: "93.184.216.34", family: 4 as const };

function dependencies(
  responses: Array<{ body?: string; location?: string | null; status: number }>,
): VerifierDependencies {
  let responseIndex = 0;
  return {
    lookup: vi.fn(async () => [publicAddress]),
    request: vi.fn(async () => {
      const response = responses[responseIndex++]!;
      return {
        body: Buffer.from(response.body ?? ""),
        location: response.location ?? null,
        status: response.status,
      };
    }),
  };
}

describe("opportunity URL verification", () => {
  it("recognizes public and non-public address ranges", () => {
    expect(isPublicIpAddress("93.184.216.34")).toBe(true);
    expect(isPublicIpAddress("10.0.0.1")).toBe(false);
    expect(isPublicIpAddress("192.0.2.1")).toBe(false);
    expect(isPublicIpAddress("2001:4860:4860::8888")).toBe(true);
    expect(isPublicIpAddress("2001:db8::1")).toBe(false);
  });

  it("blocks unsafe URLs before DNS or HTTP", async () => {
    const deps = dependencies([]);
    const result = await verifyOpportunityUrl("http://127.0.0.1/private", {
      dependencies: deps,
    });
    expect(result).toMatchObject({
      errorCode: "UNSAFE_URL",
      result: "BLOCKED",
    });
    expect(deps.lookup).not.toHaveBeenCalled();
    expect(deps.request).not.toHaveBeenCalled();
  });

  it("blocks a public hostname if any resolved address is private", async () => {
    const deps = dependencies([]);
    deps.lookup = vi.fn(async () => [
      publicAddress,
      { address: "10.0.0.2", family: 4 as const },
    ]);
    const result = await verifyOpportunityUrl("https://hospital.example.edu", {
      dependencies: deps,
    });
    expect(result).toMatchObject({
      errorCode: "NON_PUBLIC_DNS",
      result: "BLOCKED",
    });
    expect(deps.request).not.toHaveBeenCalled();
  });

  it("revalidates and records an official redirect", async () => {
    const deps = dependencies([
      { location: "/new-program", status: 301 },
      { body: "official program page", status: 200 },
    ]);
    const result = await verifyOpportunityUrl(
      "https://hospital.example.edu/old-program",
      { dependencies: deps },
    );
    expect(result).toMatchObject({
      finalUrl: "https://hospital.example.edu/new-program",
      httpStatus: 200,
      result: "REDIRECTED",
    });
    expect(deps.lookup).toHaveBeenCalledTimes(2);
    expect(deps.request).toHaveBeenCalledTimes(2);
  });

  it("marks changed content for review without changing publication state", async () => {
    const deps = dependencies([{ body: "new official content", status: 200 }]);
    const result = await verifyOpportunityUrl(
      "https://hospital.example.edu/program",
      { dependencies: deps, previousFingerprint: "old" },
    );
    expect(result.result).toBe("CONTENT_CHANGED");
    expect(result.contentChanged).toBe(true);
    expect(result.suggestedAction).toMatch(/Review/);
  });

  it("caps concurrency", async () => {
    let active = 0;
    let maximumActive = 0;
    const deps: VerifierDependencies = {
      lookup: async () => [publicAddress],
      request: async () => {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return { body: Buffer.from("ok"), location: null, status: 200 };
      },
    };
    await verifyOpportunityUrls(
      Array.from(
        { length: 12 },
        (_, index) => `https://hospital.example.edu/program-${index}`,
      ),
      { concurrency: 3, dependencies: deps },
    );
    expect(maximumActive).toBe(3);
  });
});
