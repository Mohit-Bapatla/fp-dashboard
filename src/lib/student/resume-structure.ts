export const resumeSectionKeys = [
  "summary",
  "education",
  "honors",
  "experience",
  "leadership",
  "activities",
  "volunteering",
  "research",
  "projects",
  "skills",
  "certifications",
  "school",
] as const;

export type ResumeSectionKey = (typeof resumeSectionKeys)[number];

export type StructuredResumeSections = Record<ResumeSectionKey, string[]>;

const headingAliases: Record<ResumeSectionKey, readonly string[]> = {
  activities: [
    "activities",
    "extracurricular activities",
    "community activities",
    "service activities",
  ],
  certifications: [
    "certification",
    "certifications",
    "certificate",
    "certificates",
    "licenses",
    "licenses and certifications",
    "licensure",
    "training",
    "credentials",
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
    "honors/awards",
    "honors and awards",
    "awards and honors",
    "scholarships",
    "recognition",
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
    "campus activities",
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
  summary: ["summary", "profile", "professional summary", "objective", "about"],
  volunteering: [
    "volunteering",
    "volunteer experience",
    "community service",
    "service",
  ],
};

const monthPattern =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

const dateRangePattern = new RegExp(
  `\\b(?:${monthPattern}\\s+)?(?:19|20)\\d{2}\\s*(?:-|\\u2013|\\u2014|to)\\s*(?:present|current|(?:${monthPattern}\\s+)?(?:19|20)\\d{2})\\b`,
  "i",
);

const actionVerbPattern =
  /^(achieved|analyzed|built|collaborated|conducted|coordinated|created|delivered|designed|developed|expanded|facilitated|hosted|implemented|improved|increased|launched|led|managed|mentored|organized|planned|presented|reduced|researched|scaled|supported|taught|trained|volunteered)\b/i;

function emptySections(): StructuredResumeSections {
  return {
    activities: [],
    certifications: [],
    education: [],
    experience: [],
    honors: [],
    leadership: [],
    projects: [],
    research: [],
    school: [],
    skills: [],
    summary: [],
    volunteering: [],
  };
}

function cleanWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseHeadingLine(line: string) {
  const compact = cleanWhitespace(line).replace(/^[-*]\s*/, "");
  const normalized = normalizeHeading(compact);

  for (const key of resumeSectionKeys) {
    for (const alias of headingAliases[key]) {
      if (normalized === normalizeHeading(alias)) {
        return { key, remainder: "" };
      }

      const inline = compact.match(
        new RegExp(
          `^${escapeRegExp(alias)}\\s*[:\\-\\u2013\\u2014]\\s*(.+)$`,
          "i",
        ),
      );

      if (inline?.[1]) {
        return { key, remainder: inline[1].trim() };
      }
    }
  }

  return null;
}

export function normalizeResumeSourceText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2022\u25cf\u25aa\u25e6]/g, "\n- ")
    .replace(/\t+/g, " ")
    .replace(/[ \f\v]+/g, " ")
    .replace(
      /^\s*(?:[-\u2013\u2014]\s*)*(?:page\s+)?\d+\s*(?:of|\/)\s*\d+(?:\s*[-\u2013\u2014])*\s*$/gim,
      "",
    )
    .replace(/\n[ ]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.replace(/\s{2,}/g, " ").trimEnd())
    .join("\n")
    .trim();
}

export function stripResumeContactDetails(value: string) {
  return cleanWhitespace(
    value
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, " ")
      .replace(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g, " ")
      .replace(/\bhttps?:\/\/\S+\b/gi, " ")
      .replace(/\b(?:linkedin|github)\.com\/\S+\b/gi, " ")
      .replace(/\s*[|,;]\s*(?=$|[|,;])/g, " "),
  );
}

function lineContent(line: string) {
  return cleanWhitespace(line.replace(/^[-*]\s*/, ""));
}

function hasBulletMarker(line: string) {
  return /^[-*]\s+/.test(line.trim());
}

function hasTerminalPunctuation(value: string) {
  return /[.!?)]$/.test(value);
}

function isDateRangeLine(value: string) {
  return dateRangePattern.test(value);
}

function looksLikeStandaloneRecord(value: string, key: ResumeSectionKey) {
  if (isDateRangeLine(value)) {
    return true;
  }

  if (key === "education") {
    return /\b(university|college|academy|bachelor|master|associate|degree|diploma|gpa|expected|graduat)\b/i.test(
      value,
    );
  }

  return false;
}

function shouldJoinContinuation(previous: string, current: string) {
  if (!previous) {
    return false;
  }

  if (/^[a-z(]/.test(current)) {
    return true;
  }

  if (/[,;:\-/]$/.test(previous)) {
    return true;
  }

  const words = current.split(/\s+/);

  return (
    words.length === 1 &&
    current.length < 32 &&
    !hasTerminalPunctuation(previous)
  );
}

function sentenceCapitalization(value: string, key: ResumeSectionKey) {
  if (key === "skills" || !/^[a-z]/.test(value)) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function tokenSet(value: string) {
  return new Set(
    value
      .toLowerCase()
      .match(/[a-z0-9+#.]{3,}/g)
      ?.filter((token) => !["and", "the", "with", "for"].includes(token)) ?? [],
  );
}

function nearDuplicate(left: string, right: string) {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return left.toLowerCase() === right.toLowerCase();
  }

  const overlap = [...leftTokens].filter((token) => rightTokens.has(token));
  const union = new Set([...leftTokens, ...rightTokens]);

  return overlap.length / union.size >= 0.85;
}

function uniqueEntries(values: string[], key: ResumeSectionKey) {
  const output: string[] = [];

  for (const value of values) {
    const cleaned = sentenceCapitalization(
      lineContent(value)
        .replace(/^[:;,\s]+|[:;,\s]+$/g, "")
        .trim(),
      key,
    ).slice(0, 500);

    if (
      cleaned.length < 2 ||
      (cleaned.split(/\s+/).length === 1 &&
        cleaned.length < 12 &&
        key !== "skills") ||
      output.some((entry) => nearDuplicate(entry, cleaned))
    ) {
      continue;
    }

    output.push(cleaned);
  }

  return output.slice(0, 24);
}

function normalizeSectionItems(lines: string[], key: ResumeSectionKey) {
  if (key === "summary") {
    const summary = stripResumeContactDetails(lines.map(lineContent).join(" "));
    return summary ? [summary.slice(0, 1_200)] : [];
  }

  if (key === "skills") {
    return uniqueEntries(
      lines.flatMap((line) =>
        lineContent(line)
          .replace(/^[A-Za-z][A-Za-z /&()+.#-]{1,40}:\s*/, "")
          .split(/[,;|]| {2,}/)
          .map((item) => item.trim())
          .filter(Boolean),
      ),
      key,
    );
  }

  const entries: string[] = [];
  let current = "";
  let currentStartedAsBullet = false;

  const flush = () => {
    if (current) {
      entries.push(current);
    }
    current = "";
    currentStartedAsBullet = false;
  };

  for (const sourceLine of lines) {
    const content = lineContent(sourceLine);

    if (!content) {
      continue;
    }

    const bullet = hasBulletMarker(sourceLine);

    if (bullet) {
      flush();
      current = content;
      currentStartedAsBullet = true;
      continue;
    }

    if (!current) {
      current = content;
      continue;
    }

    if (
      shouldJoinContinuation(current, content) ||
      (currentStartedAsBullet && !looksLikeStandaloneRecord(content, key))
    ) {
      current = cleanWhitespace(`${current} ${content}`);
      continue;
    }

    flush();
    current = content;
  }

  flush();

  return uniqueEntries(entries, key);
}

function clearlyHeldCredential(line: string) {
  if (
    /\b(hosted|facilitated|taught|organized|led|coordinated|provided)\b/i.test(
      line,
    )
  ) {
    return false;
  }

  return (
    /\b(?:certified|licensed)\s+(?:in|as)\b/i.test(line) ||
    /\b(?:BLS|CPR|CNA|EMT|first aid)\s+(?:certified|certification)\b/i.test(
      line,
    ) ||
    /\b(?:holds?|earned)\b.{0,60}\b(?:certification|certificate|license)\b/i.test(
      line,
    )
  );
}

function collectRawSections(text: string) {
  const sections = emptySections();
  const unsectioned: string[] = [];
  let current: ResumeSectionKey | null = null;

  for (const line of normalizeResumeSourceText(text).split("\n")) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    const heading = parseHeadingLine(trimmed);

    if (heading) {
      current = heading.key;
      if (heading.remainder) {
        sections[current].push(heading.remainder);
      }
      continue;
    }

    if (
      current === "education" &&
      isDateRangeLine(trimmed) &&
      cleanWhitespace(trimmed.replace(dateRangePattern, "")).length > 2
    ) {
      current = null;
    }

    if (current) {
      sections[current].push(trimmed);
    } else {
      unsectioned.push(trimmed);
    }
  }

  return { sections, unsectioned };
}

function extractRoleFirstExperience(lines: string[]) {
  const entries: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lineContent(lines[index]);

    if (!isDateRangeLine(line)) {
      continue;
    }

    const dateRange = line.match(dateRangePattern)?.at(0) ?? "";
    const title = cleanWhitespace(line.replace(dateRangePattern, ""));

    if (!title || title.length > 100) {
      continue;
    }

    const organization = lineContent(lines[index + 1] ?? "");
    const achievements: string[] = [];

    for (let cursor = index + 2; cursor < lines.length; cursor += 1) {
      const candidate = lineContent(lines[cursor]);

      if (isDateRangeLine(candidate) || parseHeadingLine(candidate)) {
        break;
      }

      if (actionVerbPattern.test(candidate)) {
        achievements.push(candidate);
      } else if (achievements.length > 0 && /^[a-z(]/.test(candidate)) {
        achievements[achievements.length - 1] = cleanWhitespace(
          `${achievements.at(-1)} ${candidate}`,
        );
      }

      if (achievements.length >= 3) {
        break;
      }
    }

    entries.push(
      cleanWhitespace(
        [
          title,
          organization ? `at ${organization}` : null,
          dateRange
            ? `(${dateRange.replace(/\s*(?:-|\u2013|\u2014|to)\s*/i, " - ")})`
            : null,
          achievements.length ? `- ${achievements.join(" ")}` : null,
        ]
          .filter(Boolean)
          .join(" "),
      ),
    );
  }

  return uniqueEntries(entries, "experience");
}

export function extractStructuredResumeSections(
  text: string,
): StructuredResumeSections {
  const { sections: rawSections, unsectioned } = collectRawSections(text);
  const structured = emptySections();

  for (const key of resumeSectionKeys) {
    structured[key] = normalizeSectionItems(rawSections[key], key);
  }

  if (structured.experience.length === 0) {
    structured.experience = extractRoleFirstExperience(unsectioned);
  }

  const explicitCredentialLines = normalizeResumeSourceText(text)
    .split("\n")
    .map(lineContent)
    .filter(clearlyHeldCredential);

  structured.certifications = uniqueEntries(
    [...structured.certifications, ...explicitCredentialLines],
    "certifications",
  );

  return structured;
}

export function isResumeActionBullet(value: string) {
  return actionVerbPattern.test(value);
}
