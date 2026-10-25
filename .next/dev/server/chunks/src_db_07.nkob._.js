module.exports = [
"[project]/src/db/index.ts [instrumentation] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[root-of-the-server]__0gw2oio._.js",
  "server/chunks/src_db_index_ts_0fadv14._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/src/db/index.ts [instrumentation] (ecmascript)");
    });
});
}),
"[project]/src/db/schema.ts [instrumentation] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/node_modules_drizzle-orm_0-vbq-2._.js",
  "server/chunks/src_db_schema_ts_0xlg71b._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/src/db/schema.ts [instrumentation] (ecmascript)");
    });
});
}),
];