import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { CSRF_COOKIE, cookieFlags } from "@/lib/auth";

/**
 * Issues a fresh double-submit CSRF token. Called by forms on mount and whenever a
 * stale token is rejected, so a page that was loaded earlier (or cached) can still post.
 */
export async function GET() {
  const token = crypto.randomBytes(24).toString("hex");
  const jar = await cookies();
  const { secure, sameSite } = await cookieFlags();
  jar.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite,
    secure,
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return NextResponse.json({ ok: true, data: { token } });
}
