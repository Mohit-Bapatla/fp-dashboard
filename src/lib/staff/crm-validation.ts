import type {
  OutreachTaskStatus,
  PartnerStatus,
} from "@/generated/prisma/enums";

export const partnerStatusOptions: PartnerStatus[] = [
  "NOT_CONTACTED",
  "CONTACTED",
  "FOLLOW_UP_NEEDED",
  "INTERESTED",
  "MEETING_SCHEDULED",
  "PARTNERED",
  "REJECTED",
  "NO_RESPONSE",
  "PAUSED",
];

export const outreachTaskStatusOptions: OutreachTaskStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "WAITING",
  "COMPLETED",
  "BLOCKED",
];

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export function getNullableString(formData: FormData, key: string) {
  return getString(formData, key) || null;
}

export function getOptionalDate(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateInput(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

export function isPartnerStatus(value: string): value is PartnerStatus {
  return partnerStatusOptions.includes(value as PartnerStatus);
}

export function isOutreachTaskStatus(
  value: string,
): value is OutreachTaskStatus {
  return outreachTaskStatusOptions.includes(value as OutreachTaskStatus);
}

export function getSafeStaffRedirect(formData: FormData, fallback: string) {
  const redirectTo = getString(formData, "redirectTo");

  return redirectTo.startsWith("/dashboard/staff") ? redirectTo : fallback;
}
