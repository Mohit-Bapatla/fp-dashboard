/**
 * Test-only reset for one explicitly identified disposable local student.
 *
 * This script never reads DATABASE_URL, never deletes a Clerk user, and refuses
 * non-local or non-reliability databases.
 */
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DISPOSABLE_TEST_DATABASE_URL?.trim();
const userId = process.env.DISPOSABLE_TEST_USER_ID?.trim();

if (process.env.NODE_ENV !== "test") {
  throw new Error("Refusing to reset onboarding outside NODE_ENV=test.");
}

if (!databaseUrl) {
  throw new Error("DISPOSABLE_TEST_DATABASE_URL is required.");
}

if (!userId || !/^reliability_[a-z0-9_-]{8,}$/i.test(userId)) {
  throw new Error(
    "DISPOSABLE_TEST_USER_ID must explicitly name a reliability_ test user.",
  );
}

const parsedDatabaseUrl = new URL(databaseUrl);
const databaseName = parsedDatabaseUrl.pathname.replace(/^\//, "");

if (
  !["127.0.0.1", "localhost"].includes(parsedDatabaseUrl.hostname) ||
  !/^fp_(?:dashboard_)?reliability(?:_test)?$/.test(databaseName)
) {
  throw new Error(
    "Refusing reset: use a localhost database named fp_reliability or fp_dashboard_reliability_test.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        id: true,
        studentProfile: { select: { id: true } },
      },
    });

    const isDisposableEmail =
      user?.email.endsWith("@example.test") ||
      /^[^@+]+\+clerk_test_[a-z0-9_-]+@example\.com$/i.test(user?.email ?? "");

    if (!user?.studentProfile || !isDisposableEmail) {
      throw new Error(
        "Refusing reset: the target is not a recognized disposable student.",
      );
    }

    const result = await prisma.$transaction(async (transaction) => {
      const applications = await transaction.application.deleteMany({
        where: {
          studentProfileId: user.studentProfile!.id,
          OR: [
            { id: { startsWith: "reliability_" } },
            { opportunityId: { startsWith: "reliability_" } },
          ],
        },
      });
      const onboardingAudits = await transaction.auditLog.deleteMany({
        where: {
          action: {
            in: [
              "STUDENT_ONBOARDING_AGE_AFFIRMED",
              "STUDENT_ONBOARDING_COMPLETED",
            ],
          },
          actorId: user.id,
        },
      });

      await transaction.studentProfile.update({
        where: { id: user.studentProfile!.id },
        data: {
          ageYears: null,
          availability: [],
          careerGoals: null,
          certifications: [],
          city: null,
          country: null,
          githubUrl: null,
          gradeYear: null,
          interestedSpecialties: [],
          languages: [],
          linkedinUrl: null,
          locationPreference: null,
          maximumTravelMiles: null,
          opportunityTypes: [],
          paidOnlyPreference: null,
          portfolioUrl: null,
          preferredSeasons: [],
          remotePreference: null,
          school: null,
          state: null,
          transportationNotes: null,
        },
      });
      await transaction.user.update({
        where: { id: user.id },
        data: { firstName: null, lastName: null },
      });

      return {
        applicationsRemoved: applications.count,
        onboardingAuditsRemoved: onboardingAudits.count,
        userId: user.id,
      };
    });

    console.log(JSON.stringify(result));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    `Disposable onboarding reset failed: ${
      error instanceof Error ? error.message : "Unknown error"
    }`,
  );
  process.exitCode = 1;
});
