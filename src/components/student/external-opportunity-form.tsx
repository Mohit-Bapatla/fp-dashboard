"use client";

import { ExternalLink, PlusCircle } from "lucide-react";
import { useActionState } from "react";

import { addExternalOpportunity } from "@/app/dashboard/student/opportunities/add-external/actions";
import {
  emptyExternalOpportunityValues,
  type ExternalOpportunityActionState,
} from "@/lib/student/external-opportunity-validation";

const initialState: ExternalOpportunityActionState = {
  fieldErrors: {},
  formError: null,
  values: emptyExternalOpportunityValues,
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

function FieldError({ message }: { message?: string }) {
  return message ? (
    <span className="mt-2 block text-sm text-red-600" role="alert">
      {message}
    </span>
  ) : null;
}

export function ExternalOpportunityForm() {
  const [state, action, pending] = useActionState(
    addExternalOpportunity,
    initialState,
  );

  return (
    <form action={action} className="space-y-6">
      {state.formError ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {state.formError}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-medium md:col-span-2">
          Official source or application URL
          <input
            aria-describedby="source-url-help"
            className={inputClass}
            defaultValue={state.values.sourceUrl}
            inputMode="url"
            name="sourceUrl"
            placeholder="https://hospital.example/apply"
            required
            type="url"
          />
          <span
            className="mt-2 block text-xs text-muted-foreground"
            id="source-url-help"
          >
            FP stores the link as untrusted student-provided information. It is
            never scraped or published automatically.
          </span>
          <FieldError message={state.fieldErrors.sourceUrl} />
        </label>

        <label className="block text-sm font-medium">
          Opportunity title
          <input
            className={inputClass}
            defaultValue={state.values.title}
            maxLength={160}
            name="title"
            required
          />
          <FieldError message={state.fieldErrors.title} />
        </label>

        <label className="block text-sm font-medium">
          Organization name
          <input
            className={inputClass}
            defaultValue={state.values.organizationName}
            maxLength={160}
            name="organizationName"
            required
          />
          <FieldError message={state.fieldErrors.organizationName} />
        </label>

        <label className="block text-sm font-medium">
          Opening date <span className="text-muted-foreground">(optional)</span>
          <input
            className={inputClass}
            defaultValue={state.values.opensAt}
            name="opensAt"
            type="date"
          />
          <FieldError message={state.fieldErrors.opensAt} />
        </label>

        <label className="block text-sm font-medium">
          Deadline <span className="text-muted-foreground">(optional)</span>
          <input
            className={inputClass}
            defaultValue={state.values.deadline}
            name="deadline"
            type="date"
          />
          <FieldError message={state.fieldErrors.deadline} />
        </label>

        <label className="block text-sm font-medium">
          Location <span className="text-muted-foreground">(optional)</span>
          <input
            className={inputClass}
            defaultValue={state.values.location}
            maxLength={200}
            name="location"
            placeholder="Dallas, TX or Virtual"
          />
          <FieldError message={state.fieldErrors.location} />
        </label>

        <label className="block text-sm font-medium">
          Opportunity type
          <select
            className={inputClass}
            defaultValue={state.values.opportunityType}
            name="opportunityType"
          >
            <option value="">Program (default)</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="SHADOWING">Shadowing</option>
            <option value="RESEARCH">Research</option>
            <option value="VOLUNTEERING">Volunteering</option>
            <option value="MENTORSHIP">Mentorship</option>
            <option value="EVENT">Event</option>
            <option value="PROGRAM">Program</option>
          </select>
          <FieldError message={state.fieldErrors.opportunityType} />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Required documents{" "}
        <span className="text-muted-foreground">(optional)</span>
        <textarea
          className={`${inputClass} min-h-28`}
          defaultValue={state.values.requiredDocuments}
          name="requiredDocuments"
          placeholder="Resume&#10;Transcript&#10;Parent consent"
        />
        <span className="mt-2 block text-xs text-muted-foreground">
          Separate documents with commas or new lines. Each becomes a private
          preparation task.
        </span>
        <FieldError message={state.fieldErrors.requiredDocuments} />
      </label>

      <label className="block text-sm font-medium">
        Private notes <span className="text-muted-foreground">(optional)</span>
        <textarea
          className={`${inputClass} min-h-32`}
          defaultValue={state.values.notes}
          maxLength={5000}
          name="notes"
          placeholder="Save details you want to remember. These notes remain private to your account."
        />
        <FieldError message={state.fieldErrors.notes} />
      </label>

      <fieldset className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <legend className="px-1 text-sm font-semibold">After saving</legend>
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input
            className="mt-1 h-4 w-4"
            defaultChecked={state.values.createWorkspace}
            name="createWorkspace"
            type="checkbox"
          />
          <span>
            <span className="block font-medium">
              Create a preparation workspace
            </span>
            <span className="mt-1 block text-muted-foreground">
              Start tasks, choose a resume, and set an internal target now.
            </span>
          </span>
        </label>
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input
            className="mt-1 h-4 w-4"
            defaultChecked={state.values.requestVerification}
            name="requestVerification"
            type="checkbox"
          />
          <span>
            <span className="block font-medium">
              Submit the source for FP review
            </span>
            <span className="mt-1 block text-muted-foreground">
              This creates an admin review item. It does not publish your
              private record.
            </span>
          </span>
        </label>
      </fieldset>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">Student-added external application</p>
        <p>
          Not verified by Future Physicians. Always confirm requirements on the
          official source.
        </p>
      </div>

      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <PlusCircle aria-hidden="true" className="h-4 w-4 animate-pulse" />
        ) : (
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
        )}
        {pending ? "Saving…" : "Add external opportunity"}
      </button>
    </form>
  );
}
