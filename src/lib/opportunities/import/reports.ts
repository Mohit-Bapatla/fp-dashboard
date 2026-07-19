import { escapeSpreadsheetCell, isReservedExampleUrl } from "./validation";
import type {
  OpportunityImportPlan,
  OpportunityImportPlanRow,
  RealOpportunityRecord,
} from "./types";

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item) || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(
    Array.from(counts.entries()).sort(
      ([firstKey, firstCount], [secondKey, secondCount]) =>
        secondCount - firstCount || firstKey.localeCompare(secondKey),
    ),
  );
}

function sourceDomain(record: RealOpportunityRecord) {
  try {
    return new URL(record.officialSourceUrl).hostname.toLowerCase();
  } catch {
    return "Invalid URL";
  }
}

function verificationAgeBucket(record: RealOpportunityRecord, now: Date) {
  const date = new Date(record.lastVerifiedAt);
  if (Number.isNaN(date.getTime())) return "Invalid";
  const days = Math.floor(
    (now.getTime() - date.getTime()) / (24 * 60 * 60 * 1_000),
  );
  if (days <= 30) return "0-30 days";
  if (days <= 60) return "31-60 days";
  if (days <= 120) return "61-120 days";
  return "Over 120 days";
}

function recordsForReport(plan: OpportunityImportPlan) {
  return plan.rows
    .filter((row) => !["REJECT", "DUPLICATE", "ARCHIVE"].includes(row.action))
    .map((row) => row.normalized)
    .filter((record): record is RealOpportunityRecord => Boolean(record));
}

export function buildOpportunityImportReport(
  plan: OpportunityImportPlan,
  now = new Date(),
) {
  const records = recordsForReport(plan);
  return {
    applicationStatusCounts: countBy(records, (item) =>
      item.isRolling ? "Rolling" : item.availabilityStatus,
    ),
    categoryCounts: countBy(records, (item) => item.type),
    compensationCounts: countBy(records, (item) => item.compensationType),
    educationLevelCounts: countBy(
      records.flatMap((item) =>
        item.acceptedGradeLevels.length
          ? item.acceptedGradeLevels.map((grade) => ({ grade }))
          : [{ grade: "Unknown" }],
      ),
      (item) => item.grade,
    ),
    generatedAt: plan.generatedAt,
    geographicCounts: countBy(records, (item) =>
      item.remoteType === "REMOTE"
        ? "Remote"
        : item.state || item.city || item.geographicScope || "Unknown",
    ),
    planCounts: plan.counts,
    sourceDomainCounts: countBy(records, sourceDomain),
    totalRows: plan.totalRows,
    verificationAgeCounts: countBy(records, (item) =>
      verificationAgeBucket(item, now),
    ),
  };
}

function markdownCounts(title: string, counts: Record<string, number>) {
  const rows = Object.entries(counts)
    .map(([key, count]) => `| ${key} | ${count} |`)
    .join("\n");
  return `## ${title}\n\n| Value | Count |\n| --- | ---: |\n${rows || "| None | 0 |"}`;
}

function legacyRowSummary(row: OpportunityImportPlanRow) {
  return `- Row ${row.rowNumber}: ${row.normalized?.title ?? "Unparsed record"} (${row.sourceKey ?? "no source key"})${
    row.duplicateOpportunityId
      ? ` — possible existing ${row.duplicateOpportunityId}`
      : ""
  }${row.validationErrors.length ? ` — ${row.validationErrors.join(" ")}` : ""}${
    row.warnings.length ? ` — ${row.warnings.join(" ")}` : ""
  }`;
}

function rowSummary(row: OpportunityImportPlanRow) {
  const details = [
    row.duplicateOpportunityId
      ? `possible existing ${row.duplicateOpportunityId}`
      : null,
    row.validationErrors.length ? row.validationErrors.join(" ") : null,
    row.warnings.length ? row.warnings.join(" ") : null,
  ].filter((detail): detail is string => Boolean(detail));

  if (details.length === 0) return legacyRowSummary(row);

  return `- Row ${row.rowNumber}: ${row.normalized?.title ?? "Unparsed record"} (${row.sourceKey ?? "no source key"})${
    details.length ? ` -- ${details.join(" -- ")}` : ""
  }`;
}

export function renderOpportunityImportMarkdown(plan: OpportunityImportPlan) {
  const report = buildOpportunityImportReport(plan);
  const rejected = plan.rows.filter((row) => row.action === "REJECT");
  const duplicates = plan.rows.filter((row) => row.action === "DUPLICATE");
  const needsReview = plan.rows.filter((row) => row.action === "NEEDS_REVIEW");
  const invalidExampleSources = plan.rows.filter(
    (row) =>
      row.normalized && isReservedExampleUrl(row.normalized.officialSourceUrl),
  );

  return [
    "# Opportunity import dry-run report",
    "",
    `Generated: ${plan.generatedAt}`,
    `Dataset SHA-256: \`${plan.datasetHash}\``,
    `Rows: ${plan.totalRows}`,
    "",
    markdownCounts("Planned actions", report.planCounts),
    markdownCounts("Categories", report.categoryCounts),
    markdownCounts("Geography", report.geographicCounts),
    markdownCounts("Education levels", report.educationLevelCounts),
    markdownCounts("Application status", report.applicationStatusCounts),
    markdownCounts("Verification age", report.verificationAgeCounts),
    markdownCounts("Source domains", report.sourceDomainCounts),
    "## Rejected records",
    "",
    rejected.length ? rejected.map(rowSummary).join("\n") : "None.",
    "",
    "## Duplicates",
    "",
    duplicates.length ? duplicates.map(rowSummary).join("\n") : "None.",
    "",
    "## Needs review",
    "",
    needsReview.length ? needsReview.map(rowSummary).join("\n") : "None.",
    "",
    "## Reserved example-domain check",
    "",
    invalidExampleSources.length
      ? invalidExampleSources.map(rowSummary).join("\n")
      : "No reserved example-domain sources.",
    "",
  ].join("\n");
}

function csvCell(value: unknown) {
  const safe = escapeSpreadsheetCell(
    value == null ? "" : Array.isArray(value) ? value.join("|") : String(value),
  );
  return `"${safe.replaceAll('"', '""')}"`;
}

export function renderPublicationReadyCsv(plan: OpportunityImportPlan) {
  const headers = [
    "sourceKey",
    "slug",
    "title",
    "organizationName",
    "type",
    "location",
    "state",
    "remoteType",
    "acceptedGradeLevels",
    "availabilityStatus",
    "deadline",
    "officialSourceUrl",
    "officialApplicationUrl",
    "lastVerifiedAt",
    "qualityScore",
    "completenessScore",
  ];
  const rows = plan.rows
    .filter((row) =>
      ["CREATE", "UPDATE", "UNCHANGED", "RESTORE"].includes(row.action),
    )
    .filter((row) => row.normalized)
    .map((row) => {
      const record = row.normalized!;
      const values: Record<string, unknown> = {
        ...record,
        completenessScore: row.completenessScore,
        qualityScore: row.qualityScore,
      };
      return headers.map((header) => csvCell(values[header])).join(",");
    });
  return [headers.map(csvCell).join(","), ...rows].join("\r\n");
}

export function renderProductionWritePlan({
  currentOpportunityCount,
  database,
  demoCount,
  dryRunHash,
  environment,
  plan,
  projectRef,
  schema,
}: {
  currentOpportunityCount: number;
  database: string;
  demoCount: number;
  dryRunHash: string;
  environment: string;
  plan: OpportunityImportPlan;
  projectRef: string;
  schema: string;
}) {
  return `# Production opportunity write plan

- Project ref: \`${projectRef}\`
- Environment: ${environment}
- Database/schema: \`${database}.${schema}\`
- Current Opportunity rows: ${currentOpportunityCount}
- Demo rows detected: ${demoCount}
- Create: ${plan.counts.create}
- Update: ${plan.counts.update}
- Unchanged: ${plan.counts.unchanged}
- Archive: ${plan.counts.archive}
- Restore: ${plan.counts.restore}
- Duplicate: ${plan.counts.duplicate}
- Rejected: ${plan.counts.reject}
- Needs review: ${plan.counts.needs_review}
- Dataset SHA-256: \`${plan.datasetHash}\`
- Dry-run approval digest: \`${dryRunHash}\`
- Transaction strategy: validate and research outside the transaction; lock matched rows in stable ID order; merge at most 500 planned rows in one atomic Serializable transaction with a 60-second timeout.
- Rollback strategy: reverse the committed import using OpportunityChangeEvent before/after snapshots; demo records are archived, never deleted.

No command in this plan is authorized until the owner explicitly approves the exact counts and approval phrase.
`;
}
