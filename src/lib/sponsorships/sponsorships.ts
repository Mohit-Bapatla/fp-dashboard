import "server-only";

import type {
  SponsorDeliverableStatus,
  SponsorDeliverableType,
  SponsorInteractionType,
  SponsorshipCampaignStatus,
  SponsorshipCommitmentStatus,
  SponsorStatus,
} from "@/generated/prisma/enums";

export const sponsorStatuses: SponsorStatus[] = [
  "PROSPECT",
  "CONTACTED",
  "IN_DISCUSSION",
  "COMMITTED",
  "ACTIVE",
  "DECLINED",
  "PAUSED",
  "PAST",
];

export const sponsorshipCampaignStatuses: SponsorshipCampaignStatus[] = [
  "DRAFT",
  "ACTIVE",
  "CLOSED",
  "ARCHIVED",
];

export const sponsorshipCommitmentStatuses: SponsorshipCommitmentStatus[] = [
  "PLEDGED",
  "COMMITTED",
  "RECEIVED",
  "CANCELED",
  "DECLINED",
];

export const sponsorDeliverableTypes: SponsorDeliverableType[] = [
  "LOGO_PLACEMENT",
  "EVENT_MENTION",
  "NEWSLETTER_MENTION",
  "SOCIAL_POST",
  "THANK_YOU_EMAIL",
  "OTHER",
];

export const sponsorDeliverableStatuses: SponsorDeliverableStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "COMPLETED",
  "WAIVED",
];

export const sponsorInteractionTypes: SponsorInteractionType[] = [
  "NOTE",
  "EMAIL",
  "CALL",
  "MEETING",
  "FOLLOW_UP",
];

export function formatSponsorLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function dollarsToCents(value: string) {
  const amount = Number.parseFloat(value);

  return Number.isFinite(amount) && amount >= 0
    ? Math.round(amount * 100)
    : null;
}

export function formatCents(value: number | null) {
  if (value === null) {
    return "Not set";
  }

  return new Intl.NumberFormat("en", {
    currency: "USD",
    style: "currency",
  }).format(value / 100);
}
