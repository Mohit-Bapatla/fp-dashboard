import { describe, expect, it } from "vitest";

import {
  accountTransitionLockKey,
  getStudentAccountTransitionBlockReason,
} from "@/lib/auth/account-transition";

describe("student and partner account transition invariant", () => {
  it("uses one stable lock namespace for a Clerk user", () => {
    expect(accountTransitionLockKey("user_123")).toBe(
      "account-transition:user:user_123",
    );
    expect(accountTransitionLockKey("user_456")).not.toBe(
      accountTransitionLockKey("user_123"),
    );
  });

  it("allows student profile writes only for a student without memberships", () => {
    expect(
      getStudentAccountTransitionBlockReason({
        databaseRole: "STUDENT",
        hasPartnerMembership: false,
      }),
    ).toBeNull();
    expect(
      getStudentAccountTransitionBlockReason({
        databaseRole: "STUDENT",
        hasPartnerMembership: true,
      }),
    ).toBe("EXISTING_PARTNER_MEMBERSHIP");
    expect(
      getStudentAccountTransitionBlockReason({
        databaseRole: "PARTNER",
        hasPartnerMembership: false,
      }),
    ).toBe("NON_STUDENT_ROLE");
    expect(
      getStudentAccountTransitionBlockReason({
        databaseRole: "ADMIN",
        hasPartnerMembership: false,
      }),
    ).toBe("NON_STUDENT_ROLE");
  });
});
