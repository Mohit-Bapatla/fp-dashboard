import { ShieldCheck } from "lucide-react";

import {
  ModerationQueue,
  type ModerationOpportunityItem,
} from "@/components/admin/moderation-queue";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  getModerationChecks,
  normalizeModerationToken,
} from "@/lib/moderation/moderation-checks";

export default async function AdminModerationPage() {
  await assertAdminAccess();

  const [partners, opportunities] = await Promise.all([
    prisma.partnerOrganization.findMany({
      where: {
        verificationStatus: {
          not: "VERIFIED",
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      select: {
        contactEmail: true,
        id: true,
        name: true,
        verificationChecklist: true,
        verificationNotes: true,
        verificationStatus: true,
      },
    }),
    prisma.opportunity.findMany({
      where: {
        OR: [
          {
            status: {
              in: ["PENDING_APPROVAL", "REJECTED"],
            },
          },
          {
            moderationFlags: {
              isEmpty: false,
            },
          },
        ],
      },
      orderBy: [
        {
          updatedAt: "desc",
        },
      ],
      select: {
        applicationInstructions: true,
        deadline: true,
        description: true,
        id: true,
        moderationFlags: true,
        moderationNotes: true,
        organization: {
          select: {
            id: true,
            name: true,
            verificationStatus: true,
          },
        },
        status: true,
        title: true,
      },
    }),
  ]);
  const titleCounts = new Map<string, number>();

  for (const opportunity of opportunities) {
    const key = `${opportunity.organization.id}:${normalizeModerationToken(
      opportunity.title,
    )}`;
    titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
  }

  const moderationOpportunities: ModerationOpportunityItem[] =
    opportunities.map((opportunity) => {
      const key = `${opportunity.organization.id}:${normalizeModerationToken(
        opportunity.title,
      )}`;

      return {
        ...opportunity,
        checks: getModerationChecks({
          opportunity,
          similarTitleCount: titleCounts.get(key) ?? 0,
        }),
      };
    });
  const flaggedCount = moderationOpportunities.filter(
    (opportunity) => opportunity.moderationFlags.length > 0,
  ).length;
  const pendingCount = moderationOpportunities.filter(
    (opportunity) => opportunity.status === "PENDING_APPROVAL",
  ).length;

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/moderation")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Quality and safety
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Moderation
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Review partner verification state, opportunity quality checks,
              moderation flags, and safe publish/reject/archive actions.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <ShieldCheck aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Partners that are not currently verified."
            label="Unverified partners"
            value={partners.length.toString()}
          />
          <StatCard
            helper="Opportunities waiting for moderation."
            label="Pending"
            value={pendingCount.toString()}
          />
          <StatCard
            helper="Opportunities with stored moderation flags."
            label="Flagged"
            value={flaggedCount.toString()}
          />
        </section>

        <ModerationQueue
          opportunities={moderationOpportunities}
          partners={partners}
          redirectTo="/dashboard/admin/moderation"
        />
      </div>
    </DashboardShell>
  );
}
