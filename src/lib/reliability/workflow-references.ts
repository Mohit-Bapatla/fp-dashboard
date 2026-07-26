export const WORKFLOW_CATEGORIES = [
  "AUTH",
  "ONB",
  "DASH",
  "APP",
  "PARTNER",
  "PUBLIC",
  "SIGNOUT",
] as const;

export type WorkflowCategory = (typeof WORKFLOW_CATEGORIES)[number];

const SUPPORT_REFERENCE_PATTERN =
  /^FP-(AUTH|ONB|DASH|APP|PARTNER|PUBLIC|SIGNOUT)-\d{8}-[A-Z0-9]{6}$/;

function compactUtcDate(date: Date) {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function randomSuffix() {
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);

  return Array.from(bytes, (value) => (value % 36).toString(36))
    .join("")
    .toUpperCase();
}

export function createWorkflowSupportReference(
  category: WorkflowCategory,
  date = new Date(),
) {
  return `FP-${category}-${compactUtcDate(date)}-${randomSuffix()}`;
}

export function isWorkflowSupportReference(value: string) {
  return SUPPORT_REFERENCE_PATTERN.test(value);
}
