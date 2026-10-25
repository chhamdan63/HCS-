module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/lib/settings.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "DEFAULT_SETTINGS",
    ()=>DEFAULT_SETTINGS,
    "chargeLabels",
    ()=>chargeLabels,
    "getSettings",
    ()=>getSettings,
    "ratesFromSettings",
    ()=>ratesFromSettings,
    "saveSettings",
    ()=>saveSettings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/index.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
const DEFAULT_SETTINGS = {
    shopName: "HAMDAN COMMISSION SHOP",
    shopAddress: "29/B Grain Market, Arifwala",
    shopPhone: "0300-0070010",
    agentCode: "160018",
    commissionPercent: 0.72,
    labourPerBori: 22,
    threadPerBori: 1,
    plasticPerBori: 34.5,
    marketFeePerBori: 1.4,
    balanceWording: "Net credit balance / Net debit balance",
    timezone: "Asia/Karachi"
};
const KEY_MAP = {
    shop_name: "shopName",
    shop_address: "shopAddress",
    shop_phone: "shopPhone",
    agent_code: "agentCode",
    commission_percent: "commissionPercent",
    labour_per_bori: "labourPerBori",
    thread_per_bori: "threadPerBori",
    plastic_per_bori: "plasticPerBori",
    market_fee_per_bori: "marketFeePerBori",
    balance_wording: "balanceWording",
    timezone: "timezone"
};
const NUMERIC_KEYS = [
    "commissionPercent",
    "labourPerBori",
    "threadPerBori",
    "plasticPerBori",
    "marketFeePerBori"
];
async function getSettings() {
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["settings"]);
    const out = {
        ...DEFAULT_SETTINGS
    };
    for (const r of rows){
        const key = KEY_MAP[r.settingKey];
        if (!key) continue;
        if (NUMERIC_KEYS.includes(key)) {
            const n = Number(r.settingValue);
            out[key] = Number.isFinite(n) ? n : DEFAULT_SETTINGS[key];
        } else {
            out[key] = r.settingValue;
        }
    }
    return out;
}
async function saveSettings(partial) {
    const reverse = {};
    for (const [k, v] of Object.entries(KEY_MAP))reverse[v] = k;
    for (const [key, value] of Object.entries(partial)){
        if (value === undefined) continue;
        const settingKey = reverse[key];
        if (!settingKey) continue;
        const settingValue = String(value);
        const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["settings"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["settings"].settingKey, settingKey)).limit(1);
        if (existing.length) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["db"].update(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["settings"]).set({
                settingValue,
                updatedAt: new Date()
            }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["settings"].settingKey, settingKey));
        } else {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["db"].insert(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["settings"]).values({
                settingKey,
                settingValue
            });
        }
    }
}
function ratesFromSettings(s) {
    return {
        commissionPercent: s.commissionPercent,
        labourPerBori: s.labourPerBori,
        threadPerBori: s.threadPerBori,
        plasticPerBori: s.plasticPerBori,
        marketFeePerBori: s.marketFeePerBori
    };
}
function chargeLabels(s) {
    return {
        commission: `Commission (${s.commissionPercent}%)`,
        labour: `Labour (x${s.labourPerBori})`,
        thread: `Thread (x${s.threadPerBori})`,
        plasticBag: `Plastic Bag (x${s.plasticPerBori})`,
        marketFee: `Market Fee (x${s.marketFeePerBori})`,
        brokery: "Brokery"
    };
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/lib/money.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Business math for the commission shop.
 * All money is handled as decimal numbers rounded to 2 dp on the server.
 * 1 bori = 70 kg. Rates are quoted per 40 kg (maund).
 */ __turbopack_context__.s([
    "KG_PER_BORI",
    ()=>KG_PER_BORI,
    "RATE_UNIT_KG",
    ()=>RATE_UNIT_KG,
    "computeInvoiceTotals",
    ()=>computeInvoiceTotals,
    "computeLine",
    ()=>computeLine,
    "computePurchaseLines",
    ()=>computePurchaseLines,
    "lineAmount",
    ()=>lineAmount,
    "lineWeight",
    ()=>lineWeight,
    "money",
    ()=>money,
    "num",
    ()=>num,
    "round2",
    ()=>round2,
    "toNum",
    ()=>toNum
]);
const KG_PER_BORI = 70;
const RATE_UNIT_KG = 40;
function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}
function toNum(v, fallback = 0) {
    if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
    if (typeof v === "string") {
        const cleaned = v.replace(/,/g, "").trim();
        if (cleaned === "") return fallback;
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : fallback;
    }
    return fallback;
}
function lineWeight(bori, kg) {
    return round2(toNum(bori) * KG_PER_BORI + toNum(kg));
}
function lineAmount(weightKg, rate) {
    return round2(toNum(weightKg) / RATE_UNIT_KG * toNum(rate));
}
function computeLine(bori, kg, rate) {
    const weight = lineWeight(bori, kg);
    return {
        weight,
        amount: lineAmount(weight, rate)
    };
}
function computeInvoiceTotals(lines, rates, overrides = {}, brokeryInput = 0) {
    const computed = lines.map((l)=>{
        const { weight, amount } = computeLine(l.qtyBori, l.qtyKg, l.rate);
        return {
            qtyBori: toNum(l.qtyBori),
            qtyKg: toNum(l.qtyKg),
            rate: toNum(l.rate),
            weight,
            amount
        };
    });
    const corncost = round2(computed.reduce((s, l)=>s + l.amount, 0));
    const totalBori = computed.reduce((s, l)=>s + l.qtyBori, 0);
    const totalWeight = round2(computed.reduce((s, l)=>s + l.weight, 0));
    const pick = (key, calc)=>overrides[key] !== undefined && overrides[key] !== null ? round2(toNum(overrides[key])) : round2(calc);
    const commission = pick("commission", corncost * toNum(rates.commissionPercent) / 100);
    const labour = pick("labour", totalBori * toNum(rates.labourPerBori));
    const thread = pick("thread", totalBori * toNum(rates.threadPerBori));
    const plasticBag = pick("plasticBag", totalBori * toNum(rates.plasticPerBori));
    const marketFee = pick("marketFee", totalBori * toNum(rates.marketFeePerBori));
    const brokery = overrides.brokery !== undefined && overrides.brokery !== null ? round2(toNum(overrides.brokery)) : round2(toNum(brokeryInput));
    const total = round2(corncost + commission + labour + thread + plasticBag + marketFee + brokery);
    return {
        corncost,
        totalBori,
        totalWeight,
        commission,
        labour,
        thread,
        plasticBag,
        marketFee,
        brokery,
        total,
        lines: computed
    };
}
function computePurchaseLines(rows) {
    return rows.map((r)=>{
        const { weight, amount } = computeLine(r.qtyBori, r.qtyKg, r.rate);
        return {
            qtyBori: toNum(r.qtyBori),
            qtyKg: toNum(r.qtyKg),
            rate: toNum(r.rate),
            weightKg: weight,
            amount
        };
    });
}
function money(n) {
    const v = typeof n === "string" ? toNum(n) : n;
    return v.toLocaleString("en-PK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
function num(n, dp = 2) {
    const v = typeof n === "string" ? toNum(n) : n;
    return v.toLocaleString("en-PK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: dp
    });
}
}),
"[project]/src/app/(app)/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>Dashboard,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/index.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/settings.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/money.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
const dynamic = "force-dynamic";
function karachiToday() {
    return new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Karachi"
    }).format(new Date());
}
async function Dashboard() {
    const settings = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$settings$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSettings"])();
    const [inv] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["db"].select({
        c: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sql"]`count(*)::int`
    }).from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["invoices"]);
    const [purch] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["db"].select({
        c: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sql"]`count(*)::int`
    }).from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["purchases"]);
    const [st] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["db"].select({
        c: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sql"]`count(*)::int`
    }).from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["stores"]);
    const [bags] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["db"].select({
        v: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sql"]`coalesce(sum(${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["invoices"].totalBori}),0)`
    }).from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["invoices"]);
    const [gross] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["db"].select({
        v: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sql"]`coalesce(sum(${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["invoices"].corncost}),0)`
    }).from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["invoices"]);
    const cards = [
        {
            label: "Total Invoices",
            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["num"])(inv.c, 0),
            href: "/invoices",
            sub: "Bills dispatched to PIC CORN"
        },
        {
            label: "Total Stores",
            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["num"])(st.c, 0),
            href: "/stores",
            sub: "Accounts in the ledger"
        },
        {
            label: "Total Purchases",
            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["num"])(purch.c, 0),
            href: "/purchases",
            sub: "Purchase bills"
        },
        {
            label: "Total Bags (Bori)",
            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["num"])(bags.v, 0),
            href: "/invoices",
            sub: `Gross corn cost Rs. ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$money$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["money"])(gross.v)}`
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-end justify-between gap-4 flex-wrap mb-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "micro",
                                children: "Business Overview"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(app)/page.tsx",
                                lineNumber: 45,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                style: {
                                    fontSize: 30,
                                    fontWeight: 700,
                                    letterSpacing: "-0.02em",
                                    marginTop: 4
                                },
                                children: settings.shopName
                            }, void 0, false, {
                                fileName: "[project]/src/app/(app)/page.tsx",
                                lineNumber: 46,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    color: "var(--muted)",
                                    fontSize: 13,
                                    marginTop: 2
                                },
                                children: [
                                    settings.shopAddress,
                                    " · ",
                                    settings.shopPhone
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(app)/page.tsx",
                                lineNumber: 49,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(app)/page.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "sheet",
                        style: {
                            padding: "10px 16px",
                            borderLeft: "3px solid var(--accent)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "micro",
                                children: "Today"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(app)/page.tsx",
                                lineNumber: 57,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontWeight: 600,
                                    fontSize: 13.5
                                },
                                children: karachiToday()
                            }, void 0, false, {
                                fileName: "[project]/src/app/(app)/page.tsx",
                                lineNumber: 58,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(app)/page.tsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(app)/page.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid form-grid grid-2",
                style: {
                    gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))"
                },
                children: cards.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                        href: c.href,
                        className: "stat",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "micro",
                                children: c.label
                            }, void 0, false, {
                                fileName: "[project]/src/app/(app)/page.tsx",
                                lineNumber: 65,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "stat-value num",
                                style: {
                                    marginTop: 8
                                },
                                children: c.value
                            }, void 0, false, {
                                fileName: "[project]/src/app/(app)/page.tsx",
                                lineNumber: 66,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    color: "var(--muted)",
                                    fontSize: 11.5,
                                    marginTop: 6
                                },
                                children: c.sub
                            }, void 0, false, {
                                fileName: "[project]/src/app/(app)/page.tsx",
                                lineNumber: 69,
                                columnNumber: 13
                            }, this)
                        ]
                    }, c.label, true, {
                        fileName: "[project]/src/app/(app)/page.tsx",
                        lineNumber: 64,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/app/(app)/page.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(app)/page.tsx",
        lineNumber: 42,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/app/(app)/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/(app)/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0v74kyo._.js.map