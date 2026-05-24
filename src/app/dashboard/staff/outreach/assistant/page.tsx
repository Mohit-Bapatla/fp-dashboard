import { MailCheck } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { OutreachAssistantForm } from "@/components/staff/outreach-assistant-form";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import { getStaffNavItems } from "@/lib/staff/navigation";

function userName(user: {
  email: string;
  firstName: string | null;
  lastName: string | null;
}) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
  );
}

export default async function StaffOutreachAssistantPage() {
  await assertPlacementQueueAccess();

  const [organizations, contacts, placementRequests] = await Promise.all([
    prisma.partnerOrganization.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.outreachContact.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        firstName: true,
        id: true,
        lastName: true,
        organizationId: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.placementRequest.findMany({
      where: {
        status: {
          notIn: ["PLACED", "CLOSED"],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        title: true,
        studentProfile: {
          select: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return (
    <DashboardShell
      navItems={getStaffNavItems("/dashboard/staff/outreach")}
      role="staff"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="staff" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Outreach assistant
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              AI Outreach Assistant
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Generate editable partner outreach drafts from CRM context. Drafts
              are never sent, scheduled, saved, or automated.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
            href="/dashboard/staff/outreach"
          >
            Back to outreach
          </Link>
        </header>

        <OutreachAssistantForm
          contacts={contacts.map((contact) => ({
            id: contact.id,
            label: `${[contact.firstName, contact.lastName].filter(Boolean).join(" ")} - ${contact.organization.name}`,
            organizationId: contact.organizationId,
          }))}
          organizations={organizations.map((organization) => ({
            id: organization.id,
            label: organization.name,
          }))}
          placementRequests={placementRequests.map((request) => ({
            id: request.id,
            label: `${request.title} - ${userName(request.studentProfile.user)}`,
          }))}
        />

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <MailCheck aria-hidden="true" className="h-5 w-5 text-primary" />
          <h2 className="mt-4 text-base font-semibold text-foreground">
            Human-controlled outreach
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This assistant drafts copy only. Staff remain responsible for
            reviewing, editing, sending, and tracking all outreach.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}
