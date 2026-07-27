import { describe, expect, it } from "vitest";

import {
  createRuntimePoolConfig,
  PRODUCTION_SUPABASE_PROJECT_REF,
  RUNTIME_DATABASE_POOL_CONFIG,
  validatePreviewDatabaseIsolation,
} from "@/lib/db/runtime-database-config";

const previewProjectRef = "fjagysinaodnpxcdgogp";
const previewEnvironment = {
  VERCEL_ENV: "preview",
  PREVIEW_DATABASE_PROJECT_REF: previewProjectRef,
  DATABASE_URL: `postgresql://postgres.${previewProjectRef}:secret@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require`,
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

  it("accepts a session-pooled migration path for the same project", () => {
    expect(() =>
      validatePreviewDatabaseIsolation({
        ...previewEnvironment,
        DIRECT_URL: `postgresql://postgres.${previewProjectRef}:secret@aws-0-ca-central-1.pooler.supabase.com:5432/postgres?sslmode=require`,
      }),
    ).not.toThrow();
  });

  it("rejects a session-pooled runtime URL", () => {
    expect(() =>
      validatePreviewDatabaseIsolation({
        ...previewEnvironment,
        DATABASE_URL: previewEnvironment.DATABASE_URL.replace("6543", "5432"),
      }),
    ).toThrow(/transaction pooling on port 6543/);
  });

  it("rejects the production project for Preview", () => {
    expect(() =>
      validatePreviewDatabaseIsolation({
        ...previewEnvironment,
        PREVIEW_DATABASE_PROJECT_REF: PRODUCTION_SUPABASE_PROJECT_REF,
      }),
    ).toThrow(/isolated from Production/);
  });

  it.each([
    ["PREVIEW_DATABASE_PROJECT_REF", undefined],
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
