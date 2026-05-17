import type { OpportunityType } from "@/generated/prisma/enums";

export const studentOpportunityTypeOptions = [
  "INTERNSHIP",
  "SHADOWING",
  "RESEARCH",
  "VOLUNTEERING",
  "MENTORSHIP",
  "EVENT",
  "PROGRAM",
] as const satisfies readonly OpportunityType[];

export const studentOpportunitySortOptions = ["recent", "deadline"] as const;

export type StudentOpportunitySort =
  (typeof studentOpportunitySortOptions)[number];

export type StudentOpportunityFilters = {
  q: string;
  type: OpportunityType | "";
  specialty: string;
  remoteType: string;
  paidStatus: string;
  location: string;
  sort: StudentOpportunitySort;
};

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function getOpportunityType(value: string) {
  return studentOpportunityTypeOptions.includes(value as OpportunityType)
    ? (value as OpportunityType)
    : "";
}

function getSort(value: string): StudentOpportunitySort {
  return studentOpportunitySortOptions.includes(value as StudentOpportunitySort)
    ? (value as StudentOpportunitySort)
    : "recent";
}

export function getStudentOpportunityFilters(
  searchParams: SearchParams,
): StudentOpportunityFilters {
  return {
    q: getParam(searchParams, "q"),
    type: getOpportunityType(getParam(searchParams, "type")),
    specialty: getParam(searchParams, "specialty"),
    remoteType: getParam(searchParams, "remoteType"),
    paidStatus: getParam(searchParams, "paidStatus"),
    location: getParam(searchParams, "location"),
    sort: getSort(getParam(searchParams, "sort")),
  };
}
