import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";
import { handleApi } from "@/lib/api";

export async function POST(req: Request) {
  return handleApi(
    req,
    "logout",
    async () => {
      await clearAuthCookies();
      return NextResponse.json({ ok: true, data: { loggedOut: true } });
    },
    { requireAuth: false },
  );
}
