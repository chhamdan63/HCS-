import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { handleApi } from "@/lib/api";
import { ApiError, required } from "@/lib/validate";

export async function POST(req: Request) {
  return handleApi<{ current?: string; password?: string; confirm?: string }>(
    req,
    "change-password",
    async (body, session) => {
      const current = String(body.current ?? "");
      const next = required(body.password, "New password", 100);
      const confirm = String(body.confirm ?? "");
      if (next.length < 6) throw new ApiError("New password must be at least 6 characters.");
      if (next !== confirm) throw new ApiError("New password and confirmation do not match.");

      const rows = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
      const user = rows[0];
      if (!user) throw new ApiError("User not found.", 404);
      if (!verifyPassword(current, user.passwordHash)) throw new ApiError("Current password is incorrect.");

      await db
        .update(users)
        .set({ passwordHash: hashPassword(next), mustChangePassword: false })
        .where(eq(users.id, session.id));
      return { changed: true };
    },
  );
}
