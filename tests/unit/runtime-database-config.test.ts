import { describe, expect, it } from "vitest";

import {
  createRuntimePoolConfig,
  PRODUCTION_SUPABASE_PROJECT_REF,
  resolveRuntimeDatabaseUrl,
  RUNTIME_DATABASE_POOL_CONFIG,
  validatePreviewDatabaseIsolation,
} from "@/lib/db/runtime-database-config";

const previewProjectRef = "fjagysinaodnpxcdgogp";
const previewEnvironment = {
  VERCEL_ENV: "preview",
  SUPABASE_URL: `https://${previewProjectRef}.supabase.co`,
  DATABASE_URL: `postgresql://postgres.${previewProjectRef}:secret@aws-0-ca-central-1.pooler.supabase.com:5432/postgres?sslmode=require`,
  DIRECT_URL: `postgresql://postgres:secret@db.${previewProjectRef}.supabase.co:5432/postgres?sslmode=require`,
} as const;

describe("runtime database configuration", () => {
  it("uses one bounded connection per serverless instance", () => {
    expect(RUNTIME_DATABASE_POOL_CONFIG).toEqual({
      max: 1,
      min: 0,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 10_000,
      maxLifetimeSeconds: 300,
      allowExitOnIdle: true,
    });

    expect(
      createRuntimePoolConfig("postgresql://example.invalid/database"),
    ).toMatchObject({
      max: 1,
      min: 0,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 10_000,
      maxLifetimeSeconds: 300,
      allowExitOnIdle: true,
      application_name: "fp-dashboard-runtime",
    });
  });

  it("accepts an isolated transaction runtime and direct migration path", () => {
    expect(() =>
      validatePreviewDatabaseIsolation(previewEnvironment),
    ).not.toThrow();
  });

  it("derives a transaction-pooled runtime URL from the protected pooler credential", () => {
    const resolved = new URL(
      resolveRuntimeDatabaseUrl(
        previewEnvironment,
        "postgresql://fallback.invalid/database",
      ),
    );

    expect(resolved.port).toBe("6543");
    expect(resolved.searchParams.get("pgbouncer")).toBe("true");
    expect(resolved.hostname).toBe("aws-0-ca-central-1.pooler.supabase.com");
    expect(decodeURIComponent(resolved.username)).toBe(
      `postgres.${previewProjectRef}`,
    );
  });

  it("accepts a session-pooled migration path for the same project", () => {
    expect(() =>
      validatePreviewDatabaseIsolation({
        ...previewEnvironment,
        DIRECT_URL: `postgresql://postgres.${previewProjectRef}:secret@aws-0-ca-central-1.pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=10`,
      }),
    ).not.toThrow();
  });

  it("rejects a direct runtime URL", () => {
    expect(() =>
      validatePreviewDatabaseIsolation({
        ...previewEnvironment,
        DATABASE_URL: previewEnvironment.DIRECT_URL,
      }),
    ).toThrow(/must use the Supabase transaction pooler/);
  });

  it("rejects the production project for Preview", () => {
    expect(() =>
      validatePreviewDatabaseIsolation({
        ...previewEnvironment,
        SUPABASE_URL: `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`,
      }),
    ).toThrow(/isolated from Production/);
  });

  it.each([
    ["SUPABASE_URL", undefined],
    ["DATABASE_URL", undefined],
    ["DIRECT_URL", undefined],
  ] as const)("rejects Preview when %s is missing", (key, value) => {
    expect(() =>
      validatePreviewDatabaseIsolation({
        ...previewEnvironment,
        [key]: value,
      }),
    ).toThrow(/Unsafe Preview database configuration/);
  });

  it("rejects a mismatched runtime project without exposing credentials", () => {
    const secret = "do-not-print-this-secret";

    expect(() =>
      validatePreviewDatabaseIsolation({
        ...previewEnvironment,
        DATABASE_URL: previewEnvironment.DATABASE_URL.replace(
          "secret",
          secret,
        ).replace(previewProjectRef, "aaaaaaaaaaaaaaaaaaaa"),
      }),
    ).toThrowError(
      expect.objectContaining({
        message: expect.not.stringContaining(secret),
      }),
    );
  });

  it("does not impose Preview identity rules outside Vercel Preview", () => {
    expect(() =>
      validatePreviewDatabaseIsolation({
        VERCEL_ENV: "production",
      }),
    ).not.toThrow();
  });
});
