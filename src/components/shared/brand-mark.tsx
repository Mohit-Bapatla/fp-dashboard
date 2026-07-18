import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandMark({
  compact = false,
  className,
  href = "/",
}: {
  compact?: boolean;
  className?: string;
  href?: string;
}) {
  return (
    <Link
      aria-label="Future Physicians home"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-xl text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      href={href}
    >
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center rounded-xl bg-primary text-sm font-black tracking-[-0.06em] text-primary-foreground shadow-[0_8px_24px_rgba(47,111,237,0.24)] transition-transform duration-200 group-hover:-translate-y-0.5"
      >
        FP
      </span>
      {!compact ? (
        <span className="leading-none">
          <span className="block text-[15px] font-bold tracking-[-0.02em]">
            Future Physicians
          </span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Opportunity platform
          </span>
        </span>
      ) : null}
    </Link>
  );
}
