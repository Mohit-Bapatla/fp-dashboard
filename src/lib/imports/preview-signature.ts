import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function signingSecret() {
  const secret =
    process.env.CSV_IMPORT_SIGNING_SECRET ?? process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "CSV import commits require CSV_IMPORT_SIGNING_SECRET or CLERK_SECRET_KEY.",
    );
  }
  return secret;
}

export function signImportPreview(payload: string, secret = signingSecret()) {
  return createHmac("sha256", secret)
    .update("fp-csv-import-preview-v1\0")
    .update(payload)
    .digest("hex");
}

export function verifyImportPreviewSignature(
  payload: string,
  signature: string,
  secret = signingSecret(),
) {
  if (!/^[a-f0-9]{64}$/.test(signature)) return false;
  const expected = Buffer.from(signImportPreview(payload, secret), "hex");
  const supplied = Buffer.from(signature, "hex");
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}
