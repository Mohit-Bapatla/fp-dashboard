import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-12 text-foreground">
      <section className="mx-auto max-w-3xl rounded-lg border border-border bg-background p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Terms
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">
          Terms of Use Placeholder
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-6 text-muted-foreground">
          <p>
            FP Dashboard is intended for internal Future Physicians program
            coordination during beta. Authorized users should use the platform
            only for approved student, partner, opportunity, and program
            operations.
          </p>
          <p>
            The platform does not make automated acceptance, rejection, or
            placement decisions. Human reviewers remain responsible for program
            decisions and communications.
          </p>
          <p>
            A full terms document should be reviewed before broader public or
            production launch.
          </p>
        </div>
        <Link
          className="mt-8 inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
          href="/"
        >
          Back home
        </Link>
      </section>
    </main>
  );
}
