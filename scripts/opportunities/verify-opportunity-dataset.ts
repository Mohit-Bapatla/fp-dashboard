import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { normalizeOpportunityRecord } from "../../src/lib/opportunities/import/normalization";
import { stableJson } from "../../src/lib/opportunities/import/planner";
import type { RealOpportunityDataset } from "../../src/lib/opportunities/import/types";
import { verifyOpportunityUrls } from "../../src/lib/opportunities/import/verifier";

function flagValue(args: string[], name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? (args[index + 1] ?? "") : "";
}

async function main() {
  const args = process.argv.slice(2);
  const datasetPath = flagValue(args, "--dataset");
  if (!datasetPath) throw new Error("--dataset is required.");
  const outDir = path.resolve(
    flagValue(args, "--out") ||
      path.join(
        "artifacts",
        "opportunity-import",
        "latest",
        "url-verification",
      ),
  );
  const dataset = JSON.parse(
    await readFile(path.resolve(datasetPath), "utf8"),
  ) as RealOpportunityDataset;
  const records = dataset.records.map(normalizeOpportunityRecord);
  const urls = Array.from(
    new Set(
      records.flatMap((record) => [
        record.officialSourceUrl,
        record.officialApplicationUrl,
      ]),
    ),
  );
  const results = await verifyOpportunityUrls(urls, {
    concurrency: 4,
    retries: 1,
    timeoutMs: 12_000,
  });
  const checks = results.map((result) => ({
    ...result,
    sourceKeys: records
      .filter(
        (record) =>
          record.officialSourceUrl === result.checkedUrl ||
          record.officialApplicationUrl === result.checkedUrl,
      )
      .map((record) => record.sourceKey),
  }));
  const counts = Object.fromEntries(
    checks.reduce((entries, check) => {
      entries.set(check.result, (entries.get(check.result) ?? 0) + 1);
      return entries;
    }, new Map<string, number>()),
  );
  const needsReview = checks.filter(
    (check) => !["HEALTHY", "REDIRECTED"].includes(check.result),
  );
  const markdown = [
    "# Official-source URL verification",
    "",
    `Checked: ${new Date().toISOString()}`,
    `Unique URLs: ${checks.length}`,
    "",
    "## Results",
    "",
    "| Result | Count |",
    "| --- | ---: |",
    ...Object.entries(counts).map(
      ([result, count]) => `| ${result} | ${count} |`,
    ),
    "",
    "## Human review queue",
    "",
    ...(needsReview.length
      ? needsReview.map(
          (check) =>
            `- ${check.result} ${check.httpStatus ?? ""} — ${check.checkedUrl} — ${check.errorCode ?? check.suggestedAction ?? "Review"}`,
        )
      : ["None."]),
    "",
    "Automated checks never publish, unpublish, archive, or overwrite opportunity facts.",
    "",
  ]
    .join("\n")
    .replaceAll(/[^\x00-\x7F]+/g, "--");

  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(outDir, "url-verification.json"),
      `${stableJson({ checks, counts, generatedAt: new Date().toISOString() })}\n`,
      "utf8",
    ),
    writeFile(path.join(outDir, "url-verification.md"), markdown, "utf8"),
  ]);
  process.stdout.write(
    `${JSON.stringify({ counts, needsReview: needsReview.length, outDir, urls: urls.length }, null, 2)}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Verification failed."}\n`,
  );
  process.exitCode = 1;
});
