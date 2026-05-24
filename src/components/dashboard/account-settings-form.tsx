"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";

import {
  updateAccountDisplayName,
  type AccountSettingsActionState,
} from "@/app/dashboard/settings/actions";

const initialState: AccountSettingsActionState = {
  error: null,
  success: null,
};

type AccountSettingsFormProps = {
  email: string;
  firstName: string;
  lastName: string;
};

export function AccountSettingsForm({
  email,
  firstName,
  lastName,
}: AccountSettingsFormProps) {
  const [state, action, pending] = useActionState(
    updateAccountDisplayName,
    initialState,
  );

  return (
    <form
      action={action}
      className="rounded-xl border border-border bg-background p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-foreground">Display name</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        This app-level name is used throughout FP Dashboard and will not change
        your Clerk or Google identity.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          First name
          <input
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
            defaultValue={firstName}
            name="firstName"
            required
          />
        </label>
        <label className="text-sm font-medium text-foreground">
          Last name
          <input
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
            defaultValue={lastName}
            name="lastName"
            required
          />
        </label>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
        Signed in as{" "}
        <span className="font-medium text-foreground">{email}</span>
      </div>

      {state.error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </div>
      ) : null}

      <button
        className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        <Save aria-hidden="true" className="h-4 w-4" />
        {pending ? "Saving" : "Save name"}
      </button>
    </form>
  );
}
