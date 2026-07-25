export const CANONICAL_PRODUCTION_ORIGIN =
  "https://www.futurephysicians.org" as const;
export const FORBIDDEN_PRODUCTION_ALIAS =
  "fp-dashboard-rosy.vercel.app" as const;

export const PRODUCTION_PUBLIC_ROUTES = [
  "/",
  "/opportunities",
  "/contact",
  "/sign-in",
  "/sign-up",
] as const;

export const EXPECTED_HOMEPAGE_METRICS = [
  ["2,000+", "Students in the FP community"],
  ["50+", "Partner organizations"],
  ["$300K+", "Student stipends facilitated through partner programs"],
] as const;

export const FRAMEWORK_ERROR_TEXT = [
  "Application error: a client-side exception has occurred",
  "Internal Server Error",
  "This page could not be found",
  "Something went wrong",
  "Dashboard unavailable",
] as const;

export function validateCanonicalProductionUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return ["response URL is not valid"];
  }

  const failures: string[] = [];
  if (url.origin !== CANONICAL_PRODUCTION_ORIGIN) {
    failures.push(`final origin was ${url.origin}`);
  }
  if (url.hostname === FORBIDDEN_PRODUCTION_ALIAS) {
    failures.push("noncanonical Vercel alias was used");
  }
  return failures;
}

function directiveTokens(csp: string, directive: string) {
  const match = csp
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${directive} `));
  return match?.split(/\s+/).slice(1) ?? [];
}

export function validateProductionSecurityHeaders(
  headers: Record<string, string>,
) {
  const failures: string[] = [];
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key.toLowerCase(),
      value.trim(),
    ]),
  );
  const csp = normalized["content-security-policy"] ?? "";

  for (const name of [
    "content-security-policy",
    "permissions-policy",
    "referrer-policy",
    "strict-transport-security",
    "x-content-type-options",
  ]) {
    if (!normalized[name]) failures.push(`missing ${name}`);
  }

  if (
    csp &&
    !/https:\/\/(?:clerk\.futurephysicians\.org|\*\.accounts\.dev|\*\.clerk\.(?:accounts\.dev|com|dev))/.test(
      csp,
    )
  ) {
    failures.push("CSP does not permit a required Clerk origin");
  }

  for (const directive of [
    "default-src",
    "script-src",
    "script-src-elem",
    "connect-src",
  ]) {
    if (directiveTokens(csp, directive).includes("*")) {
      failures.push(`CSP ${directive} contains a broad wildcard`);
    }
  }

  if (directiveTokens(csp, "script-src").includes("'unsafe-eval'")) {
    failures.push("CSP script-src contains unsafe-eval");
  }

  if (
    normalized["x-content-type-options"] &&
    normalized["x-content-type-options"].toLowerCase() !== "nosniff"
  ) {
    failures.push("x-content-type-options is not nosniff");
  }

  return failures;
}

export function redactSmokeDiagnostic(value: string) {
  return value
    .replace(
      /\b(authorization|cookie|set-cookie|token|secret)\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    )
    .replace(
      /https?:\/\/([^/\s?#]+)[^\s]*/gi,
      (_match, host: string) => `https://${host}/[REDACTED_PATH]`,
    )
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .slice(0, 500);
}
