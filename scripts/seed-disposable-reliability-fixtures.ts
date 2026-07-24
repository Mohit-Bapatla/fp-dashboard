/**
 * Test-only fixtures for local authenticated reliability walkthroughs.
 * Clerk development users must be created separately and passed by ID.
 */
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DISPOSABLE_TEST_DATABASE_URL?.trim();
const clerkIds = {
  admin: process.env.DISPOSABLE_ADMIN_CLERK_ID?.trim(),
  partnerA: process.env.DISPOSABLE_PARTNER_A_CLERK_ID?.trim(),
  partnerB: process.env.DISPOSABLE_PARTNER_B_CLERK_ID?.trim(),
  studentA: process.env.DISPOSABLE_STUDENT_A_CLERK_ID?.trim(),
  studentB: process.env.DISPOSABLE_STUDENT_B_CLERK_ID?.trim(),
};

if (process.env.NODE_ENV !== "test" || !databaseUrl) {
  throw new Error(
    "Fixture seeding requires NODE_ENV=test and DISPOSABLE_TEST_DATABASE_URL.",
  );
}

const parsedDatabaseUrl = new URL(databaseUrl);
const databaseName = parsedDatabaseUrl.pathname.replace(/^\//, "");

if (
  !["127.0.0.1", "localhost"].includes(parsedDatabaseUrl.hostname) ||
  !/^fp_(?:dashboard_)?reliability(?:_test)?$/.test(databaseName)
) {
  throw new Error("Fixture seeding is restricted to a local reliability DB.");
}

if (Object.values(clerkIds).some((id) => !id?.startsWith("user_"))) {
  throw new Error(
    "All five disposable Clerk development user IDs are required.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const fixtureUsers = [
  {
    clerkUserId: clerkIds.studentA!,
    email: "student-a+clerk_test_20260724r1@example.com",
    id: "reliability_student_a",
    role: "STUDENT" as const,
  },
  {
    clerkUserId: clerkIds.studentB!,
    email: "student-b+clerk_test_20260724r1@example.com",
    id: "reliability_student_b",
    role: "STUDENT" as const,
  },
  {
    clerkUserId: clerkIds.partnerA!,
    email: "partner-a+clerk_test_20260724r1@example.com",
    id: "reliability_partner_a",
    role: "PARTNER" as const,
  },
  {
    clerkUserId: clerkIds.partnerB!,
    email: "partner-b+clerk_test_20260724r1@example.com",
    id: "reliability_partner_b",
    role: "PARTNER" as const,
  },
  {
    clerkUserId: clerkIds.admin!,
    email: "admin+clerk_test_20260724r1@example.com",
    id: "reliability_admin",
    role: "ADMIN" as const,
  },
];

async function main() {
  try {
    const users = new Map(
      await Promise.all(
        fixtureUsers.map(async (fixture) => {
          const user = await prisma.user.upsert({
            where: { clerkUserId: fixture.clerkUserId },
            update: {
              email: fixture.email,
              role: fixture.role,
            },
            create: fixture,
          });
          return [fixture.id, user] as const;
        }),
      ),
    );
    const studentB = users.get("reliability_student_b")!;
    const partnerA = users.get("reliability_partner_a")!;
    const partnerB = users.get("reliability_partner_b")!;
    const admin = users.get("reliability_admin")!;

    const studentBProfile = await prisma.studentProfile.upsert({
      where: { userId: studentB.id },
      update: {
        availability: ["Weekends"],
        careerGoals: "Explore clinical care",
        city: "Chicago",
        country: "United States",
        gradeYear: "College freshman",
        interestedSpecialties: ["Pediatrics"],
        opportunityTypes: ["SHADOWING"],
        school: "Reliability Test University",
        state: "Illinois",
      },
      create: {
        id: "reliability_profile_student_b",
        userId: studentB.id,
        availability: ["Weekends"],
        careerGoals: "Explore clinical care",
        city: "Chicago",
        country: "United States",
        gradeYear: "College freshman",
        interestedSpecialties: ["Pediatrics"],
        opportunityTypes: ["SHADOWING"],
        school: "Reliability Test University",
        state: "Illinois",
      },
    });

    const organizationA = await prisma.partnerOrganization.upsert({
      where: { name: "Reliability Organization A" },
      update: {
        status: "PARTNERED",
        verificationStatus: "VERIFIED",
        verifiedById: admin.id,
      },
      create: {
        id: "reliability_organization_a",
        name: "Reliability Organization A",
        status: "PARTNERED",
        verificationStatus: "VERIFIED",
        verifiedById: admin.id,
      },
    });
    const organizationB = await prisma.partnerOrganization.upsert({
      where: { name: "Reliability Organization B" },
      update: {
        status: "PARTNERED",
        verificationStatus: "VERIFIED",
        verifiedById: admin.id,
      },
      create: {
        id: "reliability_organization_b",
        name: "Reliability Organization B",
        status: "PARTNERED",
        verificationStatus: "VERIFIED",
        verifiedById: admin.id,
      },
    });

    await Promise.all([
      prisma.partnerMember.upsert({
        where: {
          userId_organizationId: {
            organizationId: organizationA.id,
            userId: partnerA.id,
          },
        },
        update: { isPrimary: true, title: "Reliability Partner A" },
        create: {
          id: "reliability_membership_a",
          organizationId: organizationA.id,
          userId: partnerA.id,
          isPrimary: true,
          title: "Reliability Partner A",
        },
      }),
      prisma.partnerMember.upsert({
        where: {
          userId_organizationId: {
            organizationId: organizationB.id,
            userId: partnerB.id,
          },
        },
        update: { isPrimary: true, title: "Reliability Partner B" },
        create: {
          id: "reliability_membership_b",
          organizationId: organizationB.id,
          userId: partnerB.id,
          isPrimary: true,
          title: "Reliability Partner B",
        },
      }),
    ]);

    await prisma.opportunity.upsert({
      where: { id: "reliability_opportunity_a" },
      update: {},
      create: {
        id: "reliability_opportunity_a",
        organizationId: organizationA.id,
        title: "Reliability External Shadowing A",
        type: "SHADOWING",
        status: "PUBLISHED",
        relationshipType: "EXTERNAL_PUBLIC",
        applicationMethod: "EXTERNAL_PORTAL",
        officialSourceUrl: "https://example.com/reliability-a",
        officialApplicationUrl: "https://example.com/reliability-a/apply",
        verificationStatus: "VERIFIED",
        visibility: "PUBLIC_DIRECTORY",
        availabilityStatus: "OPEN",
        deadline: new Date("2026-12-15T23:59:00.000Z"),
        publishedAt: new Date("2026-07-24T12:00:00.000Z"),
        requiredDocuments: ["Resume"],
      },
    });
    const opportunityB = await prisma.opportunity.upsert({
      where: { id: "reliability_opportunity_b" },
      update: {},
      create: {
        id: "reliability_opportunity_b",
        organizationId: organizationB.id,
        title: "Reliability Internal Program B",
        type: "PROGRAM",
        status: "PUBLISHED",
        relationshipType: "FP_OWNED",
        applicationMethod: "FP_INTERNAL",
        verificationStatus: "VERIFIED",
        visibility: "PUBLIC_DIRECTORY",
        availabilityStatus: "ROLLING",
        isRolling: true,
        publishedAt: new Date("2026-07-24T12:00:00.000Z"),
      },
    });

    const applicationB = await prisma.application.upsert({
      where: {
        studentProfileId_opportunityId: {
          opportunityId: opportunityB.id,
          studentProfileId: studentBProfile.id,
        },
      },
      update: { status: "SUBMITTED" },
      create: {
        id: "reliability_application_b",
        applicationMethod: "FP_INTERNAL",
        opportunityId: opportunityB.id,
        status: "SUBMITTED",
        statement: "Synthetic reliability application B.",
        studentProfileId: studentBProfile.id,
        submittedAt: new Date("2026-07-24T13:00:00.000Z"),
      },
    });

    await Promise.all([
      prisma.applicationTask.upsert({
        where: {
          applicationId_taskKey: {
            applicationId: applicationB.id,
            taskKey: "SYSTEM:REVIEW_ELIGIBILITY",
          },
        },
        update: {},
        create: {
          id: "reliability_task_b",
          applicationId: applicationB.id,
          taskKey: "SYSTEM:REVIEW_ELIGIBILITY",
          title: "Review eligibility",
          type: "REVIEW_ELIGIBILITY",
        },
      }),
      prisma.applicationOnboardingItem.upsert({
        where: {
          applicationId_title: {
            applicationId: applicationB.id,
            title: "Synthetic orientation",
          },
        },
        update: {},
        create: {
          id: "reliability_onboarding_b",
          applicationId: applicationB.id,
          title: "Synthetic orientation",
        },
      }),
    ]);

    console.log(
      JSON.stringify({
        applications: 1,
        organizations: 2,
        opportunities: 2,
        users: fixtureUsers.length,
        studentAHasProfile: false,
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    `Disposable reliability fixture seed failed: ${
      error instanceof Error ? error.message : "Unknown error"
    }`,
  );
  process.exitCode = 1;
});
