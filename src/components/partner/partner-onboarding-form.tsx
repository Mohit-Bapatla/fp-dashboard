"use client";

import { useSession, useUser } from "@clerk/nextjs";
import { ArrowRight, Building2, LoaderCircle, ShieldCheck } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { createPartnerWorkspace } from "@/app/(auth)/partner-onboarding/actions";
import type {
  PartnerOnboardingActionState,
  PartnerOnboardingFieldErrors,
  PartnerOnboardingFormValues,
} from "@/lib/partner/onboarding";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type PartnerOnboardingFormProps = {
  contactEmail: string;
  initialState: PartnerOnboardingActionState;
};

type PartnerFieldProps = {
  autoComplete?: string;
  errors: PartnerOnboardingFieldErrors;
  label: string;
  name: keyof PartnerOnboardingFormValues;
  placeholder?: string;
  required?: boolean;
  type?: string;
  values: PartnerOnboardingFormValues;
};

function PartnerField({
  autoComplete,
  errors,
  label,
  name,
  placeholder,
  required,
  type = "text",
  values,
}: PartnerFieldProps) {
  const error = errors[name];

  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      {required ? <span className="text-primary"> *</span> : null}
      <input
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className={cn(
          "mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
          error && "border-red-400 focus:border-red-500 focus:ring-red-100",
        )}
        defaultValue={values[name]}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
      {error ? (
        <span
          className="mt-1.5 block text-xs text-red-700"
          id={`${name}-error`}
        >
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function PartnerOnboardingForm({
  contactEmail,
  initialState,
}: PartnerOnboardingFormProps) {
  const [state, formAction, isPending] = useActionState(
    createPartnerWorkspace,
    initialState,
  );
  const { isLoaded: sessionLoaded, session } = useSession();
  const { isLoaded: userLoaded, user } = useUser();
  const refreshStarted = useRef(false);
  const [refreshAttempt, setRefreshAttempt] = useState(0);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (
      state.status !== "complete" ||
      !sessionLoaded ||
      !userLoaded ||
      refreshStarted.current
    ) {
      return;
    }

    refreshStarted.current = true;

    async function finishOnboarding() {
      if (!session || !user) {
        throw new Error("The active Clerk session is unavailable.");
      }

      await user.reload();
      const token = await session.getToken({ skipCache: true });

      if (!token) {
        throw new Error("Clerk did not return a refreshed session token.");
      }

      window.location.replace("/dashboard/partner");
    }

    void finishOnboarding().catch(() => {
      setRefreshError(
        "Your workspace was created, but this browser could not refresh the new partner role. Retry the secure refresh; do not submit the organization form again.",
      );
    });
  }, [refreshAttempt, session, sessionLoaded, state.status, user, userLoaded]);

  if (state.status === "complete") {
    return (
      <section
        aria-live="polite"
        className="rounded-xl border border-primary/25 bg-primary/[0.04] p-6 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            {refreshError ? (
              <ShieldCheck aria-hidden="true" className="size-5" />
            ) : (
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {refreshError
                ? "Workspace created; session refresh needed"
                : "Creating your secure partner session"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {refreshError ??
                "Your organization is unverified and pending review. We are refreshing your session before opening the partner dashboard."}
            </p>
            {refreshError ? (
              <button
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => {
                  refreshStarted.current = false;
                  setRefreshError(null);
                  setRefreshAttempt((attempt) => attempt + 1);
                }}
                type="button"
              >
                Retry secure refresh
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-xl border border-border bg-background shadow-sm"
    >
      <div className="border-b border-border p-6">
        <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted text-primary">
          <Building2 aria-hidden="true" className="size-5" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-foreground">
          Organization details
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          This creates a new, unverified organization workspace. It does not
          approve the organization or publish any opportunity.
        </p>
      </div>

      {state.formError ? (
        <div
          aria-live="polite"
          className={cn(
            "border-b px-6 py-4 text-sm leading-6",
            state.status === "activation_pending"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          {state.formError}
        </div>
      ) : null}

      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <PartnerField
            autoComplete="organization"
            errors={state.fieldErrors}
            label="Organization name"
            name="name"
            placeholder="Example Medical Center"
            required
            values={state.values}
          />
        </div>
        <PartnerField
          autoComplete="organization-title"
          errors={state.fieldErrors}
          label="Organization type (optional)"
          name="organizationType"
          placeholder="Hospital, clinic, university, nonprofit..."
          values={state.values}
        />
        <PartnerField
          autoComplete="organization-title"
          errors={state.fieldErrors}
          label="Your title (optional)"
          name="title"
          placeholder="Program coordinator"
          values={state.values}
        />
        <div className="sm:col-span-2">
          <PartnerField
            autoComplete="url"
            errors={state.fieldErrors}
            label="Organization website (optional)"
            name="website"
            placeholder="https://www.example.org"
            type="url"
            values={state.values}
          />
        </div>

        <div className="sm:col-span-2 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground">Contact email</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">
            {contactEmail}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            We use the verified email from your signed-in account. It is not
            editable in this form.
          </p>
        </div>

        <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck aria-hidden="true" className="size-4" />
            Review is still required
          </div>
          <p className="mt-1">
            Future Physicians must verify the organization and separately review
            each submitted opportunity before anything appears to students.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-muted-foreground">
          Need help instead? Email{" "}
          <a
            className="font-semibold text-primary hover:underline"
            href={`mailto:${siteConfig.emails.partnerships}`}
          >
            {siteConfig.emails.partnerships}
          </a>
          .
        </p>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending || state.status === "activation_pending"}
          type="submit"
        >
          {isPending ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
              Creating workspace
            </>
          ) : (
            <>
              Create unverified workspace
              <ArrowRight aria-hidden="true" className="size-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
