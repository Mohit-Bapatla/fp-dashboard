import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const validationScript = resolve(
  process.cwd(),
  "scripts/validate-migrations.mjs",
);
const localValidationUrl =
  "postgresql://postgres:postgres@127.0.0.1:55432/fp_dashboard_migration_validation";

function runGuard(databaseUrl: string) {
  return spawnSync(process.execPath, [validationScript], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      MIGRATION_VALIDATION_DATABASE_URL: databaseUrl,
    },
    timeout: 10_000,
  });
}

describe("migration validation database guard", () => {
  it.each([
    ["host", `${localValidationUrl}?schema=public&host=example.com`],
    ["port", `${localValidationUrl}?schema=public&port=6543`],
    [
      "options",
      `${localValidationUrl}?schema=public&options=-csearch_path%3Dpublic`,
    ],
  ])("rejects the %s connection override", (parameter, databaseUrl) => {
    const result = runGuard(databaseUrl);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(output).toContain(
      `Validation refused: MIGRATION_VALIDATION_DATABASE_URL includes unsupported connection parameter "${parameter}". Only "schema=public" is allowed.`,
    );
  });

  it("rejects duplicate schema parameters", () => {
    const result = runGuard(
      `${localValidationUrl}?schema=public&schema=public`,
    );
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(output).toContain(
      'Validation refused: MIGRATION_VALIDATION_DATABASE_URL must not repeat the "schema" connection parameter.',
    );
  });
});
