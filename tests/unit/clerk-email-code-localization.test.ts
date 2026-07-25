import { describe, expect, it } from "vitest";

import {
  clerkEmailCodeLocalization,
  EMAIL_CODE_DELIVERY_HELP,
} from "@/lib/auth/clerk-email-code-localization";

describe("Clerk email-code delivery guidance", () => {
  it("uses the approved helper text for each applicable email-code flow", () => {
    expect(clerkEmailCodeLocalization.signUp.emailCode.formSubtitle).toBe(
      EMAIL_CODE_DELIVERY_HELP,
    );
    expect(clerkEmailCodeLocalization.signIn.emailCode.subtitle).toBe(
      EMAIL_CODE_DELIVERY_HELP,
    );
    expect(clerkEmailCodeLocalization.signIn.emailCodeMfa.subtitle).toBe(
      EMAIL_CODE_DELIVERY_HELP,
    );
    expect(
      clerkEmailCodeLocalization.signIn.forgotPassword.subtitle_email,
    ).toBe(EMAIL_CODE_DELIVERY_HELP);
    expect(clerkEmailCodeLocalization.reverification.emailCode.subtitle).toBe(
      EMAIL_CODE_DELIVERY_HELP,
    );
  });

  it("does not customize non-email factors or Clerk's resend control", () => {
    const serialized = JSON.stringify(clerkEmailCodeLocalization);

    expect(serialized).not.toContain("phoneCode");
    expect(serialized).not.toContain("totp");
    expect(serialized).not.toContain("passkey");
    expect(serialized).not.toContain("backupCode");
    expect(serialized).not.toContain("resendButton");
  });

  it("keeps the sender and spam-folder guidance exact", () => {
    expect(EMAIL_CODE_DELIVERY_HELP).toBe(
      "Didn’t receive the code? Check your Spam or Promotions folder for an email from notifications@futurephysicians.org. Mark it as ‘Not spam’ so future codes reach your inbox.",
    );
  });
});
