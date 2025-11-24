"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvalQueries = void 0;
exports.createEvalId = createEvalId;
exports.getEvalSummaries = getEvalSummaries;
const crypto_1 = require("crypto");
const drizzle_orm_1 = require("drizzle-orm");
const constants_1 = require("../constants");
const index_1 = require("../database/index");
const signal_1 = require("../database/signal");
const tables_1 = require("../database/tables");
const envars_1 = require("../envars");
const accounts_1 = require("../globalConfig/accounts");
const logger_1 = __importDefault(require("../logger"));
const utils_1 = require("../prompts/utils");
const constants_2 = require("../redteam/constants");
const sharedFrontend_1 = require("../redteam/sharedFrontend");
const index_2 = require("../types/index");
const convertEvalResultsToTable_1 = require("../util/convertEvalResultsToTable");
const createHash_1 = require("../util/createHash");
const index_3 = require("../util/exportToFile/index");
const invariant_1 = __importDefault(require("../util/invariant"));
const time_1 = require("../util/time");
const tokenUsageUtils_1 = require("../util/tokenUsageUtils");
const evalPerformance_1 = require("./evalPerformance");
const evalResult_1 = __importDefault(require("./evalResult"));
const calculateFilteredMetrics_1 = require("../util/calculateFilteredMetrics");
const metrics_1 = require("../redteam/metrics");
/**
 * Sanitizes runtime options to ensure only JSON-serializable data is persisted.
 * Removes non-serializable fields like AbortSignal, functions, and symbols.
 */
function sanitizeRuntimeOptions(options) {
    if (!options) {
        return undefined;
    }
    // Create a deep copy to avoid mutating the original
    const sanitized = { ...options };
    // Remove known non-serializable fields
    delete sanitized.abortSignal;
    // Remove any function or symbol values
    for (const key in sanitized) {
        const value = sanitized[key];
        if (typeof value === 'function' || typeof value === 'symbol') {
            delete sanitized[key];
        }
    }
    return sanitized;
}
function createEvalId(createdAt = new Date()) {
    return `eval-${(0, createHash_1.randomSequence)(3)}-${createdAt.toISOString().slice(0, 19)}`;
}
const escapeJsonPathKey = (key) => key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
class EvalQueries {
    static async getVarsFromEvals(evals) {
        const db = (0, index_1.getDb)();
        const query = drizzle_orm_1.sql.raw(`SELECT DISTINCT j.key, eval_id from (SELECT eval_id, json_extract(eval_results.test_case, '$.vars') as vars
FROM eval_results where eval_id IN (${evals.map((e) => `'${e.id}'`).join(',')})) t, json_each(t.vars) j;`);
        const results = await db.all(query);
        const vars = results.reduce((acc, r) => {
            acc[r.eval_id] = acc[r.eval_id] || [];
            acc[r.eval_id].push(r.key);
            return acc;
        }, {});
        return vars;
    }
    static async getVarsFromEval(evalId) {
        const db = (0, index_1.getDb)();
        const query = drizzle_orm_1.sql.raw(`SELECT DISTINCT j.key from (SELECT json_extract(eval_results.test_case, '$.vars') as vars
    FROM eval_results where eval_results.eval_id = '${evalId}') t, json_each(t.vars) j;`);
        const results = await db.all(query);
        const vars = results.map((r) => r.key);
        return vars;
    }
    static async setVars(evalId, vars) {
        const db = (0, index_1.getDb)();
        try {
            db.update(tables_1.evalsTable).set({ vars }).where((0, drizzle_orm_1.eq)(tables_1.evalsTable.id, evalId)).run();
        }
        catch (e) {
            logger_1.default.error(`Error setting vars: ${vars} for eval ${evalId}: ${e}`);
        }
    }
    static async getMetadataKeysFromEval(evalId, comparisonEvalIds = []) {
        const db = (0, index_1.getDb)();
        try {
            // Combine primary eval ID with comparison eval IDs
            const allEvalIds = [evalId, ...comparisonEvalIds];
            // Use json_valid() to filter out malformed JSON and add LIMIT for DoS protection
            const query = (0, drizzle_orm_1.sql) `
        SELECT DISTINCT j.key FROM (
          SELECT metadata FROM eval_results
          WHERE eval_id IN (${drizzle_orm_1.sql.join(allEvalIds, (0, drizzle_orm_1.sql) `, `)})
            AND metadata IS NOT NULL
            AND metadata != '{}'
            AND json_valid(metadata)
          LIMIT 10000
        ) t, json_each(t.metadata) j
        ORDER BY j.key
        LIMIT 1000
      `;
            const results = await db.all(query);
            return results.map((r) => r.key);
        }
        catch (error) {
            // Log error but return empty array to prevent breaking the UI
            logger_1.default.error(`Error fetching metadata keys for eval ${evalId} and comparisons [${comparisonEvalIds.join(', ')}]: ${error}`);
            return [];
        }
    }
    /**
     * Queries all unique metadata values for a given metadata key.
     * @param evalId - The ID of the eval to get the metadata values from.
     * @param key - The key of the metadata to get the values from.
     * @returns An array of unique metadata values.
     */
    static getMetadataValuesFromEval(evalId, key) {
        const db = (0, index_1.getDb)();
        const trimmedKey = key.trim();
        if (!trimmedKey) {
            return [];
        }
        try {
            const escapedKey = escapeJsonPathKey(trimmedKey);
            const jsonPath = `$."${escapedKey}"`;
            const query = (0, drizzle_orm_1.sql) `
        SELECT DISTINCT
          json_extract(${tables_1.evalResultsTable.metadata}, ${jsonPath}) AS value
        FROM ${tables_1.evalResultsTable}
        WHERE ${tables_1.evalResultsTable.evalId} = ${evalId}
          AND ${tables_1.evalResultsTable.metadata} IS NOT NULL
          AND ${tables_1.evalResultsTable.metadata} != '{}'
          AND json_valid(${tables_1.evalResultsTable.metadata})
          AND json_extract(${tables_1.evalResultsTable.metadata}, ${jsonPath}) IS NOT NULL
        ORDER BY value
        LIMIT 1000
      `;
            const rows = db.all(query);
            const values = rows
                .map(({ value }) => String(value).trim())
                .filter((value) => Boolean(value && value.length > 0));
            return Array.from(new Set(values));
        }
        catch (error) {
            logger_1.default.error(`Error fetching metadata values for eval ${evalId} and key ${trimmedKey}: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
}
exports.EvalQueries = EvalQueries;
class Eval {
    static async latest() {
        const db = (0, index_1.getDb)();
        const db_results = await db
            .select({
            id: tables_1.evalsTable.id,
        })
            .from(tables_1.evalsTable)
            .orderBy((0, drizzle_orm_1.desc)(tables_1.evalsTable.createdAt))
            .limit(1);
        if (db_results.length === 0) {
            return undefined;
        }
        return await Eval.findById(db_results[0].id);
    }
    static async findById(id) {
        const db = (0, index_1.getDb)();
        const evalData = db.select().from(tables_1.evalsTable).where((0, drizzle_orm_1.eq)(tables_1.evalsTable.id, id)).all();
        if (evalData.length === 0) {
            return undefined;
        }
        const datasetResults = db
            .select({
            datasetId: tables_1.evalsToDatasetsTable.datasetId,
        })
            .from(tables_1.evalsToDatasetsTable)
            .where((0, drizzle_orm_1.eq)(tables_1.evalsToDatasetsTable.evalId, id))
            .limit(1)
            .all();
        const eval_ = evalData[0];
        const datasetId = datasetResults[0]?.datasetId;
        const evalInstance = new Eval(eval_.config, {
            id: eval_.id,
            createdAt: new Date(eval_.createdAt),
            author: eval_.author || undefined,
            description: eval_.description || undefined,
            prompts: eval_.prompts || [],
            datasetId,
            persisted: true,
            vars: eval_.vars || [],
            runtimeOptions: eval_.runtimeOptions,
        });
        if (eval_.results && 'table' in eval_.results) {
            evalInstance.oldResults = eval_.results;
        }
        // backfill vars
        if (!eval_.vars || eval_.vars.length === 0) {
            const vars = await EvalQueries.getVarsFromEval(id);
            evalInstance.setVars(vars);
            await EvalQueries.setVars(id, vars);
        }
        return evalInstance;
    }
    static async getMany(limit = constants_1.DEFAULT_QUERY_LIMIT) {
        const db = (0, index_1.getDb)();
        const evals = await db
            .select()
            .from(tables_1.evalsTable)
            .limit(limit)
            .orderBy((0, drizzle_orm_1.desc)(tables_1.evalsTable.createdAt))
            .all();
        return evals.map((e) => new Eval(e.config, {
            id: e.id,
            createdAt: new Date(e.createdAt),
            author: e.author || undefined,
            description: e.description || undefined,
            prompts: e.prompts || [],
            persisted: true,
        }));
    }
    static async create(config, renderedPrompts, // The config doesn't contain the actual prompts, so we need to pass them in separately
    opts) {
        const createdAt = opts?.createdAt || new Date();
        const evalId = opts?.id || createEvalId(createdAt);
        const author = opts?.author || (0, accounts_1.getUserEmail)();
        const db = (0, index_1.getDb)();
        const datasetId = (0, createHash_1.sha256)(JSON.stringify(config.tests || []));
        db.transaction(() => {
            db.insert(tables_1.evalsTable)
                .values({
                id: evalId,
                createdAt: createdAt.getTime(),
                author,
                description: config.description,
                config,
                results: {},
                vars: opts?.vars || [],
                runtimeOptions: sanitizeRuntimeOptions(opts?.runtimeOptions),
                prompts: opts?.completedPrompts || [],
            })
                .run();
            for (const prompt of renderedPrompts) {
                const label = prompt.label || prompt.display || prompt.raw;
                const promptId = (0, utils_1.hashPrompt)(prompt);
                db.insert(tables_1.promptsTable)
                    .values({
                    id: promptId,
                    prompt: label,
                })
                    .onConflictDoNothing()
                    .run();
                db.insert(tables_1.evalsToPromptsTable)
                    .values({
                    evalId,
                    promptId,
                })
                    .onConflictDoNothing()
                    .run();
                logger_1.default.debug(`Inserting prompt ${promptId}`);
            }
            if (opts?.results && opts.results.length > 0) {
                const res = db
                    .insert(tables_1.evalResultsTable)
                    .values(opts.results?.map((r) => ({ ...r, evalId, id: (0, crypto_1.randomUUID)() })))
                    .run();
                logger_1.default.debug(`Inserted ${res.changes} eval results`);
            }
            db.insert(tables_1.datasetsTable)
                .values({
                id: datasetId,
                tests: config.tests,
            })
                .onConflictDoNothing()
                .run();
            db.insert(tables_1.evalsToDatasetsTable)
                .values({
                evalId,
                datasetId,
            })
                .onConflictDoNothing()
                .run();
            logger_1.default.debug(`Inserting dataset ${datasetId}`);
            if (config.tags) {
                for (const [tagKey, tagValue] of Object.entries(config.tags)) {
                    const tagId = (0, createHash_1.sha256)(`${tagKey}:${tagValue}`);
                    db.insert(tables_1.tagsTable)
                        .values({
                        id: tagId,
                        name: tagKey,
                        value: tagValue,
                    })
                        .onConflictDoNothing()
                        .run();
                    db.insert(tables_1.evalsToTagsTable)
                        .values({
                        evalId,
                        tagId,
                    })
                        .onConflictDoNothing()
                        .run();
                    logger_1.default.debug(`Inserting tag ${tagId}`);
                }
            }
        });
        return new Eval(config, {
            id: evalId,
            author: opts?.author,
            createdAt,
            persisted: true,
            runtimeOptions: sanitizeRuntimeOptions(opts?.runtimeOptions),
        });
    }
    constructor(config, opts) {
        this._resultsLoaded = false;
        this._shared = false;
        const createdAt = opts?.createdAt || new Date();
        this.createdAt = createdAt.getTime();
        this.id = opts?.id || createEvalId(createdAt);
        this.author = opts?.author;
        this.config = config;
        this.results = [];
        this.prompts = opts?.prompts || [];
        this.datasetId = opts?.datasetId;
        this.persisted = opts?.persisted || false;
        this._resultsLoaded = false;
        this.vars = opts?.vars || [];
        this.runtimeOptions = opts?.runtimeOptions;
    }
    version() {
        /**
         * Version 3 is the denormalized version of where the table and results are stored on the eval object.
         * Version 4 is the normalized version where the results are stored in another databse table and the table for vizualization is generated by the app.
         */
        return this.oldResults && 'table' in this.oldResults ? 3 : 4;
    }
    useOldResults() {
        return this.version() < 4;
    }
    setTable(table) {
        (0, invariant_1.default)(this.version() < 4, 'Eval is not version 3');
        (0, invariant_1.default)(this.oldResults, 'Old results not found');
        this.oldResults.table = table;
    }
    async save() {
        const db = (0, index_1.getDb)();
        const updateObj = {
            config: this.config,
            prompts: this.prompts,
            description: this.config.description,
            author: this.author,
            updatedAt: (0, time_1.getCurrentTimestamp)(),
            vars: Array.from(this.vars),
            runtimeOptions: sanitizeRuntimeOptions(this.runtimeOptions),
        };
        if (this.useOldResults()) {
            (0, invariant_1.default)(this.oldResults, 'Old results not found');
            updateObj.results = this.oldResults;
        }
        db.update(tables_1.evalsTable).set(updateObj).where((0, drizzle_orm_1.eq)(tables_1.evalsTable.id, this.id)).run();
        this.persisted = true;
    }
    setVars(vars) {
        this.vars = vars;
    }
    addVar(varName) {
        this.vars.push(varName);
    }
    getPrompts() {
        if (this.useOldResults()) {
            (0, invariant_1.default)(this.oldResults, 'Old results not found');
            return this.oldResults.table?.head.prompts || [];
        }
        return this.prompts;
    }
    async getTable() {
        if (this.useOldResults()) {
            return this.oldResults?.table || { head: { prompts: [], vars: [] }, body: [] };
        }
        return (0, convertEvalResultsToTable_1.convertResultsToTable)(await this.toResultsFile());
    }
    async addResult(result) {
        const newResult = await evalResult_1.default.createFromEvaluateResult(this.id, result, {
            persist: this.persisted,
        });
        if (!this.persisted) {
            // We're only going to keep results in memory if the eval isn't persisted in the database
            // This is to avoid memory issues when running large evaluations
            this.results.push(newResult);
        }
        if (this.persisted) {
            // Notify watchers that new results are available
            (0, signal_1.updateSignalFile)();
        }
    }
    async *fetchResultsBatched(batchSize = 100) {
        for await (const batch of evalResult_1.default.findManyByEvalIdBatched(this.id, { batchSize })) {
            yield batch;
        }
    }
    async getResultsCount() {
        // Use cached count for better performance
        return (0, evalPerformance_1.getCachedResultsCount)(this.id);
    }
    async fetchResultsByTestIdx(testIdx) {
        return await evalResult_1.default.findManyByEvalId(this.id, { testIdx });
    }
    /**
     * CRITICAL: Builds the WHERE SQL clause for filtering results.
     * This is the single source of truth for all filtering logic.
     * Used by both queryTestIndices() (pagination) and getFilteredMetrics().
     *
     * Any changes to filter logic MUST be made here to ensure consistency
     * between displayed rows and calculated metrics.
     *
     * @returns SQL WHERE clause string (without "WHERE" keyword)
     */
    buildFilterWhereSql(opts) {
        const mode = opts.filterMode ?? 'all';
        // Build filter conditions
        const conditions = [`eval_id = '${this.id}'`];
        if (mode === 'errors') {
            conditions.push(`failure_reason = ${index_2.ResultFailureReason.ERROR}`);
        }
        else if (mode === 'failures') {
            conditions.push(`success = 0 AND failure_reason != ${index_2.ResultFailureReason.ERROR}`);
        }
        else if (mode === 'passes') {
            conditions.push(`success = 1`);
        }
        else if (mode === 'highlights') {
            conditions.push(`json_extract(grading_result, '$.comment') LIKE '!highlight%'`);
        }
        // Add filters
        if (opts.filters && opts.filters.length > 0) {
            const filterConditions = [];
            // Helper function to sanitize SQL string values
            const sanitizeValue = (val) => val.replace(/'/g, "''");
            // Helper function to escape JSON path keys (quotes & backslashes) for safe SQLite json_extract() usage
            const escapeJsonPathKey = (key) => key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            opts.filters.forEach((filter) => {
                const { logicOperator, type, operator, value, field } = JSON.parse(filter);
                let condition = null;
                if (type === 'metric') {
                    // For backward compatibility: old filters use 'value' for metric name with 'equals' operator
                    // New filters use 'field' for metric name with comparison operators
                    const metricKey = field || value;
                    if (!metricKey) {
                        // Skip invalid metric filters
                        return;
                    }
                    const escapedField = escapeJsonPathKey(metricKey);
                    // Value must be a number
                    const numericValue = typeof value === 'number' ? value : Number.parseFloat(value);
                    if (operator === 'is_defined' || (operator === 'equals' && !field)) {
                        // 'is_defined': new operator that checks if metric exists
                        // 'equals' without field: old format for backward compatibility
                        condition = `json_extract(named_scores, '$."${escapedField}"') IS NOT NULL`;
                    }
                    // For the numeric operators, validate that the value is a number
                    else if (Number.isFinite(numericValue)) {
                        if (operator === 'eq') {
                            // Numeric equality
                            condition = `CAST(json_extract(named_scores, '$."${escapedField}"') AS REAL) = ${numericValue}`;
                        }
                        else if (operator === 'neq') {
                            // Numeric inequality
                            condition = `(json_extract(named_scores, '$."${escapedField}"') IS NOT NULL AND CAST(json_extract(named_scores, '$."${escapedField}"') AS REAL) != ${numericValue})`;
                        }
                        else if (operator === 'gt') {
                            // Greater than
                            condition = `CAST(json_extract(named_scores, '$."${escapedField}"') AS REAL) > ${numericValue}`;
                        }
                        else if (operator === 'gte') {
                            // Greater than or equal
                            condition = `CAST(json_extract(named_scores, '$."${escapedField}"') AS REAL) >= ${numericValue}`;
                        }
                        else if (operator === 'lt') {
                            // Less than
                            condition = `CAST(json_extract(named_scores, '$."${escapedField}"') AS REAL) < ${numericValue}`;
                        }
                        else if (operator === 'lte') {
                            // Less than or equal
                            condition = `CAST(json_extract(named_scores, '$."${escapedField}"') AS REAL) <= ${numericValue}`;
                        }
                    }
                }
                else if (type === 'metadata' && field) {
                    const sanitizedValue = sanitizeValue(value);
                    const escapedField = escapeJsonPathKey(field);
                    if (operator === 'equals') {
                        condition = `json_extract(metadata, '$."${escapedField}"') = '${sanitizedValue}'`;
                    }
                    else if (operator === 'contains') {
                        condition = `json_extract(metadata, '$."${escapedField}"') LIKE '%${sanitizedValue}%'`;
                    }
                    else if (operator === 'not_contains') {
                        condition = `(json_extract(metadata, '$."${escapedField}"') IS NULL OR json_extract(metadata, '$."${escapedField}"') NOT LIKE '%${sanitizedValue}%')`;
                    }
                    else if (operator === 'exists') {
                        // For exists, check if the field is present AND not empty (not null, not empty string, not just whitespace)
                        // Use a single json_extract call with LENGTH(TRIM()) for better performance
                        condition = `LENGTH(TRIM(COALESCE(json_extract(metadata, '$."${escapedField}"'), ''))) > 0`;
                    }
                }
                else if (type === 'plugin') {
                    const sanitizedValue = sanitizeValue(value);
                    const pluginIdPath = "json_extract(metadata, '$.pluginId')";
                    const isCategory = Object.keys(constants_2.PLUGIN_CATEGORIES).includes(sanitizedValue);
                    if (operator === 'equals') {
                        // Plugin ID is stored in metadata.pluginId
                        if (isCategory) {
                            condition = `${pluginIdPath} LIKE '${sanitizedValue}:%'`;
                        }
                        else {
                            condition = `${pluginIdPath} = '${sanitizedValue}'`;
                        }
                    }
                    else if (operator === 'not_equals') {
                        if (isCategory) {
                            condition = `(${pluginIdPath} IS NULL OR (${pluginIdPath} != '${sanitizedValue}' AND ${pluginIdPath} NOT LIKE '${sanitizedValue}:%'))`;
                        }
                        else {
                            condition = `(${pluginIdPath} IS NULL OR ${pluginIdPath} != '${sanitizedValue}')`;
                        }
                    }
                }
                else if (type === 'strategy' && operator === 'equals') {
                    const sanitizedValue = sanitizeValue(value);
                    if (sanitizedValue === 'basic') {
                        // Basic is represented by NULL in the metadata.strategyId field
                        condition = `(json_extract(metadata, '$.strategyId') IS NULL OR json_extract(metadata, '$.strategyId') = '')`;
                    }
                    else {
                        // Strategy ID is stored in metadata.strategyId
                        condition = `json_extract(metadata, '$.strategyId') = '${sanitizedValue}'`;
                    }
                }
                else if (type === 'severity' && operator === 'equals') {
                    const sanitizedValue = sanitizeValue(value);
                    // Severity can be explicit (metadata.severity) or implied by pluginId.
                    // When implied by pluginId, ignore cases where an explicit override disagrees.
                    const explicit = `json_extract(metadata, '$.severity') = '${sanitizedValue}'`;
                    // Get the severity map for all plugins
                    const severityMap = (0, sharedFrontend_1.getRiskCategorySeverityMap)(this.config?.redteam?.plugins);
                    // Find all plugin IDs that match the requested severity
                    const matchingPluginIds = Object.entries(severityMap)
                        .filter(([, severity]) => severity === sanitizedValue)
                        .map(([pluginId]) => pluginId);
                    // Build pluginId match conditions for this severity
                    const pluginIdPath = "json_extract(metadata, '$.pluginId')";
                    const pluginConditions = matchingPluginIds.map((pluginId) => {
                        const sanitizedPluginId = sanitizeValue(pluginId);
                        return pluginId.includes(':')
                            ? // It's a specific subcategory
                                `${pluginIdPath} = '${sanitizedPluginId}'`
                            : // It's a category, match any plugin starting with this prefix
                                `${pluginIdPath} LIKE '${sanitizedPluginId}:%'`;
                    });
                    // Final condition: explicit OR (plugin match AND no conflicting override)
                    if (pluginConditions.length > 0) {
                        // Plugin-derived severity is only applied when there's no conflicting explicitly-defined override
                        // in the row's metadata.
                        const overrideOk = `(json_extract(metadata, '$.severity') IS NULL OR json_extract(metadata, '$.severity') = '${sanitizedValue}')`;
                        condition = `(${explicit} OR ((${pluginConditions.join(' OR ')}) AND ${overrideOk}))`;
                    }
                    else {
                        condition = `(${explicit})`;
                    }
                }
                else if (type === 'policy' && operator === 'equals') {
                    const sanitizedValue = sanitizeValue(value);
                    condition = `(named_scores LIKE '%PolicyViolation:%' AND named_scores LIKE '%${sanitizedValue}%')`;
                }
                if (condition) {
                    // Apply logic operator if there are already existing filter conditions
                    filterConditions.push(filterConditions.length > 0 ? `${logicOperator} ${condition}` : condition);
                }
            });
            if (filterConditions.length > 0) {
                conditions.push(`(${filterConditions.join(' ')})`);
            }
        }
        // Add search condition if searchQuery is provided
        if (opts.searchQuery && opts.searchQuery.trim() !== '') {
            const sanitizedSearch = opts.searchQuery.replace(/'/g, "''");
            const searchConditions = [
                // Search in response text
                `response LIKE '%${sanitizedSearch}%'`,
                // Search in grading result reason
                `json_extract(grading_result, '$.reason') LIKE '%${sanitizedSearch}%'`,
                // Search in grading result comment
                `json_extract(grading_result, '$.comment') LIKE '%${sanitizedSearch}%'`,
                // Search in named scores
                `json_extract(named_scores, '$') LIKE '%${sanitizedSearch}%'`,
                // Search in metadata
                `json_extract(metadata, '$') LIKE '%${sanitizedSearch}%'`,
                // Search in test case vars
                `json_extract(test_case, '$.vars') LIKE '%${sanitizedSearch}%'`,
                // Search in test case metadata
                `json_extract(test_case, '$.metadata') LIKE '%${sanitizedSearch}%'`,
            ];
            conditions.push(`(${searchConditions.join(' OR ')})`);
        }
        return conditions.join(' AND ');
    }
    /**
     * Private helper method to build filter conditions and query for test indices
     */
    async queryTestIndices(opts) {
        const db = (0, index_1.getDb)();
        const offset = opts.offset ?? 0;
        const limit = opts.limit ?? 50;
        // CRITICAL: Use single source of truth for WHERE clause
        const whereSql = this.buildFilterWhereSql({
            filterMode: opts.filterMode,
            searchQuery: opts.searchQuery,
            filters: opts.filters,
        });
        // Get filtered count
        const filteredCountQuery = drizzle_orm_1.sql.raw(`SELECT COUNT(DISTINCT test_idx) as count FROM eval_results WHERE ${whereSql}`);
        const countStart = Date.now();
        const countResult = await db.get(filteredCountQuery);
        const countEnd = Date.now();
        logger_1.default.debug(`Count query took ${countEnd - countStart}ms`);
        const filteredCount = countResult?.count || 0;
        // Query for test indices based on filters
        const idxQuery = drizzle_orm_1.sql.raw(`SELECT DISTINCT test_idx FROM eval_results WHERE ${whereSql} ORDER BY test_idx LIMIT ${limit} OFFSET ${offset}`);
        const idxStart = Date.now();
        const rows = await db.all(idxQuery);
        const idxEnd = Date.now();
        logger_1.default.debug(`Index query took ${idxEnd - idxStart}ms`);
        // Get all test indices from the rows
        const testIndices = rows.map((row) => row.test_idx);
        return { testIndices, filteredCount };
    }
    /**
     * CRITICAL: Calculates metrics for filtered results.
     * Uses the SAME WHERE clause as queryTestIndices() to ensure consistency.
     *
     * This method is called from the API route when filters are active to provide
     * metrics that accurately reflect the filtered dataset.
     *
     * @returns Array of PromptMetrics, one per prompt
     */
    async getFilteredMetrics(opts) {
        // CRITICAL: Use the SAME WHERE clause as queryTestIndices
        const whereSql = this.buildFilterWhereSql(opts);
        return (0, calculateFilteredMetrics_1.calculateFilteredMetrics)({
            evalId: this.id,
            numPrompts: this.prompts.length,
            whereSql,
            whereParams: [], // SQLite uses string interpolation in this codebase
        });
    }
    async getTablePage(opts) {
        // Get total count of tests for this eval
        const totalCount = await this.getResultsCount();
        // Determine test indices to use
        let testIndices;
        let filteredCount;
        if (opts.testIndices && opts.testIndices.length > 0) {
            // Use the provided test indices directly
            testIndices = opts.testIndices;
            filteredCount = testIndices.length;
        }
        else {
            // Use optimized query for simple cases, fall back to original for complex filters
            const hasComplexFilters = opts.filters && opts.filters.length > 0;
            let queryResult;
            if (hasComplexFilters) {
                // Fall back to original query for complex filters
                logger_1.default.debug('Using original query for complex filters');
                queryResult = await this.queryTestIndices({
                    offset: opts.offset,
                    limit: opts.limit,
                    filterMode: opts.filterMode,
                    searchQuery: opts.searchQuery,
                    filters: opts.filters,
                });
            }
            else {
                // Use optimized query for better performance
                logger_1.default.debug('Using optimized query for table page');
                queryResult = await (0, evalPerformance_1.queryTestIndicesOptimized)(this.id, {
                    offset: opts.offset,
                    limit: opts.limit,
                    filterMode: opts.filterMode,
                    searchQuery: opts.searchQuery,
                    filters: opts.filters,
                });
            }
            testIndices = queryResult.testIndices;
            filteredCount = queryResult.filteredCount;
        }
        // Get vars for this eval
        const varsStart = Date.now();
        const vars = Array.from(this.vars);
        const varsEnd = Date.now();
        logger_1.default.debug(`Vars query took ${varsEnd - varsStart}ms`);
        // Initialize the body array that will hold table rows
        const body = [];
        const bodyStart = Date.now();
        // Early return if no test indices found
        if (testIndices.length === 0) {
            const bodyEnd = Date.now();
            logger_1.default.debug(`Body query took ${bodyEnd - bodyStart}ms`);
            return {
                head: { prompts: this.prompts, vars },
                body,
                totalCount,
                filteredCount,
                id: this.id,
            };
        }
        // Fetch all results for these test indices in a single query
        const allResults = await evalResult_1.default.findManyByEvalIdAndTestIndices(this.id, testIndices);
        // Group results by test index
        const resultsByTestIdx = new Map();
        for (const result of allResults) {
            if (!resultsByTestIdx.has(result.testIdx)) {
                resultsByTestIdx.set(result.testIdx, []);
            }
            resultsByTestIdx.get(result.testIdx).push(result);
        }
        // Create table rows in the same order as the original query
        for (const testIdx of testIndices) {
            const results = resultsByTestIdx.get(testIdx) || [];
            if (results.length > 0) {
                body.push((0, index_3.convertTestResultsToTableRow)(results, vars));
            }
        }
        const bodyEnd = Date.now();
        logger_1.default.debug(`Body query took ${bodyEnd - bodyStart}ms`);
        return { head: { prompts: this.prompts, vars }, body, totalCount, filteredCount, id: this.id };
    }
    async addPrompts(prompts) {
        this.prompts = prompts;
        if (this.persisted) {
            const db = (0, index_1.getDb)();
            db.update(tables_1.evalsTable).set({ prompts }).where((0, drizzle_orm_1.eq)(tables_1.evalsTable.id, this.id)).run();
        }
    }
    async setResults(results) {
        this.results = results;
        if (this.persisted) {
            const db = (0, index_1.getDb)();
            await db.insert(tables_1.evalResultsTable).values(results.map((r) => ({ ...r, evalId: this.id })));
        }
        this._resultsLoaded = true;
    }
    async loadResults() {
        this.results = await evalResult_1.default.findManyByEvalId(this.id);
        this._resultsLoaded = true;
    }
    async getResults() {
        if (this.useOldResults()) {
            (0, invariant_1.default)(this.oldResults, 'Old results not found');
            return this.oldResults.results;
        }
        await this.loadResults();
        this._resultsLoaded = true;
        return this.results;
    }
    clearResults() {
        this.results = [];
        this._resultsLoaded = false;
    }
    getStats() {
        const stats = {
            successes: 0,
            failures: 0,
            errors: 0,
            tokenUsage: (0, tokenUsageUtils_1.createEmptyTokenUsage)(),
        };
        for (const prompt of this.prompts) {
            stats.successes += prompt.metrics?.testPassCount ?? 0;
            stats.failures += prompt.metrics?.testFailCount ?? 0;
            stats.errors += prompt.metrics?.testErrorCount ?? 0;
            (0, tokenUsageUtils_1.accumulateTokenUsage)(stats.tokenUsage, prompt.metrics?.tokenUsage);
        }
        return stats;
    }
    async toEvaluateSummary() {
        if (this.useOldResults()) {
            (0, invariant_1.default)(this.oldResults, 'Old results not found');
            return {
                version: 2,
                timestamp: new Date(this.createdAt).toISOString(),
                results: this.oldResults.results,
                table: this.oldResults.table,
                stats: this.oldResults.stats,
            };
        }
        if (this.results.length === 0) {
            await this.loadResults();
        }
        const stats = await this.getStats();
        const shouldStripPromptText = (0, envars_1.getEnvBool)('PROMPTFOO_STRIP_PROMPT_TEXT', false);
        const prompts = shouldStripPromptText
            ? this.prompts.map((p) => ({
                ...p,
                raw: '[prompt stripped]',
            }))
            : this.prompts;
        return {
            version: 3,
            timestamp: new Date(this.createdAt).toISOString(),
            prompts,
            results: this.results.map((r) => r.toEvaluateResult()),
            stats,
        };
    }
    async toResultsFile() {
        const results = {
            version: this.version(),
            createdAt: new Date(this.createdAt).toISOString(),
            results: await this.toEvaluateSummary(),
            config: this.config,
            author: this.author || null,
            prompts: this.getPrompts(),
            datasetId: this.datasetId || null,
        };
        return results;
    }
    async delete() {
        const db = (0, index_1.getDb)();
        db.transaction(() => {
            db.delete(tables_1.evalsToDatasetsTable).where((0, drizzle_orm_1.eq)(tables_1.evalsToDatasetsTable.evalId, this.id)).run();
            db.delete(tables_1.evalsToPromptsTable).where((0, drizzle_orm_1.eq)(tables_1.evalsToPromptsTable.evalId, this.id)).run();
            db.delete(tables_1.evalsToTagsTable).where((0, drizzle_orm_1.eq)(tables_1.evalsToTagsTable.evalId, this.id)).run();
            db.delete(tables_1.evalResultsTable).where((0, drizzle_orm_1.eq)(tables_1.evalResultsTable.evalId, this.id)).run();
            db.delete(tables_1.evalsTable).where((0, drizzle_orm_1.eq)(tables_1.evalsTable.id, this.id)).run();
        });
    }
    /**
     * Creates a deep copy of this eval including all results.
     * Uses batching to avoid memory exhaustion on large evals.
     * @param description - Optional description for the new eval
     * @param distinctTestCount - Optional pre-computed test count to avoid duplicate query
     */
    async copy(description, distinctTestCount) {
        const newEvalId = createEvalId(new Date());
        const copyDescription = description || `${this.description || 'Evaluation'} (Copy)`;
        // Get distinct test count for logging and progress tracking
        const testCount = distinctTestCount ?? (await this.getResultsCount());
        logger_1.default.info('Starting eval copy', {
            sourceEvalId: this.id,
            targetEvalId: newEvalId,
            distinctTestCount: testCount,
        });
        // Deep clone to prevent mutation issues
        const newConfig = structuredClone(this.config);
        newConfig.description = copyDescription;
        const newPrompts = structuredClone(this.prompts);
        const newVars = this.vars ? structuredClone(this.vars) : [];
        const author = (0, accounts_1.getUserEmail)();
        const db = (0, index_1.getDb)();
        // Copy eval, results, and relationships within transaction for atomicity
        let copiedCount = 0;
        db.transaction(() => {
            // Create the new eval record first
            db.insert(tables_1.evalsTable)
                .values({
                id: newEvalId,
                createdAt: Date.now(),
                author,
                description: copyDescription,
                config: newConfig,
                results: {},
                prompts: newPrompts,
                vars: newVars,
                runtimeOptions: sanitizeRuntimeOptions(this.runtimeOptions),
                isRedteam: Boolean(newConfig.redteam),
            })
                .run();
            // Copy prompts relationships
            // Note: prompts already exist in promptsTable from when the source eval was created
            // We just need to create new relationships pointing to those same prompts
            const promptRels = db
                .select()
                .from(tables_1.evalsToPromptsTable)
                .where((0, drizzle_orm_1.eq)(tables_1.evalsToPromptsTable.evalId, this.id))
                .all();
            if (promptRels.length > 0) {
                db.insert(tables_1.evalsToPromptsTable)
                    .values(promptRels.map((rel) => ({
                    evalId: newEvalId,
                    promptId: rel.promptId,
                })))
                    .onConflictDoNothing()
                    .run();
            }
            // Copy tags relationships (from config.tags)
            if (this.config.tags) {
                for (const [tagKey, tagValue] of Object.entries(this.config.tags)) {
                    const tagId = (0, createHash_1.sha256)(`${tagKey}:${tagValue}`);
                    db.insert(tables_1.tagsTable)
                        .values({
                        id: tagId,
                        name: tagKey,
                        value: tagValue,
                    })
                        .onConflictDoNothing()
                        .run();
                    db.insert(tables_1.evalsToTagsTable)
                        .values({
                        evalId: newEvalId,
                        tagId,
                    })
                        .onConflictDoNothing()
                        .run();
                }
            }
            // Copy dataset relationship
            const datasetRel = db
                .select()
                .from(tables_1.evalsToDatasetsTable)
                .where((0, drizzle_orm_1.eq)(tables_1.evalsToDatasetsTable.evalId, this.id))
                .limit(1)
                .all();
            if (datasetRel.length > 0) {
                db.insert(tables_1.evalsToDatasetsTable)
                    .values({
                    evalId: newEvalId,
                    datasetId: datasetRel[0].datasetId,
                })
                    .onConflictDoNothing()
                    .run();
            }
            // Copy results in batches to avoid memory exhaustion
            const BATCH_SIZE = 1000;
            let offset = 0;
            while (true) {
                // Fetch batch from source eval
                const batch = db
                    .select()
                    .from(tables_1.evalResultsTable)
                    .where((0, drizzle_orm_1.eq)(tables_1.evalResultsTable.evalId, this.id))
                    .orderBy(tables_1.evalResultsTable.id)
                    .limit(BATCH_SIZE)
                    .offset(offset)
                    .all();
                if (batch.length === 0) {
                    break;
                }
                // Map to new eval with new IDs and timestamps
                const now = Date.now();
                const copiedResults = batch.map((result) => ({
                    ...result,
                    id: (0, crypto_1.randomUUID)(),
                    evalId: newEvalId,
                    createdAt: now,
                    updatedAt: now,
                }));
                // Insert batch
                db.insert(tables_1.evalResultsTable).values(copiedResults).run();
                copiedCount += batch.length;
                offset += BATCH_SIZE;
                logger_1.default.debug('Copied batch of eval results', {
                    sourceEvalId: this.id,
                    targetEvalId: newEvalId,
                    batchSize: batch.length,
                    rowsCopied: copiedCount,
                    distinctTestCount: testCount,
                });
            }
        });
        logger_1.default.info('Eval copy completed successfully', {
            sourceEvalId: this.id,
            targetEvalId: newEvalId,
            rowsCopied: copiedCount,
            distinctTestCount: testCount,
        });
        return (await Eval.findById(newEvalId));
    }
    get shared() {
        return this._shared;
    }
    set shared(shared) {
        this._shared = shared;
    }
}
exports.default = Eval;
/**
 * Queries summaries of all evals, optionally for a given dataset.
 *
 * @param datasetId - An optional dataset ID to filter by.
 * @param type - An optional eval type to filter by.
 * @param includeProviders - An optional flag to include providers in the summary.
 * @returns A list of eval summaries.
 */
async function getEvalSummaries(datasetId, type, includeProviders = false) {
    const db = (0, index_1.getDb)();
    const whereClauses = [];
    if (datasetId) {
        whereClauses.push((0, drizzle_orm_1.eq)(tables_1.evalsToDatasetsTable.datasetId, datasetId));
    }
    if (type) {
        if (type === 'redteam') {
            whereClauses.push((0, drizzle_orm_1.sql) `json_type(${tables_1.evalsTable.config}, '$.redteam') IS NOT NULL`);
        }
        else {
            whereClauses.push((0, drizzle_orm_1.sql) `json_type(${tables_1.evalsTable.config}, '$.redteam') IS NULL`);
        }
    }
    const results = db
        .select({
        evalId: tables_1.evalsTable.id,
        createdAt: tables_1.evalsTable.createdAt,
        description: tables_1.evalsTable.description,
        datasetId: tables_1.evalsToDatasetsTable.datasetId,
        isRedteam: (0, drizzle_orm_1.sql) `json_type(${tables_1.evalsTable.config}, '$.redteam') IS NOT NULL`,
        prompts: tables_1.evalsTable.prompts,
        config: tables_1.evalsTable.config,
    })
        .from(tables_1.evalsTable)
        .leftJoin(tables_1.evalsToDatasetsTable, (0, drizzle_orm_1.eq)(tables_1.evalsTable.id, tables_1.evalsToDatasetsTable.evalId))
        .where((0, drizzle_orm_1.and)(...whereClauses))
        .orderBy((0, drizzle_orm_1.desc)(tables_1.evalsTable.createdAt))
        .all();
    /**
     * Deserialize the evals. A few things to note:
     *
     * - Test statistics are derived from the prompt metrics as this is the only reliable source of truth
     * that's written to the evals table.
     */
    return results.map((result) => {
        const passCount = result.prompts?.reduce((memo, prompt) => {
            return memo + (prompt.metrics?.testPassCount ?? 0);
        }, 0) ?? 0;
        const failCount = result.prompts?.reduce((memo, prompt) => {
            return memo + (prompt.metrics?.testFailCount ?? 0);
        }, 0) ?? 0;
        // All prompts should have the same number of test cases:
        const testCounts = result.prompts?.map((p) => {
            return ((p.metrics?.testPassCount ?? 0) +
                (p.metrics?.testFailCount ?? 0) +
                (p.metrics?.testErrorCount ?? 0));
        }) ?? [0];
        // Derive the number of tests from the first prompt.
        const testCount = testCounts.length > 0 ? testCounts[0] : 0;
        // Test count * prompt count
        const testRunCount = testCount * (result.prompts?.length ?? 0);
        // Construct an array of providers
        const deserializedProviders = [];
        const providers = result.config.providers;
        if (includeProviders) {
            if (typeof providers === 'string') {
                // `providers: string`
                deserializedProviders.push({
                    id: providers,
                    label: null,
                });
            }
            else if (Array.isArray(providers)) {
                providers.forEach((p) => {
                    if (typeof p === 'string') {
                        // `providers: string[]`
                        deserializedProviders.push({
                            id: p,
                            label: null,
                        });
                    }
                    else if (typeof p === 'object' && p) {
                        // Check if it's a declarative provider (record format)
                        // e.g., { 'openai:gpt-4': { config: {...} } }
                        const keys = Object.keys(p);
                        if (keys.length === 1 && !('id' in p)) {
                            // This is a declarative provider
                            const providerId = keys[0];
                            const providerConfig = p[providerId];
                            deserializedProviders.push({
                                id: providerId,
                                label: providerConfig.label ?? null,
                            });
                        }
                        else {
                            // `providers: ProviderOptions[]` with explicit id
                            deserializedProviders.push({
                                id: p.id ?? 'unknown',
                                label: p.label ?? null,
                            });
                        }
                    }
                });
            }
        }
        return {
            evalId: result.evalId,
            createdAt: result.createdAt,
            description: result.description,
            numTests: testCount,
            datasetId: result.datasetId,
            isRedteam: result.isRedteam,
            passRate: testRunCount > 0 ? (passCount / testRunCount) * 100 : 0,
            label: result.description ? `${result.description} (${result.evalId})` : result.evalId,
            providers: deserializedProviders,
            attackSuccessRate: type === 'redteam' ? (0, metrics_1.calculateAttackSuccessRate)(testRunCount, failCount) : undefined,
        };
    });
}
//# sourceMappingURL=eval.js.map