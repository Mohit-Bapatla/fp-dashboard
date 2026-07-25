import { Bookmark } from "lucide-react";
import Link from "next/link";
import { setFollowReopening, unsaveOpportunity } from "./actions";
import { startApplicationWorkspace } from "@/app/dashboard/student/applications/workspace-actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { EligibilityBadge } from "@/components/opportunities/eligibility-badge";
import { OpportunityRelationshipBadge } from "@/components/opportunities/opportunity-relationship-badge";
import { prisma } from "@/lib/db/prisma";
import { evaluateOpportunityEligibility } from "@/lib/matching/opportunity-eligibility";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { getCompletedStudentProfile } from "@/lib/student/profile-completion";
import {
  isOpportunityPreparable,
  isOpportunitySubmittable,
} from "@/lib/opportunities/student-visibility";

function date(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(value)
    : "Not published";
}

export default async function StudentSavedPage() {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const profile = getCompletedStudentProfile(user.studentProfile);
  const saved = profile
    ? await prisma.savedOpportunity.findMany({
        where: {
          studentProfileId: profile.id,
          dismissedAt: null,
          opportunity: {
            status: { in: ["PUBLISHED", "CLOSED", "ARCHIVED"] },
            verificationStatus: { in: ["VERIFIED", "ARCHIVED"] },
            visibility: "PUBLIC_DIRECTORY",
          },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          opportunity: {
            include: { organization: { select: { name: true } } },
          },
        },
      })
    : [];
  const now = new Date();
  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/saved")}
      role="student"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="student" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Saved opportunities
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">Saved</h1>
          <p className="mt-4 text-muted-foreground">
            Keep promising programs together, follow closed programs for
            reopening, and continue preparing when you are ready.
          </p>
        </header>
        {saved.length === 0 ? (
          <>
            <EmptyState
              description="Save a listing from the opportunity directory to compare it here."
              icon={Bookmark}
              title="No saved opportunities yet"
            />
            <Link
              className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              href="/dashboard/student/opportunities"
            >
              Browse opportunities
            </Link>
          </>
        ) : (
          <div className="grid gap-4">
            {saved.map(({ opportunity, followReopening }) => {
              const eligibility = evaluateOpportunityEligibility({
                opportunity,
                student: profile,
              });
              const preparationAllowed = isOpportunityPreparable(
                opportunity,
                now,
              );
              const submissionAllowed = isOpportunitySubmittable(
                opportunity,
                now,
              );
              const awaitingOpening =
                !submissionAllowed &&
                (opportunity.availabilityStatus === "OPENING_SOON" ||
                  Boolean(opportunity.opensAt && opportunity.opensAt > now));
              return (
                <article
                  className="rounded-xl border border-border bg-background p-5 shadow-sm"
                  key={opportunity.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <OpportunityRelationshipBadge
                      relationshipType={opportunity.relationshipType}
                    />
                    <EligibilityBadge category={eligibility.category} />
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs">
                      {opportunity.availabilityStatus.replaceAll("_", " ")}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">
                    <Link
                      href={`/dashboard/student/opportunities/${opportunity.id}`}
                    >
                      {opportunity.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {opportunity.organization.name}
                  </p>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-muted-foreground">
                        Applications open
                      </dt>
                      <dd className="font-medium">
                        {date(opportunity.opensAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Deadline</dt>
                      <dd className="font-medium">
                        {date(opportunity.deadline)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Verification</dt>
                      <dd className="font-medium">
                        {opportunity.verificationStatus.replaceAll("_", " ")} ·{" "}
                        {date(opportunity.lastVerifiedAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        Eligibility note
                      </dt>
                      <dd className="font-medium">
                        {eligibility.blockingReasons[0] ??
                          eligibility.unknowns[0] ??
                          eligibility.confirmedMatches[0] ??
                          "Review details"}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {preparationAllowed ? (
                      <form action={startApplicationWorkspace}>
                        <input
                          name="opportunityId"
                          type="hidden"
                          value={opportunity.id}
                        />
                        <button
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                          type="submit"
                        >
                          {submissionAllowed
                            ? "Start or continue application"
                            : "Start or continue preparation"}
                        </button>
                      </form>
                    ) : (
                      <span className="rounded-lg border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
                        Applications unavailable
                      </span>
                    )}
                    <form action={setFollowReopening}>
                      <input
                        name="opportunityId"
                        type="hidden"
                        value={opportunity.id}
                      />
                      <input
                        name="followReopening"
                        type="hidden"
                        value={String(!followReopening)}
                      />
                      <button
                        className="rounded-lg border border-border px-4 py-2 text-sm"
                        type="submit"
                      >
                        {followReopening
                          ? awaitingOpening
                            ? "Stop opening alerts"
                            : "Stop reopening alerts"
                          : awaitingOpening
                            ? "Follow for opening alert"
                            : "Follow for reopening"}
                      </button>
                    </form>
                    <form action={unsaveOpportunity}>
                      <input
                        name="opportunityId"
                        type="hidden"
                        value={opportunity.id}
                      />
                      <button
                        className="rounded-lg border border-border px-4 py-2 text-sm"
                        type="submit"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
