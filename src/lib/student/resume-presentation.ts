import {
  buildResumeOpportunityAlignment,
  buildResumeReview,
  type ResumeAlignmentOpportunity,
} from "@/lib/student/resume-review";
import { extractStructuredResumeSections } from "@/lib/student/resume-structure";

export function buildResumePresentation({
  alignmentOpportunities,
  analyzedAt,
  parsedSummary,
  parsedText,
  parseStatus,
  uploadedAt,
}: {
  alignmentOpportunities: ResumeAlignmentOpportunity[];
  analyzedAt: Date | null;
  parsedSummary: string | null;
  parsedText: string | null;
  parseStatus: string;
  uploadedAt: Date;
}) {
  const extractedSections = parsedText
    ? extractStructuredResumeSections(parsedText)
    : null;
  const review =
    parseStatus === "COMPLETED" && extractedSections && analyzedAt
      ? buildResumeReview({
          analyzedAt,
          parsedSummary,
          sections: extractedSections,
          sourceResumeUpdatedAt: uploadedAt,
        })
      : null;

  return {
    alignments:
      review && extractedSections
        ? alignmentOpportunities.map((opportunity) =>
            buildResumeOpportunityAlignment(extractedSections, opportunity),
          )
        : [],
    extractedSections,
    review,
  };
}
