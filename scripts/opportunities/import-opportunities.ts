import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { config as loadEnv } from "dotenv";

import {
  planOpportunityImport,
  stableJson,
  withFixtureArchivePlan,
} from "../../src/lib/opportunities/import/planner";
import { normalizeOpportunityRecord } from "../../src/lib/opportunities/import/normalization";
import { productionApprovalPhrase } from "../../src/lib/opportunities/import/production-guard";
import {
  buildOpportunityImportReport,
  renderOpportunityImportMarkdown,
  renderProductionWritePlan,
  renderPublicationReadyCsv,
} from "../../src/lib/opportunities/import/reports";
import type {
  ProductionWriteGuardInput,
  RealOpportunityDataset,
} from "../../src/lib/opportunities/import/types";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

type CliOptions = {
  allowProduction: boolean;
  approvalPhrase: string | null;
  approvedById: string | null;
  archiveFixtures: boolean;
  commit: boolean;
  datasetPath: string;
  dryRunHash: string | null;
  environment: "development" | "preview" | "production";
  expectedCount: number | null;
  expectedDatabase: string;
  expectedProjectRef: string;
  expectedSchema: string;
  outDir: string;
  submittedById: string | null;
};

function flagValue(args: string[], name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? (args[index + 1] ?? "") : "";
}

function parseCount(value: string) {
  if (!value) return null;
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 ? count : null;
}

function parseOptions(args: string[]): CliOptions {
  const environment = flagValue(args, "--environment") || "production";
  if (!["development", "preview", "production"].includes(environment)) {
    throw new Error(
      "--environment must be development, preview, or production.",
    );
  }
  const datasetPath = flagValue(args, "--dataset");
  if (!datasetPath) throw new Error("--dataset is required.");

  return {
    allowProduction: args.includes("--allow-production"),
    approvalPhrase: flagValue(args, "--approval-phrase") || null,
    approvedById: flagValue(args, "--approved-by") || null,
    archiveFixtures: args.includes("--archive-fixtures"),
    commit: args.includes("--commit"),
    datasetPath,
    dryRunHash: flagValue(args, "--dry-run-hash") || null,
    environment: environment as CliOptions["environment"],
    expectedCount: parseCount(flagValue(args, "--expected-count")),
    expectedDatabase: flagValue(args, "--expected-database") || "postgres",
    expectedProjectRef: flagValue(args, "--expected-project-ref"),
    expectedSchema: flagValue(args, "--expected-schema") || "public",
    outDir:
      flagValue(args, "--out") ||
      path.join("artifacts", "opportunity-import", "latest"),
    submittedById: flagValue(args, "--submitted-by") || null,
  };
}

function projectRefFromEnvironment() {
  const candidates = [process.env.SUPABASE_URL, process.env.DATABASE_URL];
  for (const candidate of candidates) {
    const match = candidate?.match(/([a-z0-9]{20})\.supabase\.co/i);
    if (match) return match[1];
  }
  return "unknown";
}

function actionRows(
  plan: ReturnType<typeof planOpportunityImport>,
  action: string,
) {
  return plan.rows.filter((row) => row.action === action);
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const absoluteDatasetPath = path.resolve(options.datasetPath);
  const rawDataset = await readFile(absoluteDatasetPath, "utf8");
  const dataset = JSON.parse(rawDataset) as RealOpportunityDataset;
  const { loadExistingOpportunityImportState, loadImportDatabaseIdentity } =
    await import("../../src/lib/opportunities/import/database");
  const [state, identity] = await Promise.all([
    loadExistingOpportunityImportState(),
    loadImportDatabaseIdentity(),
  ]);
  let plan = planOpportunityImport({ dataset, existing: state.opportunities });
  if (options.archiveFixtures) {
    plan = withFixtureArchivePlan(plan, state.opportunities);
  }
  const report = buildOpportunityImportReport(plan);
  const approvalPlan = { ...plan, generatedAt: undefined };
  const approvalReport = { ...report, generatedAt: undefined };
  const reportHash = createHash("sha256")
    .update(stableJson({ plan: approvalPlan, report: approvalReport }))
    .digest("hex");
  const dryRunJson = `${stableJson({ approvalDigest: reportHash, plan, report })}\n`;
  const demoCount = state.opportunities.filter((item) =>
    /demo|smoke|tester/i.test(
      `${item.id} ${item.organizationName} ${String(item.snapshot.title ?? "")}`,
    ),
  ).length;
  const projectRef = projectRefFromEnvironment();

  await mkdir(path.resolve(options.outDir), { recursive: true });
  const outputs: Array<[string, string]> = [
    ["dry-run.json", dryRunJson],
    ["dry-run.md", renderOpportunityImportMarkdown(plan)],
    ["publication-ready.csv", renderPublicationReadyCsv(plan)],
    [
      "normalized-dataset.json",
      `${stableJson({
        ...dataset,
        records: dataset.records.map(normalizeOpportunityRecord),
      })}\n`,
    ],
    ["duplicate-report.json", `${stableJson(actionRows(plan, "DUPLICATE"))}\n`],
    ["rejected-report.json", `${stableJson(actionRows(plan, "REJECT"))}\n`],
    [
      "needs-review-report.json",
      `${stableJson(actionRows(plan, "NEEDS_REVIEW"))}\n`,
    ],
    [
      "production-write-plan.md",
      renderProductionWritePlan({
        currentOpportunityCount: identity.opportunityCount,
        database: identity.database,
        demoCount,
        dryRunHash: reportHash,
        environment: options.environment,
        plan,
        projectRef,
        schema: identity.schema,
      }),
    ],
  ];
  await Promise.all(
    outputs.map(([name, content]) =>
      writeFile(path.join(path.resolve(options.outDir), name), content, "utf8"),
    ),
  );

  const approvalPhrase = productionApprovalPhrase({
    dryRunHash: reportHash,
    observedOpportunityCount: identity.opportunityCount,
    projectRef,
  });
  process.stdout.write(
    `${JSON.stringify(
      {
        approvalPhrase,
        database: identity,
        dryRunHash: reportHash,
        outputDirectory: path.resolve(options.outDir),
        planCounts: plan.counts,
        projectRef,
        schemaReady: state.schemaReady,
      },
      null,
      2,
    )}\n`,
  );

  if (!options.commit) return;
  const expectedProjectRef = options.expectedProjectRef;
  if (!expectedProjectRef) {
    throw new Error("--expected-project-ref is required for commit mode.");
  }
  const guard: ProductionWriteGuardInput = {
    allowProduction: options.allowProduction,
    approvalPhrase: options.approvalPhrase,
    commit: true,
    database: identity.database,
    dryRunHash: options.dryRunHash,
    environment: options.environment,
    expectedDatabase: options.expectedDatabase,
    expectedDryRunHash: reportHash,
    expectedOpportunityCount: options.expectedCount,
    expectedProjectRef,
    expectedSchema: options.expectedSchema,
    observedOpportunityCount: identity.opportunityCount,
    projectRef,
    schema: identity.schema,
  };
  const { commitOpportunityImport } =
    await import("../../src/lib/opportunities/import/database");
  const result = await commitOpportunityImport({
    actorId: options.submittedById,
    approvedById: options.approvedById,
    guard,
    plan,
    report,
    sourceFileName: path.basename(absoluteDatasetPath),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Import failed.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
