import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getContext: vi.fn(),
  parseResume: vi.fn(),
  rateLimit: vi.fn(),
  resumeUpdate: vi.fn(),
  resumeUpdateMany: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/ai/resume-parsing", () => ({
  parseResume: mocks.parseResume,
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    resume: {
      update: mocks.resumeUpdate,
      updateMany: mocks.resumeUpdateMany,
    },
  },
}));
vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: mocks.rateLimit,
  formatRateLimitMessage: vi.fn().mockReturnValue("Try again later."),
}));
vi.mock("@/lib/student/resume", () => ({
  createResumeSignedUrl: vi.fn(),
  getCurrentStudentResumeContext: mocks.getContext,
}));
vi.mock("@/lib/audit/audit-log", () => ({ createAuditLog: vi.fn() }));
vi.mock("@/lib/student/resume-validation", () => ({
  validateResumeFile: vi.fn(),
}));
vi.mock("@/lib/storage/supabase-admin", () => ({
  createSupabaseAdminClient: vi.fn(),
  resumeBucketName: "synthetic-resume-bucket",
}));

import {
  parseStudentResume,
  type ResumeActionState,
} from "@/app/dashboard/student/resume/actions";
import { ResumeParsingError } from "@/lib/ai/resume-parsing-errors";

const initialState: ResumeActionState = { error: null, success: null };

function parseForm() {
  const data = new FormData();
  data.set("resumeId", "resume_test");
  return data;
}

describe("resume parse action status transitions", () => {
  const deterministicResult = {
    certifications: ["Basic Life Support"],
    education: ["Example University"],
    experience: ["Clinical volunteer"],
    projects: [],
    skills: ["Patient communication"],
    summary: "Synthetic summary",
    text: "Synthetic normalized resume text with sufficient content.",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getContext.mockResolvedValue({
      profileId: "profile_test",
      resume: {
        fileName: "synthetic-text-resume.pdf",
        id: "resume_test",
        parseStatus: "NOT_STARTED",
        updatedAt: new Date("2026-07-17T12:00:00.000Z"),
      },
      userId: "user_test",
    });
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.resumeUpdateMany.mockResolvedValue({ count: 1 });
    mocks.resumeUpdate.mockResolvedValue({ id: "resume_test" });
    mocks.parseResume.mockImplementation(
      async (_resumeId, _profileId, onDeterministicResult) => {
        await onDeterministicResult(deterministicResult, {
          byteLength: 1_000,
          extension: ".pdf",
          mimeType: "application/pdf",
          resumeId: "resume_test",
        });

        return {
          ...deterministicResult,
          usedEnrichment: false,
        };
      },
    );
  });

  it("claims the record and completes after deterministic parsing succeeds", async () => {
    const result = await parseStudentResume(initialState, parseForm());

    expect(result).toEqual({ error: null, success: "Resume parsed." });
    expect(mocks.resumeUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          parseFailureReason: null,
          parseStatus: "PROCESSING",
        },
        where: expect.objectContaining({
          id: "resume_test",
          studentProfileId: "profile_test",
        }),
      }),
    );
    expect(mocks.resumeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parseFailureReason: null,
          parseStatus: "COMPLETED",
        }),
      }),
    );
  });

  it("persists FAILED with a safe categorized reason after extraction fails", async () => {
    mocks.parseResume.mockRejectedValue(
      new ResumeParsingError({
        cause: new Error("Synthetic insufficient text"),
        code: "UNREADABLE_DOCUMENT",
        stage: "deterministic_extraction",
      }),
    );

    const result = await parseStudentResume(initialState, parseForm());

    expect(result.error).toContain("selectable text");
    expect(mocks.resumeUpdate).toHaveBeenCalledWith({
      data: {
        parseFailureReason: "UNREADABLE_DOCUMENT",
        parseStatus: "FAILED",
      },
      where: { id: "resume_test" },
    });
  });

  it("does not start a duplicate active parse", async () => {
    mocks.resumeUpdateMany.mockResolvedValue({ count: 0 });

    const result = await parseStudentResume(initialState, parseForm());

    expect(result).toEqual({
      error: "This resume is already being parsed. Please wait a moment.",
      success: null,
    });
    expect(mocks.parseResume).not.toHaveBeenCalled();
  });
});
