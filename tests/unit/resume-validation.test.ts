import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  sanitizeResumeFileName,
  validateResumeFileContent,
} from "@/lib/student/resume-validation";

const fixtures = fileURLToPath(
  new URL("../fixtures/resumes/", import.meta.url),
);

describe("resume upload content validation", () => {
  it("accepts real generated PDF and DOCX fixtures", () => {
    const pdf = readFileSync(`${fixtures}/synthetic-text-resume.pdf`);
    const docx = readFileSync(`${fixtures}/synthetic-resume.docx`);
    expect(validateResumeFileContent(pdf, "pdf")).toEqual({ success: true });
    expect(validateResumeFileContent(docx, "docx")).toEqual({ success: true });
  });

  it("rejects extension-only spoofing", () => {
    const spoofed = new TextEncoder().encode("not a PDF or DOCX");
    expect(validateResumeFileContent(spoofed, "pdf")).toMatchObject({
      success: false,
    });
    expect(validateResumeFileContent(spoofed, "docx")).toMatchObject({
      success: false,
    });
  });

  it("removes path separators and unsafe characters from display names", () => {
    expect(sanitizeResumeFileName("../My <Resume>.pdf", "pdf")).toBe(
      "..-My Resume.pdf",
    );
  });
});
