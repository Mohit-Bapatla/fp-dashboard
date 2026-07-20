import "server-only";

import {
  redactLogMessage,
  redactTelemetryValue,
} from "@/lib/monitoring/redaction";

type LogMetadata = Record<string, unknown>;

export function logServerInfo(message: string, metadata?: LogMetadata) {
  console.info(redactLogMessage(message), redactTelemetryValue(metadata ?? {}));
}

export function logServerWarning(message: string, metadata?: LogMetadata) {
  console.warn(redactLogMessage(message), redactTelemetryValue(metadata ?? {}));
}

export function logServerError(
  message: string,
  error: unknown,
  metadata?: LogMetadata,
) {
  console.error(
    redactLogMessage(message),
    redactTelemetryValue({ error, ...metadata }),
  );
}
