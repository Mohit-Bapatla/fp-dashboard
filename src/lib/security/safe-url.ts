export function isSafeExternalUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

export function optionalSafeExternalUrl(value: string | null | undefined) {
  return !value || isSafeExternalUrl(value);
}
