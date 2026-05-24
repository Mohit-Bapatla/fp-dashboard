import type { DashboardStat } from "./role-config";

type StatCardProps = DashboardStat;

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <article className="rounded-xl border border-border bg-background p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">{helper}</p>
    </article>
  );
}
