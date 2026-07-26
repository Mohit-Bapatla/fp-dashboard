"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

import { createWorkflowSupportReference } from "@/lib/reliability/workflow-references";
import { DASHBOARD_SUPPORT_ACTION } from "@/lib/support-contact";
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [supportReference] = useState(() =>
    createWorkflowSupportReference("AUTH"),
  );

  useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        route: "/(auth)",
        supportReference,
        workflowCategory: "AUTH",
      },
    });
  }, [error, supportReference]);

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background px-4 py-12"
      id="auth-main"
    >
      <section
        aria-labelledby="auth-error-heading"
        className="w-full max-w-lg rounded-2xl border border-border bg-background p-8 text-center shadow-sm"
        role="alert"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Account form unavailable
        </p>
        <h1
          className="mt-3 text-3xl font-semibold text-brand-navy"
          id="auth-error-heading"
        >
          We couldn&apos;t load the secure account form
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Try loading it again. If the problem continues, contact support and
          include reference {supportReference}.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <Link
            className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 text-sm font-semibold text-brand-navy"
            href={DASHBOARD_SUPPORT_ACTION.href}
          >
            {DASHBOARD_SUPPORT_ACTION.label}
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 text-sm font-semibold text-brand-navy"
            href="/"
          >
            Return to public site
          </Link>
        </div>
      </section>
    </main>
  );
}
