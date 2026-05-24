"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  refreshEmbeddingsAction,
  type EmbeddingRefreshActionState,
} from "@/app/dashboard/staff/embeddings/actions";

const initialState: EmbeddingRefreshActionState = {
  error: null,
  result: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={pending}
      type="submit"
    >
      {pending ? "Refreshing..." : "Refresh embeddings"}
    </button>
  );
}

export function EmbeddingRefreshPanel() {
  const [state, action] = useActionState(refreshEmbeddingsAction, initialState);

  return (
    <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <form action={action} className="grid gap-4 md:grid-cols-[1fr_auto]">
        <label className="text-sm font-medium text-foreground">
          Refresh scope
          <select
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
            defaultValue="all"
            name="scope"
          >
            <option value="all">All supported records</option>
            <option value="OPPORTUNITY">Opportunities</option>
            <option value="STUDENT_PROFILE">Student profiles</option>
            <option value="RESUME">Resumes</option>
            <option value="PARTNER_ORGANIZATION">Partner organizations</option>
          </select>
        </label>
        <div className="flex items-end">
          <SubmitButton />
        </div>
      </form>

      {state.error ? (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {state.result ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <ResultPill label="Missing" value={state.result.missing} />
          <ResultPill label="Stale" value={state.result.stale} />
          <ResultPill label="Created" value={state.result.created} />
          <ResultPill label="Updated" value={state.result.updated} />
          <ResultPill label="Skipped" value={state.result.skipped} />
          <ResultPill
            label="OpenAI"
            value={state.result.unavailable ? "Unavailable" : "Available"}
          />
        </div>
      ) : null}
    </section>
  );
}

function ResultPill({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
