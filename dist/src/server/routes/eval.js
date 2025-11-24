"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evalJobs = exports.evalRouter = void 0;
const dedent_1 = __importDefault(require("dedent"));
const express_1 = require("express");
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const accounts_1 = require("../../globalConfig/accounts");
const index_1 = __importDefault(require("../../index"));
const logger_1 = __importDefault(require("../../logger"));
const eval_1 = __importStar(require("../../models/eval"));
const evalResult_1 = __importDefault(require("../../models/evalResult"));
const index_2 = require("../../types/index");
const database_1 = require("../../util/database");
const invariant_1 = __importDefault(require("../../util/invariant"));
const apiSchemas_1 = require("../apiSchemas");
const evalTableUtils_1 = require("../utils/evalTableUtils");
const downloadHelpers_1 = require("../utils/downloadHelpers");
exports.evalRouter = (0, express_1.Router)();
// Running jobs
exports.evalJobs = new Map();
exports.evalRouter.post('/job', (req, res) => {
    const { evaluateOptions, ...testSuite } = req.body;
    const id = (0, uuid_1.v4)();
    exports.evalJobs.set(id, {
        evalId: null,
        status: 'in-progress',
        progress: 0,
        total: 0,
        result: null,
        logs: [],
    });
    index_1.default
        .evaluate(Object.assign({}, testSuite, {
        writeLatestResults: true,
        sharing: testSuite.sharing ?? true,
    }), Object.assign({}, evaluateOptions, {
        eventSource: 'web',
        progressCallback: (progress, total) => {
            const job = exports.evalJobs.get(id);
            (0, invariant_1.default)(job, 'Job not found');
            job.progress = progress;
            job.total = total;
            console.log(`[${id}] ${progress}/${total}`);
        },
    }))
        .then(async (result) => {
        const job = exports.evalJobs.get(id);
        (0, invariant_1.default)(job, 'Job not found');
        job.status = 'complete';
        job.result = await result.toEvaluateSummary();
        job.evalId = result.id;
        console.log(`[${id}] Complete`);
    })
        .catch((error) => {
        logger_1.default.error((0, dedent_1.default) `Failed to eval tests:
        Error: ${error}
        Body: ${JSON.stringify(req.body, null, 2)}`);
        const job = exports.evalJobs.get(id);
        (0, invariant_1.default)(job, 'Job not found');
        job.status = 'error';
        job.result = null;
        job.evalId = null;
        job.logs = [String(error)];
    });
    res.json({ id });
});
exports.evalRouter.get('/job/:id', (req, res) => {
    const id = req.params.id;
    const job = exports.evalJobs.get(id);
    if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
    }
    if (job.status === 'complete') {
        res.json({
            status: 'complete',
            result: job.result,
            evalId: job.evalId,
            logs: job.logs,
        });
    }
    else if (job.status === 'error') {
        res.json({
            status: 'error',
            logs: job.logs,
        });
    }
    else {
        res.json({
            status: 'in-progress',
            progress: job.progress,
            total: job.total,
            logs: job.logs,
        });
    }
});
exports.evalRouter.patch('/:id', (req, res) => {
    const id = req.params.id;
    const { table, config } = req.body;
    if (!id) {
        res.status(400).json({ error: 'Missing id' });
        return;
    }
    try {
        (0, database_1.updateResult)(id, config, table);
        res.json({ message: 'Eval updated successfully' });
    }
    catch {
        res.status(500).json({ error: 'Failed to update eval table' });
    }
});
exports.evalRouter.patch('/:id/author', async (req, res) => {
    try {
        const { id } = apiSchemas_1.ApiSchemas.Eval.UpdateAuthor.Params.parse(req.params);
        const { author } = apiSchemas_1.ApiSchemas.Eval.UpdateAuthor.Request.parse(req.body);
        const eval_ = await eval_1.default.findById(id);
        if (!eval_) {
            res.status(404).json({ error: 'Eval not found' });
            return;
        }
        if (!author) {
            res.status(400).json({ error: 'No author provided' });
            return;
        }
        eval_.author = author;
        await eval_.save();
        // NOTE: Side effect. If user email is not set, set it to the author's email
        if (!(0, accounts_1.getUserEmail)()) {
            (0, accounts_1.setUserEmail)(author);
        }
        res.json(apiSchemas_1.ApiSchemas.Eval.UpdateAuthor.Response.parse({
            message: 'Author updated successfully',
        }));
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const validationError = (0, zod_validation_error_1.fromZodError)(error);
            res.status(400).json({ error: validationError.message });
        }
        else {
            logger_1.default.error(`Failed to update eval author: ${error}`);
            res.status(500).json({ error: 'Failed to update eval author' });
        }
    }
});
// Query parameter schemas
const evalTableQuerySchema = zod_1.z.object({
    format: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().positive().default(50),
    offset: zod_1.z.coerce.number().nonnegative().default(0),
    filterMode: index_2.EvalResultsFilterMode.default('all'),
    search: zod_1.z.string().default(''),
    filter: zod_1.z
        .union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())])
        .transform((v) => (Array.isArray(v) ? v : v ? [v] : []))
        .default([]),
    comparisonEvalIds: zod_1.z
        .union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())])
        .transform((v) => (Array.isArray(v) ? v : v ? [v] : []))
        .default([]),
});
const UNLIMITED_RESULTS = Number.MAX_SAFE_INTEGER;
exports.evalRouter.get('/:id/table', async (req, res) => {
    const { id } = req.params;
    // Parse and validate query parameters
    const queryResult = evalTableQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
        const validationError = (0, zod_validation_error_1.fromZodError)(queryResult.error);
        res.status(400).json({ error: validationError.message });
        return;
    }
    const { format, limit: baseLimit, offset: baseOffset, filterMode, search: searchText, filter: filters, comparisonEvalIds, } = queryResult.data;
    // Apply UNLIMITED_RESULTS when format is specified
    const limit = format ? UNLIMITED_RESULTS : baseLimit;
    const offset = format ? 0 : baseOffset;
    const eval_ = await eval_1.default.findById(id);
    if (!eval_) {
        res.status(404).json({ error: 'Eval not found' });
        return;
    }
    const table = await eval_.getTablePage({
        offset,
        limit,
        filterMode,
        searchQuery: searchText,
        filters: filters,
    });
    const indices = table.body.map((row) => row.testIdx);
    let returnTable = { head: table.head, body: table.body };
    if (comparisonEvalIds.length > 0) {
        const comparisonEvals = await Promise.all(comparisonEvalIds.map(async (comparisonEvalId) => {
            const comparisonEval_ = await eval_1.default.findById(comparisonEvalId);
            return comparisonEval_;
        }));
        if (comparisonEvals.some((comparisonEval_) => !comparisonEval_)) {
            res.status(404).json({ error: 'Comparison eval not found' });
            return;
        }
        const comparisonTables = await Promise.all(comparisonEvals.map(async (comparisonEval_) => {
            (0, invariant_1.default)(comparisonEval_, 'Comparison eval not found');
            return comparisonEval_.getTablePage({
                offset: 0,
                limit: indices.length,
                filterMode: 'all',
                testIndices: indices,
                searchQuery: searchText,
                filters: filters,
            });
        }));
        returnTable = {
            head: {
                prompts: [
                    ...table.head.prompts.map((prompt) => ({
                        ...prompt,
                        label: `[${id}] ${prompt.label || ''}`,
                    })),
                    ...comparisonTables.flatMap((table) => table.head.prompts.map((prompt) => ({
                        ...prompt,
                        label: `[${table.id}] ${prompt.label || ''}`,
                    }))),
                ],
                vars: table.head.vars, // Assuming vars are the same
            },
            body: table.body.map((row) => {
                // Find matching row in comparison table by test index
                const testIdx = row.testIdx;
                const matchingRows = comparisonTables
                    .map((table) => {
                    const compRow = table.body.find((compRow) => {
                        const compTestIdx = compRow.testIdx;
                        return compTestIdx === testIdx;
                    });
                    return compRow;
                })
                    .filter((r) => r !== undefined);
                return {
                    ...row,
                    outputs: [...row.outputs, ...(matchingRows.flatMap((r) => r?.outputs) || [])],
                };
            }),
        };
    }
    // Handle export formats
    if (format === 'csv') {
        const csvData = (0, evalTableUtils_1.evalTableToCsv)(returnTable, {
            isRedteam: Boolean(eval_.config.redteam),
        });
        (0, downloadHelpers_1.setDownloadHeaders)(res, `${id}.csv`, 'text/csv');
        res.send(csvData);
        return;
    }
    else if (format === 'json') {
        const jsonData = (0, evalTableUtils_1.evalTableToJson)(returnTable);
        (0, downloadHelpers_1.setDownloadHeaders)(res, `${id}.json`, 'application/json');
        res.json(jsonData);
        return;
    }
    // Calculate filtered metrics when filters are active
    let filteredMetrics = null;
    const hasActiveFilters = filterMode !== 'all' || searchText !== '' || filters.length > 0;
    if (hasActiveFilters) {
        try {
            filteredMetrics = await eval_.getFilteredMetrics({
                filterMode,
                searchQuery: searchText,
                filters: filters,
            });
            logger_1.default.debug('[GET /:id/table] Calculated filtered metrics', {
                evalId: id,
                filterMode,
                numPrompts: filteredMetrics.length,
            });
            // Validate that filteredMetrics array length matches prompts array length
            // Note: Use table.head.prompts (base eval) not returnTable.head.prompts (includes comparison evals)
            const expectedLength = table.head.prompts.length;
            if (filteredMetrics.length !== expectedLength) {
                logger_1.default.error('[GET /:id/table] Filtered metrics array length mismatch - setting to null to prevent frontend errors', {
                    evalId: id,
                    expectedLength,
                    actualLength: filteredMetrics.length,
                    filterMode,
                    searchText,
                    filtersCount: filters.length,
                });
                filteredMetrics = null;
            }
        }
        catch (error) {
            logger_1.default.error('[GET /:id/table] Failed to calculate filtered metrics', { error, evalId: id });
            // Don't fail the request, just return null for filteredMetrics
        }
    }
    // Default response for table view
    res.json({
        table: returnTable,
        totalCount: table.totalCount,
        filteredCount: table.filteredCount,
        filteredMetrics,
        config: eval_.config,
        author: eval_.author || null,
        version: eval_.version(),
        id,
    });
});
exports.evalRouter.get('/:id/metadata-keys', async (req, res) => {
    try {
        const { id } = apiSchemas_1.ApiSchemas.Eval.MetadataKeys.Params.parse(req.params);
        const { comparisonEvalIds = [] } = apiSchemas_1.ApiSchemas.Eval.MetadataKeys.Query.parse(req.query);
        const eval_ = await eval_1.default.findById(id);
        if (!eval_) {
            res.status(404).json({ error: 'Eval not found' });
            return;
        }
        // Validate that comparison evals exist
        if (comparisonEvalIds.length > 0) {
            const comparisonEvals = await Promise.all(comparisonEvalIds.map((compId) => eval_1.default.findById(compId)));
            const missingEvals = comparisonEvalIds.filter((_, index) => !comparisonEvals[index]);
            if (missingEvals.length > 0) {
                res.status(400).json({
                    error: `Comparison evals not found: ${missingEvals.join(', ')}`,
                });
                return;
            }
        }
        const keys = await eval_1.EvalQueries.getMetadataKeysFromEval(id, comparisonEvalIds);
        const response = apiSchemas_1.ApiSchemas.Eval.MetadataKeys.Response.parse({ keys });
        res.json(response);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: (0, zod_validation_error_1.fromZodError)(error).toString() });
            return;
        }
        const { id } = req.params;
        logger_1.default.error(`Error fetching metadata keys for eval ${id}: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).json({ error: 'Failed to fetch metadata keys' });
    }
});
exports.evalRouter.get('/:id/metadata-values', async (req, res) => {
    try {
        const { id } = apiSchemas_1.ApiSchemas.Eval.MetadataValues.Params.parse(req.params);
        const { key } = apiSchemas_1.ApiSchemas.Eval.MetadataValues.Query.parse(req.query);
        const eval_ = await eval_1.default.findById(id);
        if (!eval_) {
            res.status(404).json({ error: 'Eval not found' });
            return;
        }
        const values = eval_1.EvalQueries.getMetadataValuesFromEval(id, key);
        const response = apiSchemas_1.ApiSchemas.Eval.MetadataValues.Response.parse({ values });
        res.json(response);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: (0, zod_validation_error_1.fromZodError)(error).toString() });
            return;
        }
        const { id } = req.params;
        logger_1.default.error(`Error fetching metadata values for eval ${id}: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).json({ error: 'Failed to fetch metadata values' });
    }
});
exports.evalRouter.post('/:id/results', async (req, res) => {
    const { id } = req.params;
    const results = req.body;
    if (!Array.isArray(results)) {
        res.status(400).json({ error: 'Results must be an array' });
        return;
    }
    const eval_ = await eval_1.default.findById(id);
    if (!eval_) {
        res.status(404).json({ error: 'Eval not found' });
        return;
    }
    try {
        await eval_.setResults(results);
    }
    catch (error) {
        logger_1.default.error(`Failed to add results to eval: ${error}`);
        res.status(500).json({ error: 'Failed to add results to eval' });
        return;
    }
    res.status(204).send();
});
exports.evalRouter.post('/replay', async (req, res) => {
    const { evaluationId, testIndex, prompt, variables } = req.body;
    if (!evaluationId || !prompt) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }
    try {
        // Load the evaluation to get the provider configuration
        const eval_ = await eval_1.default.findById(evaluationId);
        if (!eval_) {
            res.status(404).json({ error: 'Evaluation not found' });
            return;
        }
        // Get the provider configuration from the eval
        const providers = eval_.config.providers;
        if (!providers) {
            res.status(400).json({ error: 'No providers found in evaluation' });
            return;
        }
        // Handle different provider config formats
        let providerConfig;
        if (Array.isArray(providers)) {
            if (providers.length === 0) {
                res.status(400).json({ error: 'No providers found in evaluation' });
                return;
            }
            // Use the first provider or the one at the specified test index
            providerConfig = providers[testIndex % providers.length];
        }
        else if (typeof providers === 'string' || typeof providers === 'function') {
            providerConfig = providers;
        }
        else {
            // providers might be a single provider object
            providerConfig = providers;
        }
        // Run the prompt through the provider
        const result = await index_1.default.evaluate({
            prompts: [
                {
                    raw: prompt,
                    label: 'Replay', // Add required label field
                },
            ],
            providers: [providerConfig],
            tests: [
                {
                    vars: variables || {},
                },
            ],
        }, {
            maxConcurrency: 1,
            showProgressBar: false,
            eventSource: 'web',
            cache: false, // Always disable cache for replays to get fresh results
        });
        const summary = await result.toEvaluateSummary();
        // Better output extraction - handle different response structures
        const firstResult = summary.results[0];
        let output = firstResult?.response?.output;
        // If still no output, try the raw response
        if (!output && firstResult?.response?.raw) {
            output = firstResult.response.raw;
        }
        // Return both output and any error information for debugging
        res.json({
            output: output || '',
            error: firstResult?.response?.error,
            response: firstResult?.response, // Include full response for debugging
        });
    }
    catch (error) {
        logger_1.default.error(`Failed to replay evaluation: ${error}`);
        res.status(500).json({ error: 'Failed to replay evaluation' });
    }
});
exports.evalRouter.post('/:evalId/results/:id/rating', async (req, res) => {
    const { id } = req.params;
    const gradingResult = req.body;
    const result = await evalResult_1.default.findById(id);
    (0, invariant_1.default)(result, 'Result not found');
    const eval_ = await eval_1.default.findById(result.evalId);
    (0, invariant_1.default)(eval_, 'Eval not found');
    // Capture the current state before we change it
    const hasExistingManualOverride = Boolean(result.gradingResult?.componentResults?.some((r) => r.assertion?.type === 'human'));
    const successChanged = result.success !== gradingResult.pass;
    const scoreChange = gradingResult.score - result.score;
    // Update the result
    result.gradingResult = gradingResult;
    result.success = gradingResult.pass;
    result.score = gradingResult.score;
    // Update the prompt metrics
    const prompt = eval_.prompts[result.promptIdx];
    (0, invariant_1.default)(prompt, 'Prompt not found');
    if (!prompt.metrics) {
        logger_1.default.error(`[${id}] This is not normal. Prompt metrics not found for prompt ${result.promptIdx}`);
        res.status(400).json({ error: 'Prompt metrics not found' });
        return;
    }
    if (successChanged) {
        if (result.success) {
            // Result changed from fail to pass
            prompt.metrics.testPassCount += 1;
            prompt.metrics.testFailCount -= 1;
            prompt.metrics.assertPassCount += 1;
            prompt.metrics.score += scoreChange;
            if (hasExistingManualOverride) {
                // If there was an existing manual override, we need to decrement the assertFailCount because it changed from fail to pass
                prompt.metrics.assertFailCount -= 1;
            }
        }
        else {
            prompt.metrics.testPassCount -= 1;
            prompt.metrics.testFailCount += 1;
            prompt.metrics.assertFailCount += 1;
            prompt.metrics.score += scoreChange;
            if (hasExistingManualOverride) {
                // If there was an existing manual override, we need to decrement the assertPassCount because it changed from pass to fail
                prompt.metrics.assertPassCount -= 1;
            }
        }
    }
    else if (!hasExistingManualOverride) {
        // Nothing changed, so the user just added an assertion
        if (result.success) {
            prompt.metrics.assertPassCount += 1;
        }
        else {
            prompt.metrics.assertFailCount += 1;
        }
    }
    await eval_.save();
    await result.save();
    res.json(result);
});
exports.evalRouter.post('/', async (req, res) => {
    const body = req.body;
    try {
        if (body.data) {
            logger_1.default.debug('[POST /api/eval] Saving eval results (v3) to database');
            const { data: payload } = req.body;
            const id = await (0, database_1.writeResultsToDatabase)(payload.results, payload.config);
            res.json({ id });
        }
        else {
            const incEval = body;
            logger_1.default.debug('[POST /api/eval] Saving eval results (v4) to database');
            const eval_ = await eval_1.default.create(incEval.config, incEval.prompts || [], {
                author: incEval.author,
                createdAt: new Date(incEval.createdAt),
                results: incEval.results,
                vars: incEval.vars,
            });
            if (incEval.prompts) {
                eval_.addPrompts(incEval.prompts);
            }
            logger_1.default.debug(`[POST /api/eval] Eval created with ID: ${eval_.id}`);
            logger_1.default.debug(`[POST /api/eval] Saved ${incEval.results.length} results to eval ${eval_.id}`);
            res.json({ id: eval_.id });
        }
    }
    catch (error) {
        logger_1.default.error((0, dedent_1.default) `Failed to write eval to database:
      Error: ${error}
      Body: ${JSON.stringify(body, null, 2)}`);
        res.status(500).json({ error: 'Failed to write eval to database' });
    }
});
exports.evalRouter.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await (0, database_1.deleteEval)(id);
        res.json({ message: 'Eval deleted successfully' });
    }
    catch (error) {
        logger_1.default.error('[DELETE /eval/:id] Failed to delete eval', {
            evalId: id,
            error: error instanceof Error ? error.message : String(error),
        });
        if (error instanceof Error && error.message === `Eval with ID ${id} not found`) {
            res.status(404).json({ error: 'Evaluation not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to delete eval' });
    }
});
/**
 * Bulk delete evals.
 */
exports.evalRouter.delete('/', (req, res) => {
    const ids = req.body.ids;
    if (!Array.isArray(ids)) {
        res.status(400).json({ error: 'Ids must be an array' });
        return;
    }
    try {
        (0, database_1.deleteEvals)(ids);
        res.status(204).send();
    }
    catch {
        res.status(500).json({ error: 'Failed to delete evals' });
    }
});
/**
 * Copy an eval with all its results and relationships.
 */
exports.evalRouter.post('/:id/copy', async (req, res) => {
    try {
        const { id } = apiSchemas_1.ApiSchemas.Eval.Copy.Params.parse(req.params);
        const { description } = apiSchemas_1.ApiSchemas.Eval.Copy.Request.parse(req.body);
        const sourceEval = await eval_1.default.findById(id);
        if (!sourceEval) {
            res.status(404).json({ error: 'Eval not found' });
            return;
        }
        // Get distinct test count for response and pass to copy to avoid duplicate query
        const distinctTestCount = await sourceEval.getResultsCount();
        // Create copy
        const newEval = await sourceEval.copy(description, distinctTestCount);
        logger_1.default.info('Eval copied via API', {
            sourceEvalId: id,
            targetEvalId: newEval.id,
            distinctTestCount,
        });
        const response = apiSchemas_1.ApiSchemas.Eval.Copy.Response.parse({
            id: newEval.id,
            distinctTestCount,
        });
        res.status(201).json(response);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const validationError = (0, zod_validation_error_1.fromZodError)(error);
            res.status(400).json({ error: validationError.message });
            return;
        }
        logger_1.default.error('Failed to copy eval', {
            error,
            evalId: req.params.id,
        });
        res.status(500).json({ error: 'Failed to copy evaluation' });
    }
});
//# sourceMappingURL=eval.js.map