import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { parseResumeBytes } from "@/lib/ai/resume-parsing";

function fixture(name: string) {
  return readFileSync(
    fileURLToPath(new URL(`../fixtures/resumes/${name}`, import.meta.url)),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("resume file extraction", () => {
  it("parses a generated two-page text PDF", async () => {
    const parsed = await parseResumeBytes({
      bytes: fixture("synthetic-text-resume.pdf"),
      enrichResume: async () => null,
      fileName: "synthetic-text-resume.pdf",
      mimeType: "application/pdf",
      resumeId: "resume_text_pdf_test",
    });

    expect(parsed.text.length).toBeGreaterThan(100);
    expect(parsed.education.join(" ")).toContain("Example University");
    expect(parsed.experience.join(" ")).toContain(
      "Coordinated a health-literacy program serving 75 local students each semester.",
    );
    expect(parsed.sections.honors.join(" ")).toContain(
      "Community Science Scholarship",
    );
    expect(parsed.sections.school.join(" ")).toContain(
      "Hosted CPR training for 45 students and coordinated volunteer instructors.",
    );
    expect(parsed.certifications).toEqual([]);
    expect(
      JSON.stringify({
        education: parsed.education,
        experience: parsed.experience,
        sections: parsed.sections,
        skills: parsed.skills,
      }),
    ).not.toMatch(/\d+\s+of\s+\d+/i);
  });

  it("rejects an image-only-like PDF with insufficient selectable text", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      parseResumeBytes({
        bytes: fixture("synthetic-image-only-like.pdf"),
        enrichResume: async () => null,
        fileName: "synthetic-image-only-like.pdf",
        mimeType: "application/pdf",
        resumeId: "resume_image_pdf_test",
      }),
    ).rejects.toMatchObject({
      code: "UNREADABLE_DOCUMENT",
      stage: "deterministic_extraction",
    });
  });

  it("parses a generated DOCX fixture", async () => {
    const parsed = await parseResumeBytes({
      bytes: fixture("synthetic-resume.docx"),
      enrichResume: async () => null,
      fileName: "synthetic-resume.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      resumeId: "resume_docx_test",
    });

    expect(parsed.text.length).toBeGreaterThan(100);
    expect(parsed.education.join(" ")).toContain("Example University");
    expect(parsed.experience.join(" ")).toContain("Clinical volunteer");
  });

  it("completes deterministic parsing when the OpenAI key is missing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");

    const parsed = await parseResumeBytes({
      bytes: fixture("synthetic-text-resume.pdf"),
      fileName: "synthetic-text-resume.pdf",
      mimeType: "application/pdf",
      resumeId: "resume_without_openai_test",
    });

    expect(parsed.education.join(" ")).toContain("Example University");
  });

  it("keeps deterministic results when OpenAI enrichment throws", async () => {
    const warning = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    const parsed = await parseResumeBytes({
      bytes: fixture("synthetic-text-resume.pdf"),
      enrichResume: async () => {
        throw new Error("Synthetic enrichment failure");
      },
      fileName: "synthetic-text-resume.pdf",
      mimeType: "application/pdf",
      resumeId: "resume_openai_failure_test",
    });

    expect(parsed.education.join(" ")).toContain("Example University");
    expect(warning).toHaveBeenCalledWith(
      "resume_parse_warning",
      expect.objectContaining({
        byteLength: expect.any(Number),
        errorClass: "Error",
        errorMessage: "Synthetic enrichment failure",
        extension: ".pdf",
        mimeType: "application/pdf",
        resumeId: "resume_openai_failure_test",
        stage: "openai_enrichment",
      }),
    );
  });

  it("discards AI fields that are not grounded in the resume", async () => {
    const parsed = await parseResumeBytes({
      bytes: fixture("synthetic-text-resume.pdf"),
      enrichResume: async () => ({
        certifications: ["Certified Nursing Assistant"],
        education: ["Prestigious Medical University"],
        experience: ["Completed 900 invented clinical hours"],
        skills: ["Phlebotomy"],
        summary: "Guaranteed acceptance based on invented experience.",
      }),
      fileName: "synthetic-text-resume.pdf",
      mimeType: "application/pdf",
      resumeId: "resume_ungrounded_ai_test",
    });

    expect(parsed.certifications).toEqual([]);
    expect(parsed.education.join(" ")).toContain("Example University");
    expect(parsed.experience.join(" ")).not.toContain("900");
    expect(parsed.skills).not.toContain("Phlebotomy");
    expect(parsed.summary).not.toContain("acceptance");
  });

  it("rejects an unsupported extension before parsing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      parseResumeBytes({
        bytes: Buffer.from("synthetic resume text"),
        enrichResume: async () => null,
        fileName: "synthetic-resume.txt",
        mimeType: "text/plain",
        resumeId: "resume_unsupported_test",
      }),
    ).rejects.toMatchObject({
      code: "UNSUPPORTED_FILE_TYPE",
      stage: "deterministic_extraction",
    });
  });
});
