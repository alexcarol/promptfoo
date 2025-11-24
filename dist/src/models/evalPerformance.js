"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedResultsCount = getCachedResultsCount;
exports.clearCountCache = clearCountCache;
exports.queryTestIndicesOptimized = queryTestIndicesOptimized;
const drizzle_orm_1 = require("drizzle-orm");
const index_1 = require("../database/index");
const tables_1 = require("../database/tables");
const logger_1 = __importDefault(require("../logger"));
// Simple in-memory cache for counts with 5-minute TTL
const countCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
async function getCachedResultsCount(evalId) {
    const cacheKey = `count:${evalId}`;
    const cached = countCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger_1.default.debug(`Using cached count for eval ${evalId}: ${cached.count}`);
        return cached.count;
    }
    const db = (0, index_1.getDb)();
    const start = Date.now();
    // Use COUNT(*) with the composite index on (eval_id, test_idx)
    const result = db
        .select({ count: (0, drizzle_orm_1.sql) `COUNT(DISTINCT test_idx)` })
        .from(tables_1.evalResultsTable)
        .where((0, drizzle_orm_1.sql) `eval_id = ${evalId}`)
        .all();
    const count = Number(result[0]?.count ?? 0);
    const duration = Date.now() - start;
    logger_1.default.debug(`Count query for eval ${evalId} took ${duration}ms`);
    // Cache the result
    countCache.set(cacheKey, { count, timestamp: Date.now() });
    return count;
}
function clearCountCache(evalId) {
    if (evalId) {
        countCache.delete(`count:${evalId}`);
    }
    else {
        countCache.clear();
    }
}
// Optimized query for test indices without heavy JSON search
async function queryTestIndicesOptimized(evalId, opts) {
    const db = (0, index_1.getDb)();
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? 50;
    const mode = opts.filterMode ?? 'all';
    // Build base query with efficient filtering
    let baseQuery = (0, drizzle_orm_1.sql) `eval_id = ${evalId}`;
    // Add mode filter (these can use indexes)
    if (mode === 'errors') {
        baseQuery = (0, drizzle_orm_1.sql) `${baseQuery} AND failure_reason = ${2}`; // ResultFailureReason.ERROR
    }
    else if (mode === 'failures') {
        baseQuery = (0, drizzle_orm_1.sql) `${baseQuery} AND success = 0 AND failure_reason != ${2}`;
    }
    else if (mode === 'passes') {
        baseQuery = (0, drizzle_orm_1.sql) `${baseQuery} AND success = 1`;
    }
    else if (mode === 'highlights') {
        baseQuery = (0, drizzle_orm_1.sql) `${baseQuery} AND json_extract(grading_result, '$.comment') LIKE '!highlight%'`;
    }
    // For search queries, only search in response field if no filters
    // This is a compromise - we search less fields but query is faster
    let searchCondition = (0, drizzle_orm_1.sql) `1=1`;
    if (opts.searchQuery && opts.searchQuery.trim() !== '' && !opts.filters?.length) {
        const sanitizedSearch = opts.searchQuery.replace(/'/g, "''");
        // Only search in response field for better performance
        searchCondition = (0, drizzle_orm_1.sql) `response LIKE ${'%' + sanitizedSearch + '%'}`;
    }
    const whereClause = (0, drizzle_orm_1.sql) `${baseQuery} AND ${searchCondition}`;
    // Get filtered count using the composite index
    const countStart = Date.now();
    const countQuery = (0, drizzle_orm_1.sql) `
    SELECT COUNT(DISTINCT test_idx) as count 
    FROM ${tables_1.evalResultsTable} 
    WHERE ${whereClause}
  `;
    const countResult = db.all(countQuery);
    const filteredCount = Number(countResult[0]?.count ?? 0);
    logger_1.default.debug(`Optimized count query took ${Date.now() - countStart}ms`);
    // Get test indices
    const idxStart = Date.now();
    const idxQuery = (0, drizzle_orm_1.sql) `
    SELECT DISTINCT test_idx 
    FROM ${tables_1.evalResultsTable} 
    WHERE ${whereClause}
    ORDER BY test_idx 
    LIMIT ${limit} 
    OFFSET ${offset}
  `;
    const rows = db.all(idxQuery);
    const testIndices = rows.map((row) => row.test_idx);
    logger_1.default.debug(`Optimized index query took ${Date.now() - idxStart}ms`);
    return { testIndices, filteredCount };
}
//# sourceMappingURL=evalPerformance.js.map