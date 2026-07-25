import * as crypto from "node:crypto";

type ClerkKeyInput = {
  publishableKey: string | undefined;
  secretKey: string | undefined;
};

type CleanupInput = {
  fetchImpl?: typeof fetch;
  secretKey: string;
  userIds: readonly string[];
};

const LOCAL_DATABASE_HOSTS = new Set(["127.0.0.1", "localhost"]);
const RELIABILITY_DATABASE_NAME = /^fp_(?:dashboard_)?reliability(?:_test)?$/;

export function assertDisposableDatabase(value: string | undefined) {
  if (!value) {
    throw new Error("DISPOSABLE_TEST_DATABASE_URL is required.");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      "Authenticated reliability tests require a valid local disposable database URL.",
    );
  }

  const databaseName = parsed.pathname.replace(/^\//, "");
  if (
    !["postgres:", "postgresql:"].includes(parsed.protocol) ||
    !LOCAL_DATABASE_HOSTS.has(parsed.hostname) ||
    !RELIABILITY_DATABASE_NAME.test(databaseName)
  ) {
    throw new Error(
      "Authenticated reliability tests require a local disposable reliability database.",
    );
  }

  return value;
}

export function assertDevelopmentClerkKeys({
  publishableKey,
  secretKey,
}: ClerkKeyInput) {
  const normalizedSecretKey = secretKey?.trim();
  const normalizedPublishableKey = publishableKey?.trim();
  if (
    !normalizedSecretKey?.startsWith("sk_test_") ||
    !normalizedPublishableKey?.startsWith("pk_test_")
  ) {
    throw new Error(
      "Authenticated reliability tests require Clerk development keys.",
    );
  }

  return {
    publishableKey: normalizedPublishableKey,
    secretKey: normalizedSecretKey,
  };
}

export function createReliabilityRunId(
  now = Date.now(),
  uuid = crypto.randomUUID(),
) {
  const randomSuffix = uuid.replaceAll("-", "").slice(0, 12);
  if (!/^[a-f0-9]{12}$/i.test(randomSuffix)) {
    throw new Error("Reliability run IDs require a UUID-derived suffix.");
  }
  return `${now.toString(36)}${randomSuffix.toLowerCase()}`;
}

export function redactReliabilityDiagnostic(value: string) {
  return value
    .replace(
      /\b(?:sk|pk)_(?:test|live)_[a-z0-9_-]+\b/gi,
      "[REDACTED_CLERK_KEY]",
    )
    .replace(
      /\b(postgres(?:ql)?:\/\/)[^@\s]+@/gi,
      "$1[REDACTED_DATABASE_CREDENTIALS]@",
    );
}

export async function cleanupClerkUsers({
  fetchImpl = fetch,
  secretKey,
  userIds,
}: CleanupInput) {
  const uniqueUserIds = [...new Set(userIds)];
  const results = await Promise.allSettled(
    uniqueUserIds.map(async (userId) => {
      const response = await fetchImpl(
        `https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`,
        {
          headers: { authorization: `Bearer ${secretKey}` },
          method: "DELETE",
        },
      );
      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP ${response.status}`);
      }
    }),
  );
  const failures = results
    .filter((result) => result.status === "rejected")
    .map((result) =>
      result.status === "rejected" &&
      result.reason instanceof Error &&
      /^HTTP \d{3}$/.test(result.reason.message)
        ? result.reason.message
        : "network error",
    );

  if (failures.length > 0) {
    throw new Error(
      `Clerk development identity cleanup failed for ${failures.length} of ${uniqueUserIds.length} users (${failures.join(", ")}).`,
    );
  }
}
