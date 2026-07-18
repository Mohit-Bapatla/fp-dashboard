export const RESUME_PARSE_STALE_AFTER_MS = 5 * 60 * 1000;

export const persistedResumeParseFailureReasons = [
  "DOWNLOAD_FAILED",
  "UNSUPPORTED_FILE_TYPE",
  "UNREADABLE_DOCUMENT",
  "PARSER_UNAVAILABLE",
  "TEMPORARY_FAILURE",
] as const;

export type PersistedResumeParseFailureReason =
  (typeof persistedResumeParseFailureReasons)[number];

const failureMessages: Record<PersistedResumeParseFailureReason, string> = {
  DOWNLOAD_FAILED:
    "We couldn't download this resume from secure storage. Please retry in a moment.",
  PARSER_UNAVAILABLE:
    "PDF parsing is temporarily unavailable. Please retry in a moment.",
  TEMPORARY_FAILURE:
    "Resume processing failed temporarily. Please retry in a moment.",
  UNREADABLE_DOCUMENT:
    "We couldn't find enough selectable text in this resume. Upload a text-based PDF or DOCX file; scanned or image-only PDFs aren't supported yet.",
  UNSUPPORTED_FILE_TYPE:
    "This resume file type is not supported. Upload a PDF or DOCX file.",
};

export function getResumeParseFailureMessage(
  reason: PersistedResumeParseFailureReason | null | undefined,
) {
  return reason ? failureMessages[reason] : failureMessages.TEMPORARY_FAILURE;
}

export function isResumeProcessingStale(updatedAt: Date, now = new Date()) {
  return now.getTime() - updatedAt.getTime() >= RESUME_PARSE_STALE_AFTER_MS;
}
