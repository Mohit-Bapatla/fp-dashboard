"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createPartnerOrganization,
  saveOpportunity,
} from "@/app/dashboard/admin/opportunities/actions";
import type {
  OpportunityActionState,
  OpportunityFormValues,
} from "@/lib/admin/opportunity-validation";
import {
  emptyPartnerOrganizationActionState,
  opportunityStatusOptions,
  opportunityTypeOptions,
  partnerStatusOptions,
} from "@/lib/admin/opportunity-validation";

type PartnerOrganizationOption = {
  id: string;
  name: string;
  status: string;
};

type OpportunityFormProps = {
  currentPath: string;
  initialValues: OpportunityFormValues;
  organizations: PartnerOrganizationOption[];
};

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background shadow-sm transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-destructive">{message}</p>;
}

function inputClassName(hasError?: boolean) {
  return [
    "mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground",
    hasError
      ? "border-destructive focus:border-destructive"
      : "border-border focus:border-foreground",
  ].join(" ");
}

export function OpportunityForm({
  currentPath,
  initialValues,
  organizations,
}: OpportunityFormProps) {
  const initialOpportunityState: OpportunityActionState = {
    fieldErrors: {},
    formError: null,
    values: initialValues,
  };
  const [opportunityState, opportunityAction] = useActionState(
    saveOpportunity,
    initialOpportunityState,
  );
  const [partnerState, partnerAction] = useActionState(
    createPartnerOrganization,
    emptyPartnerOrganizationActionState,
  );
  const values = opportunityState.values;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form
        action={opportunityAction}
        className="rounded-lg border border-border bg-background p-5 shadow-sm"
      >
        <input
          name="opportunityId"
          type="hidden"
          value={values.opportunityId}
        />
        <div className="border-b border-border pb-5">
          <h2 className="text-lg font-semibold text-foreground">
            Opportunity details
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a clear admin-managed listing before publishing it.
          </p>
          {opportunityState.formError ? (
            <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {opportunityState.formError}
            </p>
          ) : null}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium text-foreground md:col-span-2">
            Title
            <input
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.title),
              )}
              defaultValue={values.title}
              name="title"
              placeholder="Clinical shadowing with community health team"
            />
            <FieldError message={opportunityState.fieldErrors.title} />
          </label>

          <label className="text-sm font-medium text-foreground">
            Partner organization
            <select
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.organizationId),
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
            <FieldError message={opportunityState.fieldErrors.organizationId} />
          </label>

          <label className="text-sm font-medium text-foreground">
            Status
            <select
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.status),
              )}
              defaultValue={values.status}
              name="status"
            >
              {opportunityStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatEnumLabel(status)}
                </option>
              ))}
            </select>
            <FieldError message={opportunityState.fieldErrors.status} />
          </label>

          <label className="text-sm font-medium text-foreground">
            Type
            <select
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.type),
              )}
              defaultValue={values.type}
              name="type"
            >
              <option value="">Select type</option>
              {opportunityTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {formatEnumLabel(type)}
                </option>
              ))}
            </select>
            <FieldError message={opportunityState.fieldErrors.type} />
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
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.deadline),
              )}
              defaultValue={values.deadline}
              name="deadline"
              type="date"
            />
            <FieldError message={opportunityState.fieldErrors.deadline} />
          </label>

          <label className="text-sm font-medium text-foreground">
            Capacity
            <input
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.capacity),
              )}
              defaultValue={values.capacity}
              min="1"
              name="capacity"
              placeholder="12"
              type="number"
            />
            <FieldError message={opportunityState.fieldErrors.capacity} />
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
              placeholder="How students should apply once student-facing flows are enabled."
              rows={4}
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <SubmitButton label="Save opportunity" />
          <a
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            href="/dashboard/admin/opportunities"
          >
            Back to opportunities
          </a>
        </div>
      </form>

      <aside className="space-y-6">
        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">
            Partner organization
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add a partner here when the opportunity belongs to a new
            organization.
          </p>
          <form action={partnerAction} className="mt-5 space-y-4">
            <input name="redirectTo" type="hidden" value={currentPath} />
            {partnerState.formError ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {partnerState.formError}
              </p>
            ) : null}
            <label className="block text-sm font-medium text-foreground">
              Name
              <input
                className={inputClassName(
                  Boolean(partnerState.fieldErrors.name),
                )}
                defaultValue={partnerState.values.name}
                name="name"
                placeholder="Northside Health Collective"
              />
              <FieldError message={partnerState.fieldErrors.name} />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Website
              <input
                className={inputClassName(
                  Boolean(partnerState.fieldErrors.website),
                )}
                defaultValue={partnerState.values.website}
                name="website"
                placeholder="https://example.org"
              />
              <FieldError message={partnerState.fieldErrors.website} />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Type
              <input
                className={inputClassName()}
                defaultValue={partnerState.values.type}
                name="type"
                placeholder="Clinic, nonprofit, lab"
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Status
              <select
                className={inputClassName(
                  Boolean(partnerState.fieldErrors.status),
                )}
                defaultValue={partnerState.values.status}
                name="status"
              >
                {partnerStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatEnumLabel(status)}
                  </option>
                ))}
              </select>
              <FieldError message={partnerState.fieldErrors.status} />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Contact email
              <input
                className={inputClassName(
                  Boolean(partnerState.fieldErrors.contactEmail),
                )}
                defaultValue={partnerState.values.contactEmail}
                name="contactEmail"
                placeholder="contact@example.org"
              />
              <FieldError message={partnerState.fieldErrors.contactEmail} />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Location
              <input
                className={inputClassName()}
                defaultValue={partnerState.values.location}
                name="location"
                placeholder="Chicago metro"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium text-foreground">
                City
                <input
                  className={inputClassName()}
                  defaultValue={partnerState.values.city}
                  name="city"
                />
              </label>
              <label className="text-sm font-medium text-foreground">
                State
                <input
                  className={inputClassName()}
                  defaultValue={partnerState.values.state}
                  name="state"
                />
              </label>
              <label className="text-sm font-medium text-foreground">
                Country
                <input
                  className={inputClassName()}
                  defaultValue={partnerState.values.country}
                  name="country"
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-foreground">
              Specialty areas
              <textarea
                className={inputClassName()}
                defaultValue={partnerState.values.specialtyAreas}
                name="specialtyAreas"
                placeholder="Primary care, behavioral health, pediatrics"
                rows={3}
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Description
              <textarea
                className={inputClassName()}
                defaultValue={partnerState.values.description}
                name="description"
                rows={4}
              />
            </label>
            <SubmitButton label="Add partner" />
          </form>
        </section>
      </aside>
    </div>
  );
}
