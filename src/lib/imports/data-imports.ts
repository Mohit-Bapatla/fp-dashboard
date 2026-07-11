import "server-only";

import type {
  ApplicationMethod,
  GradeLevelCode,
  OpportunityAvailabilityStatus,
  OpportunityRelationshipType,
  OpportunityStatus,
  OpportunityType,
  PartnerStatus,
} from "@/generated/prisma/enums";
import { parseGradeLevelCodes } from "@/lib/matching/grade-levels";
import { optionalSafeExternalUrl } from "@/lib/security/safe-url";
import { prisma } from "@/lib/db/prisma";
import {
  getAliasedValue,
  normalizeDuplicateKey,
  parseCsv,
  splitImportList,
} from "@/lib/imports/csv";

export const importTypes = ["students", "partners", "opportunities"] as const;
export type ImportType = (typeof importTypes)[number];

export type ImportPreviewRow = {
  errors: string[];
  importable: boolean;
  normalized: Record<string, string | number | string[] | null>;
  rowNumber: number;
  warnings: string[];
};

export type ImportPreview = {
  errors: string[];
  importType: ImportType;
  rows: ImportPreviewRow[];
};

export type ImportSummary = {
  created: number;
  errors: string[];
  skippedDuplicates: number;
  skippedInvalid: number;
  updated: number;
};

const opportunityTypes = [
  "INTERNSHIP",
  "SHADOWING",
  "RESEARCH",
  "VOLUNTEERING",
  "MENTORSHIP",
  "EVENT",
  "PROGRAM",
] as const satisfies readonly OpportunityType[];
const relationshipTypes = [
  "EXTERNAL_PUBLIC",
  "FP_PARTNER",
  "FP_OWNED",
] as const satisfies readonly OpportunityRelationshipType[];
const availabilityStatuses = [
  "OPEN",
  "OPENING_SOON",
  "ROLLING",
  "CLOSED",
  "EXPIRED",
  "ARCHIVED",
] as const satisfies readonly OpportunityAvailabilityStatus[];
const applicationMethods = [
  "EXTERNAL_PORTAL",
  "FP_INTERNAL",
  "FP_REFERRAL",
] as const satisfies readonly ApplicationMethod[];

const partnerStatuses = [
  "NOT_CONTACTED",
  "CONTACTED",
  "FOLLOW_UP_NEEDED",
  "INTERESTED",
  "MEETING_SCHEDULED",
  "PARTNERED",
  "REJECTED",
  "NO_RESPONSE",
  "PAUSED",
] as const satisfies readonly PartnerStatus[];

function isImportType(value: string): value is ImportType {
  return importTypes.includes(value as ImportType);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeUrl(value: string) {
  if (!value) return "";

  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";

    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return value.toLowerCase().trim().replace(/\/$/, "");
  }
}

function parseIntValue(value: string) {
  if (!value) return null;

  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function parseDateValue(value: string) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOpportunityType(value: string) {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");

  return opportunityTypes.includes(normalized as OpportunityType)
    ? (normalized as OpportunityType)
    : null;
}

function parsePartnerStatus(value: string) {
  if (!value) return "NOT_CONTACTED";

  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");

  return partnerStatuses.includes(normalized as PartnerStatus)
    ? (normalized as PartnerStatus)
    : null;
}

async function previewStudents(rows: ReturnType<typeof parseCsv>["rows"]) {
  const emails = rows
    .map((row) =>
      normalizeEmail(getAliasedValue(row.values, ["email", "studentEmail"])),
    )
    .filter(Boolean);
  const [existingUsers, existingImports] = await Promise.all([
    prisma.user.findMany({
      where: {
        email: {
          in: emails,
        },
      },
      select: {
        email: true,
      },
    }),
    prisma.studentImportRecord.findMany({
      where: {
        normalizedEmail: {
          in: emails,
        },
      },
      select: {
        normalizedEmail: true,
      },
    }),
  ]);
  const existingUserEmails = new Set(
    existingUsers.map((user) => normalizeEmail(user.email)),
  );
  const existingImportEmails = new Set(
    existingImports.map((record) => record.normalizedEmail),
  );
  const seen = new Set<string>();

  return rows.map((row) => {
    const email = getAliasedValue(row.values, ["email", "studentEmail"]);
    const normalizedEmail = normalizeEmail(email);
    const graduationYear = parseIntValue(
      getAliasedValue(row.values, ["graduationYear", "gradYear"]),
    );
    const opportunityTypesValue = splitImportList(
      getAliasedValue(row.values, ["opportunityTypes", "types"]),
    )
      .map(parseOpportunityType)
      .filter((type): type is OpportunityType => Boolean(type));
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!normalizedEmail || !isEmail(normalizedEmail)) {
      errors.push("Valid email is required.");
    }

    if (Number.isNaN(graduationYear)) {
      errors.push("Graduation year must be a number.");
    }

    if (normalizedEmail && seen.has(normalizedEmail)) {
      warnings.push("Duplicate student email in this CSV.");
    }

    if (existingUserEmails.has(normalizedEmail)) {
      warnings.push("A real user already exists for this email.");
    }

    if (existingImportEmails.has(normalizedEmail)) {
      warnings.push(
        "A staged import already exists for this email and will be updated.",
      );
    }

    seen.add(normalizedEmail);

    return {
      errors,
      importable:
        errors.length === 0 && !existingUserEmails.has(normalizedEmail),
      normalized: {
        availability: splitImportList(
          getAliasedValue(row.values, ["availability"]),
        ),
        careerGoals: getAliasedValue(row.values, ["careerGoals"]),
        city: getAliasedValue(row.values, ["city"]),
        country: getAliasedValue(row.values, ["country"]),
        email,
        experienceLevel: getAliasedValue(row.values, ["experienceLevel"]),
        firstName: getAliasedValue(row.values, ["firstName", "first"]),
        gradeYear: getAliasedValue(row.values, ["gradeYear", "grade"]),
        graduationYear: Number.isNaN(graduationYear) ? null : graduationYear,
        interestedSpecialties: splitImportList(
          getAliasedValue(row.values, ["interestedSpecialties", "specialties"]),
        ),
        languages: splitImportList(getAliasedValue(row.values, ["languages"])),
        lastName: getAliasedValue(row.values, ["lastName", "last"]),
        locationPreference: getAliasedValue(row.values, ["locationPreference"]),
        major: getAliasedValue(row.values, ["major"]),
        normalizedEmail,
        opportunityTypes: opportunityTypesValue,
        remotePreference: getAliasedValue(row.values, ["remotePreference"]),
        school: getAliasedValue(row.values, ["school"]),
        state: getAliasedValue(row.values, ["state"]),
      },
      rowNumber: row.rowNumber,
      warnings,
    };
  });
}

async function previewPartners(rows: ReturnType<typeof parseCsv>["rows"]) {
  const names = rows
    .map((row) => getAliasedValue(row.values, ["name", "organizationName"]))
    .filter(Boolean);
  const contactEmails = rows
    .map((row) =>
      normalizeEmail(getAliasedValue(row.values, ["contactEmail", "email"])),
    )
    .filter(Boolean);
  const websites = rows
    .map((row) => normalizeUrl(getAliasedValue(row.values, ["website", "url"])))
    .filter(Boolean);
  const existing = await prisma.partnerOrganization.findMany({
    where: {
      OR: [
        { name: { in: names } },
        { contactEmail: { in: contactEmails } },
        { website: { in: websites } },
      ],
    },
    select: {
      contactEmail: true,
      name: true,
      website: true,
    },
  });
  const existingNames = new Set(
    existing.map((partner) => normalizeDuplicateKey(partner.name)),
  );
  const existingEmails = new Set(
    existing
      .map((partner) => normalizeEmail(partner.contactEmail ?? ""))
      .filter(Boolean),
  );
  const existingWebsites = new Set(
    existing
      .map((partner) => normalizeUrl(partner.website ?? ""))
      .filter(Boolean),
  );
  const seenNames = new Set<string>();

  return rows.map((row) => {
    const name = getAliasedValue(row.values, ["name", "organizationName"]);
    const contactEmail = getAliasedValue(row.values, ["contactEmail", "email"]);
    const website = getAliasedValue(row.values, ["website", "url"]);
    const normalizedName = normalizeDuplicateKey(name);
    const normalizedEmail = normalizeEmail(contactEmail);
    const normalizedWebsite = normalizeUrl(website);
    const status = parsePartnerStatus(getAliasedValue(row.values, ["status"]));
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!name) errors.push("Partner name is required.");
    if (contactEmail && !isEmail(normalizedEmail))
      errors.push("Contact email is invalid.");
    if (!status) errors.push("Partner status is invalid.");
    if (normalizedName && seenNames.has(normalizedName)) {
      warnings.push("Duplicate partner name in this CSV.");
    }
    if (
      existingNames.has(normalizedName) ||
      (normalizedEmail && existingEmails.has(normalizedEmail)) ||
      (normalizedWebsite && existingWebsites.has(normalizedWebsite))
    ) {
      warnings.push(
        "Possible existing partner duplicate; row will be skipped.",
      );
    }

    seenNames.add(normalizedName);

    return {
      errors,
      importable:
        errors.length === 0 &&
        !existingNames.has(normalizedName) &&
        !(normalizedEmail && existingEmails.has(normalizedEmail)) &&
        !(normalizedWebsite && existingWebsites.has(normalizedWebsite)),
      normalized: {
        city: getAliasedValue(row.values, ["city"]),
        contactEmail,
        country: getAliasedValue(row.values, ["country"]),
        description: getAliasedValue(row.values, ["description"]),
        healthcareFocus: getAliasedValue(row.values, ["healthcareFocus"]),
        location: getAliasedValue(row.values, ["location"]),
        name,
        specialtyAreas: splitImportList(
          getAliasedValue(row.values, ["specialtyAreas", "specialties"]),
        ),
        state: getAliasedValue(row.values, ["state"]),
        status: status ?? "NOT_CONTACTED",
        type: getAliasedValue(row.values, ["type"]),
        website,
      },
      rowNumber: row.rowNumber,
      warnings,
    };
  });
}

async function previewOpportunities(
  rows: ReturnType<typeof parseCsv>["rows"],
  defaultStatus: Extract<OpportunityStatus, "DRAFT" | "PENDING_APPROVAL">,
) {
  const organizations = await prisma.partnerOrganization.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  const organizationById = new Map(organizations.map((org) => [org.id, org]));
  const organizationByName = new Map(
    organizations.map((org) => [normalizeDuplicateKey(org.name), org]),
  );
  const existingOpportunities = await prisma.opportunity.findMany({
    select: {
      organizationId: true,
      title: true,
      cycleLabel: true,
      location: true,
      officialApplicationUrl: true,
    },
  });
  const existingKeys = new Set(
    existingOpportunities.map(
      (opportunity) =>
        `${opportunity.organizationId}:${normalizeDuplicateKey(opportunity.title)}:${normalizeDuplicateKey(opportunity.cycleLabel ?? "")}:${normalizeDuplicateKey(opportunity.location ?? "")}:${normalizeUrl(opportunity.officialApplicationUrl ?? "")}`,
    ),
  );
  const seenKeys = new Set<string>();

  return rows.map((row) => {
    const organizationIdValue = getAliasedValue(row.values, ["organizationId"]);
    const organizationName = getAliasedValue(row.values, [
      "organizationName",
      "partner",
      "partnerName",
    ]);
    const organization =
      (organizationIdValue
        ? organizationById.get(organizationIdValue)
        : null) ??
      organizationByName.get(normalizeDuplicateKey(organizationName));
    const title = getAliasedValue(row.values, ["title", "opportunityTitle"]);
    const type = parseOpportunityType(
      getAliasedValue(row.values, ["type", "opportunityType"]),
    );
    const deadlineValue = getAliasedValue(row.values, ["deadline"]);
    const deadline = parseDateValue(deadlineValue);
    const opensAtValue = getAliasedValue(row.values, ["opensAt"]);
    const opensAt = parseDateValue(opensAtValue);
    const capacity = parseIntValue(getAliasedValue(row.values, ["capacity"]));
    const relationshipRaw = (
      getAliasedValue(row.values, ["relationshipType"]) || "EXTERNAL_PUBLIC"
    ).toUpperCase();
    const relationshipType = relationshipTypes.includes(
      relationshipRaw as OpportunityRelationshipType,
    )
      ? (relationshipRaw as OpportunityRelationshipType)
      : null;
    const availabilityRaw = (
      getAliasedValue(row.values, ["availabilityStatus"]) || "OPEN"
    ).toUpperCase();
    const availabilityStatus = availabilityStatuses.includes(
      availabilityRaw as OpportunityAvailabilityStatus,
    )
      ? (availabilityRaw as OpportunityAvailabilityStatus)
      : null;
    const applicationMethodRaw = (
      getAliasedValue(row.values, ["applicationMethod"]) || "EXTERNAL_PORTAL"
    ).toUpperCase();
    const applicationMethod = applicationMethods.includes(
      applicationMethodRaw as ApplicationMethod,
    )
      ? (applicationMethodRaw as ApplicationMethod)
      : null;
    const officialSourceUrl = getAliasedValue(row.values, [
      "officialSourceUrl",
      "sourceUrl",
    ]);
    const officialApplicationUrl = getAliasedValue(row.values, [
      "officialApplicationUrl",
      "applicationUrl",
    ]);
    const cycleLabel = getAliasedValue(row.values, ["cycleLabel"]);
    const location = getAliasedValue(row.values, ["location"]);
    const minimumAge = parseIntValue(
      getAliasedValue(row.values, ["minimumAge"]),
    );
    const maximumAge = parseIntValue(
      getAliasedValue(row.values, ["maximumAge"]),
    );
    const estimatedApplicationMinutes = parseIntValue(
      getAliasedValue(row.values, ["estimatedApplicationMinutes"]),
    );
    const acceptedGrades = parseGradeLevelCodes(
      splitImportList(getAliasedValue(row.values, ["acceptedGradeLevels"])),
    );
    const duplicateKey = organization
      ? `${organization.id}:${normalizeDuplicateKey(title)}:${normalizeDuplicateKey(cycleLabel)}:${normalizeDuplicateKey(location)}:${normalizeUrl(officialApplicationUrl)}`
      : "";
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!title) errors.push("Opportunity title is required.");
    if (!type) errors.push("Opportunity type is required or invalid.");
    if (!organization) errors.push("Matching organization was not found.");
    if (deadlineValue && !deadline) errors.push("Deadline is invalid.");
    if (opensAtValue && !opensAt) errors.push("Opening date is invalid.");
    if (Number.isNaN(capacity)) errors.push("Capacity must be a number.");
    if (!relationshipType) errors.push("Relationship type is invalid.");
    if (!availabilityStatus) errors.push("Availability status is invalid.");
    if (!applicationMethod) errors.push("Application method is invalid.");
    if (
      relationshipType === "EXTERNAL_PUBLIC" &&
      applicationMethod !== "EXTERNAL_PORTAL"
    )
      errors.push("External public opportunities must use EXTERNAL_PORTAL.");
    if (
      Number.isNaN(minimumAge) ||
      (minimumAge != null && (minimumAge < 13 || minimumAge > 100))
    )
      errors.push("Minimum age must be a whole number between 13 and 100.");
    if (
      Number.isNaN(maximumAge) ||
      (maximumAge != null && (maximumAge < 13 || maximumAge > 100))
    )
      errors.push("Maximum age must be a whole number between 13 and 100.");
    if (
      minimumAge != null &&
      maximumAge != null &&
      !Number.isNaN(minimumAge) &&
      !Number.isNaN(maximumAge) &&
      maximumAge < minimumAge
    )
      errors.push("Maximum age must be at least minimum age.");
    if (
      Number.isNaN(estimatedApplicationMinutes) ||
      (estimatedApplicationMinutes != null &&
        (estimatedApplicationMinutes < 1 ||
          estimatedApplicationMinutes > 10_000))
    )
      errors.push(
        "Estimated application minutes must be a whole number between 1 and 10000.",
      );
    if (acceptedGrades.unknownValues.length > 0)
      errors.push(
        `Unrecognized grade level: ${acceptedGrades.unknownValues.join(", ")}.`,
      );
    if (!optionalSafeExternalUrl(officialSourceUrl))
      errors.push("Official source URL is invalid.");
    if (!optionalSafeExternalUrl(officialApplicationUrl))
      errors.push("Official application URL is invalid.");
    if (duplicateKey && seenKeys.has(duplicateKey)) {
      warnings.push("Duplicate opportunity title + organization in this CSV.");
    }
    if (duplicateKey && existingKeys.has(duplicateKey)) {
      warnings.push(
        "Existing opportunity has this title + organization; row will be skipped.",
      );
    }

    if (duplicateKey) seenKeys.add(duplicateKey);

    return {
      errors,
      importable:
        errors.length === 0 &&
        Boolean(organization) &&
        !(duplicateKey && existingKeys.has(duplicateKey)),
      normalized: {
        applicationInstructions: getAliasedValue(row.values, [
          "applicationInstructions",
          "instructions",
        ]),
        capacity: Number.isNaN(capacity) ? null : capacity,
        deadline: deadline ? deadline.toISOString() : null,
        opensAt: opensAt ? opensAt.toISOString() : null,
        description: getAliasedValue(row.values, ["description"]),
        eligibilityRequirements: getAliasedValue(row.values, [
          "eligibilityRequirements",
          "eligibility",
        ]),
        location,
        city: getAliasedValue(row.values, ["city"]),
        state: getAliasedValue(row.values, ["state"]),
        country: getAliasedValue(row.values, ["country"]),
        relationshipType: relationshipType ?? "",
        applicationMethod: applicationMethod ?? "",
        officialSourceUrl,
        officialApplicationUrl,
        availabilityStatus: availabilityStatus ?? "",
        cycleLabel,
        minimumAge: Number.isNaN(minimumAge) ? null : minimumAge,
        maximumAge: Number.isNaN(maximumAge) ? null : maximumAge,
        acceptedGradeLevels: acceptedGrades.codes,
        requiredCertifications: splitImportList(
          getAliasedValue(row.values, ["requiredCertifications"]),
        ),
        estimatedApplicationMinutes: Number.isNaN(estimatedApplicationMinutes)
          ? null
          : estimatedApplicationMinutes,
        organizationId: organization?.id ?? null,
        organizationName: organization?.name ?? organizationName,
        paidStatus: getAliasedValue(row.values, ["paidStatus"]),
        remoteType: getAliasedValue(row.values, ["remoteType", "format"]),
        requiredDocuments: splitImportList(
          getAliasedValue(row.values, ["requiredDocuments", "documents"]),
        ),
        specialty: getAliasedValue(row.values, ["specialty"]),
        status: defaultStatus,
        title,
        type: type ?? "",
      },
      rowNumber: row.rowNumber,
      warnings,
    };
  });
}

export async function buildImportPreview({
  csvText,
  defaultOpportunityStatus = "DRAFT",
  importType,
}: {
  csvText: string;
  defaultOpportunityStatus?: Extract<
    OpportunityStatus,
    "DRAFT" | "PENDING_APPROVAL"
  >;
  importType: string;
}): Promise<ImportPreview> {
  if (!isImportType(importType)) {
    return {
      errors: ["Choose an import type."],
      importType: "students",
      rows: [],
    };
  }

  const parsed = parseCsv(csvText);

  if (parsed.errors.length > 0) {
    return {
      errors: parsed.errors,
      importType,
      rows: [],
    };
  }

  if (importType === "students") {
    return {
      errors: [],
      importType,
      rows: await previewStudents(parsed.rows),
    };
  }

  if (importType === "partners") {
    return {
      errors: [],
      importType,
      rows: await previewPartners(parsed.rows),
    };
  }

  return {
    errors: [],
    importType,
    rows: await previewOpportunities(parsed.rows, defaultOpportunityStatus),
  };
}

function getStringValue(row: ImportPreviewRow, key: string) {
  const value = row.normalized[key];

  return typeof value === "string" ? value : "";
}

function getStringArrayValue(row: ImportPreviewRow, key: string) {
  const value = row.normalized[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export async function importPreviewRows({
  actorId,
  preview,
}: {
  actorId: string | null;
  preview: ImportPreview;
}): Promise<ImportSummary> {
  const rows = preview.rows.filter(
    (row) => row.importable && row.errors.length === 0,
  );
  const summary: ImportSummary = {
    created: 0,
    errors: [],
    skippedDuplicates: preview.rows.filter((row) =>
      row.warnings.some(
        (warning) =>
          warning.toLowerCase().includes("duplicate") ||
          warning.toLowerCase().includes("existing"),
      ),
    ).length,
    skippedInvalid: preview.rows.length - rows.length,
    updated: 0,
  };

  for (const row of rows) {
    try {
      if (preview.importType === "students") {
        const normalizedEmail = getStringValue(row, "normalizedEmail");
        const existingUser = await prisma.user.findUnique({
          where: {
            email: normalizedEmail,
          },
          select: {
            id: true,
          },
        });
        const existingImport = await prisma.studentImportRecord.findUnique({
          where: {
            normalizedEmail,
          },
          select: {
            id: true,
          },
        });

        if (!normalizedEmail || !isEmail(normalizedEmail) || existingUser) {
          summary.skippedInvalid += existingUser ? 0 : 1;
          summary.skippedDuplicates += existingUser ? 1 : 0;
          continue;
        }

        await prisma.studentImportRecord.upsert({
          where: { normalizedEmail },
          create: {
            availability: getStringArrayValue(row, "availability"),
            careerGoals: getStringValue(row, "careerGoals") || null,
            city: getStringValue(row, "city") || null,
            country: getStringValue(row, "country") || null,
            email: getStringValue(row, "email"),
            experienceLevel: getStringValue(row, "experienceLevel") || null,
            firstName: getStringValue(row, "firstName") || null,
            gradeYear: getStringValue(row, "gradeYear") || null,
            graduationYear:
              typeof row.normalized.graduationYear === "number"
                ? row.normalized.graduationYear
                : null,
            interestedSpecialties: getStringArrayValue(
              row,
              "interestedSpecialties",
            ),
            languages: getStringArrayValue(row, "languages"),
            lastName: getStringValue(row, "lastName") || null,
            locationPreference:
              getStringValue(row, "locationPreference") || null,
            major: getStringValue(row, "major") || null,
            normalizedEmail,
            opportunityTypes: getStringArrayValue(
              row,
              "opportunityTypes",
            ) as OpportunityType[],
            remotePreference: getStringValue(row, "remotePreference") || null,
            school: getStringValue(row, "school") || null,
            state: getStringValue(row, "state") || null,
          },
          update: {
            availability: getStringArrayValue(row, "availability"),
            careerGoals: getStringValue(row, "careerGoals") || null,
            city: getStringValue(row, "city") || null,
            country: getStringValue(row, "country") || null,
            experienceLevel: getStringValue(row, "experienceLevel") || null,
            firstName: getStringValue(row, "firstName") || null,
            gradeYear: getStringValue(row, "gradeYear") || null,
            graduationYear:
              typeof row.normalized.graduationYear === "number"
                ? row.normalized.graduationYear
                : null,
            interestedSpecialties: getStringArrayValue(
              row,
              "interestedSpecialties",
            ),
            languages: getStringArrayValue(row, "languages"),
            lastName: getStringValue(row, "lastName") || null,
            locationPreference:
              getStringValue(row, "locationPreference") || null,
            major: getStringValue(row, "major") || null,
            opportunityTypes: getStringArrayValue(
              row,
              "opportunityTypes",
            ) as OpportunityType[],
            remotePreference: getStringValue(row, "remotePreference") || null,
            school: getStringValue(row, "school") || null,
            state: getStringValue(row, "state") || null,
          },
        });
        if (existingImport) {
          summary.updated += 1;
        } else {
          summary.created += 1;
        }
      } else if (preview.importType === "partners") {
        const name = getStringValue(row, "name");
        const contactEmail = normalizeEmail(
          getStringValue(row, "contactEmail"),
        );
        const website = normalizeUrl(getStringValue(row, "website"));
        const duplicate = await prisma.partnerOrganization.findFirst({
          where: {
            OR: [
              { name },
              ...(contactEmail ? [{ contactEmail }] : []),
              ...(website ? [{ website }] : []),
            ],
          },
          select: {
            id: true,
          },
        });

        if (!name || duplicate) {
          summary.skippedInvalid += name ? 0 : 1;
          summary.skippedDuplicates += duplicate ? 1 : 0;
          continue;
        }

        await prisma.partnerOrganization.create({
          data: {
            city: getStringValue(row, "city") || null,
            contactEmail: getStringValue(row, "contactEmail") || null,
            country: getStringValue(row, "country") || null,
            description: getStringValue(row, "description") || null,
            healthcareFocus: getStringValue(row, "healthcareFocus") || null,
            location: getStringValue(row, "location") || null,
            name: getStringValue(row, "name"),
            specialtyAreas: getStringArrayValue(row, "specialtyAreas"),
            state: getStringValue(row, "state") || null,
            status: getStringValue(row, "status") as PartnerStatus,
            type: getStringValue(row, "type") || null,
            website: getStringValue(row, "website") || null,
          },
        });
        summary.created += 1;
      } else {
        const organizationId = getStringValue(row, "organizationId");
        const title = getStringValue(row, "title");
        const status = getStringValue(row, "status");
        const organization = organizationId
          ? await prisma.partnerOrganization.findUnique({
              where: {
                id: organizationId,
              },
              select: {
                id: true,
              },
            })
          : null;
        const duplicate =
          organization && title
            ? await prisma.opportunity.findFirst({
                where: {
                  organizationId,
                  title,
                },
                select: {
                  id: true,
                },
              })
            : null;

        if (
          !organization ||
          !title ||
          !getStringValue(row, "type") ||
          (status !== "DRAFT" && status !== "PENDING_APPROVAL") ||
          duplicate
        ) {
          summary.skippedInvalid += duplicate ? 0 : 1;
          summary.skippedDuplicates += duplicate ? 1 : 0;
          continue;
        }

        await prisma.opportunity.create({
          data: {
            applicationInstructions:
              getStringValue(row, "applicationInstructions") || null,
            capacity:
              typeof row.normalized.capacity === "number"
                ? row.normalized.capacity
                : null,
            deadline:
              typeof row.normalized.deadline === "string" &&
              row.normalized.deadline
                ? new Date(row.normalized.deadline)
                : null,
            opensAt:
              typeof row.normalized.opensAt === "string" &&
              row.normalized.opensAt
                ? new Date(row.normalized.opensAt)
                : null,
            description: getStringValue(row, "description") || null,
            eligibilityRequirements:
              getStringValue(row, "eligibilityRequirements") || null,
            location: getStringValue(row, "location") || null,
            organizationId,
            paidStatus: getStringValue(row, "paidStatus") || null,
            remoteType: getStringValue(row, "remoteType") || null,
            requiredDocuments: getStringArrayValue(row, "requiredDocuments"),
            specialty: getStringValue(row, "specialty") || null,
            status: status as OpportunityStatus,
            title,
            type: getStringValue(row, "type") as OpportunityType,
            relationshipType: getStringValue(
              row,
              "relationshipType",
            ) as OpportunityRelationshipType,
            applicationMethod: getStringValue(
              row,
              "applicationMethod",
            ) as ApplicationMethod,
            officialSourceUrl: getStringValue(row, "officialSourceUrl") || null,
            officialApplicationUrl:
              getStringValue(row, "officialApplicationUrl") || null,
            availabilityStatus: getStringValue(
              row,
              "availabilityStatus",
            ) as OpportunityAvailabilityStatus,
            verificationStatus: "NEEDS_REVIEW",
            cycleLabel: getStringValue(row, "cycleLabel") || null,
            city: getStringValue(row, "city") || null,
            state: getStringValue(row, "state") || null,
            country: getStringValue(row, "country") || null,
            minimumAge:
              typeof row.normalized.minimumAge === "number"
                ? row.normalized.minimumAge
                : null,
            maximumAge:
              typeof row.normalized.maximumAge === "number"
                ? row.normalized.maximumAge
                : null,
            acceptedGradeLevels: getStringArrayValue(
              row,
              "acceptedGradeLevels",
            ) as GradeLevelCode[],
            requiredCertifications: getStringArrayValue(
              row,
              "requiredCertifications",
            ),
            estimatedApplicationMinutes:
              typeof row.normalized.estimatedApplicationMinutes === "number"
                ? row.normalized.estimatedApplicationMinutes
                : null,
          },
        });
        summary.created += 1;
      }
    } catch (error) {
      summary.errors.push(
        `Row ${row.rowNumber}: ${
          error instanceof Error ? error.message : "Unable to import row."
        }`,
      );
    }
  }

  await prisma.auditLog.create({
    data: {
      action: "CSV_IMPORT_COMPLETED",
      actorId,
      entityType: "CsvImport",
      metadata: {
        importType: preview.importType,
        summary,
        totalRows: preview.rows.length,
      },
    },
  });

  return summary;
}
