import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialStudentOnboardingActionState } from "@/lib/student/onboarding-state";

const mocks = vi.hoisted(() => ({
  acquireLock: vi.fn(),
  auditCreate: vi.fn(),
  auditFindFirst: vi.fn(),
  transactionAuditFindFirst: vi.fn(),
  auth: vi.fn(),
  enforceRateLimit: vi.fn(),
  getCurrentUser: vi.fn(),
  getRole: vi.fn(),
  profileUpsert: vi.fn(),
  redirect: vi.fn(),
  redirectToSignIn: vi.fn(),
  transaction: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/account-transition", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/auth/account-transition")>();
  return {
    ...original,
    acquireAccountTransitionLock: mocks.acquireLock,
  };
});
vi.mock("@/lib/auth/roles", () => ({
  getRoleFromSessionClaims: mocks.getRole,
}));
vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
  formatRateLimitMessage: () => "Rate limited",
}));
vi.mock("@/lib/student/profile", () => ({
  getOrCreateCurrentStudentUser: mocks.getCurrentUser,
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    auditLog: { findFirst: mocks.auditFindFirst },
  },
}));

import { saveStudentProfile } from "@/app/dashboard/student/onboarding/actions";

function basicStepForm() {
  const form = new FormData();
  form.set("step", "0");
  form.set("firstName", "Student");
  form.set("lastName", "A");
  form.set("school", "Example University");
  form.set("gradeYear", "College freshman");
  form.set("minimumAgeAffirmation", "on");
  form.set("studentProfileId", "attacker-controlled-profile");
  return form;
}

function locationStepForm() {
  const form = new FormData();
  form.set("step", "1");
  form.set("city", "Chicago");
  form.set("state", "Illinois");
  form.set("country", "United States");
  return form;
}

describe("student onboarding action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      redirectToSignIn: mocks.redirectToSignIn,
      sessionClaims: {},
      userId: "clerk-a",
    });
    mocks.getRole.mockReturnValue("STUDENT");
    mocks.getCurrentUser.mockResolvedValue({
      firstName: null,
      id: "database-a",
      lastName: null,
      partnerMemberships: [],
      role: "STUDENT",
      studentProfile: null,
    });
    mocks.auditFindFirst.mockResolvedValue(null);
    mocks.enforceRateLimit.mockResolvedValue({ allowed: true });
    mocks.userFindUnique.mockResolvedValue({
      firstName: null,
      lastName: null,
      partnerMemberships: [],
      role: "STUDENT",
      studentProfile: null,
    });
    mocks.userUpdate.mockResolvedValue({
      firstName: "Student",
      lastName: "A",
    });
    mocks.profileUpsert.mockResolvedValue({
      availability: [],
      careerGoals: null,
      city: null,
      country: null,
      gradeYear: "College freshman",
      id: "profile-a",
      interestedSpecialties: [],
      opportunityTypes: [],
      school: "Example University",
      state: null,
      userId: "database-a",
    });
    mocks.transaction.mockImplementation(
      async (callback: (transaction: unknown) => unknown) =>
        callback({
          auditLog: {
            create: mocks.auditCreate,
            findFirst: mocks.transactionAuditFindFirst,
          },
          studentProfile: { upsert: mocks.profileUpsert },
          user: {
            findUnique: mocks.userFindUnique,
            update: mocks.userUpdate,
          },
        }),
    );
  });

  it("rejects unauthenticated writes before touching the database", async () => {
    mocks.auth.mockResolvedValue({
      redirectToSignIn: mocks.redirectToSignIn,
      sessionClaims: null,
      userId: null,
    });
    mocks.redirectToSignIn.mockReturnValue("redirected");

    await saveStudentProfile(
      initialStudentOnboardingActionState,
      basicStepForm(),
    );

    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.redirectToSignIn).toHaveBeenCalledOnce();
  });

  it("scopes Student A's partial save to Student A despite a forged profile ID", async () => {
    const result = await saveStudentProfile(
      initialStudentOnboardingActionState,
      basicStepForm(),
    );

    expect(mocks.acquireLock).toHaveBeenCalledWith(
      expect.anything(),
      "database-a",
    );
    expect(mocks.profileUpsert).toHaveBeenCalledWith({
      where: { userId: "database-a" },
      update: {
        ageYears: null,
        gradeYear: "College freshman",
        school: "Example University",
      },
      create: {
        ageYears: null,
        gradeYear: "College freshman",
        school: "Example University",
        userId: "database-a",
      },
    });
    expect(result.saveStatus).toBe("saved");
    expect(result.resumeStep).toBe(1);
  });

  it("does not replace earlier fields when a later step is saved", async () => {
    mocks.profileUpsert.mockResolvedValue({
      availability: [],
      careerGoals: null,
      city: "Chicago",
      country: "United States",
      gradeYear: "College freshman",
      id: "profile-a",
      interestedSpecialties: [],
      opportunityTypes: [],
      school: "Example University",
      state: "Illinois",
      userId: "database-a",
    });

    await saveStudentProfile(
      initialStudentOnboardingActionState,
      locationStepForm(),
    );

    expect(mocks.profileUpsert).toHaveBeenCalledWith({
      where: { userId: "database-a" },
      update: {
        city: "Chicago",
        country: "United States",
        locationPreference: null,
        maximumTravelMiles: null,
        remotePreference: null,
        state: "Illinois",
        transportationNotes: null,
      },
      create: {
        city: "Chicago",
        country: "United States",
        locationPreference: null,
        maximumTravelMiles: null,
        remotePreference: null,
        state: "Illinois",
        transportationNotes: null,
        userId: "database-a",
      },
    });
    expect(mocks.profileUpsert.mock.calls[0]?.[0].update).not.toHaveProperty(
      "school",
    );
  });

  it("marks completion once and makes a repeated final save idempotent", async () => {
    const incompleteProfile = {
      availability: ["Weekends"],
      careerGoals: null,
      city: "Chicago",
      country: "United States",
      gradeYear: "College freshman",
      id: "profile-a",
      interestedSpecialties: ["Pediatrics"],
      opportunityTypes: ["SHADOWING"],
      school: "Example University",
      state: "Illinois",
      userId: "database-a",
    };
    const completedProfile = {
      ...incompleteProfile,
      careerGoals: "Explore clinical care",
    };
    mocks.getCurrentUser.mockResolvedValue({
      firstName: "Student",
      id: "database-a",
      lastName: "A",
      partnerMemberships: [],
      role: "STUDENT",
      studentProfile: incompleteProfile,
    });
    mocks.userFindUnique.mockResolvedValue({
      firstName: "Student",
      lastName: "A",
      partnerMemberships: [],
      role: "STUDENT",
      studentProfile: incompleteProfile,
    });
    mocks.profileUpsert.mockResolvedValue(completedProfile);
    mocks.transactionAuditFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "completion-audit" });
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    const form = new FormData();
    form.set("step", "3");
    form.set("careerGoals", "Explore clinical care");

    await expect(
      saveStudentProfile(initialStudentOnboardingActionState, form),
    ).rejects.toThrow("NEXT_REDIRECT");
    await expect(
      saveStudentProfile(initialStudentOnboardingActionState, form),
    ).rejects.toThrow("NEXT_REDIRECT");

    const completionWrites = mocks.auditCreate.mock.calls.filter(
      ([argument]) => argument.data.action === "STUDENT_ONBOARDING_COMPLETED",
    );

    expect(completionWrites).toHaveLength(1);
    expect(completionWrites[0]?.[0]).toEqual({
      data: expect.objectContaining({
        action: "STUDENT_ONBOARDING_COMPLETED",
        actorId: "database-a",
        entityId: "profile-a",
      }),
    });
    expect(mocks.profileUpsert).toHaveBeenCalledTimes(2);
  });
});
