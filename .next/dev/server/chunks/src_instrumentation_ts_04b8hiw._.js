module.exports = [
"[project]/src/instrumentation.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Runs once when the Node server bootstraps: creates the schema seed
 * (fixed accounts, settings, owner login) and the small demo data set.
 */ __turbopack_context__.s([
    "register",
    ()=>register
]);
async function register() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (process.env.NEXT_PHASE === "phase-production-build") return;
    try {
        const { runSeed } = await __turbopack_context__.A("[project]/src/db/seed.ts [instrumentation] (ecmascript, async loader)");
        await runSeed();
        // eslint-disable-next-line no-console
        console.log("[seed] Hamdan Commission Shop data ready");
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[seed] failed:", err instanceof Error ? err.message : err);
    }
}
}),
];

//# sourceMappingURL=src_instrumentation_ts_04b8hiw._.js.map