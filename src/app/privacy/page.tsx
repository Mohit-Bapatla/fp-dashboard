import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-12 text-foreground">
      <section className="mx-auto max-w-3xl rounded-lg border border-border bg-background p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Privacy
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">
          Privacy Policy Placeholder
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-6 text-muted-foreground">
          <p>
            Future Physicians uses FP Dashboard to manage student profiles,
            applications, partner records, and program operations. This page is
            a beta placeholder for the full privacy policy.
          </p>
          <p>
            During beta, access is limited to authorized users. Do not upload
            sensitive documents unless Future Physicians explicitly asks for
            them through an approved workflow.
          </p>
          <p>
            Privacy questions or requests should be sent to the Future
            Physicians operations team through the official contact channel.
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
