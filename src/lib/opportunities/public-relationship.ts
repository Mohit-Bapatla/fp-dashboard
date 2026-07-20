import type {
  OpportunityRelationshipType,
  PartnerStatus,
} from "@/generated/prisma/enums";

export function getPublicOpportunityRelationshipLabel(input: {
  organizationStatus: PartnerStatus;
  relationshipType: OpportunityRelationshipType;
}) {
  if (input.relationshipType === "FP_OWNED") {
    return "Future Physicians program";
  }

  if (
    input.relationshipType === "FP_PARTNER" &&
    input.organizationStatus === "PARTNERED"
  ) {
    return "Confirmed FP partner opportunity";
  }

  return input.relationshipType === "EXTERNAL_PUBLIC"
    ? "Publicly sourced listing"
    : "Listed host organization";
}
