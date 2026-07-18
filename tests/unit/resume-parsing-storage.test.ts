import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    resume: {
      findFirst: mocks.findFirst,
    },
  },
}));

vi.mock("@/lib/storage/supabase-admin", () => ({
  createSupabaseAdminClient: () => ({
    storage: {
      from: () => ({
        download: mocks.download,
      }),
    },
  }),
  resumeBucketName: "synthetic-resume-bucket",
}));

vi.mock("@/lib/ai/openai", () => ({
  createStructuredJsonResponse: vi.fn().mockResolvedValue(null),
}));

import { parseResume } from "@/lib/ai/resume-parsing";

describe("resume ownership and storage failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("denies parsing when the resume is not owned by the student", async () => {
    mocks.findFirst.mockResolvedValue(null);

    await expect(
      parseResume("resume_other_student", "profile_student_a"),
    ).rejects.toMatchObject({
      code: "OWNERSHIP_DENIED",
      stage: "ownership_lookup",
    });
    expect(mocks.download).not.toHaveBeenCalled();
  });

  it("returns a categorized error when Supabase download fails", async () => {
    mocks.findFirst.mockResolvedValue({
      fileName: "synthetic-text-resume.pdf",
      fileUrl: "students/test/resume.pdf",
      id: "resume_download_failure",
    });
    mocks.download.mockResolvedValue({
      data: null,
      error: new Error("Synthetic storage download failure"),
    });

    await expect(
      parseResume("resume_download_failure", "profile_student_a"),
    ).rejects.toMatchObject({
      code: "DOWNLOAD_FAILED",
      stage: "supabase_download",
    });
  });
});
