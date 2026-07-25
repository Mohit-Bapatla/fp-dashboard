import { spawn } from "node:child_process";
import * as crypto from "node:crypto";

import { clerkSetup } from "@clerk/testing/playwright";
import { config as loadDotenv } from "dotenv";

type FixtureRole = "ADMIN" | "PARTNER" | "STUDENT";
type ClerkUser = { id: string };

const createdUserIds: string[] = [];

function assertDisposableDatabase(value: string | undefined) {
  if (!value) {
    throw new Error("DISPOSABLE_TEST_DATABASE_URL is required.");
  }

  const parsed = new URL(value);
  const databaseName = parsed.pathname.replace(/^\//, "");
  if (
    !["127.0.0.1", "localhost"].includes(parsed.hostname) ||
    !/^fp_(?:dashboard_)?reliability(?:_test)?$/.test(databaseName)
  ) {
    throw new Error(
      "Authenticated reliability tests require a local disposable reliability database.",
    );
  }

  return value;
}

function assertDevelopmentClerkKeys() {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (
    !secretKey?.startsWith("sk_test_") ||
    !publishableKey?.startsWith("pk_test_")
  ) {
    throw new Error(
      "Authenticated reliability tests require Clerk development keys.",
    );
  }
  return secretKey;
}

async function createClerkUser({
  email,
  firstName,
  lastName,
  password,
  role,
  secretKey,
}: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: FixtureRole;
  secretKey: string;
}) {
  const response = await fetch("https://api.clerk.com/v1/users", {
    body: JSON.stringify({
      email_address: [email],
      first_name: firstName,
      last_name: lastName,
      password,
      public_metadata: { role },
      skip_password_checks: true,
    }),
    headers: {
      authorization: `Bearer ${secretKey}`,
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      errors?: Array<{ code?: string; meta?: { param_name?: string } }>;
    } | null;
    const safeReasons =
      payload?.errors
        ?.map(
          (item) =>
            `${item.code ?? "unknown"}${
              item.meta?.param_name ? `:${item.meta.param_name}` : ""
            }`,
        )
        .join(",") || "no-code";
    throw new Error(
      `Clerk development user creation failed (${response.status}; ${safeReasons}).`,
    );
  }

  const user = (await response.json()) as ClerkUser;
  createdUserIds.push(user.id);
  return user;
}

function runFixtureSeed(databaseUrl: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        "node_modules/tsx/dist/cli.mjs",
        "scripts/seed-disposable-reliability-fixtures.ts",
      ],
      {
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
          DIRECT_URL: databaseUrl,
          NODE_ENV: "test",
        },
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let errorOutput = "";
    child.stderr.on("data", (chunk: Buffer) => {
      errorOutput += chunk.toString();
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Disposable fixture seed failed (${code ?? "unknown"}): ${
              errorOutput.trim().split(/\r?\n/).at(-1) ?? "no diagnostic"
            }`,
          ),
        );
      }
    });
  });
}

async function removeCreatedUsers(secretKey: string) {
  await Promise.allSettled(
    createdUserIds.map((userId) =>
      fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, {
        headers: { authorization: `Bearer ${secretKey}` },
        method: "DELETE",
      }),
    ),
  );
}

export default async function globalSetup() {
  loadDotenv({ path: ".env.local", quiet: true });
  const databaseUrl = assertDisposableDatabase(
    process.env.DISPOSABLE_TEST_DATABASE_URL,
  );
  const secretKey = assertDevelopmentClerkKeys();
  await clerkSetup();

  const runId = `${Date.now().toString(36)}${crypto
    .randomUUID()
    .replaceAll("-", "")
    .slice(0, 6)}`;
  const definitions = [
    ["STUDENT_A", "Reliability", "Student A", "STUDENT"],
    ["STUDENT_B", "Reliability", "Student B", "STUDENT"],
    ["PARTNER_A", "Reliability", "Partner A", "PARTNER"],
    ["PARTNER_B", "Reliability", "Partner B", "PARTNER"],
    ["ADMIN", "Reliability", "Admin", "ADMIN"],
  ] as const;

  try {
    for (const [key, firstName, lastName, role] of definitions) {
      const email = `fp-${key.toLowerCase()}+clerk_test_${runId}@example.com`;
      const user = await createClerkUser({
        email,
        firstName,
        lastName,
        password: `R!${runId}aA9`,
        role,
        secretKey,
      });
      process.env[`DISPOSABLE_${key}_CLERK_ID`] = user.id;
      process.env[`DISPOSABLE_${key}_EMAIL`] = email;
      process.env[`E2E_${key}_EMAIL`] = email;
    }

    process.env.DATABASE_URL = databaseUrl;
    process.env.DIRECT_URL = databaseUrl;
    await runFixtureSeed(databaseUrl);
  } catch (error) {
    await removeCreatedUsers(secretKey);
    throw error;
  }

  return async () => {
    await removeCreatedUsers(secretKey);
  };
}
