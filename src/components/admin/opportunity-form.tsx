"use client";

import { useActionState, useEffect, useRef } from "react";
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
  applicationMethodOptions,
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
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background shadow-sm transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : label}
    </button>
  );
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

function inputClassName(hasError?: boolean) {
  return [
    "mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
    hasError
      ? "border-destructive focus:border-destructive"
      : "border-border focus:border-primary",
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
  const opportunityFormRef = useRef<HTMLFormElement>(null);
  const opportunityFormErrorRef = useRef<HTMLParagraphElement>(null);
  const partnerFormRef = useRef<HTMLFormElement>(null);
  const partnerFormErrorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const invalidControl =
      opportunityFormRef.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      );

    if (invalidControl) {
      invalidControl.focus();
      return;
    }

    if (opportunityState.formError) {
      opportunityFormErrorRef.current?.focus();
    }
  }, [opportunityState.fieldErrors, opportunityState.formError]);

  useEffect(() => {
    const invalidControl = partnerFormRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );

    if (invalidControl) {
      invalidControl.focus();
      return;
    }

    if (partnerState.formError) {
      partnerFormErrorRef.current?.focus();
    }
  }, [partnerState.fieldErrors, partnerState.formError]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form
        action={opportunityAction}
        className="rounded-xl border border-border bg-background p-5 shadow-sm"
        ref={opportunityFormRef}
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
            <p
              className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
              ref={opportunityFormErrorRef}
              role="alert"
              tabIndex={-1}
            >
              {opportunityState.formError}
            </p>
          ) : null}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium text-foreground md:col-span-2">
            Title
            <input
              aria-describedby={
                opportunityState.fieldErrors.title
                  ? "admin-opportunity-title-error"
                  : undefined
              }
              aria-invalid={Boolean(opportunityState.fieldErrors.title)}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.title),
              )}
              defaultValue={values.title}
              id="admin-opportunity-title"
              name="title"
              placeholder="Clinical shadowing with community health team"
              required
            />
            <FieldError
              id="admin-opportunity-title-error"
              message={opportunityState.fieldErrors.title}
            />
          </label>

          <label className="text-sm font-medium text-foreground">
            Host organization
            <select
              aria-describedby={
                opportunityState.fieldErrors.organizationId
                  ? "admin-opportunity-organization-error"
                  : undefined
              }
              aria-invalid={Boolean(
                opportunityState.fieldErrors.organizationId,
              )}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.organizationId),
              )}
              defaultValue={values.organizationId}
              id="admin-opportunity-organization"
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
              id="admin-opportunity-organization-error"
              message={opportunityState.fieldErrors.organizationId}
            />
          </label>

          <label className="text-sm font-medium text-foreground">
            Relationship
            <select
              aria-describedby={
                opportunityState.fieldErrors.relationshipType
                  ? "admin-opportunity-relationship-error"
                  : undefined
              }
              aria-invalid={Boolean(
                opportunityState.fieldErrors.relationshipType,
              )}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.relationshipType),
              )}
              defaultValue={values.relationshipType}
              id="admin-opportunity-relationship"
              name="relationshipType"
              required
            >
              <option value="EXTERNAL_PUBLIC">External public</option>
              <option value="FP_PARTNER">FP Partner</option>
              <option value="FP_OWNED">FP-Owned</option>
            </select>
            <FieldError
              id="admin-opportunity-relationship-error"
              message={opportunityState.fieldErrors.relationshipType}
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            Application method
            <select
              aria-describedby={
                opportunityState.fieldErrors.applicationMethod
                  ? "admin-opportunity-application-method-error"
                  : undefined
              }
              aria-invalid={Boolean(
                opportunityState.fieldErrors.applicationMethod,
              )}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.applicationMethod),
              )}
              defaultValue={values.applicationMethod}
              id="admin-opportunity-application-method"
              name="applicationMethod"
              required
            >
              {applicationMethodOptions.map((item) => (
                <option key={item} value={item}>
                  {formatEnumLabel(item)}
                </option>
              ))}
            </select>
            <FieldError
              id="admin-opportunity-application-method-error"
              message={opportunityState.fieldErrors.applicationMethod}
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            Availability
            <select
              aria-describedby={
                opportunityState.fieldErrors.availabilityStatus
                  ? "admin-opportunity-availability-error"
                  : undefined
              }
              aria-invalid={Boolean(
                opportunityState.fieldErrors.availabilityStatus,
              )}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.availabilityStatus),
              )}
              defaultValue={values.availabilityStatus}
              id="admin-opportunity-availability"
              name="availabilityStatus"
              required
            >
              {[
                "OPEN",
                "OPENING_SOON",
                "ROLLING",
                "CLOSED",
                "EXPIRED",
                "ARCHIVED",
              ].map((item) => (
                <option key={item} value={item}>
                  {formatEnumLabel(item)}
                </option>
              ))}
            </select>
            <FieldError
              id="admin-opportunity-availability-error"
              message={opportunityState.fieldErrors.availabilityStatus}
            />
          </label>
          <label className="text-sm font-medium text-foreground md:col-span-2">
            Official source URL
            <input
              aria-describedby={
                opportunityState.fieldErrors.officialSourceUrl
                  ? "admin-opportunity-source-url-error"
                  : undefined
              }
              aria-invalid={Boolean(
                opportunityState.fieldErrors.officialSourceUrl,
              )}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.officialSourceUrl),
              )}
              defaultValue={values.officialSourceUrl}
              id="admin-opportunity-source-url"
              name="officialSourceUrl"
              type="url"
            />
            <FieldError
              id="admin-opportunity-source-url-error"
              message={opportunityState.fieldErrors.officialSourceUrl}
            />
          </label>
          <label className="text-sm font-medium text-foreground md:col-span-2">
            Official application URL
            <input
              aria-describedby={
                opportunityState.fieldErrors.officialApplicationUrl
                  ? "admin-opportunity-application-url-error"
                  : undefined
              }
              aria-invalid={Boolean(
                opportunityState.fieldErrors.officialApplicationUrl,
              )}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.officialApplicationUrl),
              )}
              defaultValue={values.officialApplicationUrl}
              id="admin-opportunity-application-url"
              name="officialApplicationUrl"
              type="url"
            />
            <FieldError
              id="admin-opportunity-application-url-error"
              message={opportunityState.fieldErrors.officialApplicationUrl}
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            Verification status
            <select
              aria-describedby={
                opportunityState.fieldErrors.verificationStatus
                  ? "admin-opportunity-verification-status-error"
                  : undefined
              }
              aria-invalid={Boolean(
                opportunityState.fieldErrors.verificationStatus,
              )}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.verificationStatus),
              )}
              defaultValue={values.verificationStatus}
              id="admin-opportunity-verification-status"
              name="verificationStatus"
              required
            >
              {[
                "NEEDS_REVIEW",
                "VERIFIED",
                "STALE",
                "BROKEN_LINK",
                "REJECTED",
                "ARCHIVED",
              ].map((item) => (
                <option key={item} value={item}>
                  {formatEnumLabel(item)}
                </option>
              ))}
            </select>
            <FieldError
              id="admin-opportunity-verification-status-error"
              message={opportunityState.fieldErrors.verificationStatus}
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            Last verified
            <input
              aria-describedby={
                opportunityState.fieldErrors.lastVerifiedAt
                  ? "admin-opportunity-last-verified-error"
                  : undefined
              }
              aria-invalid={Boolean(
                opportunityState.fieldErrors.lastVerifiedAt,
              )}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.lastVerifiedAt),
              )}
              defaultValue={values.lastVerifiedAt}
              id="admin-opportunity-last-verified"
              name="lastVerifiedAt"
              type="date"
            />
            <FieldError
              id="admin-opportunity-last-verified-error"
              message={opportunityState.fieldErrors.lastVerifiedAt}
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            Next verification
            <input
              aria-describedby={
                opportunityState.fieldErrors.nextVerificationAt
                  ? "admin-opportunity-next-verification-error"
                  : undefined
              }
              aria-invalid={Boolean(
                opportunityState.fieldErrors.nextVerificationAt,
              )}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.nextVerificationAt),
              )}
              defaultValue={values.nextVerificationAt}
              id="admin-opportunity-next-verification"
              name="nextVerificationAt"
              type="date"
            />
            <FieldError
              id="admin-opportunity-next-verification-error"
              message={opportunityState.fieldErrors.nextVerificationAt}
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            Opens
            <input
              aria-describedby={
                opportunityState.fieldErrors.opensAt
                  ? "admin-opportunity-opens-error"
                  : undefined
              }
              aria-invalid={Boolean(opportunityState.fieldErrors.opensAt)}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.opensAt),
              )}
              defaultValue={values.opensAt}
              id="admin-opportunity-opens"
              name="opensAt"
              type="date"
            />
            <FieldError
              id="admin-opportunity-opens-error"
              message={opportunityState.fieldErrors.opensAt}
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            Program starts
            <input
              aria-describedby={
                opportunityState.fieldErrors.startsAt
                  ? "admin-opportunity-starts-error"
                  : undefined
              }
              aria-invalid={Boolean(opportunityState.fieldErrors.startsAt)}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.startsAt),
              )}
              defaultValue={values.startsAt}
              id="admin-opportunity-starts"
              name="startsAt"
              type="date"
            />
            <FieldError
              id="admin-opportunity-starts-error"
              message={opportunityState.fieldErrors.startsAt}
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            Program ends
            <input
              aria-describedby={
                opportunityState.fieldErrors.endsAt
                  ? "admin-opportunity-ends-error"
                  : undefined
              }
              aria-invalid={Boolean(opportunityState.fieldErrors.endsAt)}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.endsAt),
              )}
              defaultValue={values.endsAt}
              id="admin-opportunity-ends"
              name="endsAt"
              type="date"
            />
            <FieldError
              id="admin-opportunity-ends-error"
              message={opportunityState.fieldErrors.endsAt}
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            City
            <input
              className={inputClassName()}
              defaultValue={values.city}
              name="city"
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            State
            <input
              className={inputClassName()}
              defaultValue={values.state}
              name="state"
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            Country
            <input
              className={inputClassName()}
              defaultValue={values.country}
              name="country"
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            Minimum age
            <input
              aria-describedby={
                opportunityState.fieldErrors.minimumAge
                  ? "admin-opportunity-minimum-age-error"
                  : undefined
              }
              aria-invalid={Boolean(opportunityState.fieldErrors.minimumAge)}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.minimumAge),
              )}
              defaultValue={values.minimumAge}
              id="admin-opportunity-minimum-age"
              max="100"
              min="13"
              name="minimumAge"
              step="1"
              type="number"
            />
            <FieldError
              id="admin-opportunity-minimum-age-error"
              message={opportunityState.fieldErrors.minimumAge}
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            Maximum age
            <input
              aria-describedby={
                opportunityState.fieldErrors.maximumAge
                  ? "admin-opportunity-maximum-age-error"
                  : undefined
              }
              aria-invalid={Boolean(opportunityState.fieldErrors.maximumAge)}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.maximumAge),
              )}
              defaultValue={values.maximumAge}
              id="admin-opportunity-maximum-age"
              max="100"
              min="13"
              name="maximumAge"
              step="1"
              type="number"
            />
            <FieldError
              id="admin-opportunity-maximum-age-error"
              message={opportunityState.fieldErrors.maximumAge}
            />
          </label>
          <label className="text-sm font-medium text-foreground md:col-span-2">
            Accepted grade levels
            <input
              aria-describedby={
                opportunityState.fieldErrors.acceptedGradeLevels
                  ? "admin-opportunity-grade-levels-error"
                  : undefined
              }
              aria-invalid={Boolean(
                opportunityState.fieldErrors.acceptedGradeLevels,
              )}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.acceptedGradeLevels),
              )}
              defaultValue={values.acceptedGradeLevels}
              id="admin-opportunity-grade-levels"
              name="acceptedGradeLevels"
              placeholder="High school junior, High school senior"
            />
            <FieldError
              id="admin-opportunity-grade-levels-error"
              message={opportunityState.fieldErrors.acceptedGradeLevels}
            />
          </label>
          <label className="text-sm font-medium text-foreground md:col-span-2">
            Required certifications
            <input
              className={inputClassName()}
              defaultValue={values.requiredCertifications}
              name="requiredCertifications"
              placeholder="CPR, BLS"
            />
          </label>

          <label className="text-sm font-medium text-foreground">
            Status
            <select
              aria-describedby={
                opportunityState.fieldErrors.status
                  ? "admin-opportunity-status-error"
                  : undefined
              }
              aria-invalid={Boolean(opportunityState.fieldErrors.status)}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.status),
              )}
              defaultValue={values.status}
              id="admin-opportunity-status"
              name="status"
              required
            >
              {opportunityStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatEnumLabel(status)}
                </option>
              ))}
            </select>
            <FieldError
              id="admin-opportunity-status-error"
              message={opportunityState.fieldErrors.status}
            />
          </label>

          <label className="text-sm font-medium text-foreground">
            Type
            <select
              aria-describedby={
                opportunityState.fieldErrors.type
                  ? "admin-opportunity-type-error"
                  : undefined
              }
              aria-invalid={Boolean(opportunityState.fieldErrors.type)}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.type),
              )}
              defaultValue={values.type}
              id="admin-opportunity-type"
              name="type"
              required
            >
              <option value="">Select type</option>
              {opportunityTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {formatEnumLabel(type)}
                </option>
              ))}
            </select>
            <FieldError
              id="admin-opportunity-type-error"
              message={opportunityState.fieldErrors.type}
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
                opportunityState.fieldErrors.deadline
                  ? "admin-opportunity-deadline-error"
                  : undefined
              }
              aria-invalid={Boolean(opportunityState.fieldErrors.deadline)}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.deadline),
              )}
              defaultValue={values.deadline}
              id="admin-opportunity-deadline"
              name="deadline"
              type="date"
            />
            <FieldError
              id="admin-opportunity-deadline-error"
              message={opportunityState.fieldErrors.deadline}
            />
          </label>

          <label className="text-sm font-medium text-foreground">
            Capacity
            <input
              aria-describedby={
                opportunityState.fieldErrors.capacity
                  ? "admin-opportunity-capacity-error"
                  : undefined
              }
              aria-invalid={Boolean(opportunityState.fieldErrors.capacity)}
              className={inputClassName(
                Boolean(opportunityState.fieldErrors.capacity),
              )}
              defaultValue={values.capacity}
              id="admin-opportunity-capacity"
              min="1"
              name="capacity"
              placeholder="12"
              type="number"
            />
            <FieldError
              id="admin-opportunity-capacity-error"
              message={opportunityState.fieldErrors.capacity}
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
              placeholder="How students should apply once student-facing flows are enabled."
              rows={4}
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <SubmitButton label="Save opportunity" />
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            href="/dashboard/admin/opportunities"
          >
            Back to opportunities
          </a>
        </div>
      </form>

      <aside className="space-y-6">
        <section className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">
            Host organization record
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add a host record here. This does not make the organization an FP
            partner.
          </p>
          <form
            action={partnerAction}
            className="mt-5 space-y-4"
            ref={partnerFormRef}
          >
            <input name="redirectTo" type="hidden" value={currentPath} />
            {partnerState.formError ? (
              <p
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
                ref={partnerFormErrorRef}
                role="alert"
                tabIndex={-1}
              >
                {partnerState.formError}
              </p>
            ) : null}
            <label className="block text-sm font-medium text-foreground">
              Name
              <input
                aria-describedby={
                  partnerState.fieldErrors.name
                    ? "admin-partner-name-error"
                    : undefined
                }
                aria-invalid={Boolean(partnerState.fieldErrors.name)}
                className={inputClassName(
                  Boolean(partnerState.fieldErrors.name),
                )}
                defaultValue={partnerState.values.name}
                id="admin-partner-name"
                name="name"
                placeholder="Northside Health Collective"
                required
              />
              <FieldError
                id="admin-partner-name-error"
                message={partnerState.fieldErrors.name}
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Website
              <input
                aria-describedby={
                  partnerState.fieldErrors.website
                    ? "admin-partner-website-error"
                    : undefined
                }
                aria-invalid={Boolean(partnerState.fieldErrors.website)}
                className={inputClassName(
                  Boolean(partnerState.fieldErrors.website),
                )}
                defaultValue={partnerState.values.website}
                id="admin-partner-website"
                name="website"
                placeholder="https://example.org"
                type="url"
              />
              <FieldError
                id="admin-partner-website-error"
                message={partnerState.fieldErrors.website}
              />
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
                aria-describedby={
                  partnerState.fieldErrors.status
                    ? "admin-partner-status-error"
                    : undefined
                }
                aria-invalid={Boolean(partnerState.fieldErrors.status)}
                className={inputClassName(
                  Boolean(partnerState.fieldErrors.status),
                )}
                defaultValue={partnerState.values.status}
                id="admin-partner-status"
                name="status"
                required
              >
                {partnerStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatEnumLabel(status)}
                  </option>
                ))}
              </select>
              <FieldError
                id="admin-partner-status-error"
                message={partnerState.fieldErrors.status}
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Contact email
              <input
                aria-describedby={
                  partnerState.fieldErrors.contactEmail
                    ? "admin-partner-contact-email-error"
                    : undefined
                }
                aria-invalid={Boolean(partnerState.fieldErrors.contactEmail)}
                className={inputClassName(
                  Boolean(partnerState.fieldErrors.contactEmail),
                )}
                defaultValue={partnerState.values.contactEmail}
                id="admin-partner-contact-email"
                name="contactEmail"
                placeholder="contact@example.org"
                type="email"
              />
              <FieldError
                id="admin-partner-contact-email-error"
                message={partnerState.fieldErrors.contactEmail}
              />
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
