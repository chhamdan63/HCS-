import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isLoginLocked, recordLoginAttempt, setAuthCookies, verifyPassword } from "@/lib/auth";
import { handleApi } from "@/lib/api";
import { ApiError } from "@/lib/validate";
import { ensureSeed } from "@/db/seed";

export async function POST(req: Request) {
  return handleApi<{ username?: string; password?: string }>(req, "login", async (body) => {
    await ensureSeed();
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!username || !password) throw new ApiError("Enter your username and password.");

    if (await isLoginLocked(username)) {
      throw new ApiError("Too many failed attempts. Please wait 10 minutes and try again.", 429);
    }

    const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const user = rows[0];
    const ok = user ? verifyPassword(password, user.passwordHash) : false;
    await recordLoginAttempt(username, ok);
    if (!ok || !user) throw new ApiError("Incorrect username or password.", 401);

    // session_regenerate_id equivalent: a fresh signed token on every login
    await setAuthCookies(user.id);
    return NextResponse.json({ ok: true, data: { mustChangePassword: user.mustChangePassword } });
  },
  { requireAuth: false },
  );
}
