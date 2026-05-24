import Link from "next/link";

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-12 text-foreground">
      <section className="mx-auto max-w-3xl rounded-lg border border-border bg-background p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Data requests
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">
          Data Deletion Request Process
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-6 text-muted-foreground">
          <p>
            This beta placeholder describes the operational process for data
            deletion requests. Students, partners, and staff may request review
            or deletion of their account-associated data through Future
            Physicians operations.
          </p>
          <p>
            The team should verify the requester, review retention obligations,
            remove or anonymize eligible records, and document the completed
            request in internal operations notes.
          </p>
          <p>
            Automated self-service deletion is not implemented in this beta
            stage.
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
