export function isSafeExternalUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
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
    const url = new URL(value, "https://futurephysicians.org");
    return (
      url.origin === "https://futurephysicians.org" &&
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
