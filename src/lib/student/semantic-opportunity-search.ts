import type { Prisma } from "@/generated/prisma/client";
import type { OpportunityType } from "@/generated/prisma/enums";
import { studentOpportunityTypeOptions } from "@/lib/student/opportunity-filters";

export type SemanticOpportunity = {
  applicationInstructions: string | null;
  description: string | null;
  eligibilityRequirements: string | null;
  location: string | null;
  organization: {
    name: string;
  };
  paidStatus: string | null;
  remoteType: string | null;
  specialty: string | null;
  title: string;
  type: OpportunityType;
};

const querySynonyms: Record<string, string[]> = {
  beginner: ["beginner", "intro", "introductory", "entry", "starter"],
  beginners: ["beginner", "intro", "introductory", "entry", "starter"],
  clinic: ["clinic", "clinical", "patient"],
  lab: ["lab", "laboratory", "research"],
  online: ["online", "remote", "virtual"],
  research: ["research", "lab", "study"],
  shadow: ["shadow", "shadowing", "observe", "observation"],
  shadowing: ["shadow", "shadowing", "observe", "observation"],
  virtual: ["virtual", "remote", "online"],
  volunteer: ["volunteer", "volunteering", "service"],
  volunteering: ["volunteer", "volunteering", "service"],
  remote: ["remote", "virtual", "online"],
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
}

function tokenize(query: string) {
  return normalize(query)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function formatOpportunityType(type: OpportunityType) {
  return type.toLowerCase().replaceAll("_", " ");
}

export function getExpandedSearchTokens(query: string) {
  const tokens = tokenize(query);
  const expanded = new Set(tokens);

  tokens.forEach((token) => {
    querySynonyms[token]?.forEach((synonym) => expanded.add(synonym));
  });

  studentOpportunityTypeOptions.forEach((type) => {
    const label = formatOpportunityType(type);

    if (tokens.some((token) => label.includes(token))) {
      expanded.add(label);
      expanded.add(type.toLowerCase());
    }
  });

  return Array.from(expanded);
}

export function buildSemanticOpportunityWhere(
  query: string,
): Prisma.OpportunityWhereInput | undefined {
  const tokens = getExpandedSearchTokens(query);

  if (tokens.length === 0) {
    return undefined;
  }

  return {
    OR: tokens.flatMap((token) => [
      { title: { contains: token, mode: "insensitive" } },
      { description: { contains: token, mode: "insensitive" } },
      { specialty: { contains: token, mode: "insensitive" } },
      { location: { contains: token, mode: "insensitive" } },
      { remoteType: { contains: token, mode: "insensitive" } },
      { paidStatus: { contains: token, mode: "insensitive" } },
      {
        eligibilityRequirements: { contains: token, mode: "insensitive" },
      },
      { applicationInstructions: { contains: token, mode: "insensitive" } },
      {
        organization: {
          name: { contains: token, mode: "insensitive" },
        },
      },
    ]),
  };
}

function fieldScore(
  value: string | null | undefined,
  tokens: string[],
  weight: number,
) {
  const normalizedValue = normalize(value ?? "");

  if (!normalizedValue) {
    return 0;
  }

  return tokens.reduce(
    (score, token) => score + (normalizedValue.includes(token) ? weight : 0),
    0,
  );
}

export function getSemanticOpportunityScore(
  opportunity: SemanticOpportunity,
  query: string,
) {
  const tokens = getExpandedSearchTokens(query);

  if (tokens.length === 0) {
    return 0;
  }

  return (
    fieldScore(opportunity.title, tokens, 8) +
    fieldScore(opportunity.specialty, tokens, 7) +
    fieldScore(formatOpportunityType(opportunity.type), tokens, 7) +
    fieldScore(opportunity.organization.name, tokens, 5) +
    fieldScore(opportunity.description, tokens, 4) +
    fieldScore(opportunity.eligibilityRequirements, tokens, 4) +
    fieldScore(opportunity.applicationInstructions, tokens, 3) +
    fieldScore(opportunity.location, tokens, 5) +
    fieldScore(opportunity.remoteType, tokens, 5) +
    fieldScore(opportunity.paidStatus, tokens, 3)
  );
}
