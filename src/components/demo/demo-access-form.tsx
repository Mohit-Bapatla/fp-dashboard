"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import { type FormEvent, useState } from "react";

export function DemoAccessForm({ error }: { error?: string }) {
  const [isPending, setIsPending] = useState(false);
  const [submissionError, setSubmissionError] = useState<string>();

  async function submitAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setSubmissionError(undefined);

    try {
      const response = await fetch("/demo/session", {
        body: new FormData(event.currentTarget),
        method: "POST",
      });
      if (!response.ok) throw new Error("Demo access request failed");
      const result = (await response.json()) as { redirectTo?: string };
      window.location.assign(result.redirectTo || "/demo");
    } catch {
      setIsPending(false);
      setSubmissionError("We could not check access. Please try again.");
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={submitAccess}>
      <div>
        <label
          className="text-sm font-semibold text-brand-navy"
          htmlFor="demo-access-code"
        >
          Demo access code
        </label>
        <div className="relative mt-2">
          <KeyRound
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            aria-describedby={error ? "demo-access-error" : undefined}
            aria-invalid={Boolean(error)}
            autoComplete="off"
            autoFocus
            className="min-h-12 w-full rounded-xl border border-border bg-white py-3 pl-11 pr-4 text-base text-brand-navy outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
            id="demo-access-code"
            name="accessCode"
            placeholder="Enter the code shared with you"
            required
            type="password"
          />
        </div>
        {error ? (
          <p
            aria-live="polite"
            className="mt-2 text-sm font-medium text-error"
            id="demo-access-error"
            role="status"
          >
            {error}
          </p>
        ) : null}
      </div>

      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_9px_24px_rgba(36,95,213,0.22)] transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Checking access…" : "Enter Demo"}
        {!isPending ? (
          <ArrowRight aria-hidden="true" className="size-4" />
        ) : null}
      </button>
      {submissionError ? (
        <p aria-live="assertive" className="text-sm font-medium text-error">
          {submissionError}
        </p>
      ) : null}
    </form>
  );
}
