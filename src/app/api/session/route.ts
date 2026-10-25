import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/**
 * Lets the browser confirm the session cookie actually stuck after signing in.
 * When a browser blocks cookies (common inside an embedded preview frame) the login
 * call succeeds but the next page would be empty — this turns that into a clear message.
 */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ ok: true, data: { authenticated: !!user, username: user?.username ?? null } });
}
