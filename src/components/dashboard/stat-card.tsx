import type { DashboardStat } from "./role-config";

type StatCardProps = DashboardStat;

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <article className="rounded-[14px] border border-border/90 bg-card p-4 shadow-[0_7px_22px_rgba(16,33,58,0.045)] transition-shadow duration-200 hover:shadow-[0_10px_28px_rgba(16,33,58,0.075)] sm:p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2.5 text-2xl font-semibold tracking-[-0.03em] text-brand-navy sm:text-3xl">
        {value}
      </p>
      <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
        {helper}
      </p>
    </article>
  );
}
