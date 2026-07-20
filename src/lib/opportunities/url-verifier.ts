import "server-only";

import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import http from "node:http";
import https from "node:https";

import { isSafeExternalUrl } from "@/lib/security/safe-url";

const MAX_BYTES = 64 * 1024;
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 10_000;

export type OpportunityUrlCheckStatus =
  | "HEALTHY"
  | "REDIRECTED"
  | "BROKEN"
  | "TIMEOUT"
  | "BLOCKED"
  | "BOT_PROTECTED"
  | "CONTENT_CHANGED"
  | "LIKELY_CLOSED"
  | "LIKELY_REOPENED";

export type OpportunityUrlCheckResult = {
  contentHash: string | null;
  errorCode: string | null;
  httpStatus: number | null;
  redirectCount: number;
  status: OpportunityUrlCheckStatus;
};

type ResolvedAddress = { address: string; family: 4 | 6 };
type PinnedResponse = {
  body: Uint8Array;
  location: string | undefined;
  statusCode: number;
};

export type OpportunityUrlVerifierDependencies = {
  previousStatus?: OpportunityUrlCheckStatus | null;
  request?: (url: URL, address: ResolvedAddress) => Promise<PinnedResponse>;
  resolve?: (hostname: string) => Promise<ResolvedAddress[]>;
};

function getAvailabilitySignal(body: Uint8Array) {
  const text = new TextDecoder("utf-8", { fatal: false })
    .decode(body)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  const likelyClosed = [
    "applications are closed",
    "applications have closed",
    "application is closed",
    "no longer accepting applications",
    "program has ended",
  ].some((phrase) => text.includes(phrase));
  const likelyOpen = [
    "applications are now open",
    "applications have reopened",
    "now accepting applications",
  ].some((phrase) => text.includes(phrase));

  return { likelyClosed, likelyOpen };
}

function isNonPublicIpv4(address: string) {
  const [first, second] = address.split(".").map(Number);
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function isNonPublicAddress(address: string) {
  const family = isIP(address);
  if (family === 4) return isNonPublicIpv4(address);
  if (family !== 6) return true;

  const normalized = address.toLowerCase();
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8") ||
    normalized.startsWith("::ffff:")
  );
}

function isReservedHostname(hostname: string) {
  const value = hostname.toLowerCase();
  return (
    value === "example.com" ||
    value.endsWith(".example.com") ||
    value === "example.net" ||
    value.endsWith(".example.net") ||
    value === "example.org" ||
    value.endsWith(".example.org") ||
    value.endsWith(".invalid") ||
    value.endsWith(".test")
  );
}

function usesAllowedPort(url: URL) {
  return (
    !url.port ||
    (url.protocol === "https:" && url.port === "443") ||
    (url.protocol === "http:" && url.port === "80")
  );
}

async function resolvePublicAddresses(hostname: string) {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  return addresses
    .filter(
      (item): item is ResolvedAddress =>
        (item.family === 4 || item.family === 6) &&
        !isNonPublicAddress(item.address),
    )
    .map(({ address, family }) => ({ address, family }));
}

function requestPinnedUrl(url: URL, address: ResolvedAddress) {
  return new Promise<PinnedResponse>((resolve, reject) => {
    const requestModule = url.protocol === "https:" ? https : http;
    const request = requestModule.request(
      url,
      {
        agent: false,
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/pdf;q=0.8,*/*;q=0.5",
          "user-agent": "FuturePhysicians-LinkVerifier/1.0",
        },
        lookup: (_hostname, _options, callback) =>
          callback(null, address.address, address.family),
        method: "GET",
        servername: url.hostname,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let byteLength = 0;
        let settled = false;

        const finish = () => {
          if (settled) return;
          settled = true;
          resolve({
            body: Buffer.concat(chunks),
            location: response.headers.location,
            statusCode: response.statusCode ?? 0,
          });
        };

        response.on("data", (chunk: Buffer) => {
          if (settled) return;
          const remaining = MAX_BYTES - byteLength;
          const bounded = chunk.subarray(0, remaining);
          chunks.push(bounded);
          byteLength += bounded.length;

          if (byteLength >= MAX_BYTES) {
            response.destroy();
            finish();
          }
        });
        response.on("end", finish);
      },
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(
        Object.assign(new Error("Request timed out."), { code: "ETIMEDOUT" }),
      );
    });
    request.on("error", reject);
    request.end();
  });
}

export async function verifyOpportunityUrl(
  rawUrl: string,
  previousContentHash: string | null = null,
  dependencies: OpportunityUrlVerifierDependencies = {},
): Promise<OpportunityUrlCheckResult> {
  const resolveAddresses = dependencies.resolve ?? resolvePublicAddresses;
  const request = dependencies.request ?? requestPinnedUrl;
  let currentUrl: URL;

  try {
    currentUrl = new URL(rawUrl);
  } catch {
    return failed("BLOCKED", "INVALID_URL");
  }

  for (
    let redirectCount = 0;
    redirectCount <= MAX_REDIRECTS;
    redirectCount += 1
  ) {
    if (
      !isSafeExternalUrl(currentUrl.toString()) ||
      !usesAllowedPort(currentUrl) ||
      isReservedHostname(currentUrl.hostname)
    ) {
      return failed("BLOCKED", "UNSAFE_DESTINATION", redirectCount);
    }

    try {
      const addresses = (await resolveAddresses(currentUrl.hostname)).filter(
        (address) => !isNonPublicAddress(address.address),
      );
      if (addresses.length === 0) {
        return failed("BLOCKED", "NO_PUBLIC_ADDRESS", redirectCount);
      }

      let response: PinnedResponse | null = null;
      let lastError: unknown;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          response = await request(
            currentUrl,
            addresses[attempt % addresses.length],
          );
          if (response.statusCode < 500 || attempt === 1) break;
        } catch (error) {
          lastError = error;
          if (attempt === 1) throw error;
        }
      }
      if (!response) throw lastError ?? new Error("No verifier response.");
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.location
      ) {
        if (redirectCount === MAX_REDIRECTS) {
          return failed("BROKEN", "TOO_MANY_REDIRECTS", redirectCount);
        }
        currentUrl = new URL(response.location, currentUrl);
        continue;
      }

      if (response.statusCode < 200 || response.statusCode >= 400) {
        if ([401, 403, 429].includes(response.statusCode)) {
          return {
            ...failed("BOT_PROTECTED", "ACCESS_RESTRICTED", redirectCount),
            httpStatus: response.statusCode,
          };
        }
        return {
          ...failed("BROKEN", "HTTP_ERROR", redirectCount),
          httpStatus: response.statusCode,
        };
      }

      const contentHash = createHash("sha256")
        .update(response.body)
        .digest("hex");
      const availability = getAvailabilitySignal(response.body);
      const status =
        dependencies.previousStatus === "LIKELY_CLOSED" &&
        availability.likelyOpen
          ? "LIKELY_REOPENED"
          : availability.likelyClosed
            ? "LIKELY_CLOSED"
            : previousContentHash && previousContentHash !== contentHash
              ? "CONTENT_CHANGED"
              : redirectCount > 0
                ? "REDIRECTED"
                : "HEALTHY";
      return {
        contentHash,
        errorCode: null,
        httpStatus: response.statusCode,
        redirectCount,
        status,
      };
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? String(error.code)
          : "REQUEST_FAILED";
      return failed(
        code === "ETIMEDOUT" ? "TIMEOUT" : "BROKEN",
        code,
        redirectCount,
      );
    }
  }

  return failed("BROKEN", "UNEXPECTED_VERIFIER_STATE");
}

function failed(
  status: Extract<
    OpportunityUrlCheckStatus,
    "BROKEN" | "TIMEOUT" | "BLOCKED" | "BOT_PROTECTED"
  >,
  errorCode: string,
  redirectCount = 0,
): OpportunityUrlCheckResult {
  return {
    contentHash: null,
    errorCode,
    httpStatus: null,
    redirectCount,
    status,
  };
}
