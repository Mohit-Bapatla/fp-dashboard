import type { PoolConfig } from "pg";

const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const SUPABASE_POOLER_SUFFIX = ".pooler.supabase.com";
const SUPABASE_PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/;

export const PRODUCTION_SUPABASE_PROJECT_REF = "ksuzzfzufotrwrxdrynl";

export const RUNTIME_DATABASE_POOL_CONFIG = Object.freeze({
  max: 1,
  min: 0,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 10_000,
  maxLifetimeSeconds: 300,
  allowExitOnIdle: true,
} satisfies Omit<PoolConfig, "connectionString" | "application_name">);

type RuntimeDatabaseEnvironment = {
  [name: string]: string | undefined;
  DATABASE_URL?: string;
  DIRECT_URL?: string;
  SUPABASE_URL?: string;
  VERCEL_ENV?: string;
};

function refusePreviewConfiguration(reason: string): never {
  throw new Error(`Unsafe Preview database configuration: ${reason}`);
}

function parsePostgresUrl(
  rawValue: string | undefined,
  variableName: "DATABASE_URL" | "DIRECT_URL",
) {
  if (!rawValue?.trim()) {
    refusePreviewConfiguration(`${variableName} is required.`);
  }

  let parsed: URL;

  try {
    parsed = new URL(rawValue);
  } catch {
    refusePreviewConfiguration(
      `${variableName} must be a valid PostgreSQL URL.`,
    );
  }

  if (!POSTGRES_PROTOCOLS.has(parsed.protocol)) {
    refusePreviewConfiguration(
      `${variableName} must use the PostgreSQL protocol.`,
    );
  }

  return parsed;
}

function projectRefFromPoolerUsername(parsed: URL) {
  const username = decodeURIComponent(parsed.username);
  const separatorIndex = username.lastIndexOf(".");

  return separatorIndex === -1 ? undefined : username.slice(separatorIndex + 1);
}

function isSupabasePoolerHost(hostname: string) {
  return hostname.endsWith(SUPABASE_POOLER_SUFFIX);
}

function createPreviewTransactionUrl(sourceUrl: URL) {
  const transactionUrl = new URL(sourceUrl);
  transactionUrl.port = "6543";
  transactionUrl.searchParams.set("pgbouncer", "true");

  return transactionUrl;
}

function previewProjectRefFromSupabaseUrl(rawValue: string | undefined) {
  if (!rawValue?.trim()) {
    refusePreviewConfiguration(
      "SUPABASE_URL is required as the approved Preview identity.",
    );
  }

  let parsed: URL;

  try {
    parsed = new URL(rawValue);
  } catch {
    refusePreviewConfiguration("SUPABASE_URL must be a valid URL.");
  }

  if (parsed.protocol !== "https:") {
    refusePreviewConfiguration("SUPABASE_URL must use HTTPS.");
  }

  const hostnameParts = parsed.hostname.split(".");
  const projectRef =
    hostnameParts.length === 3 &&
    hostnameParts[1] === "supabase" &&
    hostnameParts[2] === "co"
      ? hostnameParts[0]
      : undefined;

  if (!projectRef || !SUPABASE_PROJECT_REF_PATTERN.test(projectRef)) {
    refusePreviewConfiguration(
      "SUPABASE_URL must identify the approved Supabase Preview project.",
    );
  }

  return projectRef;
}

function assertProjectRef(
  actualProjectRef: string | undefined,
  expectedProjectRef: string,
  variableName: "DATABASE_URL" | "DIRECT_URL",
) {
  if (actualProjectRef !== expectedProjectRef) {
    refusePreviewConfiguration(
      `${variableName} does not target the approved Preview project.`,
    );
  }
}

export function validatePreviewDatabaseIsolation(
  environment: RuntimeDatabaseEnvironment,
) {
  if (environment.VERCEL_ENV !== "preview") {
    return;
  }

  const expectedProjectRef = previewProjectRefFromSupabaseUrl(
    environment.SUPABASE_URL,
  );

  if (expectedProjectRef === PRODUCTION_SUPABASE_PROJECT_REF) {
    refusePreviewConfiguration(
      "the approved Preview project must be isolated from Production.",
    );
  }

  const runtimeUrl = parsePostgresUrl(environment.DATABASE_URL, "DATABASE_URL");

  if (!isSupabasePoolerHost(runtimeUrl.hostname)) {
    refusePreviewConfiguration(
      "DATABASE_URL must use the Supabase transaction pooler.",
    );
  }

  if (runtimeUrl.port !== "5432" && runtimeUrl.port !== "6543") {
    refusePreviewConfiguration(
      "DATABASE_URL must use a supported Supabase pooler credential.",
    );
  }

  assertProjectRef(
    projectRefFromPoolerUsername(runtimeUrl),
    expectedProjectRef,
    "DATABASE_URL",
  );

  const directUrl = parsePostgresUrl(environment.DIRECT_URL, "DIRECT_URL");
  const effectiveRuntimeUrl = createPreviewTransactionUrl(runtimeUrl);

  if (directUrl.toString() === effectiveRuntimeUrl.toString()) {
    refusePreviewConfiguration(
      "DIRECT_URL must be separate from the transaction-pooled runtime URL.",
    );
  }

  if (directUrl.port !== "5432") {
    refusePreviewConfiguration(
      "DIRECT_URL must use the direct or session-pooled migration port 5432.",
    );
  }

  if (isSupabasePoolerHost(directUrl.hostname)) {
    assertProjectRef(
      projectRefFromPoolerUsername(directUrl),
      expectedProjectRef,
      "DIRECT_URL",
    );
    return;
  }

  if (directUrl.hostname !== `db.${expectedProjectRef}.supabase.co`) {
    refusePreviewConfiguration(
      "DIRECT_URL does not target the approved Preview project.",
    );
  }
}

export function resolveRuntimeDatabaseUrl(
  environment: RuntimeDatabaseEnvironment,
  fallbackDatabaseUrl: string,
) {
  const sourceUrl = environment.DATABASE_URL ?? fallbackDatabaseUrl;

  if (environment.VERCEL_ENV !== "preview") {
    return sourceUrl;
  }

  validatePreviewDatabaseIsolation(environment);

  return createPreviewTransactionUrl(new URL(sourceUrl)).toString();
}

export function createRuntimePoolConfig(connectionString: string): PoolConfig {
  return {
    connectionString,
    ...RUNTIME_DATABASE_POOL_CONFIG,
    application_name: "fp-dashboard-runtime",
  };
}
