"use client";

import { Check, ChevronLeft, ChevronRight, Plus, Save, X } from "lucide-react";
import { useActionState, useMemo, useState, type ReactNode } from "react";

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

type SelectFieldProps = {
  children: ReactNode;
  errors: StudentProfileFieldErrors;
  label: string;
  name: keyof StudentProfileFormValues;
  required?: boolean;
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

const gradeYearOptions = [
  "High school freshman",
  "High school sophomore",
  "High school junior",
  "High school senior",
  "College freshman",
  "College sophomore",
  "College junior",
  "College senior",
  "Graduate student",
  "Medical student",
  "Gap year / post-baccalaureate",
  "Other",
] as const;

function getGradeYearControlValues(value: string) {
  if (!value) {
    return {
      customValue: "",
      selectedValue: "",
    };
  }

  if (gradeYearOptions.some((option) => option === value)) {
    return {
      customValue: "",
      selectedValue: value,
    };
  }

  return {
    customValue: value,
    selectedValue: "Other",
  };
}

const specialtySuggestions = [
  "Neuroscience",
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Emergency medicine",
  "Surgery",
  "Internal medicine",
  "Public health",
  "Oncology",
  "Psychiatry",
  "Radiology",
  "Dermatology",
  "Primary care",
  "Research",
  "Machine learning in healthcare",
  "Global health",
  "Health policy",
  "Medical education",
] as const;

function splitSpecialties(value: string) {
  return value
    .split(/[\n,;]+/)
    .map(normalizeSpecialty)
    .filter(Boolean);
}

function normalizeSpecialty(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();

      if (["in", "and", "of"].includes(lower)) {
        return lower;
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function uniqueSpecialties(values: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  values.forEach((value) => {
    const normalized = normalizeSpecialty(value);
    const key = normalized.toLowerCase();

    if (normalized && !seen.has(key)) {
      seen.add(key);
      unique.push(normalized);
    }
  });

  return unique;
}

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

function SelectField({
  children,
  errors,
  label,
  name,
  required,
  values,
}: SelectFieldProps) {
  const error = errors[name];

  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      {required ? <span className="text-primary"> *</span> : null}
      <select
        className={cn(
          "mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary",
          error && "border-red-400 focus:border-red-500",
        )}
        defaultValue={values[name] as string}
        name={name}
      >
        {children}
      </select>
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : null}
    </label>
  );
}

function SpecialtyTagInput({
  errors,
  values,
}: {
  errors: StudentProfileFieldErrors;
  values: StudentProfileFormValues;
}) {
  const [selected, setSelected] = useState(() =>
    uniqueSpecialties(splitSpecialties(values.interestedSpecialties)),
  );
  const [customValue, setCustomValue] = useState("");
  const error = errors.interestedSpecialties;

  function addSpecialty(value: string) {
    const normalized = normalizeSpecialty(value);

    if (!normalized) {
      return;
    }

    setSelected((current) => uniqueSpecialties([...current, normalized]));
    setCustomValue("");
  }

  function removeSpecialty(value: string) {
    setSelected((current) =>
      current.filter((item) => item.toLowerCase() !== value.toLowerCase()),
    );
  }

  const availableSuggestions = specialtySuggestions.filter(
    (suggestion) =>
      !selected.some(
        (value) => value.toLowerCase() === suggestion.toLowerCase(),
      ),
  );

  return (
    <fieldset className="rounded-lg border border-border bg-muted/20 p-4">
      <legend className="px-1 text-sm font-medium text-foreground">
        Interested specialties <span className="text-primary">*</span>
      </legend>
      <input
        name="interestedSpecialties"
        type="hidden"
        value={selected.join(", ")}
      />
      {selected.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((specialty) => (
            <span
              className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1 text-xs font-medium text-foreground"
              key={specialty}
            >
              {specialty}
              <button
                aria-label={`Remove ${specialty}`}
                className="rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => removeSpecialty(specialty)}
                type="button"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Choose a few interests so matching can start with consistent data.
        </p>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          className={cn(
            "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary",
            error && "border-red-400 focus:border-red-500",
          )}
          onChange={(event) => setCustomValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addSpecialty(customValue);
            }
          }}
          placeholder="Add a custom specialty"
          value={customValue}
        />
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => addSpecialty(customValue)}
          type="button"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {availableSuggestions.map((suggestion) => (
          <button
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            key={suggestion}
            onClick={() => addSpecialty(suggestion)}
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>
      {error ? (
        <span className="mt-2 block text-xs text-red-600">{error}</span>
      ) : null}
    </fieldset>
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
  const initialGradeYear = getGradeYearControlValues(state.values.gradeYear);
  const [selectedGradeYear, setSelectedGradeYear] = useState(
    initialGradeYear.selectedValue,
  );
  const [saveRequested, setSaveRequested] = useState(false);
  const progress = useMemo(
    () => Math.round(((step + 1) / steps.length) * 100),
    [step],
  );
  const isSaving = saveRequested && isPending;

  return (
    <form
      className="rounded-xl border border-border bg-background shadow-sm"
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          event.target instanceof HTMLInputElement &&
          event.target.type !== "submit"
        ) {
          event.preventDefault();
        }
      }}
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
            label="Age in years (optional)"
            name="ageYears"
            placeholder="16"
            type="number"
            values={state.values}
          />
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Grade year <span className="text-primary">*</span>
              <select
                className={cn(
                  "mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary",
                  state.fieldErrors.gradeYear &&
                    "border-red-400 focus:border-red-500",
                )}
                name="gradeYear"
                onChange={(event) => setSelectedGradeYear(event.target.value)}
                value={selectedGradeYear}
              >
                <option value="">Choose grade year</option>
                {gradeYearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {state.fieldErrors.gradeYear ? (
                <span className="mt-1 block text-xs text-red-600">
                  {state.fieldErrors.gradeYear}
                </span>
              ) : null}
            </label>
            {selectedGradeYear === "Other" ? (
              <label className="block text-sm font-medium text-foreground">
                Tell us your academic stage{" "}
                <span className="text-primary">*</span>
                <input
                  className={cn(
                    "mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary",
                    state.fieldErrors.gradeYearCustom &&
                      "border-red-400 focus:border-red-500",
                  )}
                  defaultValue={
                    state.values.gradeYearCustom || initialGradeYear.customValue
                  }
                  name="gradeYearCustom"
                  placeholder="Example: Dual-enrollment senior, post-bacc applicant"
                  type="text"
                />
                {state.fieldErrors.gradeYearCustom ? (
                  <span className="mt-1 block text-xs text-red-600">
                    {state.fieldErrors.gradeYearCustom}
                  </span>
                ) : null}
              </label>
            ) : null}
          </div>
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
          <SelectField
            errors={state.fieldErrors}
            label="Remote preference"
            name="remotePreference"
            values={state.values}
          >
            <option value="">No preference</option>
            <option value="In person">In person</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
          </SelectField>
          <TextField
            errors={state.fieldErrors}
            label="Maximum travel distance (miles)"
            name="maximumTravelMiles"
            placeholder="25"
            type="number"
            values={state.values}
          />
          <TextField
            errors={state.fieldErrors}
            label="Transportation notes"
            name="transportationNotes"
            placeholder="Public transit only, family ride available..."
            rows={3}
            values={state.values}
          />
        </section>

        <section className={cn("space-y-5", step !== 2 && "hidden")}>
          <SpecialtyTagInput errors={state.fieldErrors} values={state.values} />

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
          <TextField
            errors={state.fieldErrors}
            label="Certifications"
            name="certifications"
            placeholder="CPR, BLS"
            rows={3}
            values={state.values}
          />
          <TextField
            errors={state.fieldErrors}
            label="Preferred seasons"
            name="preferredSeasons"
            placeholder="Summer, Fall"
            values={state.values}
          />
          <SelectField
            errors={state.fieldErrors}
            label="Paid opportunities only"
            name="paidOnlyPreference"
            values={state.values}
          >
            <option value="">No preference</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </SelectField>
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
          disabled={step === 0 || isSaving}
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Back
        </button>

        {step < steps.length - 1 ? (
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setStep((current) => Math.min(current + 1, steps.length - 1));
            }}
            type="button"
          >
            Continue
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : (
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            formAction={formAction}
            onClick={() => setSaveRequested(true)}
            type="submit"
          >
            {isSaving ? (
              <>
                <Save aria-hidden="true" className="h-4 w-4" />
                Saving
              </>
            ) : (
              <>
                <Check aria-hidden="true" className="h-4 w-4" />
                Save and finish
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
