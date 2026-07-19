import type { RealOpportunityRecord } from "./types";

type ScoreField = {
  present: boolean;
  weight: number;
};

function weightedPercent(fields: ScoreField[]) {
  const possible = fields.reduce((sum, field) => sum + field.weight, 0);
  const earned = fields.reduce(
    (sum, field) => sum + (field.present ? field.weight : 0),
    0,
  );
  return possible === 0 ? 0 : Math.round((earned / possible) * 100);
}

export function scoreOpportunityCompleteness(record: RealOpportunityRecord) {
  return weightedPercent([
    { present: Boolean(record.title), weight: 3 },
    { present: Boolean(record.organizationName), weight: 3 },
    { present: Boolean(record.shortDescription), weight: 3 },
    { present: Boolean(record.description), weight: 2 },
    { present: Boolean(record.officialSourceUrl), weight: 4 },
    { present: Boolean(record.officialApplicationUrl), weight: 4 },
    { present: Boolean(record.lastVerifiedAt), weight: 4 },
    { present: Boolean(record.sourceRetrievedAt), weight: 3 },
    {
      present: Boolean(record.location || record.remoteType === "REMOTE"),
      weight: 2,
    },
    { present: Boolean(record.deadline || record.isRolling), weight: 3 },
    {
      present: Boolean(
        record.acceptedGradeLevels.length || record.educationRequirement,
      ),
      weight: 3,
    },
    { present: Boolean(record.eligibilityNotes), weight: 1 },
    { present: Boolean(record.applicationInstructions), weight: 3 },
    { present: record.compensationType !== "UNKNOWN", weight: 2 },
    { present: Boolean(record.scheduleRequirements), weight: 1 },
    {
      present: Boolean(record.duration || record.startsAt || record.endsAt),
      weight: 1,
    },
    { present: Boolean(record.requiredDocuments.length), weight: 1 },
    { present: Boolean(record.sourceTitle), weight: 2 },
    { present: Boolean(record.sourceOrganization), weight: 2 },
  ]);
}

export function scoreOpportunityDataQuality(
  record: RealOpportunityRecord,
  warningCount: number,
) {
  const provenanceScore = weightedPercent([
    { present: Boolean(record.sourceKey), weight: 4 },
    { present: Boolean(record.slug), weight: 3 },
    { present: Boolean(record.officialSourceUrl), weight: 5 },
    { present: Boolean(record.officialApplicationUrl), weight: 5 },
    { present: Boolean(record.organizationWebsite), weight: 2 },
    { present: Boolean(record.sourceTitle), weight: 2 },
    { present: Boolean(record.sourceOrganization), weight: 2 },
    { present: Boolean(record.sourceRetrievedAt), weight: 3 },
    { present: Boolean(record.lastVerifiedAt), weight: 4 },
    { present: Boolean(record.verificationMethod), weight: 2 },
    {
      present: Boolean(record.deadline || record.isRolling || record.opensAt),
      weight: 3,
    },
    {
      present: Boolean(
        record.acceptedGradeLevels.length ||
        record.educationRequirement ||
        record.unknownFields.includes("educationRequirement"),
      ),
      weight: 3,
    },
    { present: Boolean(record.applicationInstructions), weight: 3 },
  ]);

  return Math.max(0, provenanceScore - Math.min(warningCount * 2, 20));
}
