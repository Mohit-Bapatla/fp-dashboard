import type { DashboardStat } from "./role-config";

type StatCardProps = DashboardStat;

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <article className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>
    </article>
  );
}
