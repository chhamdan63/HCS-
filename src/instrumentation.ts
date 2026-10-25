/**
 * Runs once when the Node server bootstraps: creates the schema seed
 * (fixed accounts, settings, owner login) and the small demo data set.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  try {
    const { runSeed } = await import("./db/seed");
    await runSeed();
    // eslint-disable-next-line no-console
    console.log("[seed] Hamdan Commission Shop data ready");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[seed] failed:", err instanceof Error ? err.message : err);
  }
}
