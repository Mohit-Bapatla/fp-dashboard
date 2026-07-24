"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function ApplicationWorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <section
        aria-labelledby="application-workspace-error-heading"
        className="w-full max-w-2xl rounded-2xl border border-border bg-background p-7 text-center shadow-sm sm:p-10"
        role="alert"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Application workspace
        </p>
        <h1
          className="mt-3 text-3xl font-semibold text-brand-navy"
          id="application-workspace-error-heading"
        >
          We could not load this application
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          Your saved application data has not been removed. Try again, or
          contact support if the problem continues.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Support reference: {error.digest}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/25 px-5 text-sm font-semibold text-primary"
            href="/contact"
          >
            Contact support
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold"
            href="/dashboard/student/applications"
          >
            Back to applications
          </Link>
        </div>
      </section>
    </main>
  );
}
