import { Medal } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { ServiceHourPanel } from "@/components/service-hours/service-hour-panel";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";

function getStudentName(record: {
  studentProfile: {
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  };
}) {
  const { email, firstName, lastName } = record.studentProfile.user;
  const name = [firstName, lastName].filter(Boolean).join(" ");

  return name || email;
}

export default async function AdminServiceHoursPage() {
  await assertAdminAccess();

  const [records, pendingCertificates, verifiedHours] = await Promise.all([
    prisma.serviceHourRecord.findMany({
      where: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organization: { isSystemPlaceholder: false },
        },
        partnerOrganization: { isSystemPlaceholder: false },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 100,
      select: {
        applicationId: true,
        certificateNotes: true,
        certificateStatus: true,
        description: true,
        hours: true,
        id: true,
        verificationNotes: true,
        verificationStatus: true,
        verifiedAt: true,
        opportunity: {
          select: {
            title: true,
          },
        },
        partnerOrganization: {
          select: {
            name: true,
          },
        },
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
    prisma.serviceHourRecord.count({
      where: {
        certificateStatus: "PENDING_APPROVAL",
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organization: { isSystemPlaceholder: false },
        },
        partnerOrganization: { isSystemPlaceholder: false },
      },
    }),
    prisma.serviceHourRecord.aggregate({
      where: {
        verificationStatus: "VERIFIED",
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organization: { isSystemPlaceholder: false },
        },
        partnerOrganization: { isSystemPlaceholder: false },
      },
      _sum: {
        hours: true,
      },
    }),
  ]);

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/service-hours")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Service hours
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Service Hours and Certificates
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Review verified service hours and approve certificate metadata.
              Certificates are tracked as status records in this stage.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <Medal aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Latest service hour records shown below."
            label="Records"
            value={records.length.toString()}
          />
          <StatCard
            helper="Records waiting for certificate approval."
            label="Pending certificates"
            value={pendingCertificates.toString()}
          />
          <StatCard
            helper="Verified service hours across the platform."
            label="Verified hours"
            value={(verifiedHours._sum.hours ?? 0).toString()}
          />
        </section>

        <div className="grid gap-5">
          {records.length > 0 ? (
            records.map((record) => (
              <article
                className="rounded-lg border border-border bg-background p-5 shadow-sm"
                key={record.id}
              >
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground">
                    {getStudentName(record)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {record.opportunity.title} |{" "}
                    {record.partnerOrganization.name}
                  </p>
                </div>
                <ServiceHourPanel
                  applicationId={record.applicationId}
                  mode="admin"
                  records={[record]}
                  redirectTo="/dashboard/admin/service-hours"
                />
              </article>
            ))
          ) : (
            <section className="rounded-lg border border-dashed border-border bg-background p-8 text-sm leading-6 text-muted-foreground">
              Service hour records will appear after partners record accepted
              student hours.
            </section>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
