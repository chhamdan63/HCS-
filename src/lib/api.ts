import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getCurrentUser } from "./auth";
import { ApiError, jsonError, requireCsrf } from "./validate";

export function logError(context: string, err: unknown) {
  const line = `${new Date().toISOString()} [${context}] ${err instanceof Error ? err.stack || err.message : String(err)}\n`;
  try {
    fs.appendFileSync(path.join(process.cwd(), "app.log"), line);
  } catch {
    /* logging must never break a request */
  }
  // eslint-disable-next-line no-console
  console.error(line);
}

type Session = { id: number; username: string };
type Handler<T> = (body: T, user: Session) => Promise<NextResponse | unknown>;

/**
 * Uniform wrapper for every write endpoint:
 * CSRF check -> auth check -> handler -> friendly error message (never raw exceptions).
 * `requireAuth: false` is used by the login endpoint only.
 */
export async function handleApi<T = any>(
  req: Request,
  context: string,
  handler: Handler<T>,
  opts: { requireAuth?: boolean } = {},
) {
  try {
    await requireCsrf(req);
    const user = await getCurrentUser();
    if (opts.requireAuth !== false && !user) {
      return jsonError("Your session has expired. Please sign in again.", 401);
    }
    const body = (req.method === "GET" ? {} : await req.json().catch(() => ({}))) as T;
    const result = await handler(body, user ?? { id: 0, username: "anonymous" });
    return result instanceof NextResponse ? result : NextResponse.json({ ok: true, data: result });
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    logError(context, err);
    return jsonError("Something went wrong while saving. The error has been logged.", 500);
  }
}
