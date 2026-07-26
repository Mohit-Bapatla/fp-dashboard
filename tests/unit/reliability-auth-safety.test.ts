import { describe, expect, it, vi } from "vitest";

import {
  assertDevelopmentClerkKeys,
  assertDisposableDatabase,
  cleanupClerkUsers,
  createReliabilityRunId,
  redactReliabilityDiagnostic,
} from "../reliability-auth/safety";

describe("authenticated reliability safety", () => {
  it("accepts only an explicitly local disposable PostgreSQL database", () => {
    const local =
      "postgresql://postgres:postgres@127.0.0.1:5432/fp_dashboard_reliability_test?schema=public";
    expect(assertDisposableDatabase(local)).toBe(local);
    expect(() =>
      assertDisposableDatabase(
        "postgresql://user:password@db.example.supabase.co:5432/postgres",
      ),
    ).toThrow("local disposable reliability database");
    expect(() =>
      assertDisposableDatabase(
        "postgresql://user:password@localhost:5432/production",
      ),
    ).toThrow("local disposable reliability database");
  });

  it("rejects missing and production Clerk keys", () => {
    expect(() =>
      assertDevelopmentClerkKeys({
        publishableKey: undefined,
        secretKey: undefined,
      }),
    ).toThrow("Clerk development keys");
    expect(() =>
      assertDevelopmentClerkKeys({
        publishableKey: "pk_live_public",
        secretKey: "sk_live_secret",
      }),
    ).toThrow("Clerk development keys");
    expect(
      assertDevelopmentClerkKeys({
        publishableKey: "pk_test_public",
        secretKey: "sk_test_secret",
      }),
    ).toEqual({
      publishableKey: "pk_test_public",
      secretKey: "sk_test_secret",
    });
  });

  it("creates UUID-backed unique disposable run IDs", () => {
    const first = createReliabilityRunId(
      1_721_824_000_000,
      "00000000-0001-4000-8000-000000000000",
    );
    const second = createReliabilityRunId(
      1_721_824_000_000,
      "00000000-0002-4000-8000-000000000000",
    );
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[a-z0-9]+$/);
  });

  it("redacts keys, cookies, tokens, and passwords from diagnostics", () => {
    const diagnostic = redactReliabilityDiagnostic(
      [
        "sk_test_secret pk_live_public",
        "postgresql://user:database-password@localhost:5432/db",
        "Authorization: Bearer clerk-session-token",
        "Cookie: __session=session-cookie-value",
        "access_token=oauth-token-value",
        "password=plaintext-password",
      ].join("\n"),
    );
    expect(diagnostic).not.toContain("secret");
    expect(diagnostic).not.toContain("database-password");
    expect(diagnostic).not.toContain("clerk-session-token");
    expect(diagnostic).not.toContain("session-cookie-value");
    expect(diagnostic).not.toContain("oauth-token-value");
    expect(diagnostic).not.toContain("plaintext-password");
    expect(diagnostic).toContain("[REDACTED_CLERK_KEY]");
    expect(diagnostic).toContain("[REDACTED_DATABASE_CREDENTIALS]");
    expect(diagnostic).toContain("[REDACTED_TOKEN]");
    expect(diagnostic).toContain("[REDACTED_COOKIE]");
    expect(diagnostic).toContain("[REDACTED_PASSWORD]");
  });

  it("accepts successful or already-absent identity cleanup", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }));

    await expect(
      cleanupClerkUsers({
        fetchImpl,
        secretKey: "sk_test_never-log",
        userIds: ["user_one", "user_two", "user_two"],
      }),
    ).resolves.toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fails cleanup without exposing keys or identity IDs", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockRejectedValueOnce(new Error("sk_test_never-log user_two"));

    let error: unknown;
    try {
      await cleanupClerkUsers({
        fetchImpl,
        secretKey: "sk_test_never-log",
        userIds: ["user_one", "user_two"],
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(
      "Clerk development identity cleanup failed for 2 of 2 users (HTTP 500, network error).",
    );
    expect((error as Error).message).not.toContain("sk_test_never-log");
    expect((error as Error).message).not.toContain("user_two");
  });
});
