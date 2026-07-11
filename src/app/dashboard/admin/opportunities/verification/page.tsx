import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";
import { resolveCorrectionReport, setOpportunityVerification } from "./actions";

export default async function VerificationQueuePage() {
  await assertAdminAccess();
  const now = new Date(),
    soon = new Date(now);
  soon.setDate(now.getDate() + 14);
  const [opportunities, reports] = await Promise.all([
    prisma.opportunity.findMany({
      where: {
        OR: [
          {
            verificationStatus: {
              in: ["NEEDS_REVIEW", "STALE", "BROKEN_LINK"],
            },
          },
          { officialSourceUrl: null },
          { nextVerificationAt: { lte: soon } },
          {
            deadline: { lt: now },
            availabilityStatus: { in: ["OPEN", "ROLLING"] },
          },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        organization: { select: { name: true } },
        _count: {
          select: { correctionReports: { where: { status: "OPEN" } } },
        },
      },
    }),
    prisma.opportunityCorrectionReport.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      include: { opportunity: { select: { title: true } } },
    }),
  ]);
  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/opportunities/verification")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6">
          <RoleBadge className="mb-5" role="admin" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Opportunity trust
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Verification queue</h1>
          <p className="mt-3 text-muted-foreground">
            Review sources, stale records, passed deadlines, broken links, and
            student corrections before publishing.
          </p>
        </header>
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Listings needing attention ({opportunities.length})
          </h2>
          {opportunities.map((item) => (
            <article
              className="rounded-xl border border-border bg-background p-5"
              key={item.id}
            >
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.organization.name} ·{" "}
                {item.verificationStatus.replaceAll("_", " ")} ·{" "}
                {item.officialSourceUrl
                  ? "Source present"
                  : "Missing official source"}{" "}
                · {item._count.correctionReports} open reports
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "VERIFIED",
                  "NEEDS_REVIEW",
                  "STALE",
                  "BROKEN_LINK",
                  "ARCHIVED",
                ].map((status) => (
                  <form action={setOpportunityVerification} key={status}>
                    <input name="opportunityId" type="hidden" value={item.id} />
                    <input
                      name="verificationStatus"
                      type="hidden"
                      value={status}
                    />
                    <button
                      className="rounded-lg border border-border px-3 py-2 text-xs"
                      type="submit"
                    >
                      {status.replaceAll("_", " ")}
                    </button>
                  </form>
                ))}
              </div>
            </article>
          ))}
        </section>
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Student correction reports ({reports.length})
          </h2>
          {reports.map((report) => (
            <article
              className="rounded-xl border border-border bg-background p-5"
              key={report.id}
            >
              <h3 className="font-semibold">{report.opportunity.title}</h3>
              <p className="mt-2 text-sm">
                {report.category.replaceAll("_", " ")}:{" "}
                {report.details || "No details supplied"}
              </p>
              <form
                action={resolveCorrectionReport}
                className="mt-4 flex flex-wrap gap-2"
              >
                <input name="reportId" type="hidden" value={report.id} />
                <input
                  className="min-w-64 rounded-lg border border-border px-3 py-2 text-sm"
                  name="resolutionNotes"
                  placeholder="Resolution notes"
                />
                <button
                  className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                  name="resolution"
                  value="RESOLVED"
                >
                  Resolve
                </button>
                <button
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                  name="resolution"
                  value="REJECTED"
                >
                  Reject
                </button>
              </form>
            </article>
          ))}
        </section>
      </div>
    </DashboardShell>
  );
}
