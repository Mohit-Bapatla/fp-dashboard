import { GraduationCap } from "lucide-react";
import Link from "next/link";

import {
  AdminStudentList,
  type AdminStudentListItem,
} from "@/components/admin/admin-student-list";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Prisma } from "@/generated/prisma/client";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";
import { getStudentProfileCompletion } from "@/lib/student/profile-completion";

type AdminStudentsPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function AdminStudentsPage({
  searchParams,
}: AdminStudentsPageProps) {
  await assertAdminAccess();

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const where: Prisma.UserWhereInput = {
    role: "STUDENT",
  };

  if (query) {
    where.OR = [
      {
        email: {
          contains: query,
        },
      },
      {
        firstName: {
          contains: query,
        },
      },
      {
        lastName: {
          contains: query,
        },
      },
      {
        studentProfile: {
          is: {
            school: {
              contains: query,
            },
          },
        },
      },
      {
        studentProfile: {
          is: {
            gradeYear: {
              contains: query,
            },
          },
        },
      },
      {
        studentProfile: {
          is: {
            city: {
              contains: query,
            },
          },
        },
      },
      {
        studentProfile: {
          is: {
            state: {
              contains: query,
            },
          },
        },
      },
      {
        studentProfile: {
          is: {
            country: {
              contains: query,
            },
          },
        },
      },
    ];
  }

  const [students, totalCount, profileCount, resumeCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        studentProfile: {
          select: {
            school: true,
            gradeYear: true,
            city: true,
            state: true,
            country: true,
            interestedSpecialties: true,
            opportunityTypes: true,
            availability: true,
            careerGoals: true,
            experienceLevel: true,
            _count: {
              select: {
                applications: true,
                resumes: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        role: "STUDENT",
      },
    }),
    prisma.studentProfile.count(),
    prisma.resume.count(),
  ]);

  const studentItems: AdminStudentListItem[] = students.map((student) => ({
    ...student,
    studentProfile: student.studentProfile
      ? {
          school: student.studentProfile.school,
          gradeYear: student.studentProfile.gradeYear,
          city: student.studentProfile.city,
          state: student.studentProfile.state,
          country: student.studentProfile.country,
          completionPercent: getStudentProfileCompletion(student.studentProfile)
            .percent,
          resumeCount: student.studentProfile._count.resumes,
          applicationCount: student.studentProfile._count.applications,
        }
      : null,
  }));

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/students")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Student records
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Students
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Review student account, profile, resume, and application summary
              information from one internal admin view.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <GraduationCap aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section
          aria-label="Admin student stats"
          className="grid gap-4 md:grid-cols-3"
        >
          <StatCard
            helper="User records with the STUDENT role."
            label="Students"
            value={totalCount.toString()}
          />
          <StatCard
            helper="Students who have completed at least one profile record."
            label="Profiles"
            value={profileCount.toString()}
          />
          <StatCard
            helper="Private resume metadata records linked to student profiles."
            label="Resumes"
            value={resumeCount.toString()}
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="text-sm font-medium text-foreground">
              Search
              <input
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
                defaultValue={query}
                name="q"
                placeholder="Search name, email, school, grade, or location"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                type="submit"
              >
                Search
              </button>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/admin/students"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <AdminStudentList students={studentItems} />
      </div>
    </DashboardShell>
  );
}
