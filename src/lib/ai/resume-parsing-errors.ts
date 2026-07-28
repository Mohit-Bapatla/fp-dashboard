import "server-only";

import {
  getResumeParseFailureMessage,
  persistedResumeParseFailureReasons,
  type PersistedResumeParseFailureReason,
} from "@/lib/student/resume-parse-state";

export type ResumeParseErrorCode =
  PersistedResumeParseFailureReason | "OWNERSHIP_DENIED";

export type ResumeParseFailureStage =
  | "ownership_lookup"
  | "supabase_download"
  | "blob_to_buffer"
  | "pdf_import"
  | "pdf_constructor"
  | "pdf_get_text"
  | "pdf_cleanup"
  | "docx_import"
  | "docx_get_text"
  | "deterministic_extraction"
  | "openai_enrichment"
  | "prisma_result_update"
  | "status_update";

export type ResumeParseLogContext = {
  byteLength: number | null;
  extension: string | null;
  mimeType: string | null;
  resumeId: string;
};

export class ResumeParsingError extends Error {
  readonly code: ResumeParseErrorCode;
  readonly stage: ResumeParseFailureStage;

  constructor({
    cause,
    code,
    stage,
  }: {
    cause?: unknown;
    code: ResumeParseErrorCode;
    stage: ResumeParseFailureStage;
  }) {
    super(
      code === "OWNERSHIP_DENIED"
        ? "Resume was not found."
        : getResumeParseFailureMessage(code),
      { cause },
    );
    this.name = "ResumeParsingError";
    this.code = code;
    this.stage = stage;
  }
}

function getSafeErrorDetails(error: unknown) {
  const errorClass =
    error instanceof Error ? error.constructor.name : typeof error;
  const rawMessage =
    error instanceof Error ? error.message : String(error || "Unknown error");
  const errorMessage = rawMessage
    .replace(/https?:\/\/\S+/gi, "[redacted-url]")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 500);

  return {
    errorClass,
    errorMessage: errorMessage || "Unknown error",
  };
}

export function logResumeParseFailure({
  context,
  error,
  level = "error",
  stage,
}: {
  context: ResumeParseLogContext;
  error: unknown;
  level?: "error" | "warning";
  stage: ResumeParseFailureStage;
}) {
  const details = getSafeErrorDetails(error);
  const payload = {
    stage,
    ...details,
    resumeId: context.resumeId,
    byteLength: context.byteLength,
    mimeType: context.mimeType,
    extension: context.extension,
  };

  if (level === "warning") {
    console.warn("resume_parse_warning", payload);
    return;
  }

  console.error("resume_parse_failure", payload);
}

export function createResumeParsingError({
  code,
  context,
  error,
  stage,
}: {
  code: ResumeParseErrorCode;
  context: ResumeParseLogContext;
  error: unknown;
  stage: ResumeParseFailureStage;
}) {
  logResumeParseFailure({ context, error, stage });

  return new ResumeParsingError({
    cause: error,
    code,
    stage,
  });
}

export function getResumeParseUserMessage(error: unknown) {
  return error instanceof ResumeParsingError
    ? error.message
    : getResumeParseFailureMessage("TEMPORARY_FAILURE");
}

export function getPersistedResumeParseFailureReason(
  error: unknown,
): PersistedResumeParseFailureReason {
  if (
    error instanceof ResumeParsingError &&
    persistedResumeParseFailureReasons.some((reason) => reason === error.code)
  ) {
    return error.code as PersistedResumeParseFailureReason;
  }

  return "TEMPORARY_FAILURE";
}
