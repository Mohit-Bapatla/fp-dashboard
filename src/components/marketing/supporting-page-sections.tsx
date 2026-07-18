import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { MarketingContainer } from "./page-shell";

const sectionTone = {
  blue: "border-y border-border bg-blue-surface/45",
  white: "bg-white",
} as const;

export function MarketingSection({
  children,
  className,
  id,
  tone = "white",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: keyof typeof sectionTone;
}) {
  return (
    <section
      className={cn("py-20 sm:py-24 lg:py-28", sectionTone[tone], className)}
      id={id}
    >
      <MarketingContainer>{children}</MarketingContainer>
    </section>
  );
}

export function FeatureCard({
  children,
  className,
  icon,
  label,
  title,
}: {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  label?: string;
  title: ReactNode;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-white p-6 shadow-[0_12px_34px_rgba(16,33,58,0.06)]",
        className,
      )}
    >
      {icon ? (
        <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-blue-surface text-primary">
          {icon}
        </div>
      ) : null}
      {label ? (
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
          {label}
        </p>
      ) : null}
      <h3
        className={cn(
          "text-xl font-semibold tracking-[-0.025em] text-brand-navy",
          label && "mt-2",
        )}
      >
        {title}
      </h3>
      <div className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
        {children}
      </div>
    </article>
  );
}

export function MetricCard({
  definition,
  label,
  value,
}: {
  definition?: ReactNode;
  label: ReactNode;
  value: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <p className="text-3xl font-semibold tracking-[-0.04em] text-primary">
        {value}
      </p>
      <h3 className="mt-2 text-sm font-semibold text-brand-navy">{label}</h3>
      {definition ? (
        <div className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
          {definition}
        </div>
      ) : null}
    </article>
  );
}

export function NumberedStep({
  children,
  number,
  title,
}: {
  children: ReactNode;
  number: number;
  title: ReactNode;
}) {
  return (
    <li className="relative grid gap-4 sm:grid-cols-[auto_1fr]">
      <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {number}
      </span>
      <div className="pb-6">
        <h3 className="text-lg font-semibold text-brand-navy">{title}</h3>
        <div className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          {children}
        </div>
      </div>
    </li>
  );
}

export function PageCta({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions: ReactNode;
  description: ReactNode;
  eyebrow: string;
  title: ReactNode;
}) {
  return (
    <MarketingSection tone="blue">
      <div className="grid gap-6 rounded-3xl border border-primary/15 bg-[linear-gradient(135deg,#10213a_0%,#183c70_100%)] p-7 text-white shadow-[0_18px_50px_rgba(16,33,58,0.16)] sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            {title}
          </h2>
          <div className="mt-4 text-pretty text-base leading-7 text-blue-100">
            {description}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div>
      </div>
    </MarketingSection>
  );
}

export function ExternalTextLink({
  children,
  className,
  href,
}: {
  children: ReactNode;
  className?: string;
  href: string;
}) {
  return (
    <a
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
      <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
    </a>
  );
}

export function LimitationNote({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <aside className="rounded-2xl border border-amber-300/70 bg-amber-50 p-5 text-amber-950">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-amber-900/85">{children}</div>
    </aside>
  );
}
