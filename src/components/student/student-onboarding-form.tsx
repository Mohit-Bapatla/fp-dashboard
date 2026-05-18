"use client";

import { Check, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { saveStudentProfile } from "@/app/dashboard/student/onboarding/actions";
import type { StudentOnboardingActionState } from "@/lib/student/onboarding-state";
import { cn } from "@/lib/utils";
import {
  opportunityTypeOptions,
  type StudentProfileFieldErrors,
  type StudentProfileFormValues,
} from "@/lib/student/profile-validation";

type StudentOnboardingFormProps = {
  initialState: StudentOnboardingActionState;
};

type TextFieldProps = {
  errors: StudentProfileFieldErrors;
  label: string;
  name: keyof StudentProfileFormValues;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  type?: string;
  values: StudentProfileFormValues;
};

const steps = [
  {
    title: "Basic Info",
    description: "Start with your identity and school details.",
  },
  {
    title: "Location",
    description: "Tell us where and how you prefer to participate.",
  },
  {
    title: "Interests",
    description: "Choose the opportunity types and specialties you want.",
  },
  {
    title: "Goals",
    description: "Add career goals and any professional links.",
  },
];

function TextField({
  errors,
  label,
  name,
  placeholder,
  required,
  rows,
  type = "text",
  values,
}: TextFieldProps) {
  const error = errors[name];
  const className = cn(
    "mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary",
    error && "border-red-400 focus:border-red-500",
  );

  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      {required ? <span className="text-primary"> *</span> : null}
      {rows ? (
        <textarea
          className={className}
          defaultValue={values[name]}
          name={name}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          className={className}
          defaultValue={values[name]}
          name={name}
          placeholder={placeholder}
          type={type}
        />
      )}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : null}
    </label>
  );
}

export function StudentOnboardingForm({
  initialState,
}: StudentOnboardingFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveStudentProfile,
    initialState,
  );
  const [step, setStep] = useState(0);
  const progress = useMemo(
    () => Math.round(((step + 1) / steps.length) * 100),
    [step],
  );

  return (
    <form
      action={formAction}
      className="rounded-xl border border-border bg-background shadow-sm"
    >
      <div className="border-b border-border p-6">
        <nav aria-label="Form progress" className="mb-5">
          <ol className="flex items-center">
            {steps.map((_s, i) => (
              <li
                className={cn(
                  "flex items-center",
                  i < steps.length - 1 && "flex-1",
                )}
                key={i}
              >
                <div
                  aria-current={i === step ? "step" : undefined}
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    i < step
                      ? "border-primary bg-primary text-primary-foreground"
                      : i === step
                        ? "border-primary bg-background text-primary"
                        : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {i < step ? (
                    <Check aria-hidden="true" className="h-3 w-3" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-px flex-1 transition-colors",
                      i < step ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Step {step + 1} of {steps.length}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {steps[step].title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {steps[step].description}
            </p>
          </div>
          <div className="min-w-36 text-sm text-muted-foreground">
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-right">{progress}%</p>
          </div>
        </div>
      </div>

      {state.formError ? (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
          {state.formError}
        </div>
      ) : null}

      <div className="p-6">
        <section
          className={cn("grid gap-5 sm:grid-cols-2", step !== 0 && "hidden")}
        >
          <TextField
            errors={state.fieldErrors}
            label="First name"
            name="firstName"
            required
            values={state.values}
          />
          <TextField
            errors={state.fieldErrors}
            label="Last name"
            name="lastName"
            required
            values={state.values}
          />
          <TextField
            errors={state.fieldErrors}
            label="School"
            name="school"
            placeholder="Example University"
            required
            values={state.values}
          />
          <TextField
            errors={state.fieldErrors}
            label="Grade year"
            name="gradeYear"
            placeholder="Sophomore, junior, 2027..."
            required
            values={state.values}
          />
        </section>

        <section
          className={cn("grid gap-5 sm:grid-cols-2", step !== 1 && "hidden")}
        >
          <TextField
            errors={state.fieldErrors}
            label="City"
            name="city"
            required
            values={state.values}
          />
          <TextField
            errors={state.fieldErrors}
            label="State"
            name="state"
            required
            values={state.values}
          />
          <TextField
            errors={state.fieldErrors}
            label="Country"
            name="country"
            required
            values={state.values}
          />
          <TextField
            errors={state.fieldErrors}
            label="Location preference"
            name="locationPreference"
            placeholder="Chicago area, Midwest, anywhere..."
            values={state.values}
          />
          <TextField
            errors={state.fieldErrors}
            label="Remote preference"
            name="remotePreference"
            placeholder="In-person, remote, hybrid..."
            values={state.values}
          />
        </section>

        <section className={cn("space-y-5", step !== 2 && "hidden")}>
          <TextField
            errors={state.fieldErrors}
            label="Interested specialties"
            name="interestedSpecialties"
            placeholder="Cardiology, pediatrics, emergency medicine"
            required
            rows={3}
            values={state.values}
          />

          <fieldset>
            <legend className="text-sm font-medium text-foreground">
              Opportunity types <span className="text-primary">*</span>
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {opportunityTypeOptions.map((type) => (
                <label
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3 text-sm text-foreground transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/[0.04]"
                  key={type}
                >
                  <input
                    className="h-4 w-4 accent-primary"
                    defaultChecked={state.values.opportunityTypes.includes(
                      type,
                    )}
                    name="opportunityTypes"
                    type="checkbox"
                    value={type}
                  />
                  {type
                    .toLowerCase()
                    .split("_")
                    .map((word) => word[0].toUpperCase() + word.slice(1))
                    .join(" ")}
                </label>
              ))}
            </div>
            {state.fieldErrors.opportunityTypes ? (
              <span className="mt-2 block text-xs text-red-600">
                {state.fieldErrors.opportunityTypes}
              </span>
            ) : null}
          </fieldset>

          <TextField
            errors={state.fieldErrors}
            label="Availability"
            name="availability"
            placeholder="Weekday evenings, Saturday mornings"
            required
            rows={3}
            values={state.values}
          />
          <TextField
            errors={state.fieldErrors}
            label="Languages"
            name="languages"
            placeholder="English, Spanish"
            rows={3}
            values={state.values}
          />
        </section>

        <section
          className={cn("grid gap-5 sm:grid-cols-2", step !== 3 && "hidden")}
        >
          <div className="sm:col-span-2">
            <TextField
              errors={state.fieldErrors}
              label="Career goals"
              name="careerGoals"
              placeholder="What are you hoping to explore or accomplish?"
              required
              rows={4}
              values={state.values}
            />
          </div>
          <TextField
            errors={state.fieldErrors}
            label="Experience level"
            name="experienceLevel"
            placeholder="Exploring, beginner, intermediate..."
            required
            values={state.values}
          />
          <TextField
            errors={state.fieldErrors}
            label="LinkedIn URL"
            name="linkedinUrl"
            placeholder="https://linkedin.com/in/..."
            type="url"
            values={state.values}
          />
          <TextField
            errors={state.fieldErrors}
            label="GitHub URL"
            name="githubUrl"
            placeholder="https://github.com/..."
            type="url"
            values={state.values}
          />
          <TextField
            errors={state.fieldErrors}
            label="Portfolio URL"
            name="portfolioUrl"
            placeholder="https://..."
            type="url"
            values={state.values}
          />
        </section>
      </div>

      <div className="flex flex-col justify-between gap-3 border-t border-border p-6 sm:flex-row">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={step === 0 || isPending}
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Back
        </button>

        {step < steps.length - 1 ? (
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
            onClick={() =>
              setStep((current) => Math.min(current + 1, steps.length - 1))
            }
            type="button"
          >
            Continue
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : (
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            {isPending ? (
              <>
                <Save aria-hidden="true" className="h-4 w-4" />
                Saving
              </>
            ) : (
              <>
                <Check aria-hidden="true" className="h-4 w-4" />
                Save profile
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
