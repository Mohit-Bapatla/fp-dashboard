import {
  isResumeActionBullet,
  stripResumeContactDetails,
  type StructuredResumeSections,
} from "@/lib/student/resume-structure";

export const RESUME_REVIEW_VERSION = "1.0";

export const resumeReviewCategoryNames = [
  "STRUCTURE",
  "CLARITY",
  "SPECIFICITY",
  "EVIDENCE",
  "RELEVANCE",
  "CONSISTENCY",
] as const;

export type ResumeReviewCategoryName =
  (typeof resumeReviewCategoryNames)[number];

export type ResumeReviewCategoryStatus =
  "STRONG" | "NEEDS_ATTENTION" | "MISSING";

export type ResumeReviewCategory = {
  action: string;
  explanation: string;
  name: ResumeReviewCategoryName;
  status: ResumeReviewCategoryStatus;
};

export type ResumeReviewImprovement = {
  action: string;
  detected: string;
  whyItMatters: string;
};

export type ResumeSectionReview = {
  entryCount: number;
  key:
    | "education"
    | "honors"
    | "experience"
    | "leadership"
    | "projects"
    | "skills"
    | "certifications";
  label: string;
  summary: string;
};

export type ResumeReview = {
  categories: ResumeReviewCategory[];
  generatedAt: string;
  improvements: ResumeReviewImprovement[];
  missingSections: string[];
  sectionFeedback: ResumeSectionReview[];
  sourceResumeUpdatedAt: string;
  strengths: string[];
  summary: string | null;
  version: string;
};

export type ResumeReviewInput = {
  analyzedAt: Date | string;
  parsedSummary: string | null;
  sections: StructuredResumeSections;
  sourceResumeUpdatedAt: Date | string;
};

export type ResumeAlignmentOpportunity = {
  eligibilityRequirements: string | null;
  id: string;
  isActiveApplication: boolean;
  organizationName: string;
  requiredCertifications: string[];
  requiredExperience: string | null;
  shortDescription: string | null;
  specialty: string | null;
  title: string;
};

export type ResumeOpportunityAlignment = {
  experiencesWorthMovingHigher: string[];
  id: string;
  missingOrUnclearEvidence: string[];
  organizationName: string;
  relevantResumeEvidence: string[];
  requirementsReflected: string[];
  skillsWorthEmphasizing: string[];
  tailoringActions: string[];
  title: string;
};

const vagueLanguagePattern =
  /\b(helped|assisted with|participated in|responsible for|worked on|various|multiple tasks|duties included)\b/i;
const datePattern =
  /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spring|summer|fall|winter)?\s*(?:19|20)\d{2}\b/i;
const evidencePattern =
  /\b\d+(?:[.,]\d+)?\s*(?:%|hours?|students?|patients?|members?|events?|projects?|weeks?|months?|years?)?\b/i;
const contactPattern =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/i;

const stopWords = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "for",
  "from",
  "have",
  "into",
  "opportunity",
  "our",
  "that",
  "the",
  "their",
  "this",
  "through",
  "with",
  "you",
  "your",
]);

function asIso(value: Date | string) {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function allExperienceEntries(sections: StructuredResumeSections) {
  return [
    ...sections.experience,
    ...sections.volunteering,
    ...sections.research,
    ...sections.leadership,
    ...sections.activities,
    ...sections.school,
    ...sections.projects,
  ];
}

function likelyBullets(sections: StructuredResumeSections) {
  return allExperienceEntries(sections).filter(
    (entry) =>
      isResumeActionBullet(entry) ||
      vagueLanguagePattern.test(entry) ||
      entry.split(/\s+/).length >= 10,
  );
}

function repeatedOpeningVerb(entries: string[]) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const verb = entry
      .match(/^[A-Za-z]+/)
      ?.at(0)
      ?.toLowerCase();
    if (verb) counts.set(verb, (counts.get(verb) ?? 0) + 1);
  }

  return [...counts.entries()].find(([, count]) => count >= 3)?.at(0) ?? null;
}

function hasInconsistentPunctuation(entries: string[]) {
  if (entries.length < 3) return false;
  const withPeriod = entries.filter((entry) => /[.!?]$/.test(entry)).length;
  return withPeriod > 0 && withPeriod < entries.length;
}

function hasInconsistentNumberFormatting(entries: string[]) {
  const joined = entries.join(" ");
  const mixesPercentStyles =
    /\b\d+(?:[.,]\d+)?%\b/.test(joined) &&
    /\b\d+(?:[.,]\d+)?\s+percent\b/i.test(joined);
  const mixesLargeNumberStyles =
    /\b\d{1,3},\d{3}\b/.test(joined) && /\b\d{4,}\b/.test(joined);

  return mixesPercentStyles || mixesLargeNumberStyles;
}

function dateStyles(entries: string[]) {
  const values = entries.filter((entry) => datePattern.test(entry));
  return new Set(
    values.map((entry) => {
      if (
        /\b(?:jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\b/i.test(
          entry,
        )
      ) {
        return "abbreviated";
      }
      if (
        /\b(?:january|february|march|april|june|july|august|september|october|november|december)\b/i.test(
          entry,
        )
      ) {
        return "full";
      }
      if (/\b(?:spring|summer|fall|winter)\b/i.test(entry)) return "season";
      return "year";
    }),
  );
}

function duplicateEntry(entries: string[]) {
  const seen = new Set<string>();

  for (const entry of entries) {
    const key = entry
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    if (seen.has(key)) return entry;
    seen.add(key);
  }

  return null;
}

function sectionSummary(label: string, entries: string[]) {
  const count = entries.length;
  const evidenceEntries = entries.filter((entry) =>
    evidencePattern.test(entry),
  );
  const actionEntries = entries.filter(isResumeActionBullet);
  const observations: string[] = [
    `${count} ${count === 1 ? "entry" : "entries"} detected`,
  ];

  if (actionEntries.length > 0)
    observations.push("action-oriented detail is present");
  if (evidenceEntries.length > 0)
    observations.push("measurable evidence is present");

  return `${label} includes ${observations.join(", ")}.`;
}

function buildSectionFeedback(
  sections: StructuredResumeSections,
): ResumeSectionReview[] {
  const groups: Array<{
    entries: string[];
    key: ResumeSectionReview["key"];
    label: string;
  }> = [
    { entries: sections.education, key: "education", label: "Education" },
    { entries: sections.honors, key: "honors", label: "Honors and Awards" },
    {
      entries: [
        ...sections.experience,
        ...sections.volunteering,
        ...sections.research,
      ],
      key: "experience",
      label: "Experience",
    },
    {
      entries: [
        ...sections.leadership,
        ...sections.activities,
        ...sections.school,
      ],
      key: "leadership",
      label: "Leadership and Activities",
    },
    { entries: sections.projects, key: "projects", label: "Projects" },
    { entries: sections.skills, key: "skills", label: "Skills" },
    {
      entries: sections.certifications,
      key: "certifications",
      label: "Certifications",
    },
  ];

  return groups
    .filter(({ entries }) => entries.length > 0)
    .map(({ entries, key, label }) => ({
      entryCount: entries.length,
      key,
      label,
      summary: sectionSummary(label, entries),
    }));
}

function category(
  name: ResumeReviewCategoryName,
  status: ResumeReviewCategoryStatus,
  explanation: string,
  action: string,
): ResumeReviewCategory {
  return { action, explanation, name, status };
}

export function buildResumeReview(input: ResumeReviewInput): ResumeReview {
  const { sections } = input;
  const experienceEntries = allExperienceEntries(sections);
  const bullets = likelyBullets(sections);
  const visibleSummary =
    stripResumeContactDetails(input.parsedSummary ?? "") || null;
  const missingSections = [
    sections.education.length === 0 ? "Education" : null,
    experienceEntries.length === 0 ? "Experience or activities" : null,
    sections.skills.length === 0 ? "Skills" : null,
  ].filter((value): value is string => Boolean(value));
  const longBullets = bullets.filter((entry) => entry.length > 240);
  const vagueBullets = bullets.filter((entry) =>
    vagueLanguagePattern.test(entry),
  );
  const actionBullets = bullets.filter(isResumeActionBullet);
  const evidenceBullets = bullets.filter((entry) =>
    evidencePattern.test(entry),
  );
  const repeatedVerb = repeatedOpeningVerb(bullets);
  const punctuationIssue = hasInconsistentPunctuation(bullets);
  const inconsistentDates = dateStyles(experienceEntries).size > 1;
  const inconsistentNumbers = hasInconsistentNumberFormatting(bullets);
  const repeatedEntry = duplicateEntry(experienceEntries);
  const longSection = Object.entries(sections).find(
    ([key, entries]) => key !== "skills" && entries.length > 10,
  );
  const strengths: string[] = [];

  if (buildSectionFeedback(sections).length >= 4) {
    strengths.push(
      "The resume uses several recognizable sections, making key information easier to find.",
    );
  }
  if (actionBullets.length > 0) {
    strengths.push(
      "At least one accomplishment begins with a clear action, which helps show your contribution.",
    );
  }
  if (evidenceBullets.length > 0) {
    strengths.push(
      "The resume includes concrete scope or results in at least one experience.",
    );
  }
  if (sections.skills.length > 0 && sections.skills.length <= 16) {
    strengths.push(
      "Skills are grouped in a focused section that can support opportunity matching.",
    );
  }
  if (sections.education.length > 0) {
    strengths.push(
      "Education details are present and separated from honors and activities.",
    );
  }
  if (strengths.length < 3 && experienceEntries.length > 0) {
    strengths.push(
      "Experience, project, leadership, or activity content is available for a reviewer to evaluate.",
    );
  }
  if (strengths.length < 3 && visibleSummary) {
    strengths.push(
      "A dedicated summary gives readers context before they review the detailed sections.",
    );
  }
  if (strengths.length === 0) {
    strengths.push(
      "The uploaded file contains enough selectable text to support a structured review.",
    );
  }
  if (strengths.length < 3) {
    strengths.push(
      "The uploaded text is readable enough to support section-by-section feedback.",
    );
  }
  if (strengths.length < 3) {
    strengths.push(
      "The review can identify concrete next steps without changing the original resume.",
    );
  }

  const improvements: ResumeReviewImprovement[] = [];
  const addImprovement = (
    detected: string,
    whyItMatters: string,
    action: string,
  ) => {
    if (improvements.length < 5)
      improvements.push({ action, detected, whyItMatters });
  };

  if (missingSections.length > 0) {
    addImprovement(
      `Core information is missing or unclear: ${missingSections.join(", ")}.`,
      "Clear section labels help reviewers and matching tools find relevant evidence quickly.",
      `Add or clearly label ${missingSections.join(" and ").toLowerCase()} if that information applies to you.`,
    );
  }
  if (longBullets.length > 0) {
    addImprovement(
      `${longBullets.length} accomplishment ${longBullets.length === 1 ? "is" : "are"} difficult to scan because of length.`,
      "Shorter bullets make the action and result easier to understand.",
      "Split long accomplishments at a natural idea boundary, keeping each bullet focused on one contribution.",
    );
  }
  if (vagueBullets.length > 0) {
    addImprovement(
      `${vagueBullets.length} ${vagueBullets.length === 1 ? "bullet uses" : "bullets use"} broad wording such as helped or participated.`,
      "Specific ownership helps a reader understand what you actually did.",
      "Replace broad wording with the action you took and the result or audience, using only facts you can verify.",
    );
  }
  if (
    bullets.length >= 3 &&
    actionBullets.length < Math.ceil(bullets.length / 2)
  ) {
    addImprovement(
      "Several accomplishment bullets do not begin with a clear action.",
      "Action-led bullets make your contribution easier to identify.",
      "Start the clearest accomplishment bullets with precise verbs such as coordinated, analyzed, developed, or led when accurate.",
    );
  }
  if (bullets.length >= 3 && evidenceBullets.length === 0) {
    addImprovement(
      "The experience sections provide little concrete scope or outcome evidence.",
      "Selective evidence can clarify scale without forcing a number into every bullet.",
      "Add a verified result, audience, frequency, or scope to the one or two accomplishments where it is most meaningful.",
    );
  }
  if (repeatedVerb) {
    addImprovement(
      `The opening word “${repeatedVerb}” is repeated across several bullets.`,
      "Varied, accurate verbs make different contributions easier to distinguish.",
      "Replace repeated openings only where another truthful verb better describes the action.",
    );
  }
  if (punctuationIssue || inconsistentDates || inconsistentNumbers) {
    addImprovement(
      "Punctuation, date, or number formatting is inconsistent across entries.",
      "Consistent formatting makes the resume feel deliberate and easier to scan.",
      "Choose one punctuation, date, and number style, then apply it consistently throughout the document.",
    );
  }
  if (repeatedEntry) {
    addImprovement(
      "A duplicate accomplishment appears more than once.",
      "Repeated content uses space without adding new evidence.",
      "Keep the strongest version once and use the remaining space for a distinct contribution.",
    );
  }
  if (longSection) {
    addImprovement(
      `The ${longSection[0]} section contains more than 10 entries.`,
      "Very long sections can make the strongest evidence difficult to find.",
      "Keep the most relevant supported entries prominent and group or remove only genuinely repetitive content.",
    );
  }
  if (experienceEntries.length === 1) {
    addImprovement(
      "Only one experience, project, leadership, or activity entry was detected.",
      "Additional truthful examples can help show a broader range of contributions.",
      "Consider whether school, community, project, research, or volunteer work is missing from the resume; do not invent experience.",
    );
  }
  if (contactPattern.test(input.parsedSummary ?? "")) {
    addImprovement(
      "Contact information appeared in the extracted summary.",
      "Contact details belong in the resume header, not in the review narrative.",
      "No change to the original file is required; FP hides contact details from the visible review summary.",
    );
  }
  if (sections.skills.length > 16) {
    addImprovement(
      "The skills section is broad and may be difficult to prioritize.",
      "A focused skills section makes the most relevant abilities easier to see.",
      "Group related skills and keep the most relevant, supportable skills prominent.",
    );
  }
  if (improvements.length < 3) {
    addImprovement(
      "Opportunity-specific emphasis is not yet reflected in this general review.",
      "Different opportunities may value different parts of the same truthful experience.",
      "Choose an opportunity below and tailor emphasis without adding facts that are not in your resume.",
    );
  }
  if (improvements.length < 3) {
    addImprovement(
      "The automated review cannot evaluate the original page layout completely.",
      "Spacing, alignment, and visual hierarchy affect readability but may not survive text extraction.",
      "Inspect the original PDF or DOCX at desktop and mobile widths before using any suggested change.",
    );
  }
  if (improvements.length < 3) {
    addImprovement(
      "A final consistency pass is still recommended.",
      "Automated review can miss layout, context, and wording nuances.",
      "Review every suggestion against the original file before making changes.",
    );
  }

  const hasCoreStructure = missingSections.length === 0;
  const hasBullets = bullets.length > 0;
  const categories: ResumeReviewCategory[] = [
    category(
      "STRUCTURE",
      hasCoreStructure
        ? "STRONG"
        : buildSectionFeedback(sections).length
          ? "NEEDS_ATTENTION"
          : "MISSING",
      hasCoreStructure
        ? "Education, experience or activities, and skills are identifiable."
        : "One or more core sections are missing or unclear.",
      hasCoreStructure
        ? "Keep section labels consistent."
        : "Add clear labels for the missing core information.",
    ),
    category(
      "CLARITY",
      !hasBullets
        ? "MISSING"
        : longBullets.length === 0 && vagueBullets.length === 0
          ? "STRONG"
          : "NEEDS_ATTENTION",
      !hasBullets
        ? "There are not enough accomplishment bullets to assess clarity."
        : longBullets.length === 0 && vagueBullets.length === 0
          ? "Detected accomplishments are concise and reasonably direct."
          : "Some accomplishments are long or broadly worded.",
      "Keep each accomplishment focused on one clear action and result.",
    ),
    category(
      "SPECIFICITY",
      !hasBullets
        ? "MISSING"
        : actionBullets.length >= Math.ceil(bullets.length / 2)
          ? "STRONG"
          : "NEEDS_ATTENTION",
      !hasBullets
        ? "There are not enough accomplishments to assess specificity."
        : actionBullets.length >= Math.ceil(bullets.length / 2)
          ? "Many accomplishments communicate a distinct action."
          : "Several accomplishments do not clearly identify your contribution.",
      "Use accurate action verbs and add context where it helps distinguish your role.",
    ),
    category(
      "EVIDENCE",
      !hasBullets
        ? "MISSING"
        : evidenceBullets.length > 0
          ? "STRONG"
          : "NEEDS_ATTENTION",
      !hasBullets
        ? "There are not enough accomplishments to assess evidence."
        : evidenceBullets.length > 0
          ? "At least one accomplishment includes concrete scope or results."
          : "Concrete scope or results are not yet visible in the accomplishment bullets.",
      "Add verified evidence selectively where it improves understanding; not every bullet needs a number.",
    ),
    category(
      "RELEVANCE",
      experienceEntries.length === 0
        ? "MISSING"
        : sections.skills.length > 0
          ? "STRONG"
          : "NEEDS_ATTENTION",
      experienceEntries.length === 0
        ? "No experience, project, leadership, or activity evidence was detected."
        : sections.skills.length > 0
          ? "Experience evidence and skills are both available for opportunity alignment."
          : "Experience is present, but a clear skills section would make alignment easier.",
      "Use the opportunity alignment view to emphasize only truthful, relevant evidence.",
    ),
    category(
      "CONSISTENCY",
      punctuationIssue || inconsistentDates || inconsistentNumbers
        ? "NEEDS_ATTENTION"
        : "STRONG",
      punctuationIssue || inconsistentDates || inconsistentNumbers
        ? "Punctuation, date, or number styles vary across entries."
        : "No major punctuation, date, or number-style inconsistency was detected.",
      "Apply one punctuation, date, and number style across comparable entries.",
    ),
  ];

  return {
    categories,
    generatedAt: asIso(input.analyzedAt),
    improvements: improvements.slice(0, 5),
    missingSections,
    sectionFeedback: buildSectionFeedback(sections),
    sourceResumeUpdatedAt: asIso(input.sourceResumeUpdatedAt),
    strengths: strengths.slice(0, 5),
    summary: visibleSummary,
    version: RESUME_REVIEW_VERSION,
  };
}

function tokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .match(/[a-z0-9+#.]{3,}/g)
      ?.filter((token) => !stopWords.has(token)) ?? [],
  );
}

function overlapCount(left: string, right: string) {
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  return [...leftTokens].filter((token) => rightTokens.has(token)).length;
}

function concise(value: string, maxLength = 180) {
  if (value.length <= maxLength) return value;
  const sentences = value.match(/[^.!?]+[.!?]+/g) ?? [];
  const first = sentences.find(
    (sentence) => sentence.trim().length <= maxLength,
  );
  return first?.trim() ?? `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildResumeOpportunityAlignment(
  sections: StructuredResumeSections,
  opportunity: ResumeAlignmentOpportunity,
): ResumeOpportunityAlignment {
  const experienceEntries = allExperienceEntries(sections);
  const opportunityFacts = [
    opportunity.shortDescription,
    opportunity.specialty,
    opportunity.eligibilityRequirements,
    opportunity.requiredExperience,
    ...opportunity.requiredCertifications,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");
  const relevantResumeEvidence = experienceEntries
    .filter((entry) => overlapCount(entry, opportunityFacts) >= 1)
    .slice(0, 4)
    .map((entry) => concise(entry));
  const requirements = [
    opportunity.requiredExperience,
    ...opportunity.requiredCertifications,
    opportunity.eligibilityRequirements,
  ].filter((value): value is string => Boolean(value));
  const resumeEvidence = [
    ...experienceEntries,
    ...sections.skills,
    ...sections.education,
    ...sections.certifications,
  ].join(" ");
  const requirementsReflected = requirements
    .filter((requirement) => overlapCount(requirement, resumeEvidence) >= 1)
    .slice(0, 4)
    .map((requirement) => concise(requirement));
  const missingOrUnclearEvidence = requirements
    .filter((requirement) => overlapCount(requirement, resumeEvidence) === 0)
    .slice(0, 4)
    .map(
      (requirement) =>
        `Resume evidence is unclear for: ${concise(requirement, 140)}`,
    );
  const skillsWorthEmphasizing = sections.skills
    .filter((skill) => overlapCount(skill, opportunityFacts) >= 1)
    .slice(0, 6);
  const experiencesWorthMovingHigher = relevantResumeEvidence.slice(0, 3);
  const tailoringActions: string[] = [];

  if (experiencesWorthMovingHigher.length > 0) {
    tailoringActions.push(
      "Move the most relevant supported experience higher so reviewers see it sooner.",
    );
  }
  if (skillsWorthEmphasizing.length > 0) {
    tailoringActions.push(
      "Emphasize the matching skills only where your resume already provides truthful support.",
    );
  }
  if (missingOrUnclearEvidence.length > 0) {
    tailoringActions.push(
      "Clarify applicable requirements with verified details; do not add credentials or experience you do not have.",
    );
  }
  tailoringActions.push(
    "Use the opportunity’s language only when it accurately describes your existing experience.",
  );

  return {
    experiencesWorthMovingHigher,
    id: opportunity.id,
    missingOrUnclearEvidence,
    organizationName: opportunity.organizationName,
    relevantResumeEvidence,
    requirementsReflected,
    skillsWorthEmphasizing,
    tailoringActions: tailoringActions.slice(0, 4),
    title: opportunity.title,
  };
}

export function getSentencePreview(value: string, maxLength = 280) {
  if (value.length <= maxLength) return { text: value, truncated: false };

  const sentences = value.match(/[^.!?]+[.!?]+(?:\s+|$)/g) ?? [];
  let preview = "";

  for (const sentence of sentences) {
    if (preview && preview.length + sentence.length > maxLength) break;
    if (!preview && sentence.length > maxLength) break;
    preview += sentence;
  }

  if (!preview.trim()) return { text: value, truncated: false };
  return {
    text: preview.trim(),
    truncated: preview.trim().length < value.length,
  };
}
