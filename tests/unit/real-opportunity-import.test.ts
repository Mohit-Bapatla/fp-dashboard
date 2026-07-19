import { describe, expect, it } from "vitest";

import {
  canonicalDuplicateUrl,
  normalizeOpportunityRecord,
  slugify,
} from "@/lib/opportunities/import/normalization";
import {
  hashExistingOpportunityState,
  isExplicitFixtureOpportunity,
  planOpportunityImport,
  withFixtureArchivePlan,
} from "@/lib/opportunities/import/planner";
import {
  productionApprovalPhrase,
  validateProductionWriteGuard,
} from "@/lib/opportunities/import/production-guard";
import { renderPublicationReadyCsv } from "@/lib/opportunities/import/reports";
import type {
  ExistingOpportunityForImport,
  RealOpportunityDataset,
  RealOpportunityRecord,
} from "@/lib/opportunities/import/types";
import {
  escapeSpreadsheetCell,
  validateOpportunityRecord,
} from "@/lib/opportunities/import/validation";

function record(
  overrides: Partial<RealOpportunityRecord> = {},
): RealOpportunityRecord {
  return normalizeOpportunityRecord({
    acceptedGradeLevels: ["HS_11", "HS_12"],
    applicationInstructions:
      "Review the official requirements and submit through the host portal.",
    applicationMethod: "EXTERNAL_PORTAL",
    availabilityStatus: "ROLLING",
    compensationType: "VOLUNTEER",
    country: "United States",
    description:
      "Students support an established hospital volunteer program and learn about patient-facing healthcare operations under staff supervision.",
    educationRequirement: "High school junior or senior",
    isRolling: true,
    lastVerifiedAt: "2026-07-19",
    location: "Boston, MA",
    officialApplicationUrl: "https://hospital.example.edu/volunteer/apply",
    officialSourceUrl: "https://hospital.example.edu/volunteer",
    organizationName: "Example University Hospital",
    organizationType: "Academic medical center",
    organizationWebsite: "https://hospital.example.edu",
    relationshipType: "EXTERNAL_PUBLIC",
    remoteType: "IN_PERSON",
    shortDescription:
      "Support hospital teams while learning how an academic medical center serves patients.",
    slug: "example-university-hospital-volunteer-program",
    sourceKey: "example-university-hospital:volunteer:recurring",
    sourceOrganization: "Example University Hospital",
    sourceRetrievedAt: "2026-07-19",
    sourceTitle: "Volunteer Services",
    title: "Hospital Volunteer Program",
    type: "VOLUNTEERING",
    verificationMethod: "Official program and application pages reviewed",
    ...overrides,
  });
}

function dataset(records: RealOpportunityRecord[]): RealOpportunityDataset {
  return {
    generatedAt: "2026-07-19T12:00:00.000Z",
    records,
    schemaVersion: "1.0",
    sourcePolicy: "OFFICIAL_SOURCES_ONLY",
  };
}

function existing(
  snapshot: Record<string, unknown>,
  overrides: Partial<ExistingOpportunityForImport> = {},
): ExistingOpportunityForImport {
  return {
    activeOverrideFields: new Set(),
    id: "opp-existing",
    organizationId: "org-existing",
    organizationName: "Example University Hospital",
    snapshot,
    ...overrides,
  };
}

describe("real opportunity import normalization", () => {
  it("normalizes stable slugs and removes tracking-only duplicate URL parameters", () => {
    expect(slugify("  Médecins & Community Health  ")).toBe(
      "medecins-and-community-health",
    );
    expect(
      canonicalDuplicateUrl(
        "HTTPS://Hospital.Example.EDU/volunteer/?utm_source=test&cycle=2027#apply",
      ),
    ).toBe("https://hospital.example.edu/volunteer?cycle=2027");
  });

  it("preserves unknown facts instead of inventing values", () => {
    const normalized = normalizeOpportunityRecord({
      ...record(),
      compensationType: "UNKNOWN",
      minimumAge: null,
      unknownFields: ["minimumAge", "compensationAmount"],
    });
    expect(normalized.minimumAge).toBeNull();
    expect(normalized.compensationAmount).toBeNull();
    expect(normalized.unknownFields).toEqual([
      "minimumAge",
      "compensationAmount",
    ]);
  });
});

describe("real opportunity import validation", () => {
  it("rejects reserved placeholder sources and non-public URLs", () => {
    const placeholder = record({
      officialApplicationUrl: "https://example.org/apply",
      officialSourceUrl: "http://127.0.0.1/program",
    });
    const result = validateOpportunityRecord(
      placeholder,
      new Date("2026-07-19T18:00:00Z"),
    );
    expect(result.errors.join(" ")).toMatch(/public HTTP/);
    expect(result.errors.join(" ")).toMatch(/reserved example domain/);
  });

  it("rejects an open listing whose deadline has passed", () => {
    const result = validateOpportunityRecord(
      record({
        availabilityStatus: "OPEN",
        deadline: "2026-01-01",
        isRolling: false,
      }),
      new Date("2026-07-19T18:00:00Z"),
    );
    expect(result.errors).toContain(
      "An available opportunity cannot have a passed deadline.",
    );
  });

  it("escapes spreadsheet formulas in exported cells", () => {
    expect(escapeSpreadsheetCell('=HYPERLINK("bad")')).toBe(
      '\'=HYPERLINK("bad")',
    );
    expect(escapeSpreadsheetCell("Clinical research")).toBe(
      "Clinical research",
    );
  });
});

describe("real opportunity import planning", () => {
  it("hashes existing state deterministically and includes manual overrides", () => {
    const first = existing(
      { sourceKey: "source:first", title: "First" },
      { activeOverrideFields: new Set(["title", "deadline"]) },
    );
    const second = existing(
      { sourceKey: "source:second", title: "Second" },
      { id: "opp-second" },
    );

    expect(hashExistingOpportunityState([first, second])).toBe(
      hashExistingOpportunityState([second, first]),
    );
    expect(
      hashExistingOpportunityState([
        existing(
          { sourceKey: "source:first", title: "First" },
          { activeOverrideFields: new Set(["title"]) },
        ),
        second,
      ]),
    ).not.toBe(hashExistingOpportunityState([first, second]));
  });

  it("creates a new, valid official-source listing in pending approval", () => {
    const plan = planOpportunityImport({
      dataset: dataset([record()]),
      existing: [],
      now: new Date("2026-07-19T18:00:00Z"),
    });
    expect(plan.counts.create).toBe(1);
    expect(plan.rows[0]).toMatchObject({
      action: "CREATE",
      proposedChanges: {
        status: "PENDING_APPROVAL",
        verificationStatus: "VERIFIED",
      },
    });
    expect(plan.rows[0]?.qualityScore).toBeGreaterThan(70);
  });

  it("updates by stable source key while preserving manual field overrides", () => {
    const candidate = record({
      shortDescription:
        "A changed and sufficiently detailed official summary for this recurring hospital volunteer program.",
    });
    const plan = planOpportunityImport({
      dataset: dataset([candidate]),
      existing: [
        existing(
          {
            officialApplicationUrl: candidate.officialApplicationUrl,
            officialSourceUrl: candidate.officialSourceUrl,
            shortDescription: "Admin-curated summary",
            slug: candidate.slug,
            sourceKey: candidate.sourceKey,
            status: "PUBLISHED",
            title: candidate.title,
            visibility: "PUBLIC_DIRECTORY",
          },
          { activeOverrideFields: new Set(["shortDescription"]) },
        ),
      ],
      now: new Date("2026-07-19T18:00:00Z"),
    });
    expect(plan.rows[0]?.action).toBe("UPDATE");
    expect(plan.rows[0]?.proposedChanges).not.toHaveProperty(
      "shortDescription",
    );
    expect(plan.rows[0]?.proposedChanges).not.toHaveProperty("status");
    expect(plan.rows[0]?.warnings.join(" ")).toMatch(/manual overrides/);
  });

  it("is idempotent when a source-controlled record is unchanged", () => {
    const candidate = record();
    const initial = planOpportunityImport({
      dataset: dataset([candidate]),
      existing: [],
      now: new Date("2026-07-19T18:00:00Z"),
    });
    const plan = planOpportunityImport({
      dataset: dataset([candidate]),
      existing: [existing(initial.rows[0]!.proposedChanges)],
      now: new Date("2026-07-19T18:00:00Z"),
    });

    expect(plan.rows[0]?.action).toBe("UNCHANGED");
    expect(plan.rows[0]?.proposedChanges).toEqual({});
  });

  it("rejects invalid rows and detects duplicates within one dataset", () => {
    const candidate = record();
    const rejected = planOpportunityImport({
      dataset: dataset([
        record({ officialSourceUrl: "https://example.org/not-real" }),
      ]),
      existing: [],
      now: new Date("2026-07-19T18:00:00Z"),
    });
    const duplicates = planOpportunityImport({
      dataset: dataset([candidate, candidate]),
      existing: [],
      now: new Date("2026-07-19T18:00:00Z"),
    });

    expect(rejected.rows[0]?.action).toBe("REJECT");
    expect(duplicates.rows.map((row) => row.action)).toEqual([
      "CREATE",
      "DUPLICATE",
    ]);
  });

  it("restores a recurring stable record and archives only public fixtures", () => {
    const candidate = record();
    const restorePlan = planOpportunityImport({
      dataset: dataset([candidate]),
      existing: [
        existing({
          availabilityStatus: "ARCHIVED",
          slug: candidate.slug,
          sourceKey: candidate.sourceKey,
          status: "ARCHIVED",
          title: candidate.title,
          visibility: "PUBLIC_DIRECTORY",
        }),
      ],
      now: new Date("2026-07-19T18:00:00Z"),
    });
    const archivePlan = withFixtureArchivePlan(
      planOpportunityImport({
        dataset: dataset([]),
        existing: [],
        now: new Date("2026-07-19T18:00:00Z"),
      }),
      [
        existing(
          {
            officialSourceUrl: "https://example.org/demo",
            status: "PUBLISHED",
            title: "Demo program",
            visibility: "PUBLIC_DIRECTORY",
          },
          { id: "opp-demo" },
        ),
        existing(
          {
            officialSourceUrl: "https://example.org/private-demo",
            status: "DRAFT",
            title: "Demo private record",
            visibility: "STUDENT_PRIVATE",
          },
          { id: "opp-private-demo" },
        ),
      ],
    );

    expect(restorePlan.rows[0]?.action).toBe("RESTORE");
    expect(archivePlan.counts.archive).toBe(1);
    expect(archivePlan.rows.at(-1)).toMatchObject({
      action: "ARCHIVE",
      existingOpportunityId: "opp-demo",
    });
  });

  it("flags a shared official page with a different program title for review", () => {
    const candidate = record({
      sourceKey: "example-university-hospital:research:2027",
      slug: "example-university-hospital-research-program",
      title: "Clinical Research Internship",
    });
    const plan = planOpportunityImport({
      dataset: dataset([candidate]),
      existing: [
        existing({
          officialApplicationUrl: candidate.officialApplicationUrl,
          officialSourceUrl: candidate.officialSourceUrl,
          sourceKey: "existing-program",
          title: "Hospital Volunteer Program",
          visibility: "PUBLIC_DIRECTORY",
        }),
      ],
      now: new Date("2026-07-19T18:00:00Z"),
    });
    expect(plan.rows[0]).toMatchObject({
      action: "NEEDS_REVIEW",
      duplicateOpportunityId: "opp-existing",
    });
  });

  it("identifies explicit fixtures but not ordinary records", () => {
    expect(
      isExplicitFixtureOpportunity(
        existing({
          officialSourceUrl: "https://example.org/fp-smoke",
          title: "Smoke Open Program",
          visibility: "PUBLIC_DIRECTORY",
        }),
      ),
    ).toBe(true);
    expect(
      isExplicitFixtureOpportunity(
        existing({
          officialSourceUrl: "https://hospital.example.edu/volunteer",
          title: "Hospital Volunteer Program",
          visibility: "PUBLIC_DIRECTORY",
        }),
      ),
    ).toBe(false);
  });

  it("produces CSV that cannot execute a formula from a title", () => {
    const plan = planOpportunityImport({
      dataset: dataset([record({ title: '=IMPORTXML("https://bad")' })]),
      existing: [],
      now: new Date("2026-07-19T18:00:00Z"),
    });
    expect(renderPublicationReadyCsv(plan)).toContain(
      '\'=IMPORTXML(""https://bad"")',
    );
  });
});

describe("production import guard", () => {
  it("requires every exact production confirmation", () => {
    const dryRunHash = "a".repeat(64);
    const projectRef = "ksuzzfzufotrwrxdrynl";
    const approvalPhrase = productionApprovalPhrase({
      dryRunHash,
      observedOpportunityCount: 7,
      projectRef,
    });
    const valid = validateProductionWriteGuard({
      allowProduction: true,
      approvalPhrase,
      commit: true,
      database: "postgres",
      dryRunHash,
      environment: "production",
      expectedDatabase: "postgres",
      expectedDryRunHash: dryRunHash,
      expectedOpportunityCount: 7,
      expectedProjectRef: projectRef,
      expectedSchema: "public",
      observedOpportunityCount: 7,
      projectRef,
      schema: "public",
    });
    expect(valid).toEqual({ allowed: true, errors: [] });

    const rejected = validateProductionWriteGuard({
      allowProduction: false,
      approvalPhrase: "wrong",
      commit: true,
      database: "postgres",
      dryRunHash,
      environment: "production",
      expectedDatabase: "postgres",
      expectedDryRunHash: "b".repeat(64),
      expectedOpportunityCount: 8,
      expectedProjectRef: projectRef,
      expectedSchema: "public",
      observedOpportunityCount: 7,
      projectRef,
      schema: "public",
    });
    expect(rejected.errors).toHaveLength(4);
    expect(rejected.errors.join(" ")).toMatch(/Dry-run hash does not match/);
  });
});
