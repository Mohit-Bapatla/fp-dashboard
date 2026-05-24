import { EmptyState } from "./empty-state";
import { RoleBadge } from "./role-badge";
import {
  roleMeta,
  roleNavigation,
  sharedComingSoon,
  type ComingSoonItem,
  type DashboardRole,
  type DashboardStat,
} from "./role-config";
import { DashboardShell } from "./dashboard-shell";
import { StatCard } from "./stat-card";

type RoleDashboardPageProps = {
  role: DashboardRole;
  title: string;
  description: string;
  stats: DashboardStat[];
  comingSoon?: ComingSoonItem[];
};

export function RoleDashboardPage({
  role,
  title,
  description,
  stats,
  comingSoon = sharedComingSoon,
}: RoleDashboardPageProps) {
  const meta = roleMeta[role];

  return (
    <DashboardShell navItems={roleNavigation[role]} role={role}>
      <div className="space-y-8">
        <section className="flex flex-col justify-between gap-5 rounded-xl border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <RoleBadge className="mb-5" role={role} />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {meta.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {description}
            </p>
          </div>
        </section>

        <section
          aria-label={`${meta.label} dashboard stats`}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Features in development
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              These sections are being built out and will be available as the
              platform grows.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {comingSoon.map((item) => (
              <EmptyState key={item.title} {...item} />
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
