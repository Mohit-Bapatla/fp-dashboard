import "server-only";

import { createStructuredJsonResponse } from "@/lib/ai/openai";
import {
  createResumeParsingError,
  logResumeParseFailure,
  type ResumeParseLogContext,
} from "@/lib/ai/resume-parsing-errors";
import { prisma } from "@/lib/db/prisma";
import {
  createSupabaseAdminClient,
  resumeBucketName,
} from "@/lib/storage/supabase-admin";
import {
  extractStructuredResumeSections,
  normalizeResumeSourceText,
  resumeSectionKeys,
  stripResumeContactDetails,
  type StructuredResumeSections,
} from "@/lib/student/resume-structure";

export type ParsedResumeData = {
  certifications: string[];
  education: string[];
  experience: string[];
  projects: string[];
  sections: StructuredResumeSections;
  skills: string[];
  summary: string | null;
  text: string;
};

export type ParsedResumeResult = ParsedResumeData & {
  usedEnrichment: boolean;
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
  "Data Analysis",
  "Data Entry",
  "Excel",
  "microsoft excel",
  "google sheets",
  "SQL",
  "pandas",
  "NumPy",
  "scikit-learn",
  "SHAP",
  "FastAPI",
  "Streamlit",
  "Git/GitHub",
  "Machine Learning",
  "Model Evaluation",
  "Python",
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
  activities: [
    "activities",
    "extracurricular activities",
    "community activities",
  ],
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
  education: ["education", "academic background", "academic history"],
  experience: [
    "experience",
    "professional experience",
    "work experience",
    "clinical experience",
    "employment",
  ],
  honors: [
    "honors",
    "awards",
    "honors and awards",
    "awards and honors",
    "scholarships",
  ],
  leadership: [
    "leadership",
    "leadership experience",
    "leadership and service",
    "leadership and activities",
  ],
  projects: ["projects", "selected projects", "technical projects"],
  research: ["research", "research experience", "publications"],
  school: [
    "school",
    "school involvement",
    "campus involvement",
    "school and campus involvement",
    "student organizations",
  ],
  skills: [
    "skills",
    "core competencies",
    "competencies",
    "technical skills",
    "clinical skills",
    "relevant skills",
  ],
  volunteering: [
    "volunteering",
    "volunteer experience",
    "community service",
    "service",
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
  return normalizeResumeSourceText(value);
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

function groundedAiValues(values: string[], sourceText: string) {
  const sourceTokens = new Set(
    sourceText.toLowerCase().match(/[a-z0-9+#.]{3,}/g) ?? [],
  );

  return values.filter((value) => {
    const valueTokens = value.toLowerCase().match(/[a-z0-9+#.]{3,}/g) ?? [];
    const meaningfulTokens = valueTokens.filter(
      (token) => !["and", "for", "the", "with"].includes(token),
    );

    if (meaningfulTokens.length === 0) {
      return false;
    }

    const supported = meaningfulTokens.filter((token) =>
      sourceTokens.has(token),
    ).length;
    const numbers = value.match(/\d+(?:[.,]\d+)?/g) ?? [];

    return (
      supported / meaningfulTokens.length >= 0.8 &&
      numbers.every((number) => sourceText.includes(number))
    );
  });
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
        `^${escapeRegExp(heading)}\\s*[:\\-\\u2013\\u2014]\\s*(.+)$`,
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

function extractEducationSection(lines: string[]) {
  const matches: string[] = [];
  let collecting = false;

  for (const line of lines) {
    const heading = parseHeadingLine(line);

    if (heading) {
      if (collecting && heading.key !== "education") {
        break;
      }

      collecting = heading.key === "education";
      if (collecting && heading.remainder) {
        matches.push(heading.remainder);
      }
      continue;
    }

    if (!collecting) {
      continue;
    }

    if (isDateRangeLine(line)) {
      break;
    }

    matches.push(line);
  }

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
      .replace(/^[A-Za-z][A-Za-z /&()+.#-]{1,40}:\s*/, "")
      .split(/[,;|]| {2,}/)
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

function isDateRangeLine(line: string) {
  return /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)?\s*(?:19|20)\d{2}\s*(?:-|\u2013|\u2014|to)\s*(?:present|current|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)?\s*(?:19|20)\d{2})\b/i.test(
    line,
  );
}

function extractDateRange(line: string) {
  return (
    line
      .match(
        /\b(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+)?(?:19|20)\d{2}\s*(?:-|\u2013|\u2014|to)\s*(?:present|current|(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+)?(?:19|20)\d{2})\b/i,
      )
      ?.at(0)
      ?.replace(/\s*(?:-|\u2013|\u2014|to)\s*/i, " - ") ?? null
  );
}

function isSectionBoundary(line: string) {
  return Boolean(
    parseHeadingLine(line) || summaryHeadings.includes(normalizeHeading(line)),
  );
}

function isAchievementLine(line: string) {
  return /^(built|created|developed|led|managed|designed|implemented|scaled|analyzed|optimized|launched|coordinated|conducted|improved|supported|collaborated)\b/i.test(
    line,
  );
}

function extractRoleFirstExperience(lines: string[]) {
  const entries: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!isDateRangeLine(line) || isSectionBoundary(line)) {
      continue;
    }

    const dateRange = extractDateRange(line);
    const title = cleanText(line.replace(dateRange ?? "", ""));

    if (!title || title.length > 90) {
      continue;
    }

    const organizationLine = lines[index + 1] ?? "";
    const hasOrganization =
      organizationLine &&
      !isDateRangeLine(organizationLine) &&
      !isSectionBoundary(organizationLine) &&
      organizationLine.length <= 120;
    const achievements: string[] = [];

    for (
      let cursor = index + (hasOrganization ? 2 : 1);
      cursor < lines.length;
      cursor += 1
    ) {
      const candidate = lines[cursor];

      if (isDateRangeLine(candidate) || isSectionBoundary(candidate)) {
        break;
      }

      if (isAchievementLine(candidate)) {
        achievements.push(candidate);
      }

      if (achievements.length >= 2) {
        break;
      }
    }

    entries.push(
      cleanText(
        [
          title,
          hasOrganization ? `at ${organizationLine}` : null,
          dateRange ? `(${dateRange})` : null,
          achievements.length ? `- ${achievements.join(" ")}` : null,
        ]
          .filter(Boolean)
          .join(" "),
      ),
    );
  }

  return uniqueStrings(entries);
}

function extractProjectNames(lines: string[]) {
  const projectLines = extractSection(lines, "projects");
  const actionStarter =
    /^(built|created|developed|designed|implemented|trained|used|integrated|analyzed|visualized|deployed|optimized)\b/i;

  return uniqueStrings(
    projectLines.filter((line) => {
      return (
        line.length <= 100 &&
        !line.includes(":") &&
        !isAchievementLine(line) &&
        !actionStarter.test(line)
      );
    }),
  );
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
        (datePattern.test(line) || /[-\u2013\u2014]/.test(line))
      );
    }),
  );
}

function extractCertificationFallback(lines: string[]) {
  const certificationPattern =
    /\b(?:certified|licensed)\s+(?:in|as)\b|\b(?:BLS|CPR|CNA|EMT|first aid)\s+(?:certified|certification)\b|\b(?:holds?|earned)\b.{0,60}\b(?:certification|certificate|license)\b/i;
  const accomplishmentPattern =
    /\b(hosted|facilitated|taught|organized|led|coordinated|provided)\b/i;

  return uniqueStrings(
    lines.filter((line) => {
      return (
        certificationPattern.test(line) &&
        !accomplishmentPattern.test(line) &&
        line.length <= 180
      );
    }),
  );
}

function deterministicParse(text: string): ParsedResumeData {
  const normalizedText = normalizeResumeText(text);
  const cleaned = cleanText(normalizedText);
  const lines = getLines(normalizedText);
  const sections = extractStructuredResumeSections(normalizedText);
  const skillSection = extractSection(lines, "skills");
  const skills = uniqueSkills([
    ...sections.skills,
    ...splitPotentialSkills(skillSection),
    ...skillsFromKnownTerms(cleaned),
  ]);
  const education = sections.education.length
    ? sections.education
    : extractEducationSection(lines);
  const explicitExperience = sections.experience;
  const hasSeparateActivitySection = [
    ...sections.activities,
    ...sections.honors,
    ...sections.leadership,
    ...sections.school,
  ].length;
  const inferredExperience = hasSeparateActivitySection
    ? []
    : extractRoleFirstExperience(lines);
  const projects = sections.projects.length
    ? sections.projects.filter((entry) => !isAchievementLine(entry))
    : extractProjectNames(lines);
  const certifications = sections.certifications;
  const explicitSummary =
    sections.summary.join(" ") || extractSummarySection(lines);
  const summary =
    stripResumeContactDetails(explicitSummary).slice(0, 1_200) || null;

  return {
    certifications: certifications.length
      ? certifications
      : extractCertificationFallback(lines),
    education: education.length ? education : extractEducationFallback(lines),
    experience: uniqueStrings([
      ...(explicitExperience.length ? explicitExperience : inferredExperience),
      ...sections.volunteering,
      ...sections.research,
      ...(explicitExperience.length || inferredExperience.length
        ? []
        : extractExperienceFallback(lines)),
      ...projects.map((project) => `Project: ${project}`),
    ]),
    projects,
    sections,
    skills,
    summary,
    text: normalizedText,
  };
}

export function parseResumeTextDeterministically(text: string) {
  return deterministicParse(text);
}

type ResumeEnricher = (text: string) => Promise<AiResumeParseResult | null>;

type ParseResumeBytesOptions = {
  bytes: Buffer;
  enrichResume?: ResumeEnricher;
  fileName: string;
  mimeType: string | null;
  onDeterministicResult?: (
    result: ParsedResumeData,
    context: ResumeParseLogContext,
  ) => Promise<void>;
  resumeId: string;
};

const genericBinaryMimeTypes = new Set(["", "application/octet-stream"]);
const pdfMimeTypes = new Set(["application/pdf"]);
const docxMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function getFileExtension(fileName: string) {
  const extensionIndex = fileName.lastIndexOf(".");

  return extensionIndex >= 0
    ? fileName.slice(extensionIndex).toLowerCase()
    : "";
}

function isMimeTypeCompatible(extension: string, mimeType: string | null) {
  const normalizedMimeType = mimeType?.toLowerCase().trim() ?? "";

  if (genericBinaryMimeTypes.has(normalizedMimeType)) {
    return true;
  }

  if (extension === ".pdf") {
    return pdfMimeTypes.has(normalizedMimeType);
  }

  if (extension === ".docx") {
    return docxMimeTypes.has(normalizedMimeType);
  }

  return false;
}

function getPdfParseErrorCode(error: unknown) {
  const errorName = error instanceof Error ? error.name.toLowerCase() : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (
    message.includes("fake worker") ||
    message.includes("cannot find module") ||
    message.includes("parser is unavailable") ||
    message.includes("parsing is unavailable") ||
    message.includes("worker")
  ) {
    return "PARSER_UNAVAILABLE" as const;
  }

  if (
    errorName.includes("invalidpdf") ||
    errorName.includes("password") ||
    errorName.includes("format") ||
    message.includes("invalid pdf") ||
    message.includes("password") ||
    message.includes("corrupt")
  ) {
    return "UNREADABLE_DOCUMENT" as const;
  }

  return "TEMPORARY_FAILURE" as const;
}

async function extractPdfText(
  bytes: Buffer,
  context: ResumeParseLogContext,
): Promise<string> {
  type PdfParser = {
    destroy?: () => Promise<void> | void;
    getText: () => Promise<{ text?: string }>;
  };
  type PdfParseConstructor = new (options: { data: Buffer }) => PdfParser;
  let PDFParse: PdfParseConstructor | undefined;

  try {
    ({ PDFParse } = (await import("pdf-parse")) as unknown as {
      PDFParse?: PdfParseConstructor;
    });
  } catch (error) {
    throw createResumeParsingError({
      code: "PARSER_UNAVAILABLE",
      context,
      error,
      stage: "pdf_import",
    });
  }

  if (!PDFParse) {
    throw createResumeParsingError({
      code: "PARSER_UNAVAILABLE",
      context,
      error: new Error("PDFParse export is unavailable in this runtime."),
      stage: "pdf_import",
    });
  }

  let parser: PdfParser | null = null;

  try {
    parser = new PDFParse({
      data: bytes,
    });
  } catch (error) {
    throw createResumeParsingError({
      code: "PARSER_UNAVAILABLE",
      context,
      error,
      stage: "pdf_constructor",
    });
  }

  try {
    const result = await parser.getText();

    return result.text ?? "";
  } catch (error) {
    throw createResumeParsingError({
      code: getPdfParseErrorCode(error),
      context,
      error,
      stage: "pdf_get_text",
    });
  } finally {
    try {
      await parser.destroy?.();
    } catch (error) {
      logResumeParseFailure({
        context,
        error,
        level: "warning",
        stage: "pdf_cleanup",
      });
    }
  }
}

async function extractDocxText(bytes: Buffer, context: ResumeParseLogContext) {
  let mammoth: typeof import("mammoth");

  try {
    mammoth = await import("mammoth");
  } catch (error) {
    throw createResumeParsingError({
      code: "PARSER_UNAVAILABLE",
      context,
      error,
      stage: "docx_import",
    });
  }

  try {
    const result = await mammoth.extractRawText({
      buffer: bytes,
    });

    return result.value;
  } catch (error) {
    throw createResumeParsingError({
      code: "UNREADABLE_DOCUMENT",
      context,
      error,
      stage: "docx_get_text",
    });
  }
}

async function extractResumeText(
  fileName: string,
  bytes: Buffer,
  context: ResumeParseLogContext,
) {
  const extension = getFileExtension(fileName);

  if (
    ![".pdf", ".docx"].includes(extension) ||
    !isMimeTypeCompatible(extension, context.mimeType)
  ) {
    throw createResumeParsingError({
      code: "UNSUPPORTED_FILE_TYPE",
      context,
      error: new Error("Resume extension and MIME type are not supported."),
      stage: "deterministic_extraction",
    });
  }

  if (extension === ".pdf") {
    if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
      throw createResumeParsingError({
        code: "UNSUPPORTED_FILE_TYPE",
        context,
        error: new Error("PDF magic bytes are missing."),
        stage: "deterministic_extraction",
      });
    }

    return extractPdfText(bytes, context);
  }

  if (bytes.subarray(0, 2).toString("ascii") !== "PK") {
    throw createResumeParsingError({
      code: "UNSUPPORTED_FILE_TYPE",
      context,
      error: new Error("DOCX archive magic bytes are missing."),
      stage: "deterministic_extraction",
    });
  }

  return extractDocxText(bytes, context);
}

async function enrichResumeWithOpenAi(text: string) {
  const privateSections = extractStructuredResumeSections(text);
  const privateText = resumeSectionKeys
    .filter((key) => privateSections[key].length > 0)
    .map((key) => `${key}:\n${privateSections[key].join("\n")}`)
    .join("\n\n")
    .slice(0, 12000);

  return createStructuredJsonResponse<AiResumeParseResult>({
    input: [
      "Extract resume information for a healthcare opportunity dashboard.",
      "Do not infer protected or sensitive attributes.",
      "Return concise, factual fields supported verbatim by the resume only.",
      "Do not invent credentials, skills, impact, hours, or experiences.",
      "Contact details have been removed because they are not needed.",
      `Resume text:\n${privateText}`,
    ].join("\n\n"),
    schema: resumeSchema,
    schemaName: "resume_parse",
  });
}

export async function parseResumeBytes({
  bytes,
  enrichResume = enrichResumeWithOpenAi,
  fileName,
  mimeType,
  onDeterministicResult,
  resumeId,
}: ParseResumeBytesOptions) {
  const context: ResumeParseLogContext = {
    byteLength: bytes.length,
    extension: getFileExtension(fileName) || null,
    mimeType,
    resumeId,
  };
  const text = await extractResumeText(fileName, bytes, context);
  const cleanedText = normalizeResumeText(text);

  if (cleanedText.length < 30) {
    throw createResumeParsingError({
      code: "UNREADABLE_DOCUMENT",
      context,
      error: new Error("Extracted resume text is below the minimum length."),
      stage: "deterministic_extraction",
    });
  }

  let fallback: ParsedResumeData;

  try {
    fallback = deterministicParse(cleanedText);
  } catch (error) {
    throw createResumeParsingError({
      code: "TEMPORARY_FAILURE",
      context,
      error,
      stage: "deterministic_extraction",
    });
  }

  await onDeterministicResult?.(fallback, context);

  let aiResult: AiResumeParseResult | null = null;

  try {
    aiResult = await enrichResume(cleanedText);
  } catch (error) {
    logResumeParseFailure({
      context,
      error,
      level: "warning",
      stage: "openai_enrichment",
    });
  }

  if (!aiResult) {
    return {
      ...fallback,
      usedEnrichment: false,
    } satisfies ParsedResumeResult;
  }

  try {
    const groundedCertifications = groundedAiValues(
      aiResult.certifications,
      cleanedText,
    );
    const groundedEducation = groundedAiValues(aiResult.education, cleanedText);
    const groundedExperience = groundedAiValues(
      aiResult.experience,
      cleanedText,
    );
    const groundedSkills = groundedAiValues(aiResult.skills, cleanedText);

    return {
      certifications: uniqueStrings(
        groundedCertifications.length
          ? groundedCertifications
          : fallback.certifications,
      ),
      education: uniqueStrings(
        groundedEducation.length ? groundedEducation : fallback.education,
      ),
      experience: uniqueStrings(
        groundedExperience.length
          ? [
              ...groundedExperience,
              ...fallback.projects.map((project) => `Project: ${project}`),
            ]
          : fallback.experience,
      ),
      projects: fallback.projects,
      sections: fallback.sections,
      skills: uniqueSkills(
        groundedSkills.length ? groundedSkills : fallback.skills,
      ),
      summary: fallback.summary,
      text: cleanedText,
      usedEnrichment: true,
    } satisfies ParsedResumeResult;
  } catch (error) {
    logResumeParseFailure({
      context,
      error,
      level: "warning",
      stage: "openai_enrichment",
    });

    return {
      ...fallback,
      usedEnrichment: false,
    } satisfies ParsedResumeResult;
  }
}

export async function parseResume(
  resumeId: string,
  studentProfileId: string,
  onDeterministicResult?: ParseResumeBytesOptions["onDeterministicResult"],
) {
  let resume: {
    fileName: string;
    fileUrl: string | null;
    id: string;
  } | null;
  const initialContext: ResumeParseLogContext = {
    byteLength: null,
    extension: null,
    mimeType: null,
    resumeId,
  };

  try {
    resume = await prisma.resume.findFirst({
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
  } catch (error) {
    throw createResumeParsingError({
      code: "TEMPORARY_FAILURE",
      context: initialContext,
      error,
      stage: "ownership_lookup",
    });
  }

  if (!resume?.fileUrl) {
    throw createResumeParsingError({
      code: "OWNERSHIP_DENIED",
      context: initialContext,
      error: new Error("Owned resume record or storage path was not found."),
      stage: "ownership_lookup",
    });
  }

  const context: ResumeParseLogContext = {
    ...initialContext,
    extension: getFileExtension(resume.fileName) || null,
  };
  let data: Blob | null = null;

  try {
    const supabase = createSupabaseAdminClient();
    const result = await supabase.storage
      .from(resumeBucketName)
      .download(resume.fileUrl);

    if (result.error || !result.data) {
      throw new Error(
        result.error?.message || "Storage returned no file data.",
      );
    }

    data = result.data;
    context.mimeType = data.type || null;
  } catch (error) {
    throw createResumeParsingError({
      code: "DOWNLOAD_FAILED",
      context,
      error,
      stage: "supabase_download",
    });
  }

  let bytes: Buffer;

  try {
    bytes = Buffer.from(await data.arrayBuffer());
    context.byteLength = bytes.length;
  } catch (error) {
    throw createResumeParsingError({
      code: "TEMPORARY_FAILURE",
      context,
      error,
      stage: "blob_to_buffer",
    });
  }

  return parseResumeBytes({
    bytes,
    fileName: resume.fileName,
    mimeType: context.mimeType,
    onDeterministicResult,
    resumeId,
  });
}
