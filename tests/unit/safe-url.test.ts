import { describe, expect, it } from "vitest";

import {
  isSafeExternalUrl,
  isSafeInternalPath,
  safeInternalPath,
  safeRequestOrigin,
} from "@/lib/security/safe-url";

describe("safe internal redirects", () => {
  it("allows application and public destinations with local query strings", () => {
    expect(
      isSafeInternalPath(
        "/dashboard/student/opportunities/opportunity-1/apply?source=public",
      ),
    ).toBe(true);
    expect(isSafeInternalPath("/opportunities/opportunity-1#eligibility")).toBe(
      true,
    );
  });

  it("normalizes trusted Clerk absolute URLs to an internal path", () => {
    expect(
      safeInternalPath(
        "https://futurephysicians.org/dashboard/student/opportunities/opp-1/apply?source=public#review",
        "/dashboard",
      ),
    ).toBe("/dashboard/student/opportunities/opp-1/apply?source=public#review");
    expect(
      safeInternalPath(
        "http://localhost:4100/dashboard/student?source=clerk",
        "/dashboard",
        ["http://localhost:4100"],
      ),
    ).toBe("/dashboard/student?source=clerk");
  });

  it.each([
    "https://example.com/phish",
    "https://futurephysicians.org.evil.example/phish",
    "https://user:secret@futurephysicians.org/dashboard",
    "//example.com/phish",
    "/\\example.com/phish",
    "javascript:alert(1)",
    "dashboard/student",
    "",
  ])("blocks unsafe redirect target %s", (target) => {
    expect(isSafeInternalPath(target)).toBe(false);
    expect(safeInternalPath(target, "/dashboard")).toBe("/dashboard");
  });

  it("derives only well-formed HTTP request origins", () => {
    expect(safeRequestOrigin("localhost:3000", null)).toBe(
      "http://localhost:3000",
    );
    expect(safeRequestOrigin("preview.example.org", "https")).toBe(
      "https://preview.example.org",
    );
    expect(safeRequestOrigin("user@evil.example", "https")).toBeNull();
    expect(safeRequestOrigin("example.org/path", "https")).toBeNull();
    expect(safeRequestOrigin("example.org", "javascript")).toBeNull();
  });
});

describe("safe external URLs", () => {
  it("allows credential-free HTTP and HTTPS URLs", () => {
    expect(isSafeExternalUrl("https://example.org/apply?ref=fp")).toBe(true);
    expect(isSafeExternalUrl("http://example.org/apply")).toBe(true);
  });

  it.each([
    "https://student@example.org/apply",
    "https://student:secret@example.org/apply",
    "javascript:alert(1)",
    "ftp://example.org/file",
  ])("rejects unsafe external URL %s", (target) => {
    expect(isSafeExternalUrl(target)).toBe(false);
  });
});
