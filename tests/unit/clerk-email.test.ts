import { describe, expect, it } from "vitest";

import { getVerifiedClerkEmailAddress } from "@/lib/auth/clerk-email";

function emailAddress(emailAddress: string, status: string) {
  return {
    emailAddress,
    verification: { status },
  };
}

describe("verified Clerk contact email", () => {
  it("prefers the primary address when it is verified", () => {
    const primary = emailAddress("primary@example.org", "verified");

    expect(
      getVerifiedClerkEmailAddress({
        emailAddresses: [
          emailAddress("secondary@example.org", "verified"),
          primary,
        ],
        primaryEmailAddress: primary,
      }),
    ).toBe("primary@example.org");
  });

  it("uses another verified address when the primary address is unverified", () => {
    expect(
      getVerifiedClerkEmailAddress({
        emailAddresses: [
          emailAddress("pending@example.org", "unverified"),
          emailAddress("verified@example.org", "verified"),
        ],
        primaryEmailAddress: emailAddress("pending@example.org", "unverified"),
      }),
    ).toBe("verified@example.org");
  });

  it("rejects accounts without a verified address", () => {
    expect(
      getVerifiedClerkEmailAddress({
        emailAddresses: [emailAddress("pending@example.org", "unverified")],
        primaryEmailAddress: emailAddress("pending@example.org", "unverified"),
      }),
    ).toBeNull();
  });
});
