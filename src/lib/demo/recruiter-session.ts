import "server-only";

import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const DEMO_SESSION_COOKIE = "fp_recruiter_demo";
export const DEMO_SESSION_DURATION_SECONDS = 60 * 60 * 24;

type DemoSessionPayload = {
  exp: number;
  iat: number;
  nonce: string;
  version: 1;
};

function hashForComparison(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

function getSigningKey(accessCode: string) {
  return createHash("sha256")
    .update("future-physicians-recruiter-demo-session\0", "utf8")
    .update(accessCode, "utf8")
    .digest();
}

function signPayload(encodedPayload: string, accessCode: string) {
  return createHmac("sha256", getSigningKey(accessCode))
    .update(encodedPayload, "utf8")
    .digest("base64url");
}

export function matchesDemoAccessCode(
  submittedCode: string,
  configuredCode: string,
) {
  return timingSafeEqual(
    hashForComparison(submittedCode),
    hashForComparison(configuredCode),
  );
}

export function createDemoSessionToken(accessCode: string, now = Date.now()) {
  const issuedAt = Math.floor(now / 1000);
  const payload: DemoSessionPayload = {
    exp: issuedAt + DEMO_SESSION_DURATION_SECONDS,
    iat: issuedAt,
    nonce: randomBytes(18).toString("base64url"),
    version: 1,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );

  return `${encodedPayload}.${signPayload(encodedPayload, accessCode)}`;
}

export function verifyDemoSessionToken(
  token: string | undefined,
  accessCode: string,
  now = Date.now(),
) {
  if (!token) return false;

  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra) return false;

  const expectedSignature = signPayload(encodedPayload, accessCode);
  const received = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<DemoSessionPayload>;
    const nowSeconds = Math.floor(now / 1000);

    return (
      payload.version === 1 &&
      typeof payload.iat === "number" &&
      typeof payload.exp === "number" &&
      typeof payload.nonce === "string" &&
      payload.nonce.length >= 20 &&
      payload.iat <= nowSeconds + 60 &&
      payload.exp > nowSeconds &&
      payload.exp - payload.iat === DEMO_SESSION_DURATION_SECONDS
    );
  } catch {
    return false;
  }
}

export function getConfiguredDemoAccessCode() {
  const value = process.env.DEMO_ACCESS_CODE?.trim();
  return value || null;
}

export function demoSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: DEMO_SESSION_DURATION_SECONDS,
    path: "/demo",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function hasValidDemoSession() {
  const accessCode = getConfiguredDemoAccessCode();
  if (!accessCode) return false;

  const token = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;
  return verifyDemoSessionToken(token, accessCode);
}

export async function requireValidDemoSession() {
  if (!(await hasValidDemoSession())) {
    redirect("/demo");
  }
}
