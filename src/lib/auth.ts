import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gte, desc } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts, users } from "@/db/schema";

export const SESSION_COOKIE = "hcs_session";
export const CSRF_COOKIE = "hcs_csrf";
const SESSION_MINUTES = 45;

function secret() {
  return process.env.SESSION_SECRET || "hamdan-commission-shop-dev-secret";
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;
  const candidate = crypto.scryptSync(password, salt, 32).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(candidate, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionToken(userId: number): string {
  const exp = Date.now() + SESSION_MINUTES * 60_000;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [uid, exp, sig] = parts;
  if (sign(`${uid}.${exp}`) !== sig) return null;
  if (Number(exp) < Date.now()) return null;
  const id = Number(uid);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function getSessionUserId(): Promise<number | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

export type SessionUser = {
  id: number;
  username: string;
  mustChangePassword: boolean;
  role: "owner" | "staff";
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const u = rows[0];
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    mustChangePassword: u.mustChangePassword,
    role: "owner",
  };
}

/** Server-component gate: every page except login requires an authenticated user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function recordLoginAttempt(username: string, success: boolean) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  await db.insert(loginAttempts).values({ username, ip, success });
}

/** 5 failures inside 10 minutes locks the username + IP pair. */
export async function isLoginLocked(username: string): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const since = new Date(Date.now() - 10 * 60_000);
  const rows = await db
    .select()
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.username, username),
        eq(loginAttempts.ip, ip),
        eq(loginAttempts.success, false),
        gte(loginAttempts.createdAt, since),
      ),
    )
    .orderBy(desc(loginAttempts.createdAt))
    .limit(10);
  return rows.length >= 5;
}

/**
 * Cookie flags depend on how the app is served. Inside a preview iframe (or any
 * cross-site embed) browsers drop `SameSite=Lax` cookies, which looks like "login works
 * and then the next page is blank / logged out". Over HTTPS we therefore send
 * `SameSite=None; Secure`, which is accepted in both a normal tab and an embed.
 */
export async function cookieFlags(): Promise<{ secure: boolean; sameSite: "lax" | "none" }> {
  const h = await headers();
  const proto = (h.get("x-forwarded-proto") || h.get("x-forwarded-protocol") || "").split(",")[0].trim();
  const origin = (h.get("origin") || h.get("referer") || "").toLowerCase();
  const httpsDetected = proto === "https" || origin.startsWith("https://");
  const secure =
    httpsDetected ||
    process.env.NEXT_PUBLIC_FORCE_SECURE === "1" ||
    // production previews are served over HTTPS behind a proxy
    process.env.NODE_ENV === "production";
  return { secure, sameSite: secure ? "none" : "lax" };
}

export async function setAuthCookies(userId: number) {
  const jar = await cookies();
  const { secure, sameSite } = await cookieFlags();
  jar.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite,
    secure,
    path: "/",
    maxAge: SESSION_MINUTES * 60,
  });
  // The CSRF cookie is a double-submit token, not a credential: it lives longer than
  // the session so forms never post with a missing token mid-session.
  jar.set(CSRF_COOKIE, crypto.randomBytes(24).toString("hex"), {
    httpOnly: false,
    sameSite,
    secure,
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(CSRF_COOKIE);
}
