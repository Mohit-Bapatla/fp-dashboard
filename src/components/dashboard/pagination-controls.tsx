import Link from "next/link";

import { buildPageHref } from "@/lib/pagination";

export function PaginationControls({
  page,
  pathname,
  searchParams,
  totalCount,
  totalPages,
}: {
  page: number;
  pathname: string;
  searchParams: Record<string, string>;
  totalCount: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        Page {page} of {totalPages} | {totalCount} total
      </p>
      <div className="flex flex-wrap gap-2">
        <PaginationLink
          disabled={page <= 1}
          href={buildPageHref({
            page: page - 1,
            pathname,
            searchParams,
          })}
        >
          Previous
        </PaginationLink>
        <PaginationLink
          disabled={page >= totalPages}
          href={buildPageHref({
            page: page + 1,
            pathname,
            searchParams,
          })}
        >
          Next
        </PaginationLink>
      </div>
    </nav>
  );
}

function PaginationLink({
  children,
  disabled,
  href,
}: {
  children: string;
  disabled: boolean;
  href: string;
}) {
  if (disabled) {
    return (
      <span className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-muted-foreground opacity-50">
        {children}
      </span>
    );
  }

  return (
    <Link
      className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
      href={href}
    >
      {children}
    </Link>
  );
}
