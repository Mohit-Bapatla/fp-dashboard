"use client";

import { Download, FileText, Trash2, Upload } from "lucide-react";
import { useActionState, useEffect } from "react";

import {
  createStudentResumeSignedUrl,
  deleteStudentResume,
  uploadStudentResume,
  type ResumeActionState,
  type ResumeDownloadActionState,
} from "@/app/dashboard/student/resume/actions";

type StudentResumeManagerProps = {
  hasProfile: boolean;
  resume: {
    id: string;
    fileName: string;
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

  useEffect(() => {
    if (downloadState.signedUrl) {
      window.location.href = downloadState.signedUrl;
    }
  }, [downloadState.signedUrl]);

  return (
    <article className="rounded-lg border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <FileText aria-hidden="true" className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-foreground">Resume</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Upload one PDF or DOCX resume. Your file is stored privately and
            only temporary download links are generated.
          </p>
        </div>
        <div className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium text-muted-foreground">
          {resume ? "Uploaded" : "Not uploaded"}
        </div>
      </div>

      {!hasProfile ? (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
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
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={downloadAction}>
                  <input name="resumeId" type="hidden" value={resume.id} />
                  <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-red-200 px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={deletePending}
                    type="submit"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    {deletePending ? "Deleting" : "Delete"}
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          <form action={uploadAction} className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              {resume ? "Replace resume" : "Upload resume"}
              <input
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                name="resume"
                required
                type="file"
              />
            </label>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={uploadPending}
              type="submit"
            >
              <Upload aria-hidden="true" className="h-4 w-4" />
              {uploadPending ? "Uploading" : resume ? "Replace" : "Upload"}
            </button>
          </form>
        </div>
      )}

      {uploadState.error || deleteState.error || downloadState.error ? (
        <p className="mt-4 text-sm text-red-600">
          {uploadState.error ?? deleteState.error ?? downloadState.error}
        </p>
      ) : null}
      {uploadState.success || deleteState.success ? (
        <p className="mt-4 text-sm text-primary">
          {uploadState.success ?? deleteState.success}
        </p>
      ) : null}
    </article>
  );
}
