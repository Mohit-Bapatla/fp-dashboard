import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getStudentProfileCompletion } from "@/lib/student/profile-completion";

export type DataQualityIssueAction = "ARCHIVE_EXPIRED_OPPORTUNITY";

export type DataQualityIssueItem = {
  action?: DataQualityIssueAction;
  description: string;
  entityId: string;
  entityType: string;
  href: string;
  issueKey: string;
  title: string;
};

export type DataQualityIssueBucket = {
  description: string;
  items: DataQualityIssueItem[];
  key: string;
  title: string;
};

const staleApplicationCutoffDays = 7;
const stalePlacementCutoffHours = 48;

function isBlank(value: string | null | undefined) {
  return !value?.trim();
}

function buildIssue({
  action,
  description,
  entityId,
  entityType,
  href,
  issueKey,
  title,
}: DataQualityIssueItem): DataQualityIssueItem {
  return {
    action,
    description,
    entityId,
    entityType,
    href,
    issueKey,
    title,
  };
}

function formatName(user: {
  email: string;
  firstName: string | null;
  lastName: string | null;
}) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
  );
}

function getAcknowledgementKey(issue: DataQualityIssueItem) {
  return `${issue.entityType}:${issue.entityId}:${issue.issueKey}`;
}

async function removeAcknowledgedIssues(issues: DataQualityIssueItem[]) {
  if (issues.length === 0) {
    return issues;
  }

  const acknowledgements = await prisma.dataQualityAcknowledgement.findMany({
    where: {
      OR: issues.map((issue) => ({
        entityId: issue.entityId,
        entityType: issue.entityType,
        issueKey: issue.issueKey,
      })),
    },
    select: {
      entityId: true,
      entityType: true,
      issueKey: true,
    },
  });
  const acknowledgedKeys = new Set(
    acknowledgements.map(
      (acknowledgement) =>
        `${acknowledgement.entityType}:${acknowledgement.entityId}:${acknowledgement.issueKey}`,
    ),
  );

  return issues.filter(
    (issue) => !acknowledgedKeys.has(getAcknowledgementKey(issue)),
  );
}

export async function getDataQualityBuckets(): Promise<
  DataQualityIssueBucket[]
> {
  const now = new Date();
  const staleApplicationsBefore = new Date(now);
  staleApplicationsBefore.setDate(
    staleApplicationsBefore.getDate() - staleApplicationCutoffDays,
  );
  const stalePlacementBefore = new Date(
    now.getTime() - stalePlacementCutoffHours * 60 * 60 * 1000,
  );

  const [
    students,
    profiles,
    partnerOrganizations,
    opportunities,
    applications,
    placementRequests,
    outreachTasks,
    unclaimedImports,
  ] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "STUDENT",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        email: true,
        firstName: true,
        id: true,
        lastName: true,
        studentProfile: {
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.studentProfile.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        availability: true,
        careerGoals: true,
        city: true,
        country: true,
        experienceLevel: true,
        gradeYear: true,
        id: true,
        interestedSpecialties: true,
        opportunityTypes: true,
        resumes: {
          select: {
            id: true,
          },
          take: 1,
        },
        school: true,
        state: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.partnerOrganization.findMany({
      where: { isSystemPlaceholder: false },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        city: true,
        contactEmail: true,
        country: true,
        description: true,
        healthcareFocus: true,
        id: true,
        location: true,
        name: true,
        specialtyAreas: true,
        state: true,
        status: true,
        type: true,
        website: true,
      },
    }),
    prisma.opportunity.findMany({
      where: {
        visibility: "PUBLIC_DIRECTORY",
        organization: { isSystemPlaceholder: false },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        applicationInstructions: true,
        deadline: true,
        description: true,
        id: true,
        location: true,
        organization: {
          select: {
            name: true,
          },
        },
        specialty: true,
        status: true,
        title: true,
      },
    }),
    prisma.application.findMany({
      where: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organization: { isSystemPlaceholder: false },
        },
        status: {
          in: ["SUBMITTED", "UNDER_REVIEW"],
        },
        updatedAt: {
          lte: staleApplicationsBefore,
        },
      },
      orderBy: {
        updatedAt: "asc",
      },
      select: {
        id: true,
        status: true,
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
        opportunity: {
          select: {
            title: true,
          },
        },
        updatedAt: true,
      },
    }),
    prisma.placementRequest.findMany({
      where: {
        status: {
          notIn: ["PLACED", "CLOSED"],
        },
        OR: [
          {
            assignedStaffId: null,
          },
          {
            updatedAt: {
              lte: stalePlacementBefore,
            },
          },
        ],
      },
      orderBy: {
        updatedAt: "asc",
      },
      select: {
        assignedStaffId: true,
        id: true,
        status: true,
        title: true,
        updatedAt: true,
      },
    }),
    prisma.outreachTask.findMany({
      where: {
        status: {
          notIn: ["COMPLETED", "BLOCKED"],
        },
        OR: [
          {
            assignedToId: null,
          },
          {
            dueAt: {
              lt: now,
            },
          },
        ],
      },
      orderBy: [
        {
          dueAt: "asc",
        },
        {
          updatedAt: "asc",
        },
      ],
      select: {
        assignedToId: true,
        dueAt: true,
        id: true,
        status: true,
        title: true,
      },
    }),
    prisma.studentImportRecord.findMany({
      where: {
        claimedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        email: true,
        id: true,
        normalizedEmail: true,
      },
    }),
  ]);

  const realStudentEmails = new Set(
    students.map((student) => student.email.toLowerCase()),
  );
  const allIssues: DataQualityIssueBucket[] = [
    {
      description: "Student users that do not have an attached profile.",
      key: "missing-student-profiles",
      title: "Missing student profiles",
      items: students
        .filter((student) => !student.studentProfile)
        .map((student) =>
          buildIssue({
            description: student.email,
            entityId: student.id,
            entityType: "User",
            href: "/dashboard/admin/students",
            issueKey: "missing_student_profile",
            title: formatName(student),
          }),
        ),
    },
    {
      description: "Student profiles missing required onboarding fields.",
      key: "incomplete-student-profiles",
      title: "Incomplete student profiles",
      items: profiles
        .filter((profile) => !getStudentProfileCompletion(profile).isComplete)
        .map((profile) => {
          const completion = getStudentProfileCompletion(profile);

          return buildIssue({
            description: `${completion.completedFields} of ${completion.totalFields} required fields complete.`,
            entityId: profile.id,
            entityType: "StudentProfile",
            href: "/dashboard/admin/students",
            issueKey: "incomplete_student_profile",
            title: formatName(profile.user),
          });
        }),
    },
    {
      description: "Student profiles that do not have an uploaded resume.",
      key: "missing-resumes",
      title: "Missing resumes",
      items: profiles
        .filter((profile) => profile.resumes.length === 0)
        .map((profile) =>
          buildIssue({
            description: "No resume records are attached to this profile.",
            entityId: profile.id,
            entityType: "StudentProfile",
            href: "/dashboard/admin/students",
            issueKey: "missing_resume",
            title: formatName(profile.user),
          }),
        ),
    },
    {
      description: "Staged CSV student imports that match real student emails.",
      key: "duplicate-staged-real-emails",
      title: "Duplicate staged/real emails",
      items: unclaimedImports
        .filter((record) => realStudentEmails.has(record.normalizedEmail))
        .map((record) =>
          buildIssue({
            description: `${record.email} already has a real user account.`,
            entityId: record.id,
            entityType: "StudentImportRecord",
            href: "/dashboard/admin/data-imports",
            issueKey: "duplicate_staged_real_email",
            title: record.email,
          }),
        ),
    },
    {
      description: "Partner records missing useful CRM or profile details.",
      key: "incomplete-partners",
      title: "Incomplete partners",
      items: partnerOrganizations
        .filter(
          (partner) =>
            isBlank(partner.contactEmail) ||
            (isBlank(partner.location) &&
              isBlank(partner.city) &&
              isBlank(partner.state) &&
              isBlank(partner.country)) ||
            (isBlank(partner.description) &&
              isBlank(partner.healthcareFocus) &&
              partner.specialtyAreas.length === 0) ||
            isBlank(partner.type) ||
            isBlank(partner.website),
        )
        .map((partner) =>
          buildIssue({
            description:
              "Missing contact, location, website, type, or profile context.",
            entityId: partner.id,
            entityType: "PartnerOrganization",
            href: "/dashboard/admin/partners",
            issueKey: "incomplete_partner",
            title: partner.name,
          }),
        ),
    },
    {
      description: "Opportunities missing student-facing fields.",
      key: "incomplete-opportunities",
      title: "Incomplete opportunities",
      items: opportunities
        .filter(
          (opportunity) =>
            isBlank(opportunity.description) ||
            isBlank(opportunity.location) ||
            isBlank(opportunity.specialty) ||
            isBlank(opportunity.applicationInstructions) ||
            !opportunity.deadline,
        )
        .map((opportunity) =>
          buildIssue({
            description: `${opportunity.organization.name} | ${opportunity.status}`,
            entityId: opportunity.id,
            entityType: "Opportunity",
            href: "/dashboard/admin/opportunities",
            issueKey: "incomplete_opportunity",
            title: opportunity.title,
          }),
        ),
    },
    {
      description: "Published opportunities whose deadline has passed.",
      key: "expired-published-opportunities",
      title: "Expired published/open opportunities",
      items: opportunities
        .filter(
          (opportunity) =>
            opportunity.status === "PUBLISHED" &&
            opportunity.deadline &&
            opportunity.deadline < now,
        )
        .map((opportunity) =>
          buildIssue({
            action: "ARCHIVE_EXPIRED_OPPORTUNITY",
            description: `${opportunity.organization.name} | Deadline passed.`,
            entityId: opportunity.id,
            entityType: "Opportunity",
            href: "/dashboard/admin/opportunities",
            issueKey: "expired_published_opportunity",
            title: opportunity.title,
          }),
        ),
    },
    {
      description: `Applications in submitted or under-review state for ${staleApplicationCutoffDays}+ days.`,
      key: "stuck-applications",
      title: "Stuck applications",
      items: applications.map((application) =>
        buildIssue({
          description: `${formatName(application.studentProfile.user)} | ${application.opportunity.title} | ${application.status}`,
          entityId: application.id,
          entityType: "Application",
          href: "/dashboard/admin/applications",
          issueKey: "stuck_application",
          title: application.opportunity.title,
        }),
      ),
    },
    {
      description: "Active placement requests that are stale or unassigned.",
      key: "stale-unassigned-placement-requests",
      title: "Stale/unassigned placement requests",
      items: placementRequests.map((request) =>
        buildIssue({
          description: request.assignedStaffId
            ? `${request.status} | Not updated in 48+ hours.`
            : `${request.status} | Unassigned.`,
          entityId: request.id,
          entityType: "PlacementRequest",
          href: "/dashboard/admin/placement-requests",
          issueKey: request.assignedStaffId
            ? "stale_placement_request"
            : "unassigned_placement_request",
          title: request.title,
        }),
      ),
    },
    {
      description: "Outreach tasks that are overdue or unassigned.",
      key: "overdue-unassigned-outreach-tasks",
      title: "Overdue/unassigned outreach tasks",
      items: outreachTasks.map((task) =>
        buildIssue({
          description: task.assignedToId
            ? `${task.status} | Due date has passed.`
            : `${task.status} | Unassigned.`,
          entityId: task.id,
          entityType: "OutreachTask",
          href: "/dashboard/staff/tasks",
          issueKey: task.assignedToId
            ? "overdue_outreach_task"
            : "unassigned_outreach_task",
          title: task.title,
        }),
      ),
    },
    {
      description:
        "Student CSV import records waiting for a real student login.",
      key: "unclaimed-imports",
      title: "Unclaimed imports",
      items: unclaimedImports.map((record) =>
        buildIssue({
          description: record.normalizedEmail,
          entityId: record.id,
          entityType: "StudentImportRecord",
          href: "/dashboard/admin/data-imports",
          issueKey: "unclaimed_student_import",
          title: record.email,
        }),
      ),
    },
  ];

  return Promise.all(
    allIssues.map(async (bucket) => ({
      ...bucket,
      items: await removeAcknowledgedIssues(bucket.items),
    })),
  );
}
