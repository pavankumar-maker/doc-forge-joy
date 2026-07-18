const PUBLISHED_ORIGIN = "https://doc-forge-joy.lovable.app";
const PUBLISHED_HOST = "doc-forge-joy.lovable.app";

export function getShareOrigin(): string {
  if (typeof window === "undefined") return PUBLISHED_ORIGIN;

  const host = window.location.hostname.toLowerCase();

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".lovableproject.com") ||
    (host.endsWith(".lovable.app") && host !== PUBLISHED_HOST) ||
    host.endsWith(".vercel.app")
  ) {
    return PUBLISHED_ORIGIN;
  }

  return window.location.origin;
}