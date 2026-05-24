import "server-only";

import type { OpportunityType } from "@/generated/prisma/enums";

type OpportunityEmbeddingContent = {
  applicationInstructions: string | null;
  description: string | null;
  eligibilityRequirements: string | null;
  location: string | null;
  paidStatus: string | null;
  remoteType: string | null;
  specialty: string | null;
  title: string;
  type: OpportunityType;
};

type StudentProfileEmbeddingContent = {
  availability: string[];
  careerGoals: string | null;
  interestedSpecialties: string[];
  locationPreference: string | null;
  opportunityTypes: OpportunityType[];
  remotePreference: string | null;
};

type ResumeEmbeddingContent = {
  extractedCertifications: string[];
  extractedEducation: string[];
  extractedExperience: string[];
  extractedSkills: string[];
  parsedSummary: string | null;
};

type PartnerEmbeddingContent = {
  description: string | null;
  healthcareFocus: string | null;
  location: string | null;
  name: string;
  specialtyAreas: string[];
  type: string | null;
};

function compactLines(values: Array<string | null | undefined>) {
  return values
    .map((value) => value?.trim())
    .filter(Boolean)
    .join("\n");
}

function list(label: string, values: readonly string[]) {
  return values.length > 0 ? `${label}: ${values.join(", ")}` : null;
}

function formatOpportunityType(type: OpportunityType) {
  return type.toLowerCase().replaceAll("_", " ");
}

export function buildOpportunityEmbeddingContent(
  opportunity: OpportunityEmbeddingContent,
) {
  return compactLines([
    `Title: ${opportunity.title}`,
    `Type: ${formatOpportunityType(opportunity.type)}`,
    opportunity.specialty ? `Specialty: ${opportunity.specialty}` : null,
    opportunity.location ? `Location: ${opportunity.location}` : null,
    opportunity.remoteType ? `Format: ${opportunity.remoteType}` : null,
    opportunity.paidStatus ? `Paid status: ${opportunity.paidStatus}` : null,
    opportunity.description ? `Description: ${opportunity.description}` : null,
    opportunity.eligibilityRequirements
      ? `Eligibility: ${opportunity.eligibilityRequirements}`
      : null,
    opportunity.applicationInstructions
      ? `Application instructions: ${opportunity.applicationInstructions}`
      : null,
  ]);
}

export function buildStudentProfileEmbeddingContent(
  profile: StudentProfileEmbeddingContent,
) {
  return compactLines([
    list("Interested specialties", profile.interestedSpecialties),
    list(
      "Preferred opportunity types",
      profile.opportunityTypes.map(formatOpportunityType),
    ),
    profile.locationPreference
      ? `Location preference: ${profile.locationPreference}`
      : null,
    profile.remotePreference
      ? `Remote preference: ${profile.remotePreference}`
      : null,
    list("Availability", profile.availability),
    profile.careerGoals ? `Career goals: ${profile.careerGoals}` : null,
  ]);
}

export function buildResumeEmbeddingContent(resume: ResumeEmbeddingContent) {
  return compactLines([
    resume.parsedSummary ? `Resume summary: ${resume.parsedSummary}` : null,
    list("Skills", resume.extractedSkills),
    list("Education", resume.extractedEducation),
    list("Experience", resume.extractedExperience),
    list("Certifications", resume.extractedCertifications),
  ]);
}

export function buildPartnerEmbeddingContent(partner: PartnerEmbeddingContent) {
  return compactLines([
    `Organization: ${partner.name}`,
    partner.type ? `Type: ${partner.type}` : null,
    partner.description ? `Description: ${partner.description}` : null,
    partner.location ? `Location: ${partner.location}` : null,
    partner.healthcareFocus
      ? `Healthcare focus: ${partner.healthcareFocus}`
      : null,
    list("Specialty areas", partner.specialtyAreas),
  ]);
}
