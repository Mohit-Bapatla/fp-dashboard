"use client";

import { Send } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { createStudentPlacementRequest } from "@/app/dashboard/placement-requests/actions";
import {
  formatEnumLabel,
  initialStudentPlacementRequestValues,
  placementRequestOpportunityTypeOptions,
  type StudentPlacementRequestActionState,
} from "@/lib/placement-requests/validation";

const initialStudentPlacementRequestActionState: StudentPlacementRequestActionState =
  {
    fieldErrors: {},
    formError: null,
    values: initialStudentPlacementRequestValues,
  };

export function StudentPlacementRequestForm() {
  const [state, action, pending] = useActionState(
    createStudentPlacementRequest,
    initialStudentPlacementRequestActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const invalidControl = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );

    if (invalidControl) {
      invalidControl.focus();
      return;
    }

    if (state.formError) {
      formErrorRef.current?.focus();
    }
  }, [state.fieldErrors, state.formError]);

  return (
    <form action={action} className="space-y-6" ref={formRef}>
      {state.formError ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
          ref={formErrorRef}
          role="alert"
          tabIndex={-1}
        >
          {state.formError}
        </div>
      ) : null}

      <label className="block text-sm font-medium text-foreground">
        Request title
        <input
          aria-describedby={
            state.fieldErrors.title ? "placement-title-error" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors.title)}
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
          defaultValue={state.values.title}
          id="placement-title"
          name="title"
          placeholder="Help me find a cardiology shadowing placement"
          required
        />
        {state.fieldErrors.title ? (
          <span
            className="mt-2 block text-sm text-red-600"
            id="placement-title-error"
          >
            {state.fieldErrors.title}
          </span>
        ) : null}
      </label>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block text-sm font-medium text-foreground">
          Requested specialties
          <textarea
            className="mt-2 min-h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
            defaultValue={state.values.requestedSpecialties}
            name="requestedSpecialties"
            placeholder="Cardiology, pediatrics, emergency medicine"
          />
          <span className="mt-2 block text-xs text-muted-foreground">
            Separate items with commas or new lines.
          </span>
        </label>

        <label className="block text-sm font-medium text-foreground">
          Availability
          <textarea
            className="mt-2 min-h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
            defaultValue={state.values.availability}
            name="availability"
            placeholder="Weekends, weekday afternoons, summer break"
          />
          <span className="mt-2 block text-xs text-muted-foreground">
            Separate items with commas or new lines.
          </span>
        </label>
      </div>

      <fieldset className="rounded-lg border border-border bg-muted/20 p-4">
        <legend className="px-1 text-sm font-medium text-foreground">
          Opportunity types
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {placementRequestOpportunityTypeOptions.map((type) => (
            <label
              className="flex items-center gap-2 text-sm text-foreground"
              key={type}
            >
              <input
                defaultChecked={state.values.requestedOpportunityTypes.includes(
                  type,
                )}
                name="requestedOpportunityTypes"
                type="checkbox"
                value={type}
              />
              {formatEnumLabel(type)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="block text-sm font-medium text-foreground">
          Location preference
          <input
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
            defaultValue={state.values.locationPreference}
            name="locationPreference"
            placeholder="Dallas, TX"
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Remote preference
          <select
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
            defaultValue={state.values.remotePreference}
            name="remotePreference"
          >
            <option value="">No preference</option>
            <option value="In person">In person</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-foreground">
          Urgency
          <select
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
            defaultValue={state.values.urgency}
            name="urgency"
          >
            <option value="">No urgency set</option>
            <option value="Flexible">Flexible</option>
            <option value="This semester">This semester</option>
            <option value="This summer">This summer</option>
            <option value="As soon as possible">As soon as possible</option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-foreground">
        Context for the placement team
        <textarea
          aria-describedby={
            state.fieldErrors.description
              ? "placement-description-error"
              : undefined
          }
          aria-invalid={Boolean(state.fieldErrors.description)}
          className="mt-2 min-h-32 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
          defaultValue={state.values.description}
          id="placement-description"
          name="description"
          placeholder="Tell us what you have already tried, what you are hoping to learn, or any constraints we should know."
        />
        {state.fieldErrors.description ? (
          <span
            className="mt-2 block text-sm text-red-600"
            id="placement-description-error"
          >
            {state.fieldErrors.description}
          </span>
        ) : null}
      </label>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
        Uploading a resume is recommended before submitting a personalized
        placement request, but it is not required for this stage.
      </div>

      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        <Send aria-hidden="true" className="h-4 w-4" />
        {pending ? "Submitting" : "Submit request"}
      </button>
    </form>
  );
}
