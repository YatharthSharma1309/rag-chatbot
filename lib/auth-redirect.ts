/** Prevent open redirects — only same-origin paths allowed */
export function safeInternalPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next.split("?")[0] ?? "/";
}
