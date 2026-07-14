import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { OpportunityRelationshipDisclaimer } from "@/components/opportunities/opportunity-relationship-badge";
import { prisma } from "@/lib/db/prisma";
import { isSafeExternalUrl } from "@/lib/security/safe-url";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { updateApplicationWorkspace } from "../workspace-actions";

export default async function ApplicationWorkspacePage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const { applicationId } = await params;
  if (!user.studentProfile) notFound();
  const application = await prisma.application.findFirst({
    where: { id: applicationId, studentProfileId: user.studentProfile.id },
    include: {
      checklistItems: { orderBy: { sortOrder: "asc" } },
      resume: { select: { fileName: true } },
      opportunity: { include: { organization: { select: { name: true } } } },
    },
  });
  if (!application) notFound();
  const officialApplicationUrl = isSafeExternalUrl(
    application.opportunity.officialApplicationUrl,
  )
    ? application.opportunity.officialApplicationUrl
    : null;
  const date = (value: Date | null) =>
    value
      ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(value)
      : "Not specified";
  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/applications")}
      role="student"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="student" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Application workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            {application.opportunity.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {application.opportunity.organization.name} ·{" "}
            {application.status.replaceAll("_", " ")}
          </p>
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <OpportunityRelationshipDisclaimer
              relationshipType={application.opportunity.relationshipType}
            />
          </div>
        </header>
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground">Official deadline</p>
            <p className="mt-1 font-semibold">
              {date(application.opportunity.deadline)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground">Internal target</p>
            <p className="mt-1 font-semibold">
              {date(application.targetDeadline)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="mt-1 font-semibold">
              {application.completionPercent}%
            </p>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-background p-6">
          <h2 className="text-xl font-semibold">Preparation checklist</h2>
          <ul className="mt-4 space-y-3">
            {application.checklistItems.map((item) => (
              <li
                className="rounded-lg border border-border p-3 text-sm"
                key={item.id}
              >
                {item.completedAt ? "✓ " : "○ "}
                {item.label}
                {item.required ? " (required)" : ""}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Selected resume: {application.resume?.fileName ?? "Not selected"}
          </p>
        </section>
        <form
          action={updateApplicationWorkspace}
          className="rounded-xl border border-border bg-background p-6"
        >
          <input name="applicationId" type="hidden" value={application.id} />
          <h2 className="text-xl font-semibold">Your plan</h2>
          <label className="mt-4 block text-sm font-medium">
            Completion percent
            <input
              className="mt-2 w-full rounded-lg border border-border p-2"
              defaultValue={application.completionPercent}
              max="100"
              min="0"
              name="completionPercent"
              type="number"
            />
          </label>
          <label className="mt-4 block text-sm font-medium">
            Next action
            <input
              className="mt-2 w-full rounded-lg border border-border p-2"
              defaultValue={application.nextAction ?? ""}
              name="nextAction"
            />
          </label>
          <label className="mt-4 block text-sm font-medium">
            Private notes
            <textarea
              className="mt-2 w-full rounded-lg border border-border p-2"
              defaultValue={application.privateNotes ?? ""}
              name="privateNotes"
              rows={5}
            />
          </label>
          <button
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            type="submit"
          >
            Save workspace
          </button>
        </form>
        <section className="rounded-xl border border-border bg-muted/30 p-6">
          <h2 className="font-semibold">Submission is always your action</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {application.applicationMethod === "EXTERNAL_PORTAL"
              ? "Future Physicians does not submit this external application. Submit in the host portal, then explicitly confirm through the application form."
              : "This opportunity uses a configured Future Physicians submission workflow. Review your materials and explicitly submit when ready."}
          </p>
          <div className="mt-4 flex gap-3">
            {application.applicationMethod === "EXTERNAL_PORTAL" &&
            officialApplicationUrl ? (
              <a
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
                href={officialApplicationUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open official application
              </a>
            ) : null}
            <Link
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              href={`/dashboard/student/opportunities/${application.opportunityId}/apply`}
            >
              {application.applicationMethod === "EXTERNAL_PORTAL"
                ? "Confirm host submission"
                : "Continue submission"}
            </Link>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
