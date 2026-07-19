import { describe, expect, it } from "vitest";

import {
  signImportPreview,
  verifyImportPreviewSignature,
} from "@/lib/imports/preview-signature";

describe("CSV import preview signatures", () => {
  it("accepts the exact server-signed payload", () => {
    const payload = JSON.stringify({ importType: "opportunities", rows: [] });
    const signature = signImportPreview(payload, "unit-test-secret");
    expect(
      verifyImportPreviewSignature(payload, signature, "unit-test-secret"),
    ).toBe(true);
  });

  it("rejects a client-tampered preview", () => {
    const payload = JSON.stringify({ importType: "opportunities", rows: [] });
    const signature = signImportPreview(payload, "unit-test-secret");
    expect(
      verifyImportPreviewSignature(
        JSON.stringify({
          importType: "opportunities",
          rows: [{ importable: true }],
        }),
        signature,
        "unit-test-secret",
      ),
    ).toBe(false);
  });
});
