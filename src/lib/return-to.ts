export function safeConsentReturn(value: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\x00-\x1f\x7f]/.test(value)
  )
    return null;
  try {
    const url = new URL(value, "http://drivio.invalid");
    return url.origin === "http://drivio.invalid" &&
      url.pathname === "/hub/authorize" &&
      !url.hash
      ? url.pathname + url.search
      : null;
  } catch {
    return null;
  }
}
