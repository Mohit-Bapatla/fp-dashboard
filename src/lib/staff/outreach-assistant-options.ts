export const outreachTemplateTypes = [
  "FIRST_PARTNERSHIP_EMAIL",
  "FOLLOW_UP_EMAIL",
  "CLINIC_SHADOWING_REQUEST",
  "RESEARCH_LAB_REQUEST",
  "VOLUNTEER_OPPORTUNITY_REQUEST",
  "THANK_YOU_EMAIL",
] as const;

export type OutreachTemplateType = (typeof outreachTemplateTypes)[number];

export function formatOutreachTemplateType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
