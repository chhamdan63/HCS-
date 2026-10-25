import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CSRF_COOKIE } from "./auth";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function hmac(payload: string) {
  return crypto
    .createHmac("sha256", process.env.SESSION_SECRET || "hamdan-commission-shop-dev-secret")
    .update(payload)
    .digest("hex");
}

/**
 * Per-form token for pages that run before a session exists (the login screen).
 * Signed server-side and valid for the surrounding hour.
 */
export function issueFormToken(): string {
  const ts = String(Math.floor(Date.now() / 3_600_000));
  return `${ts}.${hmac(ts)}`;
}

export function verifyFormToken(token: string | undefined): boolean {
  if (!token) return false;
  const [ts, sig] = token.split(".");
  const n = Number(ts);
  if (!Number.isFinite(n)) return false;
  const now = Math.floor(Date.now() / 3_600_000);
  if (Math.abs(now - n) > 1) return false;
  const expected = hmac(ts);
  return (
    expected.length === sig.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  );
}

/**
 * Double-submit CSRF check for every POST/PUT/DELETE. Falls back to the signed
 * per-form token for the login screen, where no session cookie exists yet.
 */
export async function requireCsrf(req: Request) {
  const jar = await cookies();
  const cookieToken = jar.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get("x-csrf-token") || "";
  if (cookieToken && headerToken && cookieToken === headerToken) return;
  if (verifyFormToken(headerToken)) return;
  throw new ApiError(
    "Security token mismatch — the page's form token is stale. Press F5 (refresh) and submit again.",
    403,
  );
}

export function validDate(s: unknown): string {
  const v = String(s ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new ApiError("Please provide a valid date (YYYY-MM-DD).");
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new ApiError("Please provide a valid date.");
  return v;
}

export function required(v: unknown, label: string, max = 255): string {
  const s = String(v ?? "").trim();
  if (!s) throw new ApiError(`${label} is required.`);
  if (s.length > max) throw new ApiError(`${label} must be ${max} characters or fewer.`);
  return s;
}

export function optional(v: unknown, label: string, max = 50): string {
  const s = String(v ?? "").trim();
  if (s.length > max) throw new ApiError(`${label} must be ${max} characters or fewer.`);
  return s;
}

export function nonNegNumber(v: unknown, label: string): number {
  const n = Number(String(v ?? "0").replace(/,/g, ""));
  if (!Number.isFinite(n)) throw new ApiError(`${label} must be a number.`);
  if (n < 0) throw new ApiError(`${label} cannot be negative.`);
  return n;
}
