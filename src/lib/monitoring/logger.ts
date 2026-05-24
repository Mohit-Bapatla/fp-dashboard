import "server-only";

type LogMetadata = Record<string, unknown>;

export function logServerInfo(message: string, metadata?: LogMetadata) {
  console.info(message, metadata ?? {});
}

export function logServerWarning(message: string, metadata?: LogMetadata) {
  console.warn(message, metadata ?? {});
}

export function logServerError(
  message: string,
  error: unknown,
  metadata?: LogMetadata,
) {
  console.error(message, {
    error: error instanceof Error ? error.message : error,
    ...metadata,
  });
}
