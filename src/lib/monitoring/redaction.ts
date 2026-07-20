const sensitiveKeyPattern =
  /(authorization|cookie|password|secret|session|token|resume(text|content)?|essay|document(body|content)?|file(bytes|content)?|signedurl|profile(body|content)?)/i;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const bearerPattern = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const urlQueryPattern = /(https?:\/\/[^\s?#]+)[?#][^\s]*/gi;

export function redactLogMessage(message: string) {
  return message
    .replace(emailPattern, "[REDACTED_EMAIL]")
    .replace(bearerPattern, "Bearer [REDACTED]")
    .replace(urlQueryPattern, "$1?[REDACTED]");
}

export function redactTelemetryValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[REDACTED_DEPTH]";
  if (typeof value === "string") return redactLogMessage(value).slice(0, 2000);
  if (
    value == null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value instanceof Error) {
    return {
      errorClass: value.name,
      message: redactLogMessage(value.message),
    };
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, 50)
      .map((item) => redactTelemetryValue(item, depth + 1));
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 100)
        .map(([key, item]) => [
          key,
          sensitiveKeyPattern.test(key)
            ? "[REDACTED]"
            : redactTelemetryValue(item, depth + 1),
        ]),
    );
  }
  return String(value).slice(0, 500);
}

export function redactSentryEvent<T>(event: T): T {
  return redactTelemetryValue(event) as T;
}
