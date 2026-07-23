import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: vi.fn(),
  deleteMany: vi.fn(),
  findFirstOpportunity: vi.fn(),
  findFirstSaved: vi.fn(),
  rate: vi.fn(),
  revalidate: vi.fn(),
  updateMany: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/audit/audit-log", () => ({ createAuditLog: mocks.audit }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    opportunity: { findFirst: mocks.findFirstOpportunity },
    savedOpportunity: {
      deleteMany: mocks.deleteMany,
      findFirst: mocks.findFirstSaved,
      updateMany: mocks.updateMany,
      upsert: vi.fn(),
    },
  },
}));
vi.mock("@/lib/security/rate-limit", () => ({ enforceRateLimit: mocks.rate }));
vi.mock("@/lib/student/authorization", () => ({
  assertStudentAccess: vi.fn().mockResolvedValue({ userId: "clerk-1" }),
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
      id: "profile-1",
      interestedSpecialties: ["Pediatrics"],
      opportunityTypes: ["SHADOWING"],
      school: "Example University",
      state: "Illinois",
    },
  }),
}));

import {
  setFollowReopening,
  unsaveOpportunity,
} from "@/app/dashboard/student/saved/actions";

describe("saved closed-program mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rate.mockResolvedValue({ allowed: true });
    mocks.findFirstSaved.mockResolvedValue({ id: "saved-1" });
  });
  it("updates follow state by saved-record ownership without requiring a published opportunity", async () => {
    const form = new FormData();
    form.set("opportunityId", "closed-1");
    form.set("followReopening", "true");
    await setFollowReopening(form);
    expect(mocks.findFirstOpportunity).not.toHaveBeenCalled();
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { studentProfileId: "profile-1", opportunityId: "closed-1" },
      data: { followReopening: true },
    });
  });
  it("unsaves by saved-record ownership without requiring publication", async () => {
    const form = new FormData();
    form.set("opportunityId", "archived-1");
    await unsaveOpportunity(form);
    expect(mocks.findFirstOpportunity).not.toHaveBeenCalled();
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { studentProfileId: "profile-1", opportunityId: "archived-1" },
    });
  });
});
