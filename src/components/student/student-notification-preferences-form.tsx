"use client";

import { BellRing, Clock3, Mail } from "lucide-react";
import { useActionState } from "react";

import {
  type StudentNotificationPreferenceActionState,
  updateStudentNotificationPreferences,
} from "@/app/dashboard/student/settings/notification-actions";
import type { StudentNotificationPreferenceValues } from "@/lib/student/notification-preference-validation";

const initialState: StudentNotificationPreferenceActionState = {
  error: null,
  fieldErrors: {},
  success: null,
};

type StudentNotificationPreferencesFormProps = {
  disabled?: boolean;
  values: StudentNotificationPreferenceValues;
};

const reminderOptions = [
  {
    description: "Programs you saved or started preparing for.",
    key: "openingAlertsEnabled",
    label: "Opening alerts",
  },
  {
    description: "Official and internal target deadlines.",
    key: "deadlineAlertsEnabled",
    label: "Deadline alerts",
  },
  {
    description: "Required application tasks that become overdue.",
    key: "taskReminderEnabled",
    label: "Task reminders",
  },
  {
    description: "Recommendation requests and approaching due dates.",
    key: "recommendationReminderEnabled",
    label: "Recommendation reminders",
  },
  {
    description: "Scheduled interview preparation reminders.",
    key: "interviewReminderEnabled",
    label: "Interview reminders",
  },
  {
    description: "Optional prompts to record an application outcome.",
    key: "outcomeReminderEnabled",
    label: "Outcome reminders",
  },
] as const;

export function StudentNotificationPreferencesForm({
  disabled = false,
  values,
}: StudentNotificationPreferencesFormProps) {
  const [state, action, pending] = useActionState(
    updateStudentNotificationPreferences,
    initialState,
  );

  return (
    <form
      action={action}
      className="rounded-xl border border-border bg-background p-6 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-primary">
          <BellRing aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Reminders and weekly plan
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Choose where FP sends planning reminders. Transactional receipts,
            such as an application confirmation, are managed separately.
          </p>
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-foreground">
          Delivery channels
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <PreferenceCheckbox
            defaultChecked={values.inAppEnabled}
            description="Show reminders in your private FP notification inbox."
            disabled={disabled}
            icon={BellRing}
            label="In-app notifications"
            name="inAppEnabled"
          />
          <PreferenceCheckbox
            defaultChecked={values.emailEnabled}
            description="Send at most one reminder summary per scheduled run."
            disabled={disabled}
            icon={Mail}
            label="Email reminders"
            name="emailEnabled"
          />
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-foreground">
          Reminder topics
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {reminderOptions.map((option) => (
            <PreferenceCheckbox
              defaultChecked={values[option.key]}
              description={option.description}
              disabled={disabled}
              key={option.key}
              label={option.label}
              name={option.key}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6 rounded-lg border border-border bg-muted/25 p-4">
        <legend className="px-1 text-sm font-semibold text-foreground">
          Weekly email
        </legend>
        <label className="flex min-h-11 cursor-pointer items-start gap-3">
          <input
            className="mt-1 h-4 w-4 rounded border-border accent-primary"
            defaultChecked={values.weeklyDigestEnabled}
            disabled={disabled}
            name="weeklyDigestEnabled"
            type="checkbox"
          />
          <span>
            <span className="block text-sm font-medium text-foreground">
              Send my weekly FP action summary
            </span>
            <span className="mt-1 block text-sm leading-5 text-muted-foreground">
              Sent only when your structured weekly plan has an action. Email
              delivery must also be enabled.
            </span>
          </span>
        </label>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Clock3 aria-hidden="true" className="h-4 w-4" />
          Timezone and quiet hours
        </legend>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Deadlines use your local calendar day. Email is skipped during your
          quiet hours; in-app reminders may still appear without sending email.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-medium text-foreground">
            Timezone
            <input
              aria-describedby={
                state.fieldErrors.timezone
                  ? "timezone-help timezone-error"
                  : "timezone-help"
              }
              aria-invalid={Boolean(state.fieldErrors.timezone)}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
              defaultValue={values.timezone}
              disabled={disabled}
              list="student-timezones"
              name="timezone"
              required
            />
            <datalist id="student-timezones">
              <option value="America/Chicago" />
              <option value="America/New_York" />
              <option value="America/Denver" />
              <option value="America/Los_Angeles" />
              <option value="America/Phoenix" />
              <option value="UTC" />
            </datalist>
            <span
              className="mt-1 block text-xs leading-5 text-muted-foreground"
              id="timezone-help"
            >
              Use an IANA timezone such as America/Chicago.
            </span>
            {state.fieldErrors.timezone ? (
              <span
                className="mt-1 block text-xs text-destructive"
                id="timezone-error"
              >
                {state.fieldErrors.timezone}
              </span>
            ) : null}
          </label>
          <QuietHourInput
            defaultValue={values.quietHoursStart}
            disabled={disabled}
            error={state.fieldErrors.quietHoursStart}
            label="Quiet hours start"
            name="quietHoursStart"
          />
          <QuietHourInput
            defaultValue={values.quietHoursEnd}
            disabled={disabled}
            error={state.fieldErrors.quietHoursEnd}
            label="Quiet hours end"
            name="quietHoursEnd"
          />
        </div>
      </fieldset>

      {state.error ? (
        <p
          aria-live="polite"
          className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          aria-live="polite"
          className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {state.success}
        </p>
      ) : null}

      <button
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || pending}
        type="submit"
      >
        {pending ? "Saving reminders..." : "Save reminder settings"}
      </button>
    </form>
  );
}

function PreferenceCheckbox({
  defaultChecked,
  description,
  disabled,
  icon: Icon,
  label,
  name,
}: {
  defaultChecked: boolean;
  description: string;
  disabled: boolean;
  icon?: typeof BellRing;
  label: string;
  name: string;
}) {
  return (
    <label className="flex min-h-16 cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition hover:bg-muted/30">
      <input
        className="mt-1 h-4 w-4 rounded border-border accent-primary"
        defaultChecked={defaultChecked}
        disabled={disabled}
        name={name}
        type="checkbox"
      />
      <span>
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          {Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
          {label}
        </span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

function QuietHourInput({
  defaultValue,
  disabled,
  error,
  label,
  name,
}: {
  defaultValue: string;
  disabled: boolean;
  error?: string;
  label: string;
  name: "quietHoursEnd" | "quietHoursStart";
}) {
  const errorId = `${name}-error`;

  return (
    <label className="text-sm font-medium text-foreground">
      {label}
      <input
        aria-describedby={error ? errorId : undefined}
        className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        type="time"
      />
      {error ? (
        <span className="mt-1 block text-xs text-destructive" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
