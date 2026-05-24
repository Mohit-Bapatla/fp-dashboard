import "server-only";

import { createStructuredJsonResponse } from "@/lib/ai/openai";
import { prisma } from "@/lib/db/prisma";
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
  "research",
  "data analysis",
  "data entry",
  "excel",
  "microsoft excel",
  "google sheets",
  "python",
  "r programming",
  "javascript",
  "typescript",
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
  "lab safety",
  "phlebotomy",
  "scribe",
  "medical scribing",
  "vital signs",
  "patient communication",
];

const sectionHeadings = {
  certifications: [
    "certification",
    "certifications",
    "certificate",
    "certificates",
    "licenses",
    "licensure",
    "training",
    "licenses and certifications",
  ],
  education: [
    "education",
    "academic background",
    "academic history",
    "university",
    "college",
  ],
  experience: [
    "experience",
    "professional experience",
    "work experience",
    "clinical experience",
    "volunteer experience",
    "research experience",
    "employment",
    "leadership experience",
    "activities",
  ],
  skills: [
    "skills",
    "core competencies",
    "competencies",
    "technical skills",
    "clinical skills",
    "relevant skills",
  ],
} as const;

const summaryHeadings = [
  "summary",
  "profile",
  "professional summary",
  "objective",
  "about",
];

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeResumeText(value: string) {
  const withNormalizedBreaks = value
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[|·]/g, " ")
    .replace(/[\u2022\u25cf\u25aa\u25e6]/g, "\n")
    .replace(/\t+/g, " ")
    .replace(/[ \f\v]+/g, " ")
    .replace(
      /([a-z0-9)])\s+(Education|Experience|Skills|Certifications|Certificates|Licenses|Projects|Summary|Objective)\s*:?/gi,
      "$1\n$2:",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return withNormalizedBreaks
    .split(/\n/)
    .map((line) => line.replace(/\s{2,}/g, " ").trim())
    .join("\n")
    .trim();
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  values.forEach((value) => {
    const cleaned = value
      .replace(/\s+/g, " ")
      .replace(/^[\-\u2013\u2014:;,\s]+|[\-\u2013\u2014:;,\s]+$/g, "")
      .trim()
      .slice(0, 220);
    const key = cleaned.toLowerCase();

    if (cleaned.length > 1 && !seen.has(key)) {
      seen.add(key);
      normalized.push(cleaned);
    }
  });

  return normalized.slice(0, 16);
}

function uniqueSkills(values: string[]) {
  return Array.from(
    values.reduce((map, value) => {
      const cleaned = value
        .replace(/\s+/g, " ")
        .replace(/^[^a-z0-9+.#]+|[^a-z0-9+.#]+$/gi, "")
        .trim();
      const lower = cleaned.toLowerCase();
      const isSingleLetter = /^[a-z]$/i.test(cleaned);

      if (
        cleaned &&
        !isSingleLetter &&
        !["and", "or", "with", "skills", "skill"].includes(lower)
      ) {
        map.set(lower, cleaned);
      }

      return map;
    }, new Map<string, string>()),
  )
    .map(([, value]) => value.slice(0, 80))
    .slice(0, 24);
}

function getLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeHeading(line: string) {
  return line
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getAllHeadingTerms() {
  return [
    ...summaryHeadings,
    ...Object.values(sectionHeadings).flatMap((headings) => headings),
  ];
}

function parseHeadingLine(line: string) {
  const compactLine = line.replace(/\s+/g, " ").trim();
  const normalizedLine = normalizeHeading(compactLine);

  for (const [key, headings] of Object.entries(sectionHeadings)) {
    for (const heading of headings) {
      if (normalizedLine === heading) {
        return {
          key: key as keyof typeof sectionHeadings,
          remainder: "",
        };
      }

      const inlinePattern = new RegExp(
        `^${escapeRegExp(heading)}\\s*[:\\-\\u2013\\u2014]?\\s+(.+)$`,
        "i",
      );
      const match = compactLine.match(inlinePattern);

      if (match?.[1]) {
        return {
          key: key as keyof typeof sectionHeadings,
          remainder: match[1].trim(),
        };
      }
    }
  }

  return null;
}

function extractSection(lines: string[], target: keyof typeof sectionHeadings) {
  const matches: string[] = [];
  let collecting = false;

  lines.forEach((line) => {
    const heading = parseHeadingLine(line);

    if (heading) {
      collecting = heading.key === target;
      if (collecting && heading.remainder) {
        matches.push(heading.remainder);
      }
      return;
    }

    if (collecting) {
      matches.push(line);
    }
  });

  return uniqueStrings(matches);
}

function extractSummarySection(lines: string[]) {
  const matches: string[] = [];
  let collecting = false;
  const allHeadings = getAllHeadingTerms();

  lines.forEach((line) => {
    const normalizedLine = normalizeHeading(line);
    const summaryHeading = summaryHeadings.find(
      (heading) =>
        normalizedLine === heading ||
        line.toLowerCase().startsWith(`${heading}:`),
    );
    const otherHeading =
      parseHeadingLine(line) ||
      allHeadings.some((heading) => normalizeHeading(line) === heading);

    if (summaryHeading) {
      collecting = true;
      const remainder = line.replace(
        new RegExp(`^${summaryHeading}:?`, "i"),
        "",
      );

      if (remainder.trim()) {
        matches.push(remainder.trim());
      }
      return;
    }

    if (collecting && otherHeading) {
      collecting = false;
      return;
    }

    if (collecting) {
      matches.push(line);
    }
  });

  return cleanText(matches.join(" ")).slice(0, 500);
}

function splitPotentialSkills(values: string[]) {
  return values.flatMap((value) =>
    value
      .split(/[,;|/]| {2,}/)
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function skillsFromKnownTerms(text: string) {
  return commonSkillTerms.filter((skill) => {
    const escaped = escapeRegExp(skill);
    const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");

    return pattern.test(text);
  });
}

function extractEducationFallback(lines: string[]) {
  const educationPattern =
    /\b(university|college|school|academy|bachelor|master|associate|degree|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|gpa|pre-?med|biology|chemistry|neuroscience)\b/i;

  return uniqueStrings(
    lines.filter((line) => {
      return educationPattern.test(line) && line.length <= 180;
    }),
  );
}

function extractExperienceFallback(lines: string[]) {
  const datePattern =
    /\b(20\d{2}|19\d{2}|present|current|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i;
  const rolePattern =
    /\b(intern|volunteer|assistant|research|scribe|shadow|mentor|coordinator|leader|tutor|care|clinic|hospital|lab)\b/i;

  return uniqueStrings(
    lines.filter((line) => {
      return (
        line.length >= 12 &&
        line.length <= 220 &&
        rolePattern.test(line) &&
        (datePattern.test(line) || /[-–—]/.test(line))
      );
    }),
  );
}

function extractCertificationFallback(lines: string[]) {
  const certificationPattern =
    /\b(certified|certification|certificate|license|licensed|bls|cpr|first aid|hipaa|training)\b/i;

  return uniqueStrings(
    lines.filter((line) => {
      return certificationPattern.test(line) && line.length <= 180;
    }),
  );
}

function extractContactSummary(lines: string[]) {
  const joined = lines.join(" ");
  const email = joined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.at(0);
  const phone = joined
    .match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/)
    ?.at(0);
  const name = lines.slice(0, 4).find((line) => {
    const words = line.split(/\s+/);

    return words.length >= 2 && words.length <= 4 && !line.includes("@");
  });

  return { email, name, phone };
}

function deterministicParse(text: string): ParsedResumeData {
  const normalizedText = normalizeResumeText(text);
  const cleaned = cleanText(normalizedText);
  const lines = getLines(normalizedText);
  const skillSection = extractSection(lines, "skills");
  const skills = uniqueSkills([
    ...splitPotentialSkills(skillSection),
    ...skillsFromKnownTerms(cleaned),
  ]);
  const education = extractSection(lines, "education");
  const experience = extractSection(lines, "experience");
  const certifications = extractSection(lines, "certifications");
  const contact = extractContactSummary(lines);
  const explicitSummary = extractSummarySection(lines);
  const summaryLead = (explicitSummary || cleaned)
    .split(/(?<=[.!?])\s+/)
    .slice(0, 2)
    .join(" ")
    .slice(0, 500);
  const contactParts = [
    contact.name ? `Name: ${contact.name}` : null,
    contact.email ? `Email: ${contact.email}` : null,
    contact.phone ? `Phone: ${contact.phone}` : null,
  ].filter(Boolean);
  const summary = cleaned
    ? [...contactParts, summaryLead].filter(Boolean).join("\n")
    : null;

  return {
    certifications: certifications.length
      ? certifications
      : extractCertificationFallback(lines),
    education: education.length ? education : extractEducationFallback(lines),
    experience: experience.length
      ? experience
      : extractExperienceFallback(lines),
    skills,
    summary,
    text: normalizedText,
  };
}

async function extractPdfText(bytes: Buffer): Promise<string> {
  type PdfParser = {
    destroy?: () => Promise<void> | void;
    getText: () => Promise<{ text?: string }>;
  };
  type PdfParseConstructor = new (options: { data: Buffer }) => PdfParser;
  const { PDFParse } = (await import("pdf-parse")) as unknown as {
    PDFParse?: PdfParseConstructor;
  };

  if (!PDFParse) {
    throw new Error("PDF parsing is unavailable in this environment.");
  }

  let parser: PdfParser | null = null;

  try {
    parser = new PDFParse({
      data: bytes,
    });
    const result = await parser.getText();

    return result.text ?? "";
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown PDF parsing error.";

    throw new Error(
      `PDF text could not be extracted reliably. ${message}`.trim(),
    );
  } finally {
    await parser?.destroy?.();
  }
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
  const cleanedText = normalizeResumeText(text);

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
    skills: uniqueSkills(
      aiResult?.skills.length ? aiResult.skills : fallback.skills,
    ),
    summary: aiResult?.summary?.trim() || fallback.summary,
    text: cleanedText,
  } satisfies ParsedResumeData;
}
