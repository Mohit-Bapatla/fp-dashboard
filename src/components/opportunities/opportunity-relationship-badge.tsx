import type { OpportunityRelationshipType } from "@/generated/prisma/enums";

const labels: Record<OpportunityRelationshipType, string> = {
  EXTERNAL_PUBLIC: "External Opportunity",
  FP_PARTNER: "FP Partner",
  FP_OWNED: "FP-Owned",
};

export function OpportunityRelationshipBadge({ relationshipType }: { relationshipType: OpportunityRelationshipType }) {
  return <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">{labels[relationshipType]}</span>;
}

export function OpportunityRelationshipDisclaimer({ relationshipType }: { relationshipType: OpportunityRelationshipType }) {
  if (relationshipType === "EXTERNAL_PUBLIC") return <p>This program is operated by the host organization. Future Physicians does not control selection or guarantee acceptance.</p>;
  if (relationshipType === "FP_PARTNER") return <p>Future Physicians supports this partner opportunity, but the host organization controls selection unless the listing explicitly says otherwise.</p>;
  return <p>This opportunity is operated by Future Physicians. Published eligibility and selection details still apply.</p>;
}
