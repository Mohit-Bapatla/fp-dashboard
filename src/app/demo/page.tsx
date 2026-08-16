import {
  ArrowRight,
  Building2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { DemoAccessForm } from "@/components/demo/demo-access-form";
import { DemoExitButton } from "@/components/demo/demo-exit-button";
import { BrandMark } from "@/components/shared/brand-mark";
import {
  getConfiguredDemoAccessCode,
  hasValidDemoSession,
} from "@/lib/demo/recruiter-session";

export const dynamic = "force-dynamic";

const roleCard =
  "group flex min-h-72 flex-col rounded-2xl border border-border bg-card p-6 shadow-[0_10px_36px_rgba(16,33,58,0.07)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_42px_rgba(16,33,58,0.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:p-7";

function DemoFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-page px-4 py-8 sm:px-6 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(36,95,213,0.14),transparent_28%),radial-gradient(circle_at_88%_16%,rgba(11,113,110,0.12),transparent_24%)]"
      />
      <div className="relative mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <BrandMark href="/" prefetch={false} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary shadow-sm">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-secondary"
            />
            Demo — synthetic data
          </span>
        </div>
        {children}
      </div>
    </main>
  );
}

function DemoUnavailable() {
  return (
    <DemoFrame>
      <section className="mx-auto mt-16 max-w-xl rounded-2xl border border-border bg-card p-7 text-center shadow-[0_16px_50px_rgba(16,33,58,0.08)] sm:mt-24 sm:p-10">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-surface text-primary">
          <LockKeyhole aria-hidden="true" className="size-6" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Private product walkthrough
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-brand-navy">
          Demo access is currently unavailable.
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The server-side demo access setting has not been configured for this
          environment. No fallback access is permitted.
        </p>
      </section>
    </DemoFrame>
  );
}

function AccessGate({ error }: { error?: string }) {
  return (
    <DemoFrame>
      <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:mt-20 lg:grid-cols-[1fr_420px] lg:items-center">
        <section>
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-secondary/5 px-3 py-1.5 text-xs font-semibold text-secondary">
            <ShieldCheck aria-hidden="true" className="size-4" />
            Private, synthetic walkthrough
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-brand-navy sm:text-5xl">
            Future Physicians Platform Demo
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Explore a synthetic version of the Future Physicians student and
            partner dashboards. No real student or partner information is used
            in this demo.
          </p>
          <div className="mt-7 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-1">
            <p className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-surface text-primary">
                <UserRound aria-hidden="true" className="size-4" />
              </span>
              Explore student discovery and applications
            </p>
            <p className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-surface text-primary">
                <Building2 aria-hidden="true" className="size-4" />
              </span>
              Review the partner applicant workflow
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_18px_54px_rgba(16,33,58,0.1)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Recruiter access
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-brand-navy">
            Enter the shared demo code
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Access lasts for approximately 24 hours in this browser and grants
            no production account privileges.
          </p>
          <DemoAccessForm error={error} />
        </section>
      </div>
    </DemoFrame>
  );
}

function RoleSelection() {
  return (
    <DemoFrame>
      <section className="mx-auto mt-12 max-w-3xl text-center sm:mt-16">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Choose a perspective
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-brand-navy sm:text-5xl">
          Explore Future Physicians
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          No real student or partner information is used. Every record and
          interaction below is synthetic and isolated from the live application.
        </p>
      </section>

      <div className="mx-auto mt-9 grid max-w-4xl gap-5 md:grid-cols-2">
        <Link className={roleCard} href="/demo/student">
          <span className="grid size-12 place-items-center rounded-2xl bg-blue-surface text-primary">
            <UserRound aria-hidden="true" className="size-5" />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Student perspective
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-brand-navy">
            Student Dashboard
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            See how students discover opportunities, complete their profile, and
            manage healthcare applications.
          </p>
          <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-primary">
            View Student Demo
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </span>
        </Link>

        <Link className={roleCard} href="/demo/partner">
          <span className="grid size-12 place-items-center rounded-2xl bg-secondary/10 text-secondary">
            <Building2 aria-hidden="true" className="size-5" />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-secondary">
            Organization perspective
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-brand-navy">
            Partner Dashboard
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            See how organizations review applicants and manage their Future
            Physicians opportunities.
          </p>
          <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-secondary">
            View Partner Demo
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </span>
        </Link>
      </div>

      <div className="mt-8 text-center">
        <DemoExitButton className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-brand-navy transition hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70" />
      </div>
    </DemoFrame>
  );
}

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!getConfiguredDemoAccessCode()) return <DemoUnavailable />;
  if (await hasValidDemoSession()) return <RoleSelection />;
  const { error } = await searchParams;
  const errorMessage =
    error === "invalid"
      ? "That access code was not recognized. Please try again."
      : error === "unavailable"
        ? "Demo access is currently unavailable."
        : undefined;
  return <AccessGate error={errorMessage} />;
}
