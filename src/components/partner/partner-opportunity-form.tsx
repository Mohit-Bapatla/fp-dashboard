"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { savePartnerOpportunity } from "@/app/dashboard/partner/opportunities/actions";
import type {
  PartnerOpportunityActionState,
  PartnerOpportunityFormValues,
} from "@/lib/partner/opportunity-validation";
import { partnerOpportunityTypeOptions } from "@/lib/partner/opportunity-validation";

type PartnerOrganizationOption = {
  id: string;
  name: string;
};

type PartnerOpportunityFormProps = {
  canEdit: boolean;
  initialValues: PartnerOpportunityFormValues;
  organizations: PartnerOrganizationOption[];
  statusLabel?: string;
};

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inputClassName(hasError?: boolean) {
  return [
    "mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-muted/50",
    hasError
      ? "border-destructive focus:border-destructive"
      : "border-border focus:border-foreground",
  ].join(" ");
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-destructive" id={id}>
      {message}
    </p>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : "Save draft"}
    </button>
  );
}

export function PartnerOpportunityForm({
  canEdit,
  initialValues,
  organizations,
  statusLabel,
}: PartnerOpportunityFormProps) {
  const initialState: PartnerOpportunityActionState = {
    fieldErrors: {},
    formError: null,
    values: initialValues,
  };
  const [state, action] = useActionState(savePartnerOpportunity, initialState);
  const values = state.values;
  const formRef = useRef<HTMLFormElement>(null);
  const formErrorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const invalidControl = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]:not(:disabled)',
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
    <form
      action={action}
      className="rounded-lg border border-border bg-background p-5 shadow-sm"
      ref={formRef}
    >
      <input name="opportunityId" type="hidden" value={values.opportunityId} />
      <div className="border-b border-border pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Opportunity details
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Partner-created opportunities stay in draft until submitted for
              admin approval.
            </p>
          </div>
          {statusLabel ? (
            <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {statusLabel}
            </span>
          ) : null}
        </div>
        {!canEdit ? (
          <p className="mt-4 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            This opportunity is read-only while it is awaiting approval,
            published, closed, or archived.
          </p>
        ) : null}
        {state.formError ? (
          <p
            className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
            ref={formErrorRef}
            role="alert"
            tabIndex={-1}
          >
            {state.formError}
          </p>
        ) : null}
      </div>

      <fieldset className="mt-6 grid gap-5 md:grid-cols-2" disabled={!canEdit}>
        <label className="text-sm font-medium text-foreground md:col-span-2">
          Title
          <input
            aria-describedby={
              state.fieldErrors.title
                ? "partner-opportunity-title-error"
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors.title)}
            className={inputClassName(Boolean(state.fieldErrors.title))}
            defaultValue={values.title}
            id="partner-opportunity-title"
            name="title"
            placeholder="Clinical shadowing with community health team"
            required
          />
          <FieldError
            id="partner-opportunity-title-error"
            message={state.fieldErrors.title}
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Organization
          <select
            aria-describedby={
              state.fieldErrors.organizationId
                ? "partner-opportunity-organization-error"
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors.organizationId)}
            className={inputClassName(
              Boolean(state.fieldErrors.organizationId),
            )}
            defaultValue={values.organizationId}
            id="partner-opportunity-organization"
            name="organizationId"
            required
          >
            <option value="">Select organization</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
          <FieldError
            id="partner-opportunity-organization-error"
            message={state.fieldErrors.organizationId}
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Type
          <select
            aria-describedby={
              state.fieldErrors.type
                ? "partner-opportunity-type-error"
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors.type)}
            className={inputClassName(Boolean(state.fieldErrors.type))}
            defaultValue={values.type}
            id="partner-opportunity-type"
            name="type"
            required
          >
            <option value="">Select type</option>
            {partnerOpportunityTypeOptions.map((type) => (
              <option key={type} value={type}>
                {formatEnumLabel(type)}
              </option>
            ))}
          </select>
          <FieldError
            id="partner-opportunity-type-error"
            message={state.fieldErrors.type}
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Specialty
          <input
            className={inputClassName()}
            defaultValue={values.specialty}
            name="specialty"
            placeholder="Pediatrics, public health, research"
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Location
          <input
            className={inputClassName()}
            defaultValue={values.location}
            name="location"
            placeholder="Chicago, IL"
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Remote type
          <input
            className={inputClassName()}
            defaultValue={values.remoteType}
            name="remoteType"
            placeholder="In person, hybrid, remote"
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Paid status
          <input
            className={inputClassName()}
            defaultValue={values.paidStatus}
            name="paidStatus"
            placeholder="Paid, unpaid, stipend available"
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Deadline
          <input
            aria-describedby={
              state.fieldErrors.deadline
                ? "partner-opportunity-deadline-error"
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors.deadline)}
            className={inputClassName(Boolean(state.fieldErrors.deadline))}
            defaultValue={values.deadline}
            id="partner-opportunity-deadline"
            name="deadline"
            type="date"
          />
          <FieldError
            id="partner-opportunity-deadline-error"
            message={state.fieldErrors.deadline}
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Capacity
          <input
            aria-describedby={
              state.fieldErrors.capacity
                ? "partner-opportunity-capacity-error"
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors.capacity)}
            className={inputClassName(Boolean(state.fieldErrors.capacity))}
            defaultValue={values.capacity}
            id="partner-opportunity-capacity"
            min="1"
            name="capacity"
            placeholder="12"
            type="number"
          />
          <FieldError
            id="partner-opportunity-capacity-error"
            message={state.fieldErrors.capacity}
          />
        </label>

        <label className="text-sm font-medium text-foreground md:col-span-2">
          Description
          <textarea
            className={inputClassName()}
            defaultValue={values.description}
            name="description"
            placeholder="Describe the opportunity, student responsibilities, and expected outcomes."
            rows={5}
          />
        </label>

        <label className="text-sm font-medium text-foreground md:col-span-2">
          Eligibility requirements
          <textarea
            className={inputClassName()}
            defaultValue={values.eligibilityRequirements}
            name="eligibilityRequirements"
            placeholder="Grade level, interests, prerequisites, or scheduling requirements."
            rows={4}
          />
        </label>

        <label className="text-sm font-medium text-foreground md:col-span-2">
          Required documents
          <textarea
            className={inputClassName()}
            defaultValue={values.requiredDocuments}
            name="requiredDocuments"
            placeholder="Resume, transcript, parent consent"
            rows={3}
          />
        </label>

        <label className="text-sm font-medium text-foreground md:col-span-2">
          Application instructions
          <textarea
            className={inputClassName()}
            defaultValue={values.applicationInstructions}
            name="applicationInstructions"
            placeholder="How students should apply once this opportunity is published."
            rows={4}
          />
        </label>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {canEdit ? <SubmitButton /> : null}
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          href="/dashboard/partner/opportunities"
        >
          Back to opportunities
        </Link>
      </div>
    </form>
  );
}
