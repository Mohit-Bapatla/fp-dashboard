import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/support-contact";

describe("support contact", () => {
  it("uses the student support inbox and exact mailto subject", () => {
    expect(SUPPORT_EMAIL).toBe("support@futurephysicians.org");
    expect(SUPPORT_MAILTO).toBe(
      "mailto:support@futurephysicians.org?subject=Future%20Physicians%20Dashboard%20Support",
    );
  });

  it("removes the placeholder support address from the support page", () => {
    const source = readFileSync(
      fileURLToPath(
        new URL("../../src/app/dashboard/support/page.tsx", import.meta.url),
      ),
      "utf8",
    );

    expect(source).toContain("SUPPORT_MAILTO");
    expect(source).not.toContain("support@example.com");
    expect(source).not.toContain("Replace `support@example.com`");
  });
});
