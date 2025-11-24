"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorResultIds = getErrorResultIds;
exports.deleteErrorResults = deleteErrorResults;
exports.recalculatePromptMetrics = recalculatePromptMetrics;
exports.retryCommand = retryCommand;
exports.setupRetryCommand = setupRetryCommand;
const chalk_1 = __importDefault(require("chalk"));
const drizzle_orm_1 = require("drizzle-orm");
const cliState_1 = __importDefault(require("../cliState"));
const index_1 = require("../database/index");
const tables_1 = require("../database/tables");
const evaluator_1 = require("../evaluator");
const logger_1 = __importDefault(require("../logger"));
const eval_1 = __importDefault(require("../models/eval"));
const index_2 = require("../types/index");
const load_1 = require("../util/config/load");
const tokenUsageUtils_1 = require("../util/tokenUsageUtils");
/**
 * Gets all ERROR results from an evaluation and returns their IDs
 */
async function getErrorResultIds(evalId) {
    const db = (0, index_1.getDb)();
    const errorResults = await db
        .select({ id: tables_1.evalResultsTable.id })
        .from(tables_1.evalResultsTable)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(tables_1.evalResultsTable.evalId, evalId), (0, drizzle_orm_1.eq)(tables_1.evalResultsTable.failureReason, index_2.ResultFailureReason.ERROR)))
        .all();
    return errorResults.map((r) => r.id);
}
/**
 * Deletes ERROR results to prepare for retry
 */
async function deleteErrorResults(resultIds) {
    const db = (0, index_1.getDb)();
    for (const resultId of resultIds) {
        await db.delete(tables_1.evalResultsTable).where((0, drizzle_orm_1.eq)(tables_1.evalResultsTable.id, resultId));
    }
    logger_1.default.debug(`Deleted ${resultIds.length} error results from database`);
}
/**
 * Recalculates prompt metrics based on current results after ERROR results have been deleted
 */
async function recalculatePromptMetrics(evalRecord) {
    logger_1.default.debug('Recalculating prompt metrics after deleting ERROR results');
    // Load current results from database
    await evalRecord.loadResults();
    // Create a map to track metrics by promptIdx
    const promptMetricsMap = new Map();
    // Initialize metrics for each prompt
    for (const prompt of evalRecord.prompts) {
        const promptIdx = evalRecord.prompts.indexOf(prompt);
        promptMetricsMap.set(promptIdx, {
            score: 0,
            testPassCount: 0,
            testFailCount: 0,
            testErrorCount: 0,
            assertPassCount: 0,
            assertFailCount: 0,
            totalLatencyMs: 0,
            tokenUsage: (0, tokenUsageUtils_1.createEmptyTokenUsage)(),
            namedScores: {},
            namedScoresCount: {},
            cost: 0,
        });
    }
    // Recalculate metrics from current results
    for (const result of evalRecord.results) {
        const metrics = promptMetricsMap.get(result.promptIdx);
        if (!metrics) {
            continue;
        }
        // Update test counts
        if (result.success) {
            metrics.testPassCount++;
        }
        else if (result.failureReason === index_2.ResultFailureReason.ERROR) {
            metrics.testErrorCount++;
        }
        else {
            metrics.testFailCount++;
        }
        // Update scores and other metrics
        metrics.score += result.score || 0;
        metrics.totalLatencyMs += result.latencyMs || 0;
        metrics.cost += result.cost || 0;
        // Update named scores
        for (const [key, value] of Object.entries(result.namedScores || {})) {
            metrics.namedScores[key] = (metrics.namedScores[key] || 0) + value;
            // Count assertions contributing to this named score
            let contributingAssertions = 0;
            result.gradingResult?.componentResults?.forEach((componentResult) => {
                if (componentResult.assertion?.metric === key) {
                    contributingAssertions++;
                }
            });
            metrics.namedScoresCount[key] =
                (metrics.namedScoresCount[key] || 0) + (contributingAssertions || 1);
        }
        // Update assertion counts
        if (result.gradingResult?.componentResults) {
            metrics.assertPassCount += result.gradingResult.componentResults.filter((r) => r.pass).length;
            metrics.assertFailCount += result.gradingResult.componentResults.filter((r) => !r.pass).length;
        }
        // Update token usage
        if (result.response?.tokenUsage) {
            (0, tokenUsageUtils_1.accumulateResponseTokenUsage)(metrics.tokenUsage, { tokenUsage: result.response.tokenUsage });
        }
        // Update assertion token usage
        if (result.gradingResult?.tokensUsed) {
            if (!metrics.tokenUsage.assertions) {
                metrics.tokenUsage.assertions = (0, tokenUsageUtils_1.createEmptyAssertions)();
            }
            (0, tokenUsageUtils_1.accumulateAssertionTokenUsage)(metrics.tokenUsage.assertions, result.gradingResult.tokensUsed);
        }
    }
    // Update prompt metrics with recalculated values
    for (const [promptIdx, newMetrics] of promptMetricsMap.entries()) {
        if (promptIdx < evalRecord.prompts.length) {
            evalRecord.prompts[promptIdx].metrics = newMetrics;
        }
    }
    // Save the updated prompt metrics
    if (evalRecord.persisted) {
        await evalRecord.addPrompts(evalRecord.prompts);
    }
    logger_1.default.debug('Prompt metrics recalculation completed');
}
/**
 * Main retry function
 */
async function retryCommand(evalId, cmdObj) {
    logger_1.default.info(`🔄 Retrying failed tests for evaluation: ${chalk_1.default.cyan(evalId)}`);
    // Load the original evaluation
    const originalEval = await eval_1.default.findById(evalId);
    if (!originalEval) {
        throw new Error(`Evaluation with ID ${evalId} not found`);
    }
    // Get all ERROR result IDs
    const errorResultIds = await getErrorResultIds(evalId);
    if (errorResultIds.length === 0) {
        logger_1.default.info('✅ No ERROR results found in this evaluation');
        return originalEval;
    }
    logger_1.default.info(`Found ${errorResultIds.length} ERROR results to retry`);
    // Load configuration - from provided config file or from original evaluation
    let config;
    let testSuite;
    if (cmdObj.config) {
        // Load configuration from the provided config file
        const configs = await (0, load_1.resolveConfigs)({ config: [cmdObj.config] }, {});
        config = configs.config;
        testSuite = configs.testSuite;
    }
    else {
        // Load configuration from the original evaluation
        const configs = await (0, load_1.resolveConfigs)({}, originalEval.config);
        config = configs.config;
        testSuite = configs.testSuite;
    }
    // Delete the ERROR results so they will be re-evaluated when we run with resume
    await deleteErrorResults(errorResultIds);
    // Recalculate prompt metrics after deleting ERROR results to avoid double-counting
    await recalculatePromptMetrics(originalEval);
    logger_1.default.info(`🔄 Running evaluation with resume mode to retry ${errorResultIds.length} test cases...`);
    // Enable resume mode so only the missing (deleted) results will be evaluated
    cliState_1.default.resume = true;
    // Set up evaluation options
    const evaluateOptions = {
        maxConcurrency: cmdObj.maxConcurrency || config.maxConcurrency,
        delay: cmdObj.delay || config.delay,
        eventSource: 'cli',
        showProgressBar: !cmdObj.verbose, // Show progress bar unless verbose mode
    };
    try {
        // Run the retry evaluation - this will only run the missing test cases due to resume mode
        const retriedEval = await (0, evaluator_1.evaluate)(testSuite, originalEval, evaluateOptions);
        logger_1.default.info(`✅ Retry completed for evaluation: ${chalk_1.default.cyan(evalId)}`);
        return retriedEval;
    }
    finally {
        // Always clear the resume state
        cliState_1.default.resume = false;
    }
}
/**
 * Set up the retry command
 */
function setupRetryCommand(program) {
    program
        .command('retry <evalId>')
        .description('Retry all ERROR results from a given evaluation')
        .option('-c, --config <path>', 'Path to configuration file (optional, uses original eval config if not provided)')
        .option('-v, --verbose', 'Verbose output')
        .option('--max-concurrency <number>', 'Maximum number of concurrent evaluations', parseInt)
        .option('--delay <number>', 'Delay between evaluations in milliseconds', parseInt)
        .action(async (evalId, cmdObj) => {
        try {
            await retryCommand(evalId, cmdObj);
        }
        catch (error) {
            logger_1.default.error(`Failed to retry evaluation: ${error}`);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=retry.js.map