import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applicationCreate: vi.fn(),
  auditCreate: vi.fn(),
  buildTasks: vi.fn(),
  opportunityCreate: vi.fn(),
  organizationCreate: vi.fn(),
  organizationFindUnique: vi.fn(),
  organizationUpdate: vi.fn(),
  rateLimit: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  requestCreate: vi.fn(),
  taskCreateMany: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/student/authorization", () => ({
  assertStudentAccess: vi.fn().mockResolvedValue({ userId: "clerk-student" }),
}));
vi.mock("@/lib/student/profile", () => ({
  getCurrentStudentProfile: vi.fn().mockResolvedValue({
    id: "user-1",
    studentProfile: {
      availability: ["Weekends"],
      careerGoals: "Explore clinical care",
      city: "Chicago",
      country: "United States",
      gradeYear: "College freshman",
      id: "profile-owner",
      interestedSpecialties: ["Pediatrics"],
      opportunityTypes: ["SHADOWING"],
      school: "Example University",
      state: "Illinois",
    },
  }),
}));
vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: mocks.rateLimit,
  formatRateLimitMessage: vi.fn().mockReturnValue("Try later"),
}));
vi.mock("@/lib/student/application-tasks", () => ({
  buildInitialApplicationTasks: mocks.buildTasks,
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback) =>
      callback({
        application: { create: mocks.applicationCreate },
        applicationTask: { createMany: mocks.taskCreateMany },
        auditLog: { create: mocks.auditCreate },
        externalOpportunityVerificationRequest: {
          create: mocks.requestCreate,
        },
        opportunity: { create: mocks.opportunityCreate },
        partnerOrganization: {
          create: mocks.organizationCreate,
          findUnique: mocks.organizationFindUnique,
          update: mocks.organizationUpdate,
        },
      }),
    ),
  },
}));

import { addExternalOpportunity } from "@/app/dashboard/student/opportunities/add-external/actions";
import { emptyExternalOpportunityValues } from "@/lib/student/external-opportunity-validation";

describe("add external opportunity action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.organizationFindUnique.mockResolvedValue(null);
    mocks.organizationCreate.mockResolvedValue({ id: "system-org" });
    mocks.opportunityCreate.mockResolvedValue({ id: "external-1" });
    mocks.applicationCreate.mockResolvedValue({ id: "application-1" });
    mocks.buildTasks.mockReturnValue([
      {
        dueAt: null,
        required: true,
        sortOrder: 0,
        source: "SYSTEM",
        status: "NOT_STARTED",
        studentControlled: false,
        taskKey: "SYSTEM:REVIEW_ELIGIBILITY",
        title: "Review eligibility",
        type: "REVIEW_ELIGIBILITY",
      },
    ]);
  });

  it("creates an owner-scoped private source, workspace, tasks, and review item", async () => {
    const form = new FormData();
    form.set("sourceUrl", "https://example.org/apply");
    form.set("title", "Hospital internship");
    form.set("organizationName", "Example Hospital");
    form.set("createWorkspace", "on");
    form.set("requestVerification", "on");
    form.set("studentProfileId", "attacker-controlled-profile");

    await expect(
      addExternalOpportunity(
        {
          fieldErrors: {},
          formError: null,
          values: emptyExternalOpportunityValues,
        },
        form,
      ),
    ).rejects.toThrow("REDIRECT:/dashboard/student/applications/application-1");

    expect(mocks.opportunityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationMethod: "EXTERNAL_PORTAL",
          officialApplicationUrl: null,
          officialSourceUrl: "https://example.org/apply",
          sourceType: "STUDENT_ADDED",
          status: "DRAFT",
          studentOwnerProfileId: "profile-owner",
          verificationStatus: "NEEDS_REVIEW",
          visibility: "STUDENT_PRIVATE",
        }),
      }),
    );
    expect(mocks.applicationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PREPARING",
          studentProfileId: "profile-owner",
        }),
      }),
    );
    expect(mocks.taskCreateMany).toHaveBeenCalled();
    expect(mocks.requestCreate).toHaveBeenCalledWith({
      data: {
        opportunityId: "external-1",
        studentProfileId: "profile-owner",
      },
    });
    const externalAudit = mocks.auditCreate.mock.calls
      .map(([input]) => input)
      .find((input) => input.data.action === "EXTERNAL_OPPORTUNITY_ADDED");
    expect(JSON.stringify(externalAudit)).not.toContain("Hospital internship");
    expect(JSON.stringify(externalAudit)).not.toContain("example.org");
  });

  it("does not write when the authenticated user is rate limited", async () => {
    mocks.rateLimit.mockResolvedValue({ allowed: false });
    const form = new FormData();
    form.set("sourceUrl", "https://example.org/apply");
    form.set("title", "Hospital internship");
    form.set("organizationName", "Example Hospital");

    const result = await addExternalOpportunity(
      {
        fieldErrors: {},
        formError: null,
        values: emptyExternalOpportunityValues,
      },
      form,
    );

    expect(result.formError).toBe("Try later");
    expect(mocks.opportunityCreate).not.toHaveBeenCalled();
  });

  it("does not convert a real organization that collides with the reserved name", async () => {
    mocks.organizationFindUnique.mockResolvedValue({
      id: "real-organization",
      isSystemPlaceholder: false,
    });
    const form = new FormData();
    form.set("sourceUrl", "https://example.org/apply");
    form.set("title", "Hospital internship");
    form.set("organizationName", "Example Hospital");

    const result = await addExternalOpportunity(
      {
        fieldErrors: {},
        formError: null,
        values: emptyExternalOpportunityValues,
      },
      form,
    );

    expect(result.formError).toContain("Contact support");
    expect(mocks.opportunityCreate).not.toHaveBeenCalled();
    expect(mocks.organizationUpdate).not.toHaveBeenCalled();
  });
});
