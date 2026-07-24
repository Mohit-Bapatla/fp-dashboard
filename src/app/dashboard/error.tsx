"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

import { DASHBOARD_SUPPORT_ACTION } from "@/lib/support-contact";

export default function DashboardError({
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
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-12 text-foreground">
      <section
        aria-describedby="dashboard-error-description"
        aria-labelledby="dashboard-error-heading"
        className="w-full max-w-2xl rounded-2xl border border-border bg-background p-7 text-center shadow-sm sm:p-10"
        role="alert"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Dashboard unavailable
        </p>
        <h1
          className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-brand-navy"
          id="dashboard-error-heading"
        >
          We could not load this view
        </h1>
        <p
          className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground"
          id="dashboard-error-description"
        >
          Try loading the dashboard again. If the problem continues, return to
          the public site and contact support.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/25 bg-blue-surface px-5 text-sm font-semibold text-primary transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href={DASHBOARD_SUPPORT_ACTION.href}
          >
            {DASHBOARD_SUPPORT_ACTION.label}
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-brand-navy transition hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href="/"
          >
            Go to public site
          </Link>
        </div>
      </section>
    </main>
  );
}
