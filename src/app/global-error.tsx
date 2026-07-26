"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body>
        <main className="min-h-screen bg-muted/30 px-4 py-12 text-foreground">
          <section
            aria-describedby="global-error-description"
            aria-labelledby="global-error-heading"
            className="mx-auto max-w-2xl rounded-lg border border-border bg-background p-8 text-center shadow-sm"
            role="alert"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Error
            </p>
            <h1
              className="mt-3 text-3xl font-semibold tracking-normal"
              id="global-error-heading"
            >
              Something went wrong
            </h1>
            <p
              className="mt-4 text-sm leading-6 text-muted-foreground"
              id="global-error-description"
            >
              The team can review this through configured logs or Sentry once
              monitoring is enabled.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background shadow-sm transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={reset}
                type="button"
              >
                Try again
              </button>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href="/"
              >
                Go home
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
