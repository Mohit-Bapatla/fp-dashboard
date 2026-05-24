"use client";

import { Download, FileText, RefreshCw, Trash2, Upload } from "lucide-react";
import { useActionState, useEffect } from "react";

import { cn } from "@/lib/utils";

import {
  createStudentResumeSignedUrl,
  deleteStudentResume,
  parseStudentResume,
  uploadStudentResume,
  type ResumeActionState,
  type ResumeDownloadActionState,
} from "@/app/dashboard/student/resume/actions";

type StudentResumeManagerProps = {
  hasProfile: boolean;
  resume: {
    extractedCertifications: string[];
    extractedEducation: string[];
    extractedExperience: string[];
    extractedSkills: string[];
    id: string;
    fileName: string;
    parsedSummary: string | null;
    parseStatus: string;
    updatedAt: Date;
  } | null;
};

const initialResumeActionState: ResumeActionState = {
  error: null,
  success: null,
};

const initialDownloadState: ResumeDownloadActionState = {
  error: null,
  signedUrl: null,
};

export function StudentResumeManager({
  hasProfile,
  resume,
}: StudentResumeManagerProps) {
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadStudentResume,
    initialResumeActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStudentResume,
    initialResumeActionState,
  );
  const [downloadState, downloadAction, downloadPending] = useActionState(
    createStudentResumeSignedUrl,
    initialDownloadState,
  );
  const [parseState, parseAction, parsePending] = useActionState(
    parseStudentResume,
    initialResumeActionState,
  );

  useEffect(() => {
    if (downloadState.signedUrl) {
      window.location.href = downloadState.signedUrl;
    }
  }, [downloadState.signedUrl]);

  return (
    <article className="rounded-xl border border-border bg-background p-6 shadow-sm" id="resume">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-muted text-primary">
            <FileText aria-hidden="true" className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-foreground">Resume</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            A resume is required to apply to most opportunities. Upload one PDF
            or DOCX file — stored privately, accessible only via temporary
            download links.
          </p>
        </div>
        <div
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium",
            resume
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-border bg-muted/50 text-muted-foreground",
          )}
        >
          {resume ? "Resume on file" : "No resume"}
        </div>
      </div>

      {!hasProfile ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
          Complete student onboarding before uploading a resume.
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {resume ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold text-foreground">
                {resume.fileName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Updated {resume.updatedAt.toLocaleDateString()}
              </p>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Parse status: {formatParseStatus(resume.parseStatus)}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={downloadAction}>
                  <input name="resumeId" type="hidden" value={resume.id} />
                  <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={downloadPending}
                    type="submit"
                  >
                    <Download aria-hidden="true" className="h-4 w-4" />
                    {downloadPending ? "Preparing" : "View/download"}
                  </button>
                </form>
                <form action={deleteAction}>
                  <input name="resumeId" type="hidden" value={resume.id} />
                  <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={deletePending}
                    type="submit"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    {deletePending ? "Deleting" : "Delete"}
                  </button>
                </form>
                <form action={parseAction}>
                  <input name="resumeId" type="hidden" value={resume.id} />
                  <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      parsePending || resume.parseStatus === "PROCESSING"
                    }
                    type="submit"
                  >
                    <RefreshCw aria-hidden="true" className="h-4 w-4" />
                    {parsePending || resume.parseStatus === "PROCESSING"
                      ? "Parsing"
                      : resume.parseStatus === "FAILED"
                        ? "Retry parse"
                        : resume.parseStatus === "COMPLETED"
                          ? "Re-parse"
                          : "Parse resume"}
                  </button>
                </form>
              </div>

              {resume.parseStatus === "FAILED" ? (
                <p className="mt-4 text-sm leading-6 text-red-600">
                  Parsing failed. Retry with the current file or upload a
                  clearer PDF/DOCX resume.
                </p>
              ) : null}

              {resume.parsedSummary ? (
                <div className="mt-5 rounded-lg border border-border bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Parsed summary
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {resume.parsedSummary}
                  </p>
                </div>
              ) : null}

              {resume.extractedSkills.length > 0 ? (
                <ParsedList label="Skills" values={resume.extractedSkills} />
              ) : null}

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <ParsedList
                  label="Education"
                  values={resume.extractedEducation}
                />
                <ParsedList
                  label="Experience"
                  values={resume.extractedExperience}
                />
                <ParsedList
                  label="Certifications"
                  values={resume.extractedCertifications}
                />
              </div>
            </div>
          ) : null}

          <form action={uploadAction} className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              {resume ? "Replace resume" : "Upload resume"}
              <input
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                name="resume"
                required
                type="file"
              />
            </label>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={uploadPending}
              type="submit"
            >
              <Upload aria-hidden="true" className="h-4 w-4" />
              {uploadPending ? "Uploading" : resume ? "Replace" : "Upload"}
            </button>
          </form>
        </div>
      )}

      {uploadState.error ||
      deleteState.error ||
      downloadState.error ||
      parseState.error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {uploadState.error ??
            deleteState.error ??
            downloadState.error ??
            parseState.error}
        </div>
      ) : null}
      {uploadState.success || deleteState.success || parseState.success ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {uploadState.success ?? deleteState.success ?? parseState.success}
        </div>
      ) : null}
    </article>
  );
}

function formatParseStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ParsedList({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-2 text-sm text-muted-foreground">Not extracted yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-lg border border-border bg-background p-4">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
            key={value}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}
