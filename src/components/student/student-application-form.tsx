"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { submitStudentApplication } from "@/app/dashboard/student/opportunities/[opportunityId]/apply/actions";
import {
  applicationStatementMaxLength,
  emptyStudentApplicationActionState,
} from "@/lib/student/application-validation";

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
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
  const formRef = useRef<HTMLFormElement>(null);
  const formErrorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const invalidControl = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );

    if (invalidControl) {
      const focusTarget = invalidControl.matches("input, select, textarea")
        ? invalidControl
        : invalidControl.querySelector<HTMLElement>(
            "input, select, textarea, button",
          );

      focusTarget?.focus();
      return;
    }

    if (state.formError) {
      formErrorRef.current?.focus();
    }
  }, [state.fieldErrors, state.formError]);

  return (
    <form action={action} className="space-y-6" ref={formRef}>
      <input name="opportunityId" type="hidden" value={opportunityId} />
      <input
        name="recommendationSource"
        type="hidden"
        value={recommendationSource ?? ""}
      />

      {state.formError ? (
        <p
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
          ref={formErrorRef}
          role="alert"
          tabIndex={-1}
        >
          {state.formError}
        </p>
      ) : null}

      <fieldset>
        <legend
          className="text-base font-semibold text-foreground"
          id="resume-selection-label"
        >
          Select resume
        </legend>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choose the resume you want Future Physicians to attach to this
          application.
        </p>
        <div
          aria-describedby={
            state.fieldErrors.resumeId ? "resumeId-error" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors.resumeId)}
          aria-labelledby="resume-selection-label"
          aria-required="true"
          className="mt-4 space-y-3"
          role="radiogroup"
        >
          {resumes.map((resume, index) => (
            <label
              className="flex cursor-pointer gap-3 rounded-lg border border-border bg-muted/30 p-4 transition hover:bg-muted"
              key={resume.id}
            >
              <input
                aria-describedby={
                  state.fieldErrors.resumeId ? "resumeId-error" : undefined
                }
                className="mt-1"
                defaultChecked={
                  state.values.resumeId
                    ? state.values.resumeId === resume.id
                    : index === 0
                }
                id={`resume-${resume.id}`}
                name="resumeId"
                required
                type="radio"
                value={resume.id}
              />
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  {resume.fileName}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Updated {resume.updatedAt.toLocaleDateString()}
                </span>
              </span>
            </label>
          ))}
        </div>
        {state.fieldErrors.resumeId ? (
          <p className="mt-2 text-sm text-destructive" id="resumeId-error">
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
          aria-describedby={
            state.fieldErrors.statement ? "statement-error" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors.statement)}
          className="mt-3 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
          defaultValue={state.values.statement}
          id="statement"
          maxLength={applicationStatementMaxLength}
          name="statement"
          placeholder="I am interested in this opportunity because..."
          rows={6}
        />
      </label>
      {state.fieldErrors.statement ? (
        <p className="text-sm text-destructive" id="statement-error">
          {state.fieldErrors.statement}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <SubmitButton />
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          href={`/dashboard/student/opportunities/${opportunityId}`}
        >
          Back to opportunity
        </Link>
      </div>
    </form>
  );
}
