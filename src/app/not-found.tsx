import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-12 text-foreground">
      <section className="mx-auto max-w-2xl rounded-lg border border-border bg-background p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Not found
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">
          This page is not available
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The link may be incorrect, private, or no longer published.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background shadow-sm transition hover:bg-foreground/90"
            href="/"
          >
            Go home
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
            href="/dashboard"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
