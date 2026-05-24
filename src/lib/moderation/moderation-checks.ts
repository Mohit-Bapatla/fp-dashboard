import "server-only";

import type {
  OpportunityStatus,
  PartnerVerificationStatus,
} from "@/generated/prisma/enums";

export type ModerationOpportunityInput = {
  applicationInstructions: string | null;
  deadline: Date | null;
  description: string | null;
  id: string;
  moderationFlags: string[];
  organization: {
    name: string;
    verificationStatus: PartnerVerificationStatus;
  };
  status: OpportunityStatus;
  title: string;
};

export function normalizeModerationToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function getModerationChecks({
  opportunity,
  similarTitleCount,
}: {
  opportunity: ModerationOpportunityInput;
  similarTitleCount: number;
}) {
  const checks: string[] = [];

  if (!opportunity.description?.trim()) {
    checks.push("Missing description");
  }

  if (!opportunity.deadline) {
    checks.push("Missing deadline");
  }

  if (opportunity.organization.verificationStatus !== "VERIFIED") {
    checks.push("Unverified partner");
  }

  if ((opportunity.applicationInstructions?.trim().length ?? 0) < 30) {
    checks.push("Sparse instructions");
  }

  if (similarTitleCount > 1) {
    checks.push("Possible duplicate title for organization");
  }

  return checks;
}
