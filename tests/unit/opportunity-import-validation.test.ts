import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  opportunities: vi.fn(),
  organizations: vi.fn(),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    opportunity: { findMany: mocks.opportunities },
    partnerOrganization: { findMany: mocks.organizations },
  },
}));

import { buildImportPreview } from "@/lib/imports/data-imports";

describe("opportunity import preview validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.organizations.mockResolvedValue([{ id: "org-1", name: "Demo Host" }]);
    mocks.opportunities.mockResolvedValue([]);
  });
  it("rejects invalid age and effort values before Prisma", async () => {
    const csv =
      "organizationName,title,type,minimumAge,maximumAge,estimatedApplicationMinutes\nDemo Host,Demo,SHADOWING,16abc,Infinity,NaN";
    const preview = await buildImportPreview({
      csvText: csv,
      importType: "opportunities",
    });
    expect(preview.rows[0]?.importable).toBe(false);
    expect(preview.rows[0]?.errors.join(" ")).toMatch(/Minimum age/);
    expect(preview.rows[0]?.errors.join(" ")).toMatch(/Maximum age/);
    expect(preview.rows[0]?.errors.join(" ")).toMatch(
      /Estimated application minutes/,
    );
  });
  it("canonicalizes recognized grade aliases in preview data", async () => {
    const csv =
      "organizationName,title,type,acceptedGradeLevels\nDemo Host,Demo,SHADOWING,High school junior|Grade 12";
    const preview = await buildImportPreview({
      csvText: csv,
      importType: "opportunities",
    });
    expect(preview.rows[0]?.errors).toEqual([]);
    expect(preview.rows[0]?.normalized.acceptedGradeLevels).toEqual([
      "HS_11",
      "HS_12",
    ]);
  });
});
