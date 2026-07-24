import "server-only";

import { createStructuredJsonResponse } from "@/lib/ai/openai";
import { getOpportunityMatchScore } from "@/lib/matching/match-score";
import type {
  MatchOpportunity,
  MatchResume,
  MatchStudentProfile,
} from "./match-score";

export type ApplicantSummaryResult = {
  fitScore: number;
  gaps: string[];
  interviewQuestions: string[];
  matchReasons: string[];
  strengths: string[];
  summary: string;
};

type ApplicantSummaryInput = {
  opportunity: MatchOpportunity;
  profile: MatchStudentProfile & {
    school: string | null;
  };
  resume:
    | (MatchResume & {
        extractedCertifications: string[];
        extractedEducation: string[];
        extractedExperience: string[];
        parsedSummary: string | null;
      })
    | null;
  statement: string | null;
};

type AiApplicantSummary = {
  gaps: string[];
  interviewQuestions: string[];
  strengths: string[];
  summary: string;
};

const applicantSummarySchema = {
  additionalProperties: false,
  properties: {
    gaps: {
      items: { type: "string" },
      type: "array",
    },
    interviewQuestions: {
      items: { type: "string" },
      type: "array",
    },
    strengths: {
      items: { type: "string" },
      type: "array",
    },
    summary: {
      type: "string",
    },
  },
  required: ["summary", "strengths", "gaps", "interviewQuestions"],
  type: "object",
};

function firstItems(values: string[], count: number) {
  return values.filter(Boolean).slice(0, count);
}

function deterministicApplicantSummary({
  match,
  resume,
  statement,
}: {
  match: ReturnType<typeof getOpportunityMatchScore>;
  resume: ApplicantSummaryInput["resume"];
  statement: string | null;
}) {
  const strengths = [
    ...match.reasons,
    ...firstItems(resume?.extractedSkills ?? [], 3).map(
      (skill) => `Resume includes ${skill}.`,
    ),
  ].filter(Boolean);
  const gaps = match.gaps.length
    ? match.gaps
    : [
        "No major gaps were detected from the available profile and resume data.",
      ];
  const statementContext = statement
    ? "Application statement is available for review."
    : "No application statement was submitted.";

  return {
    gaps: firstItems(gaps, 4),
    interviewQuestions: [
      "What are you hoping to learn from this opportunity?",
      "Which prior experience best prepared you for this role?",
      "How would your availability align with the opportunity expectations?",
    ],
    strengths: firstItems(strengths, 5),
    summary:
      resume?.parsedSummary ||
      `${statementContext} Fit score is ${match.score}/100 based on profile, resume, and opportunity details.`,
  };
}

async function enrichApplicantSummary(input: ApplicantSummaryInput) {
  return createStructuredJsonResponse<AiApplicantSummary>({
    input: [
      "Create an advisory applicant review summary.",
      "Use only the provided opportunity, profile, resume, and application statement.",
      "Do not infer or score protected or sensitive attributes.",
      "Do not recommend accept/reject decisions.",
      JSON.stringify(input),
    ].join("\n\n"),
    schema: applicantSummarySchema,
    schemaName: "applicant_summary",
    timeoutMs: 3_000,
  });
}

export async function getApplicantSummary(
  input: ApplicantSummaryInput,
): Promise<ApplicantSummaryResult> {
  const match = getOpportunityMatchScore({
    opportunity: input.opportunity,
    profile: input.profile,
    resume: input.resume,
  });
  const fallback = deterministicApplicantSummary({
    match,
    resume: input.resume,
    statement: input.statement,
  });
  const ai = await enrichApplicantSummary(input);

  return {
    fitScore: match.score,
    gaps: ai?.gaps.length ? firstItems(ai.gaps, 4) : fallback.gaps,
    interviewQuestions: ai?.interviewQuestions.length
      ? firstItems(ai.interviewQuestions, 4)
      : fallback.interviewQuestions,
    matchReasons: match.reasons,
    strengths: ai?.strengths.length
      ? firstItems(ai.strengths, 5)
      : fallback.strengths,
    summary: ai?.summary || fallback.summary,
  };
}
