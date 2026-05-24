import "server-only";

import { prisma } from "@/lib/db/prisma";
import { createStructuredJsonResponse } from "@/lib/ai/openai";
import {
  createSupabaseAdminClient,
  resumeBucketName,
} from "@/lib/storage/supabase-admin";

export type ParsedResumeData = {
  certifications: string[];
  education: string[];
  experience: string[];
  skills: string[];
  summary: string | null;
  text: string;
};

type AiResumeParseResult = {
  certifications: string[];
  education: string[];
  experience: string[];
  skills: string[];
  summary: string;
};

const resumeSchema = {
  additionalProperties: false,
  properties: {
    certifications: {
      items: { type: "string" },
      type: "array",
    },
    education: {
      items: { type: "string" },
      type: "array",
    },
    experience: {
      items: { type: "string" },
      type: "array",
    },
    skills: {
      items: { type: "string" },
      type: "array",
    },
    summary: {
      type: "string",
    },
  },
  required: ["summary", "skills", "education", "experience", "certifications"],
  type: "object",
};

const commonSkillTerms = [
  "basic life support",
  "bls",
  "cpr",
  "first aid",
  "patient care",
  "clinical research",
  "data analysis",
  "excel",
  "python",
  "r",
  "spanish",
  "mandarin",
  "medical terminology",
  "shadowing",
  "volunteering",
  "emr",
  "epic",
  "redcap",
  "public health",
  "community health",
  "laboratory",
  "phlebotomy",
  "scribe",
];

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .map((value) => value.slice(0, 160)),
    ),
  ).slice(0, 16);
}

function getLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function linesNearHeading(lines: string[], headings: string[]) {
  const matches: string[] = [];

  lines.forEach((line, index) => {
    const normalized = line.toLowerCase();

    if (!headings.some((heading) => normalized.includes(heading))) {
      return;
    }

    matches.push(...lines.slice(index + 1, index + 5));
  });

  return uniqueStrings(matches);
}

function deterministicParse(text: string): ParsedResumeData {
  const cleaned = cleanText(text);
  const lines = getLines(text);
  const lower = cleaned.toLowerCase();
  const skills = commonSkillTerms.filter((skill) => lower.includes(skill));
  const education = linesNearHeading(lines, [
    "education",
    "university",
    "college",
    "school",
  ]);
  const experience = linesNearHeading(lines, [
    "experience",
    "work",
    "volunteer",
    "shadow",
    "research",
  ]);
  const certifications = linesNearHeading(lines, [
    "certification",
    "certifications",
    "license",
    "training",
  ]);
  const summary = cleaned
    ? cleaned
        .split(/(?<=[.!?])\s+/)
        .slice(0, 2)
        .join(" ")
        .slice(0, 500)
    : null;

  return {
    certifications,
    education,
    experience,
    skills: uniqueStrings(skills),
    summary,
    text,
  };
}

async function extractPdfText(bytes: Buffer): Promise<string> {
  void bytes;

  throw new Error(
    "PDF resume parsing is not available in this build. Please upload a DOCX resume for parsing.",
  );
}

async function extractDocxText(bytes: Buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({
    buffer: bytes,
  });

  return result.value;
}

async function extractResumeText(fileName: string, bytes: Buffer) {
  const lowerFileName = fileName.toLowerCase();

  if (lowerFileName.endsWith(".pdf")) {
    return extractPdfText(bytes);
  }

  if (lowerFileName.endsWith(".docx")) {
    return extractDocxText(bytes);
  }

  throw new Error("Unsupported resume file type.");
}

async function enrichResumeWithOpenAi(text: string) {
  return createStructuredJsonResponse<AiResumeParseResult>({
    input: [
      "Extract resume information for a healthcare opportunity dashboard.",
      "Do not infer protected or sensitive attributes.",
      "Return concise, factual fields only.",
      `Resume text:\n${text.slice(0, 16000)}`,
    ].join("\n\n"),
    schema: resumeSchema,
    schemaName: "resume_parse",
  });
}

export async function parseResume(resumeId: string, studentProfileId: string) {
  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      studentProfileId,
    },
    select: {
      fileName: true,
      fileUrl: true,
      id: true,
    },
  });

  if (!resume?.fileUrl) {
    throw new Error("Resume file was not found.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(resumeBucketName)
    .download(resume.fileUrl);

  if (error || !data) {
    throw new Error("Resume file could not be downloaded.");
  }

  const bytes = Buffer.from(await data.arrayBuffer());
  const text = await extractResumeText(resume.fileName, bytes);
  const cleanedText = text.trim();

  if (cleanedText.length < 30) {
    throw new Error("Resume text could not be extracted reliably.");
  }

  const fallback = deterministicParse(cleanedText);
  const aiResult = await enrichResumeWithOpenAi(cleanedText);

  return {
    certifications: uniqueStrings(
      aiResult?.certifications.length
        ? aiResult.certifications
        : fallback.certifications,
    ),
    education: uniqueStrings(
      aiResult?.education.length ? aiResult.education : fallback.education,
    ),
    experience: uniqueStrings(
      aiResult?.experience.length ? aiResult.experience : fallback.experience,
    ),
    skills: uniqueStrings(
      aiResult?.skills.length ? aiResult.skills : fallback.skills,
    ),
    summary: aiResult?.summary?.trim() || fallback.summary,
    text: cleanedText,
  } satisfies ParsedResumeData;
}
