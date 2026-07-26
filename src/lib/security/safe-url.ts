function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }

  const [first, second] = parts;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    first >= 224
  );
}

function isNonPublicIpLiteral(hostname: string) {
  const unwrappedHostname = hostname.replace(/^\[|\]$/g, "");

  if (isPrivateIpv4(unwrappedHostname)) return true;
  if (!unwrappedHostname.includes(":")) return false;

  // Keep literal IPv6 links conservative. Public global-unicast IPv6 currently
  // occupies 2000::/3; this rejects loopback/unspecified, IPv4-mapped, ULA,
  // link-local, multicast, NAT64, and scoped literals without DNS lookups.
  if (unwrappedHostname.includes("%")) return true;
  const firstHextet = Number.parseInt(unwrappedHostname.split(":", 1)[0], 16);
  if (
    !Number.isInteger(firstHextet) ||
    firstHextet < 0x2000 ||
    firstHextet > 0x3fff
  ) {
    return true;
  }

  const normalized = unwrappedHostname.toLowerCase();
  return normalized === "2001:db8" || normalized.startsWith("2001:db8:");
}

function parseSafeExternalUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const isLocalHostname =
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname === "[::1]" ||
      hostname === "::1";

    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      !hostname ||
      url.username ||
      url.password ||
      isLocalHostname ||
      isNonPublicIpLiteral(hostname)
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export function isSafeExternalUrl(value: string | null | undefined) {
  return Boolean(parseSafeExternalUrl(value));
}

export function normalizeExternalUrl(value: string | null | undefined) {
  const url = parseSafeExternalUrl(value);
  if (!url) return null;

  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if (
    (url.protocol === "https:" && url.port === "443") ||
    (url.protocol === "http:" && url.port === "80")
  ) {
    url.port = "";
  }

  const sortedParameters = Array.from(url.searchParams.entries()).sort(
    ([firstKey, firstValue], [secondKey, secondValue]) =>
      firstKey.localeCompare(secondKey) ||
      firstValue.localeCompare(secondValue),
  );
  url.search = "";
  for (const [key, parameterValue] of sortedParameters) {
    url.searchParams.append(key, parameterValue);
  }
  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}

export function isSafeInternalActionUrl(value: string | null | undefined) {
  return Boolean(value?.startsWith("/dashboard/") && isSafeInternalPath(value));
}

export function optionalSafeExternalUrl(value: string | null | undefined) {
  return !value || isSafeExternalUrl(value);
}

export function isSafeInternalPath(value: string | null | undefined) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return false;
  }

  try {
    const url = new URL(value, "https://www.futurephysicians.org");
    return (
      url.origin === "https://www.futurephysicians.org" &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/dashboard",
  additionalAllowedOrigins: readonly (string | null | undefined)[] = [],
): string {
  if (isSafeInternalPath(value)) return value!;

  if (
    !value ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return fallback;
  }

  try {
    const url = new URL(value);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return fallback;
    }

    const allowedOrigins = new Set(
      [
        "https://www.futurephysicians.org",
        // Preserve inbound links issued before the www origin became
        // canonical. The returned value is always a relative internal path.
        "https://futurephysicians.org",
        process.env.NEXT_PUBLIC_APP_URL,
        ...additionalAllowedOrigins,
      ]
        .map(normalizeHttpOrigin)
        .filter((origin): origin is string => Boolean(origin)),
    );

    if (!allowedOrigins.has(url.origin)) return fallback;

    const internalPath = `${url.pathname}${url.search}${url.hash}`;
    return isSafeInternalPath(internalPath) ? internalPath : fallback;
  } catch {
    return fallback;
  }
}

export function safeRequestOrigin(
  hostHeader: string | null | undefined,
  protocolHeader: string | null | undefined,
) {
  const host = hostHeader?.split(",", 1)[0]?.trim();
  const forwardedProtocol = protocolHeader?.split(",", 1)[0]?.trim();
  const protocol =
    forwardedProtocol ||
    (host && /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(host)
      ? "http"
      : "https");

  if (!host || (protocol !== "http" && protocol !== "https")) return null;

  const origin = normalizeHttpOrigin(`${protocol}://${host}`);
  if (!origin) return null;

  try {
    const url = new URL(`${protocol}://${host}`);
    return url.pathname === "/" && !url.search && !url.hash ? origin : null;
  } catch {
    return null;
  }
}

function normalizeHttpOrigin(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") &&
      url.hostname &&
      !url.username &&
      !url.password
      ? url.origin
      : null;
  } catch {
    return null;
  }
}
