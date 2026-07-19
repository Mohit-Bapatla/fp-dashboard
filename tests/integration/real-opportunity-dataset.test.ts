import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { planOpportunityImport } from "@/lib/opportunities/import/planner";
import type { RealOpportunityDataset } from "@/lib/opportunities/import/types";

const datasetPath = path.join(
  process.cwd(),
  "data",
  "opportunities",
  "official-opportunities-2026-07-19.json",
);

async function loadDataset() {
  return JSON.parse(
    await readFile(datasetPath, "utf8"),
  ) as RealOpportunityDataset;
}

describe("official opportunity research dataset", () => {
  it("contains only valid, unique official-source records", async () => {
    const dataset = await loadDataset();
    const plan = planOpportunityImport({
      dataset,
      existing: [],
      now: new Date("2026-07-19T18:00:00Z"),
    });

    expect(dataset.records).toHaveLength(30);
    expect(plan.counts.create).toBe(30);
    expect(plan.counts.reject).toBe(0);
    expect(plan.counts.duplicate).toBe(0);
    expect(plan.counts.needs_review).toBe(0);
    expect(
      plan.rows.every(
        (row) =>
          row.normalized?.officialSourceUrl.startsWith("https://") &&
          row.normalized.officialApplicationUrl.startsWith("https://"),
      ),
    ).toBe(true);
  });

  it("keeps publication as an explicit admin decision", async () => {
    const dataset = await loadDataset();
    const plan = planOpportunityImport({ dataset, existing: [] });
    expect(
      plan.rows.every(
        (row) => row.proposedChanges.status === "PENDING_APPROVAL",
      ),
    ).toBe(true);
  });
});
