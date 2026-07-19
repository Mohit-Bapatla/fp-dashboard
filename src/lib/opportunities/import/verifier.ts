import { createHash } from "node:crypto";
import { promises as dns } from "node:dns";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";

import { isSafeExternalUrl } from "@/lib/security/safe-url";

import { isReservedExampleUrl } from "./validation";

export type VerificationResult =
  | "HEALTHY"
  | "REDIRECTED"
  | "BROKEN"
  | "TIMEOUT"
  | "BLOCKED"
  | "CONTENT_CHANGED"
  | "UNKNOWN";

export type UrlVerification = {
  checkedAt: string;
  checkedUrl: string;
  contentChanged: boolean;
  contentFingerprint: string | null;
  errorCode: string | null;
  finalUrl: string | null;
  httpStatus: number | null;
  redirects: string[];
  result: VerificationResult;
  suggestedAction: string | null;
};

type ResolvedAddress = { address: string; family: 4 | 6 };

type RequestResponse = {
  body: Buffer;
  location: string | null;
  status: number;
};

export type VerifierDependencies = {
  lookup: (hostname: string) => Promise<ResolvedAddress[]>;
  request: (input: {
    address: ResolvedAddress;
    maxBodyBytes: number;
    timeoutMs: number;
    url: URL;
  }) => Promise<RequestResponse>;
};

export type VerifyUrlOptions = {
  dependencies?: Partial<VerifierDependencies>;
  maxBodyBytes?: number;
  maxRedirects?: number;
  previousFingerprint?: string | null;
  retries?: number;
  timeoutMs?: number;
};

function isPublicIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  const [first, second, third] = octets;
  return !(
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  );
}

export function isPublicIpAddress(address: string) {
  const family = isIP(address);
  if (family === 4) return isPublicIpv4(address);
  if (family !== 6) return false;

  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    return isPublicIpv4(normalized.slice("::ffff:".length));
  }

  const firstHextet = Number.parseInt(normalized.split(":", 1)[0], 16);
  return (
    firstHextet >= 0x2000 &&
    firstHextet <= 0x3fff &&
    normalized !== "2001:db8" &&
    !normalized.startsWith("2001:db8:")
  );
}

async function defaultLookup(hostname: string): Promise<ResolvedAddress[]> {
  const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  return addresses
    .filter((address) => address.family === 4 || address.family === 6)
    .map((address) => ({
      address: address.address,
      family: address.family as 4 | 6,
    }));
}

function defaultRequest({
  address,
  maxBodyBytes,
  timeoutMs,
  url,
}: Parameters<VerifierDependencies["request"]>[0]) {
  return new Promise<RequestResponse>((resolve, reject) => {
    const request = url.protocol === "https:" ? httpsRequest : httpRequest;
    const req = request(
      url,
      {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.5",
          "Accept-Encoding": "identity",
          Range: `bytes=0-${maxBodyBytes - 1}`,
          "User-Agent":
            "FuturePhysiciansOpportunityVerifier/1.0 (+https://futurephysicians.org)",
        },
        lookup: (_hostname, lookupOptions, callback) => {
          const complete = callback as unknown as {
            (error: null, addresses: ResolvedAddress[]): void;
            (error: null, resolvedAddress: string, family: 4 | 6): void;
          };
          if (typeof lookupOptions === "object" && lookupOptions.all) {
            complete(null, [address]);
          } else {
            complete(null, address.address, address.family);
          }
        },
        servername: url.hostname,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let received = 0;

        response.on("data", (chunk: Buffer | string) => {
          if (received >= maxBodyBytes) return;
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          const remaining = maxBodyBytes - received;
          chunks.push(buffer.subarray(0, remaining));
          received += Math.min(buffer.length, remaining);
        });
        response.on("end", () => {
          const location = Array.isArray(response.headers.location)
            ? (response.headers.location[0] ?? null)
            : (response.headers.location ?? null);
          resolve({
            body: Buffer.concat(chunks),
            location,
            status: response.statusCode ?? 0,
          });
        });
        response.on("error", reject);
      },
    );

    req.setTimeout(timeoutMs, () => {
      const error = new Error("Opportunity URL verification timed out.");
      error.name = "TimeoutError";
      req.destroy(error);
    });
    req.on("error", reject);
    req.end();
  });
}

function fingerprint(body: Buffer) {
  if (body.length === 0) return null;
  return createHash("sha256").update(body).digest("hex");
}

function failure(
  checkedUrl: string,
  errorCode: string,
  result: VerificationResult,
  suggestedAction: string,
): UrlVerification {
  return {
    checkedAt: new Date().toISOString(),
    checkedUrl,
    contentChanged: false,
    contentFingerprint: null,
    errorCode,
    finalUrl: null,
    httpStatus: null,
    redirects: [],
    result,
    suggestedAction,
  };
}

function safeUrl(value: string) {
  if (!isSafeExternalUrl(value) || isReservedExampleUrl(value)) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export async function verifyOpportunityUrl(
  checkedUrl: string,
  options: VerifyUrlOptions = {},
): Promise<UrlVerification> {
  const initialUrl = safeUrl(checkedUrl);
  if (!initialUrl) {
    return failure(
      checkedUrl,
      "UNSAFE_URL",
      "BLOCKED",
      "Correct the URL; no network request was made.",
    );
  }

  const dependencies: VerifierDependencies = {
    lookup: options.dependencies?.lookup ?? defaultLookup,
    request: options.dependencies?.request ?? defaultRequest,
  };
  const maxBodyBytes = options.maxBodyBytes ?? 65_536;
  const maxRedirects = options.maxRedirects ?? 5;
  const retries = options.retries ?? 2;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const redirects: string[] = [];
  let currentUrl = initialUrl;

  try {
    for (
      let redirectIndex = 0;
      redirectIndex <= maxRedirects;
      redirectIndex += 1
    ) {
      const resolved = await dependencies.lookup(currentUrl.hostname);
      if (
        resolved.length === 0 ||
        resolved.some((address) => !isPublicIpAddress(address.address))
      ) {
        return {
          ...failure(
            checkedUrl,
            "NON_PUBLIC_DNS",
            "BLOCKED",
            "Correct or manually review the host; no request was sent to a non-public address.",
          ),
          redirects,
        };
      }

      let response: RequestResponse | null = null;
      let lastError: unknown = null;
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
          response = await dependencies.request({
            address: resolved[attempt % resolved.length]!,
            maxBodyBytes,
            timeoutMs,
            url: currentUrl,
          });
          if (response.status < 500 || attempt === retries) break;
        } catch (error) {
          lastError = error;
          if (attempt === retries) throw error;
        }
      }

      if (!response) throw lastError ?? new Error("No verification response.");

      if (
        response.status >= 300 &&
        response.status < 400 &&
        response.location
      ) {
        if (redirectIndex === maxRedirects) {
          return {
            ...failure(
              checkedUrl,
              "TOO_MANY_REDIRECTS",
              "BROKEN",
              "Review the redirect chain before publication.",
            ),
            httpStatus: response.status,
            redirects,
          };
        }

        const nextUrl = safeUrl(
          new URL(response.location, currentUrl).toString(),
        );
        if (!nextUrl) {
          return {
            ...failure(
              checkedUrl,
              "UNSAFE_REDIRECT",
              "BLOCKED",
              "Correct or manually review the redirect target.",
            ),
            httpStatus: response.status,
            redirects,
          };
        }
        redirects.push(nextUrl.toString());
        currentUrl = nextUrl;
        continue;
      }

      const contentFingerprint = fingerprint(response.body);
      const contentChanged = Boolean(
        options.previousFingerprint &&
        contentFingerprint &&
        options.previousFingerprint !== contentFingerprint,
      );
      let result: VerificationResult = "UNKNOWN";
      let suggestedAction: string | null = null;

      if (response.status >= 200 && response.status < 300) {
        result = contentChanged
          ? "CONTENT_CHANGED"
          : redirects.length > 0
            ? "REDIRECTED"
            : "HEALTHY";
        if (contentChanged) {
          suggestedAction =
            "Review the official page for deadline, eligibility, and application changes.";
        } else if (redirects.length > 0) {
          suggestedAction =
            "Review and optionally adopt the final official URL.";
        }
      } else if ([401, 403, 429].includes(response.status)) {
        result = "BLOCKED";
        suggestedAction =
          "Review manually; the host denied or throttled automated verification.";
      } else if ([404, 410].includes(response.status)) {
        result = "BROKEN";
        suggestedAction =
          "Review the official source and archive only after human confirmation.";
      } else if (response.status >= 500) {
        result = "BROKEN";
        suggestedAction =
          "Retry later; do not archive from a server error alone.";
      }

      return {
        checkedAt: new Date().toISOString(),
        checkedUrl,
        contentChanged,
        contentFingerprint,
        errorCode: result === "UNKNOWN" ? "UNEXPECTED_STATUS" : null,
        finalUrl: currentUrl.toString(),
        httpStatus: response.status,
        redirects,
        result,
        suggestedAction,
      };
    }
  } catch (error) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    const networkCode =
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : "NETWORK_ERROR";
    return {
      ...failure(
        checkedUrl,
        timeout ? "TIMEOUT" : networkCode,
        timeout ? "TIMEOUT" : "UNKNOWN",
        "Retry and review manually; do not change publication status automatically.",
      ),
      redirects,
    };
  }

  return failure(
    checkedUrl,
    "UNKNOWN",
    "UNKNOWN",
    "Review manually; do not change publication status automatically.",
  );
}

export async function verifyOpportunityUrls(
  urls: readonly (
    | string
    | { previousFingerprint?: string | null; url: string }
  )[],
  options: VerifyUrlOptions & { concurrency?: number } = {},
) {
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 4, 8));
  const results = new Array<UrlVerification>(urls.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < urls.length) {
      const index = nextIndex;
      nextIndex += 1;
      const target = urls[index]!;
      results[index] = await verifyOpportunityUrl(
        typeof target === "string" ? target : target.url,
        {
          ...options,
          previousFingerprint:
            typeof target === "string"
              ? options.previousFingerprint
              : target.previousFingerprint,
        },
      );
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()),
  );
  return results;
}
