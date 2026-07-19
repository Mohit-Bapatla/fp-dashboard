import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function MarketingContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1240px] pr-[max(1.25rem,env(safe-area-inset-right))] pl-[max(1.25rem,env(safe-area-inset-left))] sm:pr-[max(2rem,env(safe-area-inset-right))] sm:pl-[max(2rem,env(safe-area-inset-left))]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  align = "left",
  description,
  eyebrow,
  title,
}: {
  align?: "left" | "center";
  description?: ReactNode;
  eyebrow?: string;
  title: ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-w-0 max-w-2xl",
        align === "center" && "mx-auto text-center",
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-balance text-3xl font-semibold tracking-[-0.035em] text-brand-navy sm:text-4xl",
          eyebrow && "mt-3",
        )}
      >
        {title}
      </h2>
      {description ? (
        <div className="mt-4 text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </div>
      ) : null}
    </div>
  );
}

export function PageHero({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  description: ReactNode;
  eyebrow: string;
  title: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[linear-gradient(180deg,#ffffff_0%,#f2f7ff_100%)] py-14 sm:py-20 lg:py-28">
      <div
        aria-hidden="true"
        className="pathway-grid absolute inset-0 opacity-45"
      />
      <MarketingContainer className="relative">
        <div className="min-w-0 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-balance text-[clamp(2.25rem,10vw,3rem)] leading-[1.05] font-semibold tracking-[-0.045em] text-brand-navy sm:text-6xl">
            {title}
          </h1>
          <div className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
            {description}
          </div>
          {actions ? (
            <div className="mt-7 grid w-full gap-3 sm:mt-8 sm:flex sm:flex-wrap">
              {actions}
            </div>
          ) : null}
        </div>
      </MarketingContainer>
    </section>
  );
}

export const primaryButtonClass =
  "inline-flex min-h-11 min-w-0 max-w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(47,111,237,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const secondaryButtonClass =
  "inline-flex min-h-11 min-w-0 max-w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-center text-sm font-semibold text-brand-navy shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const textLinkClass =
  "inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const emailLinkClass =
  "inline-block max-w-full whitespace-nowrap rounded-sm text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm";
