import { DatabaseZap } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmbeddingRefreshPanel } from "@/components/staff/embedding-refresh-panel";
import { getEmbeddingCoverage } from "@/lib/matching/embedding-refresh";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import { getStaffNavItems } from "@/lib/staff/navigation";

export default async function StaffEmbeddingsPage() {
  await assertPlacementQueueAccess();

  const coverage = await getEmbeddingCoverage();

  return (
    <DashboardShell
      navItems={getStaffNavItems("/dashboard/staff/embeddings")}
      role="staff"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="staff" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Semantic matching
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Embedding Refresh
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Refresh server-side embeddings for opportunity, student/resume,
              and partner similarity. Raw vectors stay hidden and deterministic
              matching remains the fallback.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <DatabaseZap aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            helper="Supported records eligible for embeddings."
            label="Eligible"
            value={coverage.total.toString()}
          />
          <StatCard
            helper="Records without an embedding yet."
            label="Missing"
            value={coverage.missing.toString()}
          />
          <StatCard
            helper="Records whose content changed since the last embedding."
            label="Stale"
            value={coverage.stale.toString()}
          />
          <StatCard
            helper="Records with current embedding content hashes."
            label="Up to date"
            value={coverage.upToDate.toString()}
          />
        </section>

        <EmbeddingRefreshPanel />
      </div>
    </DashboardShell>
  );
}
