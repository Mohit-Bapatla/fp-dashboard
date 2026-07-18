"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { submitStudentApplication } from "@/app/dashboard/student/opportunities/[opportunityId]/apply/actions";
import {
  applicationStatementMaxLength,
  emptyStudentApplicationActionState,
} from "@/lib/student/application-validation";
import { formatResumeDate } from "@/lib/student/resume-date";

type StudentApplicationFormProps = {
  opportunityId: string;
  recommendationSource?: string;
  resumes: Array<{
    id: string;
    fileName: string;
    updatedAt: Date;
  }>;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={pending}
      type="submit"
    >
      {pending ? "Submitting..." : "Submit application"}
    </button>
  );
}

export function StudentApplicationForm({
  opportunityId,
  recommendationSource,
  resumes,
}: StudentApplicationFormProps) {
  const [state, action] = useActionState(
    submitStudentApplication,
    emptyStudentApplicationActionState,
  );

  return (
    <form action={action} className="space-y-6">
      <input name="opportunityId" type="hidden" value={opportunityId} />
      <input
        name="recommendationSource"
        type="hidden"
        value={recommendationSource ?? ""}
      />

      {state.formError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.formError}
        </p>
      ) : null}

      <fieldset>
        <legend className="text-base font-semibold text-foreground">
          Select resume
        </legend>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choose the resume you want Future Physicians to attach to this
          application.
        </p>
        <div className="mt-4 space-y-3">
          {resumes.map((resume, index) => (
            <label
              className="flex cursor-pointer gap-3 rounded-lg border border-border bg-muted/30 p-4 transition hover:bg-muted"
              key={resume.id}
            >
              <input
                className="mt-1"
                defaultChecked={
                  state.values.resumeId
                    ? state.values.resumeId === resume.id
                    : index === 0
                }
                name="resumeId"
                type="radio"
                value={resume.id}
              />
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  {resume.fileName}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Updated {formatResumeDate(resume.updatedAt)}
                </span>
              </span>
            </label>
          ))}
        </div>
        {state.fieldErrors.resumeId ? (
          <p className="mt-2 text-sm text-destructive">
            {state.fieldErrors.resumeId}
          </p>
        ) : null}
      </fieldset>

      <label className="block text-base font-semibold text-foreground">
        Short statement
        <span className="mt-2 block text-sm font-normal leading-6 text-muted-foreground">
          Optional. Share anything the team should know about your interest in
          this opportunity.
        </span>
        <textarea
          className="mt-3 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
          defaultValue={state.values.statement}
          maxLength={applicationStatementMaxLength}
          name="statement"
          placeholder="I am interested in this opportunity because..."
          rows={6}
        />
      </label>
      {state.fieldErrors.statement ? (
        <p className="text-sm text-destructive">
          {state.fieldErrors.statement}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <SubmitButton />
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          href={`/dashboard/student/opportunities/${opportunityId}`}
        >
          Back to opportunity
        </Link>
      </div>
    </form>
  );
}
