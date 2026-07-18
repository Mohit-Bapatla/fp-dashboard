"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

export default function PublicOpportunitiesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto flex min-h-[55vh] w-full max-w-2xl items-center px-5 py-16 text-center sm:px-8">
      <div className="w-full rounded-3xl border border-border bg-white p-8 shadow-sm sm:p-12">
        <AlertCircle
          aria-hidden="true"
          className="mx-auto size-10 text-error"
        />
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-brand-navy">
          Opportunities are temporarily unavailable.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
          Please check back shortly. You can try again, contact the support
          team, or return to the homepage.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/25 bg-blue-surface px-5 text-sm font-semibold text-primary transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href={siteConfig.contact.generalSupport.href}
          >
            Contact support
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-semibold text-brand-navy transition hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href="/"
          >
            Return home
          </Link>
        </div>
      </div>
    </section>
  );
}
