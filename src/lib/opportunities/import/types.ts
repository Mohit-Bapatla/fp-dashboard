export const opportunityImportSchemaVersion = "1.0" as const;

export const opportunityTypes = [
  "INTERNSHIP",
  "SHADOWING",
  "RESEARCH",
  "VOLUNTEERING",
  "MENTORSHIP",
  "EVENT",
  "PROGRAM",
] as const;

export const gradeLevelCodes = [
  "HS_9",
  "HS_10",
  "HS_11",
  "HS_12",
  "COLLEGE_1",
  "COLLEGE_2",
  "COLLEGE_3",
  "COLLEGE_4",
  "GRADUATE",
  "MEDICAL",
  "GAP_YEAR_POST_BACC",
] as const;

export const opportunityAvailabilityStatuses = [
  "OPEN",
  "OPENING_SOON",
  "ROLLING",
  "CLOSED",
  "EXPIRED",
  "ARCHIVED",
] as const;

export const opportunityApplicationMethods = [
  "EXTERNAL_PORTAL",
  "FP_INTERNAL",
  "FP_REFERRAL",
] as const;

export const opportunityRelationshipTypes = [
  "EXTERNAL_PUBLIC",
  "FP_PARTNER",
  "FP_OWNED",
] as const;

export const compensationTypes = [
  "PAID",
  "STIPEND",
  "UNPAID",
  "VOLUNTEER",
  "SCHOOL_CREDIT",
  "UNKNOWN",
] as const;

export const opportunityFormats = [
  "IN_PERSON",
  "REMOTE",
  "HYBRID",
  "UNKNOWN",
] as const;

export type OpportunityType = (typeof opportunityTypes)[number];
export type GradeLevelCode = (typeof gradeLevelCodes)[number];
export type OpportunityAvailabilityStatus =
  (typeof opportunityAvailabilityStatuses)[number];
export type OpportunityApplicationMethod =
  (typeof opportunityApplicationMethods)[number];
export type OpportunityRelationshipType =
  (typeof opportunityRelationshipTypes)[number];
export type CompensationType = (typeof compensationTypes)[number];
export type OpportunityFormat = (typeof opportunityFormats)[number];

export type RealOpportunityRecord = {
  acceptedGradeLevels: GradeLevelCode[];
  additionalRestrictions: string | null;
  address: string | null;
  applicationContactEmail: string | null;
  applicationInstructions: string;
  applicationMethod: OpportunityApplicationMethod;
  availabilityStatus: OpportunityAvailabilityStatus;
  backgroundCheckRequirement: string | null;
  capacity: number | null;
  city: string | null;
  citizenshipRequirement: string | null;
  compensationAmount: string | null;
  compensationType: CompensationType;
  country: string | null;
  cycleLabel: string | null;
  deadline: string | null;
  description: string;
  duration: string | null;
  educationRequirement: string | null;
  eligibilityNotes: string | null;
  endsAt: string | null;
  estimatedWeeklyHours: number | null;
  feesOrCosts: string | null;
  geographicRequirement: string | null;
  geographicScope: string | null;
  healthClearanceRequirement: string | null;
  housingInformation: string | null;
  interviewProcess: string | null;
  isRolling: boolean;
  lastVerifiedAt: string;
  location: string | null;
  maximumAge: number | null;
  minimumAge: number | null;
  officialApplicationUrl: string;
  officialSourceUrl: string;
  opensAt: string | null;
  organizationName: string;
  organizationType: string;
  organizationWebsite: string;
  parentPermissionRequired: boolean | null;
  prerequisiteCourses: string[];
  priorityDeadline: string | null;
  publicNotes: string | null;
  relationshipType: OpportunityRelationshipType;
  remoteType: OpportunityFormat;
  requiredCertifications: string[];
  requiredDocuments: string[];
  requiredExperience: string | null;
  residencyRequirement: string | null;
  responsibilities: string | null;
  scheduleRequirements: string | null;
  schoolCreditAvailability: string | null;
  secondarySourceUrl: string | null;
  selectionTimeline: string | null;
  shortDescription: string;
  skillsOffered: string[];
  slug: string;
  sourceKey: string;
  sourceNotes: string | null;
  sourceOrganization: string;
  sourceRetrievedAt: string;
  sourceTitle: string;
  specialty: string | null;
  startsAt: string | null;
  state: string | null;
  stipendInformation: string | null;
  title: string;
  transportationNotes: string | null;
  travelRequirements: string | null;
  type: OpportunityType;
  unknownFields: string[];
  verificationMethod: string;
  workAuthorizationRequired: boolean | null;
};

export type RealOpportunityDataset = {
  generatedAt: string;
  records: RealOpportunityRecord[];
  schemaVersion: typeof opportunityImportSchemaVersion;
  sourcePolicy: "OFFICIAL_SOURCES_ONLY";
};

export type ExistingOpportunityForImport = {
  activeOverrideFields: ReadonlySet<string>;
  id: string;
  organizationId: string;
  organizationName: string;
  snapshot: Record<string, unknown>;
};

export const opportunityImportActions = [
  "CREATE",
  "UPDATE",
  "UNCHANGED",
  "REJECT",
  "DUPLICATE",
  "NEEDS_REVIEW",
  "ARCHIVE",
  "RESTORE",
] as const;

export type OpportunityImportAction = (typeof opportunityImportActions)[number];

export type OpportunityImportPlanRow = {
  action: OpportunityImportAction;
  duplicateOpportunityId: string | null;
  existingOpportunityId: string | null;
  normalized: RealOpportunityRecord | null;
  original: unknown;
  proposedChanges: Record<string, unknown>;
  qualityScore: number | null;
  completenessScore: number | null;
  rowNumber: number;
  sourceKey: string | null;
  validationErrors: string[];
  warnings: string[];
};

export type OpportunityImportPlanCounts = Record<
  Lowercase<OpportunityImportAction>,
  number
>;

export type OpportunityImportPlan = {
  counts: OpportunityImportPlanCounts;
  datasetHash: string;
  existingStateHash: string;
  generatedAt: string;
  rows: OpportunityImportPlanRow[];
  totalRows: number;
};

export type ProductionWriteGuardInput = {
  allowProduction: boolean;
  approvalPhrase: string | null;
  commit: boolean;
  database: string;
  dryRunHash: string | null;
  environment: "development" | "preview" | "production";
  expectedDatabase: string;
  expectedDryRunHash: string;
  expectedOpportunityCount: number | null;
  expectedProjectRef: string;
  expectedSchema: string;
  observedOpportunityCount: number;
  projectRef: string;
  schema: string;
};
