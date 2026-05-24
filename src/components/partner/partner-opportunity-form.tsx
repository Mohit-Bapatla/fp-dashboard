"use client";

import Link from "next/link";
import { useActionState } from "react";
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

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-destructive">{message}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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

  return (
    <form
      action={action}
      className="rounded-lg border border-border bg-background p-5 shadow-sm"
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
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.formError}
          </p>
        ) : null}
      </div>

      <fieldset className="mt-6 grid gap-5 md:grid-cols-2" disabled={!canEdit}>
        <label className="text-sm font-medium text-foreground md:col-span-2">
          Title
          <input
            className={inputClassName(Boolean(state.fieldErrors.title))}
            defaultValue={values.title}
            name="title"
            placeholder="Clinical shadowing with community health team"
          />
          <FieldError message={state.fieldErrors.title} />
        </label>

        <label className="text-sm font-medium text-foreground">
          Organization
          <select
            className={inputClassName(
              Boolean(state.fieldErrors.organizationId),
            )}
            defaultValue={values.organizationId}
            name="organizationId"
          >
            <option value="">Select organization</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors.organizationId} />
        </label>

        <label className="text-sm font-medium text-foreground">
          Type
          <select
            className={inputClassName(Boolean(state.fieldErrors.type))}
            defaultValue={values.type}
            name="type"
          >
            <option value="">Select type</option>
            {partnerOpportunityTypeOptions.map((type) => (
              <option key={type} value={type}>
                {formatEnumLabel(type)}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors.type} />
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
            className={inputClassName(Boolean(state.fieldErrors.deadline))}
            defaultValue={values.deadline}
            name="deadline"
            type="date"
          />
          <FieldError message={state.fieldErrors.deadline} />
        </label>

        <label className="text-sm font-medium text-foreground">
          Capacity
          <input
            className={inputClassName(Boolean(state.fieldErrors.capacity))}
            defaultValue={values.capacity}
            min="1"
            name="capacity"
            placeholder="12"
            type="number"
          />
          <FieldError message={state.fieldErrors.capacity} />
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
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
          href="/dashboard/partner/opportunities"
        >
          Back to opportunities
        </Link>
      </div>
    </form>
  );
}
