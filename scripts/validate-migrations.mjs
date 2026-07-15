import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const targetMigration = "20260711074500_opportunity_navigator_mvp";
const upgradeSchema = "upgrade_validation";
const temporaryDirectoryPrefix = "fp-dashboard-migration-validation-";
const privateWorkflowTables = [
  "SavedOpportunity",
  "ApplicationChecklistItem",
  "OpportunityCorrectionReport",
];
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceMigrationsDirectory = join(repositoryRoot, "prisma", "migrations");
const validationConfigPath = join(
  repositoryRoot,
  "scripts",
  "prisma-migration-validation.config.ts",
);

await main().catch((error) => {
  console.error(
    `Migration validation failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode =
    typeof error === "object" &&
    error !== null &&
    "exitCode" in error &&
    typeof error.exitCode === "number"
      ? error.exitCode
      : 1;
});

async function main() {
  const validationDatabaseUrl = readAndValidateDatabaseUrl();
  const prismaCliPath = resolvePrismaCli();
  const stagedBaseline = stageBaselineMigrations();

  try {
    validateFullHistory({
      databaseUrl: validationDatabaseUrl,
      migrationsPath: sourceMigrationsDirectory,
      prismaCliPath,
    });
    await assertPrivateWorkflowRls(validationDatabaseUrl, "public");

    await validateRepresentativeUpgrade({
      baselineMigrationsPath: stagedBaseline.migrationsPath,
      databaseUrl: validationDatabaseUrl,
      fullMigrationsPath: sourceMigrationsDirectory,
      prismaCliPath,
    });
  } finally {
    removeStagedBaseline(stagedBaseline.root);
  }

  console.log(
    "Migration history, schema parity, and the representative pre-navigator upgrade all passed on the disposable database.",
  );
}

function readAndValidateDatabaseUrl() {
  const validationDatabaseUrl =
    process.env.MIGRATION_VALIDATION_DATABASE_URL?.trim();

  if (!validationDatabaseUrl) {
    refuse(
      "MIGRATION_VALIDATION_DATABASE_URL is required. Use a disposable local PostgreSQL database; DATABASE_URL and DIRECT_URL are intentionally ignored.",
    );
  }

  let parsedDatabaseUrl;

  try {
    parsedDatabaseUrl = new URL(validationDatabaseUrl);
  } catch {
    refuse("MIGRATION_VALIDATION_DATABASE_URL must be a valid PostgreSQL URL.");
  }

  if (!["postgres:", "postgresql:"].includes(parsedDatabaseUrl.protocol)) {
    refuse(
      "MIGRATION_VALIDATION_DATABASE_URL must use postgres:// or postgresql://.",
    );
  }

  const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

  if (!loopbackHosts.has(parsedDatabaseUrl.hostname)) {
    refuse(
      `Refusing migration validation against non-loopback host "${parsedDatabaseUrl.hostname}".`,
    );
  }

  const databaseName = decodeURIComponent(
    parsedDatabaseUrl.pathname.replace(/^\//, ""),
  );

  if (databaseName !== "fp_dashboard_migration_validation") {
    refuse(
      `Refusing migration validation against database "${databaseName || "(missing)"}". Expected "fp_dashboard_migration_validation".`,
    );
  }

  const connectionParameters = [...parsedDatabaseUrl.searchParams.entries()];
  const unsupportedParameters = [
    ...new Set(
      connectionParameters
        .map(([name]) => name)
        .filter((name) => name !== "schema"),
    ),
  ];

  if (unsupportedParameters.length > 0) {
    refuse(
      `MIGRATION_VALIDATION_DATABASE_URL includes unsupported connection parameter${unsupportedParameters.length === 1 ? "" : "s"} ${unsupportedParameters.map((name) => `"${name}"`).join(", ")}. Only "schema=public" is allowed.`,
    );
  }

  const schemaValues = parsedDatabaseUrl.searchParams.getAll("schema");

  if (schemaValues.length > 1) {
    refuse(
      'MIGRATION_VALIDATION_DATABASE_URL must not repeat the "schema" connection parameter.',
    );
  }

  const schemaName = schemaValues[0];

  if (schemaName && schemaName !== "public") {
    refuse(
      `Refusing migration validation against schema "${schemaName}". Expected "public".`,
    );
  }

  // Reconstruct the query string after validation so PostgreSQL parsers cannot
  // reinterpret host, port, SSL, or session options after the loopback check.
  parsedDatabaseUrl.search = "";
  parsedDatabaseUrl.searchParams.set("schema", "public");
  return parsedDatabaseUrl.toString();
}

function resolvePrismaCli() {
  const require = createRequire(import.meta.url);

  try {
    return require.resolve("prisma/build/index.js");
  } catch {
    throw new Error(
      "Prisma is not installed. Run npm ci before validating migrations.",
    );
  }
}

function stageBaselineMigrations() {
  const migrationDirectories = readdirSync(sourceMigrationsDirectory, {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const targetIndex = migrationDirectories.indexOf(targetMigration);

  if (targetIndex <= 0) {
    throw new Error(
      `Expected ${targetMigration} after at least one baseline migration.`,
    );
  }

  const temporaryRoot = mkdtempSync(
    join(resolve(tmpdir()), temporaryDirectoryPrefix),
  );
  const stagedMigrationsDirectory = join(temporaryRoot, "migrations");

  try {
    mkdirSync(stagedMigrationsDirectory);
    cpSync(
      join(sourceMigrationsDirectory, "migration_lock.toml"),
      join(stagedMigrationsDirectory, "migration_lock.toml"),
    );

    for (const migrationDirectory of migrationDirectories.slice(
      0,
      targetIndex,
    )) {
      cpSync(
        join(sourceMigrationsDirectory, migrationDirectory),
        join(stagedMigrationsDirectory, migrationDirectory),
        { recursive: true },
      );
    }
  } catch (error) {
    removeStagedBaseline(temporaryRoot);
    throw error;
  }

  console.log(
    `Staged ${targetIndex} migrations preceding ${targetMigration} for upgrade validation.`,
  );

  return {
    migrationsPath: stagedMigrationsDirectory,
    root: temporaryRoot,
  };
}

function removeStagedBaseline(temporaryRoot) {
  const resolvedTemporaryRoot = resolve(temporaryRoot);
  const resolvedSystemTemp = resolve(tmpdir());
  const expectedPrefix = `${resolvedSystemTemp}${sep}`;

  if (
    !resolvedTemporaryRoot.startsWith(expectedPrefix) ||
    !basename(resolvedTemporaryRoot).startsWith(temporaryDirectoryPrefix)
  ) {
    throw new Error(
      `Refusing to remove unexpected temporary path "${resolvedTemporaryRoot}".`,
    );
  }

  rmSync(resolvedTemporaryRoot, { force: true, recursive: true });
}

function validateFullHistory({ databaseUrl, migrationsPath, prismaCliPath }) {
  console.log("Validating the complete migration history in schema public.");
  runPrisma({
    arguments_: ["migrate", "deploy"],
    databaseUrl,
    migrationsPath,
    prismaCliPath,
  });
  runPrisma({
    arguments_: ["migrate", "status"],
    databaseUrl,
    migrationsPath,
    prismaCliPath,
  });
  runPrisma({
    arguments_: [
      "migrate",
      "diff",
      "--from-config-datasource",
      "--to-schema=prisma/schema.prisma",
      "--exit-code",
    ],
    databaseUrl,
    migrationsPath,
    prismaCliPath,
  });
}

async function validateRepresentativeUpgrade({
  baselineMigrationsPath,
  databaseUrl,
  fullMigrationsPath,
  prismaCliPath,
}) {
  const upgradeDatabaseUrl = new URL(databaseUrl);
  upgradeDatabaseUrl.searchParams.set("schema", upgradeSchema);
  const upgradeUrl = upgradeDatabaseUrl.toString();

  await resetUpgradeSchema(upgradeUrl);

  try {
    console.log(
      `Applying the pre-${targetMigration} history in schema ${upgradeSchema}.`,
    );
    runPrisma({
      arguments_: ["migrate", "deploy"],
      databaseUrl: upgradeUrl,
      migrationsPath: baselineMigrationsPath,
      prismaCliPath,
    });

    await seedRepresentativeLegacyOpportunities(upgradeUrl);

    console.log(
      `Upgrading representative legacy records through ${targetMigration}.`,
    );
    runPrisma({
      arguments_: ["migrate", "deploy"],
      databaseUrl: upgradeUrl,
      migrationsPath: fullMigrationsPath,
      prismaCliPath,
    });
    runPrisma({
      arguments_: ["migrate", "status"],
      databaseUrl: upgradeUrl,
      migrationsPath: fullMigrationsPath,
      prismaCliPath,
    });
    runPrisma({
      arguments_: [
        "migrate",
        "diff",
        "--from-config-datasource",
        "--to-schema=prisma/schema.prisma",
        "--exit-code",
      ],
      databaseUrl: upgradeUrl,
      migrationsPath: fullMigrationsPath,
      prismaCliPath,
    });

    await assertPrivateWorkflowRls(upgradeUrl, upgradeSchema);
    await assertRepresentativeUpgrade(upgradeUrl);
  } finally {
    await dropUpgradeSchema(upgradeUrl);
  }
}

async function assertPrivateWorkflowRls(databaseUrl, schemaName) {
  await withPostgresClient(databaseUrl, async (client) => {
    const rlsResult = await client.query(
      `SELECT relation.relname, relation.relrowsecurity
       FROM pg_class AS relation
       JOIN pg_namespace AS relation_namespace
         ON relation_namespace.oid = relation.relnamespace
       WHERE relation_namespace.nspname = $1
         AND relation.relname = ANY($2::text[])
       ORDER BY relation.relname`,
      [schemaName, privateWorkflowTables],
    );

    if (rlsResult.rows.length !== privateWorkflowTables.length) {
      throw new Error(
        `Expected ${privateWorkflowTables.length} private workflow tables in schema ${schemaName}; found ${rlsResult.rows.length}.`,
      );
    }

    for (const row of rlsResult.rows) {
      if (row.relrowsecurity !== true) {
        throw new Error(
          `Row-level security is not enabled on ${schemaName}.${row.relname}.`,
        );
      }
    }

    const policyResult = await client.query(
      `SELECT count(*)::integer AS policy_count
       FROM pg_policies
       WHERE schemaname = $1
         AND tablename = ANY($2::text[])`,
      [schemaName, privateWorkflowTables],
    );
    const policyCount = policyResult.rows[0]?.policy_count;

    if (policyCount !== 0) {
      throw new Error(
        `Expected no Data API policies on private workflow tables in schema ${schemaName}; found ${policyCount}.`,
      );
    }

    console.log(
      `RLS is enabled with no policies on all private workflow tables in schema ${schemaName}.`,
    );
  });
}

async function resetUpgradeSchema(databaseUrl) {
  await withPostgresClient(databaseUrl, async (client) => {
    await client.query(`DROP SCHEMA IF EXISTS "${upgradeSchema}" CASCADE`);
    await client.query(`CREATE SCHEMA "${upgradeSchema}"`);
  });
}

async function dropUpgradeSchema(databaseUrl) {
  await withPostgresClient(databaseUrl, async (client) => {
    await client.query(`DROP SCHEMA IF EXISTS "${upgradeSchema}" CASCADE`);
  });
}

async function seedRepresentativeLegacyOpportunities(databaseUrl) {
  await withPostgresClient(databaseUrl, async (client) => {
    await client.query(
      `INSERT INTO "${upgradeSchema}"."PartnerOrganization" ("id", "name", "updatedAt")
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      ["upgrade-validation-org", "Upgrade Validation Organization"],
    );
    await client.query(
      `INSERT INTO "${upgradeSchema}"."Opportunity"
       ("id", "organizationId", "title", "type", "status", "updatedAt")
       VALUES
         ($1, $4, $5, 'PROGRAM', 'PUBLISHED', CURRENT_TIMESTAMP),
         ($2, $4, $6, 'PROGRAM', 'CLOSED', CURRENT_TIMESTAMP),
         ($3, $4, $7, 'PROGRAM', 'ARCHIVED', CURRENT_TIMESTAMP)`,
      [
        "legacy-published",
        "legacy-closed",
        "legacy-archived",
        "upgrade-validation-org",
        "Legacy Published Opportunity",
        "Legacy Closed Opportunity",
        "Legacy Archived Opportunity",
      ],
    );
  });
}

async function assertRepresentativeUpgrade(databaseUrl) {
  await withPostgresClient(databaseUrl, async (client) => {
    const opportunityResult = await client.query(
      `SELECT "id", "status", "availabilityStatus", "verificationStatus"
       FROM "${upgradeSchema}"."Opportunity"
       WHERE "id" = ANY($1::text[])
       ORDER BY "id"`,
      [["legacy-published", "legacy-closed", "legacy-archived"]],
    );
    const expectedOpportunities = new Map([
      ["legacy-archived", ["ARCHIVED", "ARCHIVED", "ARCHIVED"]],
      ["legacy-closed", ["CLOSED", "CLOSED", "NEEDS_REVIEW"]],
      ["legacy-published", ["PENDING_APPROVAL", "OPEN", "NEEDS_REVIEW"]],
    ]);

    if (opportunityResult.rows.length !== expectedOpportunities.size) {
      throw new Error(
        `Expected ${expectedOpportunities.size} representative opportunities after upgrade; found ${opportunityResult.rows.length}.`,
      );
    }

    for (const row of opportunityResult.rows) {
      const expected = expectedOpportunities.get(row.id);
      const actual = [
        row.status,
        row.availabilityStatus,
        row.verificationStatus,
      ];

      if (
        !expected ||
        actual.some((value, index) => value !== expected[index])
      ) {
        throw new Error(
          `Unexpected upgrade result for ${row.id}: ${actual.join(", ")}.`,
        );
      }
    }

    const enumResult = await client.query(
      `SELECT enum_value.enumlabel
       FROM pg_enum AS enum_value
       JOIN pg_type AS enum_type ON enum_type.oid = enum_value.enumtypid
       JOIN pg_namespace AS enum_namespace ON enum_namespace.oid = enum_type.typnamespace
       WHERE enum_namespace.nspname = $1
         AND enum_type.typname = 'ApplicationStatus'`,
      [upgradeSchema],
    );
    const applicationStatuses = new Set(
      enumResult.rows.map((row) => row.enumlabel),
    );
    const requiredStatuses = [
      "SAVED",
      "PLANNING",
      "PREPARING",
      "WAITING_FOR_RECOMMENDATION",
      "READY_TO_SUBMIT",
      "WAITLISTED",
    ];

    for (const status of requiredStatuses) {
      if (!applicationStatuses.has(status)) {
        throw new Error(
          `ApplicationStatus is missing expected value "${status}" after upgrade.`,
        );
      }
    }

    console.log(
      "Representative published, closed, and archived opportunity transitions and application statuses are correct.",
    );
  });
}

async function withPostgresClient(databaseUrl, callback) {
  const connectionUrl = new URL(databaseUrl);
  connectionUrl.searchParams.delete("schema");
  const client = new Client({ connectionString: connectionUrl.toString() });

  await client.connect();

  try {
    await callback(client);
  } finally {
    await client.end();
  }
}

function runPrisma({ arguments_, databaseUrl, migrationsPath, prismaCliPath }) {
  const childEnvironment = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: databaseUrl,
    MIGRATION_VALIDATION_ACTIVE_DATABASE_URL: databaseUrl,
    MIGRATION_VALIDATION_MIGRATIONS_PATH: migrationsPath,
  };
  const result = spawnSync(
    process.execPath,
    [prismaCliPath, ...arguments_, "--config", validationConfigPath],
    {
      cwd: repositoryRoot,
      env: childEnvironment,
      stdio: "inherit",
    },
  );

  if (result.error) {
    throw new Error(`Unable to run Prisma: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const error = new Error(
      `Prisma ${arguments_.join(" ")} exited with status ${result.status ?? 1}.`,
    );
    error.exitCode = result.status ?? 1;
    throw error;
  }
}

function refuse(message) {
  throw new Error(`Validation refused: ${message}`);
}
