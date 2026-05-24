import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type EmptyStateAction = {
  label: string;
  href: string;
};

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-44 flex-col justify-center rounded-xl border border-dashed border-border bg-muted/35 p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-primary">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? (
        <Link
          className="mt-5 inline-flex w-fit items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          href={action.href}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
