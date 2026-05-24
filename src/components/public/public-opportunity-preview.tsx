import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Home,
  LogIn,
  MapPin,
} from "lucide-react";
import Link from "next/link";

import type { PublicOpportunity } from "@/lib/public/opportunities";

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function fieldValue(value: string | null) {
  return value || "Not specified";
}

export function PublicOpportunityPreview({
  opportunity,
}: {
  opportunity: PublicOpportunity;
}) {
  const applyPath = `/dashboard/student/opportunities/${opportunity.id}/apply`;
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(applyPath)}`;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              href="/"
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              Future Physicians
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {formatEnumLabel(opportunity.type)}
              </span>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                Published
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-normal text-foreground sm:text-5xl">
              {opportunity.title}
            </h1>
            <p className="mt-3 text-base font-medium text-muted-foreground">
              {opportunity.organization.name}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              href={signInHref}
            >
              <LogIn aria-hidden="true" className="h-4 w-4" />
              Sign in to apply
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              href="/dashboard/student/opportunities"
            >
              Browse dashboard
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OpportunityFact
            icon={BriefcaseBusiness}
            label="Specialty"
            value={fieldValue(opportunity.specialty)}
          />
          <OpportunityFact
            icon={MapPin}
            label="Location"
            value={fieldValue(opportunity.location)}
          />
          <OpportunityFact
            label="Format"
            value={fieldValue(opportunity.remoteType)}
          />
          <OpportunityFact
            label="Paid status"
            value={fieldValue(opportunity.paidStatus)}
          />
          <OpportunityFact
            icon={CalendarDays}
            label="Deadline"
            value={formatDate(opportunity.deadline)}
          />
          <OpportunityFact
            label="Capacity"
            value={
              opportunity.capacity
                ? `${opportunity.capacity} students`
                : "Not specified"
            }
          />
          <OpportunityFact
            label="Published"
            value={formatDate(opportunity.publishedAt)}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="space-y-6 rounded-lg border border-border bg-background p-6 shadow-sm">
            <ContentBlock body={opportunity.description} title="Description" />
            <ContentBlock
              body={opportunity.eligibilityRequirements}
              title="Eligibility requirements"
            />
            <ContentBlock
              body={opportunity.applicationInstructions}
              title="Application instructions"
            />
          </article>

          <aside className="space-y-6">
            <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
              <FileText aria-hidden="true" className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-base font-semibold text-foreground">
                Required documents
              </h2>
              {opportunity.requiredDocuments.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {opportunity.requiredDocuments.map((document) => (
                    <li
                      className="rounded-md border border-border p-3"
                      key={document}
                    >
                      {document}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  No required documents have been specified yet.
                </p>
              )}
            </section>

            <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">
                Ready to apply?
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Applications are handled inside the protected Future Physicians
                student dashboard.
              </p>
              <Link
                className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                href={signInHref}
              >
                Sign in to apply
              </Link>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

type OpportunityFactProps = {
  icon?: typeof BriefcaseBusiness;
  label: string;
  value: string;
};

function OpportunityFact({ icon: Icon, label, value }: OpportunityFactProps) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ContentBlock({ body, title }: { body: string | null; title: string }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
        {body || "Not specified yet."}
      </p>
    </section>
  );
}
