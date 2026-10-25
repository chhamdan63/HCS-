"use client";

/** Tiny bridge so client components can read/refresh the double-submit CSRF cookie. */
export function getCsrf(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)hcs_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

/**
 * Returns a usable CSRF token: the cookie value when present, otherwise asks the
 * server for a fresh one (which also sets the cookie for the double-submit check).
 */
export async function ensureCsrf(): Promise<string> {
  const existing = getCsrf();
  if (existing) return existing;
  try {
    const res = await fetch("/api/csrf", { cache: "no-store" });
    const json = await res.json();
    return json?.data?.token ?? "";
  } catch {
    return "";
  }
}

/** Last-resort refresh when the server rejects a token as stale. */
export async function refreshCsrf(): Promise<string> {
  try {
    const res = await fetch("/api/csrf", { cache: "no-store" });
    const json = await res.json();
    return json?.data?.token ?? "";
  } catch {
    return "";
  }
}
