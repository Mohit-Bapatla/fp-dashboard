import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  resolveCorrectionReport,
  resolveExternalOpportunityVerification,
  setOpportunityVerification,
} from "./actions";

function getFlaggedMaintenanceChecks(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }
  const checks = (metadata as { checks?: unknown }).checks;
  if (!Array.isArray(checks)) return [];

  return checks.flatMap((check) => {
    if (!check || typeof check !== "object" || Array.isArray(check)) return [];
    const { opportunityId, status } = check as {
      opportunityId?: unknown;
      status?: unknown;
    };
    return typeof opportunityId === "string" &&
      typeof status === "string" &&
      !["HEALTHY", "REDIRECTED"].includes(status)
      ? [{ opportunityId, status }]
      : [];
  });
}

export default async function VerificationQueuePage() {
  await assertAdminAccess();
  const now = new Date(),
    soon = new Date(now);
  soon.setDate(now.getDate() + 14);
  const [opportunities, reports, externalRequests, maintenanceRuns] =
    await Promise.all([
      prisma.opportunity.findMany({
        where: {
          visibility: "PUBLIC_DIRECTORY",
          AND: [
            {
              OR: [
                {
                  verificationStatus: {
                    in: ["NEEDS_REVIEW", "STALE", "BROKEN_LINK", "ARCHIVED"],
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
        where: {
          status: "OPEN",
          opportunity: { visibility: "PUBLIC_DIRECTORY" },
        },
        orderBy: { createdAt: "asc" },
        include: { opportunity: { select: { title: true } } },
      }),
      prisma.externalOpportunityVerificationRequest.findMany({
        where: {
          status: "PENDING",
          opportunity: { visibility: "STUDENT_PRIVATE" },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
        select: {
          createdAt: true,
          id: true,
          opportunity: {
            select: {
              officialSourceUrl: true,
              studentOrganizationName: true,
              title: true,
            },
          },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, id: true, metadata: true },
        take: 5,
        where: { action: "OPPORTUNITY_MAINTENANCE_RUN" },
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
          <div>
            <h2 className="text-xl font-semibold">
              Automated freshness reports
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The protected, bounded verifier reports source health for human
              review. It never publishes, archives, or changes a listing.
            </p>
          </div>
          {maintenanceRuns.map((run) => {
            const metadata =
              run.metadata &&
              typeof run.metadata === "object" &&
              !Array.isArray(run.metadata)
                ? run.metadata
                : null;
            const checked =
              metadata && typeof metadata.checked === "number"
                ? metadata.checked
                : "Unknown";
            const flaggedChecks = getFlaggedMaintenanceChecks(run.metadata);

            return (
              <article
                className="rounded-xl border border-border bg-background p-5"
                key={run.id}
              >
                <h3 className="font-semibold">
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(run.createdAt)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {checked} listings checked. Source URLs and response bodies
                  are not stored in this run log.
                </p>
                {flaggedChecks.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm">
                    {flaggedChecks.map((check) => (
                      <li key={`${check.opportunityId}-${check.status}`}>
                        <a
                          className="font-semibold text-primary underline underline-offset-4"
                          href={`/dashboard/admin/opportunities/${check.opportunityId}/edit`}
                        >
                          Review{" "}
                          {check.status.replaceAll("_", " ").toLowerCase()}{" "}
                          listing
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })}
          {maintenanceRuns.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              No automated freshness run has been recorded in this environment.
            </p>
          ) : null}
        </section>
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
            Student-added sources ({externalRequests.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Reviewing a source resolves the intake request only. It never
            publishes or converts the student&apos;s private record.
          </p>
          {externalRequests.map((request) => (
            <article
              className="rounded-xl border border-border bg-background p-5"
              key={request.id}
            >
              <h3 className="font-semibold">{request.opportunity.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {request.opportunity.studentOrganizationName} · submitted{" "}
                {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                  request.createdAt,
                )}
              </p>
              {request.opportunity.officialSourceUrl ? (
                <a
                  className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-border px-3 py-2 text-sm font-medium"
                  href={request.opportunity.officialSourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open submitted source
                </a>
              ) : null}
              <form
                action={resolveExternalOpportunityVerification}
                className="mt-4 flex flex-col gap-2 sm:flex-row"
              >
                <input name="requestId" type="hidden" value={request.id} />
                <label
                  className="sr-only"
                  htmlFor={`request-notes-${request.id}`}
                >
                  Review notes
                </label>
                <input
                  className="min-h-10 min-w-64 flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                  id={`request-notes-${request.id}`}
                  maxLength={1000}
                  name="resolutionNotes"
                  placeholder="Sanitized review notes"
                />
                <button
                  className="min-h-10 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                  name="resolution"
                  value="APPROVED"
                >
                  Approve for catalog intake
                </button>
                <button
                  className="min-h-10 rounded-lg border border-border px-3 py-2 text-sm"
                  name="resolution"
                  value="REJECTED"
                >
                  Reject source
                </button>
              </form>
            </article>
          ))}
          {externalRequests.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              No student-added sources are waiting for review.
            </p>
          ) : null}
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
