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
exports.isAllowedPrompt = isAllowedPrompt;
exports.runEval = runEval;
exports.formatVarsForDisplay = formatVarsForDisplay;
exports.generateVarCombinations = generateVarCombinations;
exports.evaluate = evaluate;
const crypto_1 = require("crypto");
const async_1 = __importDefault(require("async"));
const chalk_1 = __importDefault(require("chalk"));
const cli_progress_1 = __importDefault(require("cli-progress"));
const glob_1 = require("glob");
const index_1 = require("./assertions/index");
const cache_1 = require("./cache");
const cliState_1 = __importDefault(require("./cliState"));
const constants_1 = require("./constants");
const signal_1 = require("./database/signal");
const envars_1 = require("./envars");
const evaluatorHelpers_1 = require("./evaluatorHelpers");
const logger_1 = __importDefault(require("./logger"));
const matchers_1 = require("./matchers");
const prompt_1 = require("./models/prompt");
const ciProgressReporter_1 = require("./progress/ciProgressReporter");
const warnings_1 = require("./providers/azure/warnings");
const providerRegistry_1 = require("./providers/providerRegistry");
const shared_1 = require("./providers/shared");
const constants_2 = require("./redteam/constants");
const util_1 = require("./redteam/util");
const suggestions_1 = require("./suggestions");
const telemetry_1 = __importDefault(require("./telemetry"));
const evaluatorTracing_1 = require("./tracing/evaluatorTracing");
const index_2 = require("./types/index");
const providers_1 = require("./types/providers");
const writeToFile_1 = require("./util/exportToFile/writeToFile");
const loadFunction_1 = require("./util/functions/loadFunction");
const invariant_1 = __importDefault(require("./util/invariant"));
const json_1 = require("./util/json");
const readline_1 = require("./util/readline");
const time_1 = require("./util/time");
const tokenUsage_1 = require("./util/tokenUsage");
const tokenUsageUtils_1 = require("./util/tokenUsageUtils");
const transform_1 = require("./util/transform");
/**
 * Manages a single progress bar for the evaluation
 */
class ProgressBarManager {
    constructor(isWebUI) {
        // Track overall progress
        this.totalCount = 0;
        this.completedCount = 0;
        this.concurrency = 1;
        this.isWebUI = isWebUI;
    }
    /**
     * Initialize progress bar
     */
    async initialize(runEvalOptions, concurrency, compareRowsCount) {
        if (this.isWebUI) {
            return;
        }
        this.totalCount = runEvalOptions.length + compareRowsCount;
        this.concurrency = concurrency;
        // Create single progress bar
        this.progressBar = new cli_progress_1.default.SingleBar({
            format: (options, params, payload) => {
                const barsize = options.barsize ?? 40;
                const barCompleteString = options.barCompleteString ?? '=';
                const barIncompleteString = options.barIncompleteString ?? '-';
                const bar = barCompleteString.substring(0, Math.round(params.progress * barsize));
                const spaces = barIncompleteString.substring(0, barsize - bar.length);
                const percentage = Math.round(params.progress * 100);
                // Only show errors if count > 0
                const errorsText = payload.errors > 0 ? ` (errors: ${payload.errors})` : '';
                return `Evaluating [${bar}${spaces}] ${percentage}% | ${params.value}/${params.total}${errorsText} | ${payload.provider} ${payload.prompt} ${payload.vars}`;
            },
            hideCursor: true,
            gracefulExit: true,
        }, cli_progress_1.default.Presets.shades_classic);
        // Start the progress bar
        this.progressBar.start(this.totalCount, 0, {
            provider: '',
            prompt: '',
            vars: '',
            errors: 0,
        });
    }
    /**
     * Update progress for a specific evaluation
     */
    updateProgress(_index, evalStep, _phase = 'concurrent', metrics) {
        if (this.isWebUI || !evalStep || !this.progressBar) {
            return;
        }
        this.completedCount++;
        const provider = evalStep.provider.label || evalStep.provider.id();
        const prompt = `"${evalStep.prompt.raw.slice(0, 10).replace(/\n/g, ' ')}"`;
        const vars = formatVarsForDisplay(evalStep.test.vars, 10);
        this.progressBar.increment({
            provider,
            prompt: prompt || '""',
            vars: vars || '',
            errors: metrics?.testErrorCount ?? 0,
        });
    }
    /**
     * Update comparison progress
     */
    updateComparisonProgress(prompt) {
        if (this.isWebUI || !this.progressBar) {
            return;
        }
        this.completedCount++;
        this.progressBar.increment({
            provider: 'Grading',
            prompt: `"${prompt.slice(0, 10).replace(/\n/g, ' ')}"`,
            vars: '',
            errors: 0,
        });
    }
    /**
     * Update total count when comparison count is determined
     */
    updateTotalCount(additionalCount) {
        if (this.isWebUI || !this.progressBar || additionalCount <= 0) {
            return;
        }
        this.totalCount += additionalCount;
        this.progressBar.setTotal(this.totalCount);
    }
    /**
     * Mark evaluation as complete
     */
    complete() {
        if (this.isWebUI || !this.progressBar) {
            return;
        }
        // Just ensure we're at 100% - the bar will be stopped in stop()
        this.progressBar.update(this.totalCount);
    }
    /**
     * Stop the progress bar
     */
    stop() {
        if (this.progressBar) {
            this.progressBar.stop();
        }
    }
}
/**
 * Update token usage metrics with assertion token usage
 */
function updateAssertionMetrics(metrics, assertionTokens) {
    if (metrics.tokenUsage && assertionTokens) {
        if (!metrics.tokenUsage.assertions) {
            metrics.tokenUsage.assertions = (0, tokenUsageUtils_1.createEmptyAssertions)();
        }
        // Accumulate assertion tokens using the specialized assertion function
        (0, tokenUsageUtils_1.accumulateAssertionTokenUsage)(metrics.tokenUsage.assertions, assertionTokens);
    }
}
/**
 * Validates if a given prompt is allowed based on the provided list of allowed
 * prompt labels. Providers can be configured with a `prompts` attribute, which
 * corresponds to an array of prompt labels. Labels can either refer to a group
 * (for example from a file) or to individual prompts. If the attribute is
 * present, this function validates that the prompt labels fit the matching
 * criteria of the provider. Examples:
 *
 * - `prompts: ['examplePrompt']` matches `examplePrompt` exactly
 * - `prompts: ['exampleGroup:*']` matches any prompt that starts with `exampleGroup:`
 *
 * If no `prompts` attribute is present, all prompts are allowed by default.
 *
 * @param prompt - The prompt object to check.
 * @param allowedPrompts - The list of allowed prompt labels.
 * @returns Returns true if the prompt is allowed, false otherwise.
 */
function isAllowedPrompt(prompt, allowedPrompts) {
    return (!Array.isArray(allowedPrompts) ||
        allowedPrompts.includes(prompt.label) ||
        allowedPrompts.some((allowedPrompt) => prompt.label.startsWith(`${allowedPrompt}:`)));
}
/**
 * Runs a single test case.
 * @param options - The options for running the test case.
 * {
 *   provider - The provider to use for the test case.
 *   prompt - The raw prompt to use for the test case.
 *   test - The test case to run with assertions, etc.
 *   delay - A delay in ms to wait before any provider calls
 *   nunjucksFilters - The nunjucks filters to use for the test case.
 *   evaluateOptions - Currently unused
 *   testIdx - The index of the test case among all tests (row in the results table).
 *   promptIdx - The index of the prompt among all prompts (column in the results table).
 *   conversations - Evals can be run serially across multiple turns of a conversation. This gives access to the conversation history.
 *   registers - The registers to use for the test case to store values for later tests.
 *   isRedteam - Whether the test case is a redteam test case.
 * }
 * @returns The result of the test case.
 */
async function runEval({ provider, prompt, // raw prompt
test, delay, nunjucksFilters: filters, evaluateOptions, testIdx, promptIdx, repeatIndex, conversations, registers, isRedteam, abortSignal, }) {
    // Use the original prompt to set the label, not renderedPrompt
    const promptLabel = prompt.label;
    provider.delay ?? (provider.delay = delay ?? (0, envars_1.getEnvInt)('PROMPTFOO_DELAY_MS', 0));
    (0, invariant_1.default)(typeof provider.delay === 'number', `Provider delay should be set for ${provider.label}`);
    // Set up the special _conversation variable
    const vars = test.vars || {};
    // Collect file metadata for the test case before rendering the prompt.
    const fileMetadata = (0, evaluatorHelpers_1.collectFileMetadata)(test.vars || vars);
    const conversationKey = `${provider.label || provider.id()}:${prompt.id}${test.metadata?.conversationId ? `:${test.metadata.conversationId}` : ''}`;
    const usesConversation = prompt.raw.includes('_conversation');
    if (!(0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_CONVERSATION_VAR') &&
        !test.options?.disableConversationVar &&
        usesConversation) {
        vars._conversation = conversations?.[conversationKey] || [];
    }
    // Overwrite vars with any saved register values
    Object.assign(vars, registers);
    // Initialize these outside try block so they're in scope for the catch
    const setup = {
        provider: {
            id: provider.id(),
            label: provider.label,
            config: provider.config,
        },
        prompt: {
            raw: '',
            label: promptLabel,
            config: prompt.config,
        },
        vars,
    };
    let latencyMs = 0;
    let traceContext = null;
    try {
        // Render the prompt
        const renderedPrompt = await (0, evaluatorHelpers_1.renderPrompt)(prompt, vars, filters, provider);
        let renderedJson = undefined;
        try {
            renderedJson = JSON.parse(renderedPrompt);
        }
        catch { }
        setup.prompt.raw = renderedPrompt;
        const startTime = Date.now();
        let response = {
            output: '',
            tokenUsage: (0, tokenUsageUtils_1.createEmptyTokenUsage)(),
            cost: 0,
            cached: false,
        };
        if (test.providerOutput) {
            response.output = test.providerOutput;
        }
        else {
            const activeProvider = (0, providers_1.isApiProvider)(test.provider) ? test.provider : provider;
            logger_1.default.debug(`Provider type: ${activeProvider.id()}`);
            // Generate trace context if tracing is enabled
            traceContext = await (0, evaluatorTracing_1.generateTraceContextIfNeeded)(test, evaluateOptions, testIdx, promptIdx);
            const callApiContext = {
                // Always included
                vars,
                // Part of these may be removed in python and script providers, but every Javascript provider gets them
                prompt,
                filters,
                originalProvider: provider,
                test,
                // All of these are removed in python and script providers, but every Javascript provider gets them
                logger: logger_1.default,
                getCache: cache_1.getCache,
                repeatIndex,
            };
            if (repeatIndex > 0) {
                callApiContext.bustCache = true;
            }
            // Only add trace context properties if tracing is enabled
            if (traceContext) {
                callApiContext.traceparent = traceContext.traceparent;
                callApiContext.evaluationId = traceContext.evaluationId;
                callApiContext.testCaseId = traceContext.testCaseId;
            }
            // Handle Simba providers specially - they use runSimba instead of callApi
            if (activeProvider.id() === 'promptfoo:redteam:simba') {
                const simbaProvider = activeProvider;
                if (simbaProvider.runSimba) {
                    // Simba returns EvaluateResult[] directly, so we need to return early
                    const simbaResults = await simbaProvider.runSimba({
                        prompt: renderedPrompt,
                        context: callApiContext,
                        options: abortSignal ? { abortSignal } : undefined,
                        concurrency: evaluateOptions?.maxConcurrency ?? constants_1.DEFAULT_MAX_CONCURRENCY,
                    });
                    // Update results with proper indices for Simba
                    for (const result of simbaResults) {
                        result.promptIdx = promptIdx;
                        result.testIdx = testIdx++;
                    }
                    return simbaResults;
                }
                else {
                    throw new Error('Simba provider does not have runSimba method');
                }
            }
            else {
                response = await activeProvider.callApi(renderedPrompt, callApiContext, abortSignal ? { abortSignal } : undefined);
            }
            logger_1.default.debug(`Provider response properties: ${Object.keys(response).join(', ')}`);
            logger_1.default.debug(`Provider response cached property explicitly: ${response.cached}`);
        }
        const endTime = Date.now();
        latencyMs = endTime - startTime;
        let conversationLastInput = undefined;
        if (renderedJson && Array.isArray(renderedJson)) {
            const lastElt = renderedJson[renderedJson.length - 1];
            // Use the `content` field if present (OpenAI chat format)
            conversationLastInput = lastElt?.content || lastElt;
        }
        if (conversations) {
            conversations[conversationKey] = conversations[conversationKey] || [];
            conversations[conversationKey].push({
                prompt: renderedJson || renderedPrompt,
                input: conversationLastInput || renderedJson || renderedPrompt,
                output: response.output || '',
                metadata: response.metadata,
            });
        }
        logger_1.default.debug(`Evaluator response = ${JSON.stringify(response).substring(0, 100)}...`);
        logger_1.default.debug(`Evaluator checking cached flag: response.cached = ${Boolean(response.cached)}, provider.delay = ${provider.delay}`);
        if (!response.cached && provider.delay > 0) {
            logger_1.default.debug(`Sleeping for ${provider.delay}ms`);
            await (0, time_1.sleep)(provider.delay);
        }
        else if (response.cached) {
            logger_1.default.debug(`Skipping delay because response is cached`);
        }
        const ret = {
            ...setup,
            response,
            success: false,
            failureReason: index_2.ResultFailureReason.NONE,
            score: 0,
            namedScores: {},
            latencyMs,
            cost: response.cost,
            metadata: {
                ...test.metadata,
                ...response.metadata,
                [constants_1.FILE_METADATA_KEY]: fileMetadata,
            },
            promptIdx,
            testIdx,
            testCase: test,
            promptId: prompt.id || '',
            tokenUsage: (0, tokenUsageUtils_1.createEmptyTokenUsage)(),
        };
        if (!ret.metadata?.sessionIds && !ret.metadata?.sessionId) {
            ret.metadata ?? (ret.metadata = {});
            ret.metadata.sessionId = (0, util_1.getSessionId)(response, { vars });
        }
        (0, invariant_1.default)(ret.tokenUsage, 'This is always defined, just doing this to shut TS up');
        // Track token usage at the provider level
        if (response.tokenUsage) {
            const providerId = provider.id();
            const trackingId = provider.constructor?.name
                ? `${providerId} (${provider.constructor.name})`
                : providerId;
            tokenUsage_1.TokenUsageTracker.getInstance().trackUsage(trackingId, response.tokenUsage);
        }
        if (response.error) {
            ret.error = response.error;
            ret.failureReason = index_2.ResultFailureReason.ERROR;
            ret.success = false;
        }
        else if (response.output === null || response.output === undefined) {
            // NOTE: empty output often indicative of guardrails, so behavior differs for red teams.
            if (isRedteam) {
                ret.success = true;
            }
            else {
                ret.success = false;
                ret.score = 0;
                ret.error = 'No output';
            }
        }
        else {
            // Create a copy of response so we can potentially mutate it.
            const processedResponse = { ...response };
            // Apply provider transform first (if exists)
            if (provider.transform) {
                processedResponse.output = await (0, transform_1.transform)(provider.transform, processedResponse.output, {
                    vars,
                    prompt,
                });
            }
            // Store the provider-transformed output for assertions (contextTransform)
            const providerTransformedOutput = processedResponse.output;
            // Apply test transform (if exists)
            const testTransform = test.options?.transform || test.options?.postprocess;
            if (testTransform) {
                processedResponse.output = await (0, transform_1.transform)(testTransform, processedResponse.output, {
                    vars,
                    prompt,
                    ...(response && response.metadata && { metadata: response.metadata }),
                });
            }
            (0, invariant_1.default)(processedResponse.output != null, 'Response output should not be null');
            // Extract traceId from traceparent if available
            let traceId;
            if (traceContext?.traceparent) {
                // traceparent format: version-traceId-spanId-flags
                const parts = traceContext.traceparent.split('-');
                if (parts.length >= 3) {
                    traceId = parts[1];
                }
            }
            // Pass providerTransformedOutput for contextTransform to use
            const checkResult = await (0, index_1.runAssertions)({
                prompt: renderedPrompt,
                provider,
                providerResponse: {
                    ...processedResponse,
                    // Add provider-transformed output for contextTransform
                    providerTransformedOutput,
                },
                test,
                latencyMs: response.latencyMs ?? latencyMs,
                assertScoringFunction: test.assertScoringFunction,
                traceId,
            });
            if (!checkResult.pass) {
                ret.error = checkResult.reason;
                ret.failureReason = index_2.ResultFailureReason.ASSERT;
            }
            ret.success = checkResult.pass;
            ret.score = checkResult.score;
            ret.namedScores = checkResult.namedScores || {};
            // Track assertion request count
            if (!ret.tokenUsage.assertions) {
                ret.tokenUsage.assertions = (0, tokenUsageUtils_1.createEmptyAssertions)();
            }
            ret.tokenUsage.assertions.numRequests = (ret.tokenUsage.assertions.numRequests ?? 0) + 1;
            // Track assertion token usage if provided
            if (checkResult.tokensUsed) {
                (0, tokenUsageUtils_1.accumulateAssertionTokenUsage)(ret.tokenUsage.assertions, checkResult.tokensUsed);
            }
            ret.response = processedResponse;
            ret.gradingResult = checkResult;
        }
        // Update token usage stats
        if (response.tokenUsage) {
            (0, tokenUsageUtils_1.accumulateResponseTokenUsage)(ret.tokenUsage, response);
        }
        if (test.options?.storeOutputAs && ret.response?.output && registers) {
            // Save the output in a register for later use
            registers[test.options.storeOutputAs] = ret.response.output;
        }
        return [ret];
    }
    catch (err) {
        return [
            {
                ...setup,
                error: String(err) + '\n\n' + err.stack,
                success: false,
                failureReason: index_2.ResultFailureReason.ERROR,
                score: 0,
                namedScores: {},
                latencyMs,
                promptIdx,
                testIdx,
                testCase: test,
                promptId: prompt.id || '',
            },
        ];
    }
}
/**
 * Safely formats variables for display in progress bars and logs.
 * Handles extremely large variables that could cause RangeError crashes.
 *
 * @param vars - Variables to format
 * @param maxLength - Maximum length of the final formatted string
 * @returns Formatted variables string or fallback message
 */
function formatVarsForDisplay(vars, maxLength) {
    if (!vars || Object.keys(vars).length === 0) {
        return '';
    }
    try {
        // Simple approach: limit individual values, then truncate the whole result
        const formatted = Object.entries(vars)
            .map(([key, value]) => {
            // Prevent memory issues by limiting individual values first
            const valueStr = String(value).slice(0, 100);
            return `${key}=${valueStr}`;
        })
            .join(' ')
            .replace(/\n/g, ' ')
            .slice(0, maxLength);
        return formatted;
    }
    catch {
        // Any error - return safe fallback
        return '[vars unavailable]';
    }
}
function generateVarCombinations(vars) {
    const keys = Object.keys(vars);
    const combinations = [{}];
    for (const key of keys) {
        let values = [];
        if (typeof vars[key] === 'string' && vars[key].startsWith('file://')) {
            const filePath = vars[key].slice('file://'.length);
            // For glob patterns, we need to resolve the base directory and use relative patterns
            const basePath = cliState_1.default.basePath || '';
            const filePaths = (0, glob_1.globSync)(filePath, {
                cwd: basePath || process.cwd(),
                windowsPathsNoEscape: true,
            }) || [];
            values = filePaths.map((path) => `file://${path}`);
            if (values.length === 0) {
                throw new Error(`No files found for variable ${key} at path ${filePath} in directory ${basePath || process.cwd()}`);
            }
        }
        else {
            values = Array.isArray(vars[key]) ? vars[key] : [vars[key]];
        }
        // Check if it's an array but not a string array
        if (Array.isArray(vars[key]) && typeof vars[key][0] !== 'string') {
            values = [vars[key]];
        }
        const newCombinations = [];
        for (const combination of combinations) {
            for (const value of values) {
                newCombinations.push({ ...combination, [key]: value });
            }
        }
        combinations.length = 0;
        combinations.push(...newCombinations);
    }
    return combinations;
}
class Evaluator {
    constructor(testSuite, evalRecord, options) {
        this.testSuite = testSuite;
        this.evalRecord = evalRecord;
        this.options = options;
        this.stats = {
            successes: 0,
            failures: 0,
            errors: 0,
            tokenUsage: (0, tokenUsageUtils_1.createEmptyTokenUsage)(),
        };
        this.conversations = {};
        this.registers = {};
        const jsonlFiles = Array.isArray(evalRecord.config.outputPath)
            ? evalRecord.config.outputPath.filter((p) => p.endsWith('.jsonl'))
            : evalRecord.config.outputPath?.endsWith('.jsonl')
                ? [evalRecord.config.outputPath]
                : [];
        this.fileWriters = jsonlFiles.map((p) => new writeToFile_1.JsonlFileWriter(p));
    }
    async _runEvaluation() {
        const { options } = this;
        let { testSuite } = this;
        const startTime = Date.now();
        const maxEvalTimeMs = options.maxEvalTimeMs ?? (0, envars_1.getMaxEvalTimeMs)();
        let evalTimedOut = false;
        let globalTimeout;
        let globalAbortController;
        const processedIndices = new Set();
        // Progress reporters declared here for cleanup in finally block
        let ciProgressReporter = null;
        let progressBarManager = null;
        if (maxEvalTimeMs > 0) {
            globalAbortController = new AbortController();
            options.abortSignal = options.abortSignal
                ? AbortSignal.any([options.abortSignal, globalAbortController.signal])
                : globalAbortController.signal;
            globalTimeout = setTimeout(() => {
                evalTimedOut = true;
                globalAbortController?.abort();
            }, maxEvalTimeMs);
        }
        const vars = new Set();
        const checkAbort = () => {
            if (options.abortSignal?.aborted) {
                throw new Error('Operation cancelled');
            }
        };
        logger_1.default.info(`Starting evaluation ${this.evalRecord.id}`);
        // Add abort checks at key points
        checkAbort();
        const prompts = [];
        const assertionTypes = new Set();
        const rowsWithSelectBestAssertion = new Set();
        const rowsWithMaxScoreAssertion = new Set();
        const beforeAllOut = await (0, evaluatorHelpers_1.runExtensionHook)(testSuite.extensions, 'beforeAll', {
            suite: testSuite,
        });
        testSuite = beforeAllOut.suite;
        if (options.generateSuggestions) {
            // TODO(ian): Move this into its own command/file
            logger_1.default.info(`Generating prompt variations...`);
            const { prompts: newPrompts, error } = await (0, suggestions_1.generatePrompts)(testSuite.prompts[0].raw, 1);
            if (error || !newPrompts) {
                throw new Error(`Failed to generate prompts: ${error}`);
            }
            logger_1.default.info(chalk_1.default.blue('Generated prompts:'));
            let numAdded = 0;
            for (const prompt of newPrompts) {
                logger_1.default.info('--------------------------------------------------------');
                logger_1.default.info(`${prompt}`);
                logger_1.default.info('--------------------------------------------------------');
                // Ask the user if they want to continue
                const shouldTest = await (0, readline_1.promptYesNo)('Do you want to test this prompt?', false);
                if (shouldTest) {
                    testSuite.prompts.push({ raw: prompt, label: prompt });
                    numAdded++;
                }
                else {
                    logger_1.default.info('Skipping this prompt.');
                }
            }
            if (numAdded < 1) {
                logger_1.default.info(chalk_1.default.red('No prompts selected. Aborting.'));
                process.exitCode = 1;
                return this.evalRecord;
            }
        }
        // Split prompts by provider
        // Order matters - keep provider in outer loop to reduce need to swap models during local inference.
        // Create a map of existing prompts for resume support
        const existingPromptsMap = new Map();
        if (cliState_1.default.resume && this.evalRecord.persisted && this.evalRecord.prompts.length > 0) {
            logger_1.default.debug('Resuming evaluation: preserving metrics from previous run');
            for (const existingPrompt of this.evalRecord.prompts) {
                const key = `${existingPrompt.provider}:${existingPrompt.id}`;
                existingPromptsMap.set(key, existingPrompt);
            }
        }
        for (const provider of testSuite.providers) {
            for (const prompt of testSuite.prompts) {
                // Check if providerPromptMap exists and if it contains the current prompt's label
                const providerKey = provider.label || provider.id();
                if (!isAllowedPrompt(prompt, testSuite.providerPromptMap?.[providerKey])) {
                    continue;
                }
                const promptId = (0, prompt_1.generateIdFromPrompt)(prompt);
                const existingPromptKey = `${providerKey}:${promptId}`;
                const existingPrompt = existingPromptsMap.get(existingPromptKey);
                const completedPrompt = {
                    ...prompt,
                    id: promptId,
                    provider: providerKey,
                    label: prompt.label,
                    metrics: existingPrompt?.metrics || {
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
                    },
                };
                prompts.push(completedPrompt);
            }
        }
        this.evalRecord.addPrompts(prompts);
        // Aggregate all vars across test cases
        let tests = testSuite.tests && testSuite.tests.length > 0
            ? testSuite.tests
            : testSuite.scenarios
                ? []
                : [
                    {
                    // Dummy test for cases when we're only comparing raw prompts.
                    },
                ];
        // Build scenarios and add to tests
        if (testSuite.scenarios && testSuite.scenarios.length > 0) {
            telemetry_1.default.record('feature_used', {
                feature: 'scenarios',
            });
            for (const scenario of testSuite.scenarios) {
                for (const data of scenario.config) {
                    // Merge defaultTest with scenario config
                    const scenarioTests = (scenario.tests || [
                        {
                        // Dummy test for cases when we're only comparing raw prompts.
                        },
                    ]).map((test) => {
                        return {
                            ...(typeof testSuite.defaultTest === 'object' ? testSuite.defaultTest : {}),
                            ...data,
                            ...test,
                            vars: {
                                ...(typeof testSuite.defaultTest === 'object' ? testSuite.defaultTest?.vars : {}),
                                ...data.vars,
                                ...test.vars,
                            },
                            options: {
                                ...(typeof testSuite.defaultTest === 'object'
                                    ? testSuite.defaultTest?.options
                                    : {}),
                                ...test.options,
                            },
                            assert: [
                                // defaultTest.assert is omitted because it will be added to each test case later
                                ...(data.assert || []),
                                ...(test.assert || []),
                            ],
                            metadata: {
                                ...(typeof testSuite.defaultTest === 'object'
                                    ? testSuite.defaultTest?.metadata
                                    : {}),
                                ...data.metadata,
                                ...test.metadata,
                            },
                        };
                    });
                    // Add scenario tests to tests
                    tests = tests.concat(scenarioTests);
                }
            }
        }
        (0, warnings_1.maybeEmitAzureOpenAiWarning)(testSuite, tests);
        // Prepare vars
        const varNames = new Set();
        const varsWithSpecialColsRemoved = [];
        const inputTransformDefault = typeof testSuite?.defaultTest === 'object'
            ? testSuite?.defaultTest?.options?.transformVars
            : undefined;
        for (const testCase of tests) {
            testCase.vars = {
                ...(typeof testSuite.defaultTest === 'object' ? testSuite.defaultTest?.vars : {}),
                ...testCase?.vars,
            };
            if (testCase.vars) {
                const varWithSpecialColsRemoved = {};
                const inputTransformForIndividualTest = testCase.options?.transformVars;
                const inputTransform = inputTransformForIndividualTest || inputTransformDefault;
                if (inputTransform) {
                    const transformContext = {
                        prompt: {},
                        uuid: (0, crypto_1.randomUUID)(),
                    };
                    const transformedVars = await (0, transform_1.transform)(inputTransform, testCase.vars, transformContext, true, transform_1.TransformInputType.VARS);
                    (0, invariant_1.default)(typeof transformedVars === 'object', 'Transform function did not return a valid object');
                    testCase.vars = { ...testCase.vars, ...transformedVars };
                }
                for (const varName of Object.keys(testCase.vars)) {
                    varNames.add(varName);
                    varWithSpecialColsRemoved[varName] = testCase.vars[varName];
                }
                varsWithSpecialColsRemoved.push(varWithSpecialColsRemoved);
            }
        }
        // Set up eval cases
        const runEvalOptions = [];
        let testIdx = 0;
        let concurrency = options.maxConcurrency || constants_1.DEFAULT_MAX_CONCURRENCY;
        for (let index = 0; index < tests.length; index++) {
            const testCase = tests[index];
            (0, invariant_1.default)(typeof testSuite.defaultTest !== 'object' ||
                Array.isArray(testSuite.defaultTest?.assert || []), `defaultTest.assert is not an array in test case #${index + 1}`);
            (0, invariant_1.default)(Array.isArray(testCase.assert || []), `testCase.assert is not an array in test case #${index + 1}`);
            // Handle default properties
            testCase.assert = [
                ...(typeof testSuite.defaultTest === 'object' ? testSuite.defaultTest?.assert || [] : []),
                ...(testCase.assert || []),
            ];
            testCase.threshold =
                testCase.threshold ??
                    (typeof testSuite.defaultTest === 'object' ? testSuite.defaultTest?.threshold : undefined);
            testCase.options = {
                ...(typeof testSuite.defaultTest === 'object' ? testSuite.defaultTest?.options : {}),
                ...testCase.options,
            };
            testCase.metadata = {
                ...(typeof testSuite.defaultTest === 'object' ? testSuite.defaultTest?.metadata : {}),
                ...testCase.metadata,
            };
            // If the test case doesn't have a provider, use the one from defaultTest
            // Note: defaultTest.provider may be a raw config object that needs to be loaded
            if (!testCase.provider &&
                typeof testSuite.defaultTest === 'object' &&
                testSuite.defaultTest?.provider) {
                const defaultProvider = testSuite.defaultTest.provider;
                if ((0, providers_1.isApiProvider)(defaultProvider)) {
                    // Already loaded
                    testCase.provider = defaultProvider;
                }
                else if (typeof defaultProvider === 'object' && defaultProvider.id) {
                    // Raw config object - load it
                    const { loadApiProvider } = await Promise.resolve().then(() => __importStar(require('./providers')));
                    const providerId = typeof defaultProvider.id === 'function' ? defaultProvider.id() : defaultProvider.id;
                    testCase.provider = await loadApiProvider(providerId, {
                        options: defaultProvider,
                    });
                }
                else {
                    testCase.provider = defaultProvider;
                }
            }
            testCase.assertScoringFunction =
                testCase.assertScoringFunction ||
                    (typeof testSuite.defaultTest === 'object'
                        ? testSuite.defaultTest?.assertScoringFunction
                        : undefined);
            if (typeof testCase.assertScoringFunction === 'string') {
                const { filePath: resolvedPath, functionName } = (0, loadFunction_1.parseFileUrl)(testCase.assertScoringFunction);
                testCase.assertScoringFunction = await (0, loadFunction_1.loadFunction)({
                    filePath: resolvedPath,
                    functionName,
                });
            }
            const prependToPrompt = testCase.options?.prefix ||
                (typeof testSuite.defaultTest === 'object' ? testSuite.defaultTest?.options?.prefix : '') ||
                '';
            const appendToPrompt = testCase.options?.suffix ||
                (typeof testSuite.defaultTest === 'object' ? testSuite.defaultTest?.options?.suffix : '') ||
                '';
            // Finalize test case eval
            const varCombinations = (0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_VAR_EXPANSION') || testCase.options?.disableVarExpansion
                ? [testCase.vars]
                : generateVarCombinations(testCase.vars || {});
            const numRepeat = this.options.repeat || 1;
            for (let repeatIndex = 0; repeatIndex < numRepeat; repeatIndex++) {
                for (const vars of varCombinations) {
                    let promptIdx = 0;
                    // Order matters - keep provider in outer loop to reduce need to swap models during local inference.
                    for (const provider of testSuite.providers) {
                        for (const prompt of testSuite.prompts) {
                            const providerKey = provider.label || provider.id();
                            if (!isAllowedPrompt(prompt, testSuite.providerPromptMap?.[providerKey])) {
                                continue;
                            }
                            runEvalOptions.push({
                                delay: options.delay || 0,
                                provider,
                                prompt: {
                                    ...prompt,
                                    raw: prependToPrompt + prompt.raw + appendToPrompt,
                                },
                                test: (() => {
                                    const baseTest = {
                                        ...testCase,
                                        vars,
                                        options: testCase.options,
                                    };
                                    // Only add tracing metadata fields if tracing is actually enabled
                                    const tracingEnabled = testCase.metadata?.tracingEnabled === true ||
                                        testSuite.tracing?.enabled === true;
                                    logger_1.default.debug(`[Evaluator] Tracing check: testCase.metadata?.tracingEnabled=${testCase.metadata?.tracingEnabled}, testSuite.tracing?.enabled=${testSuite.tracing?.enabled}, testSuite.tracing=${JSON.stringify(testSuite.tracing)}, tracingEnabled=${tracingEnabled}`);
                                    if (tracingEnabled) {
                                        return {
                                            ...baseTest,
                                            metadata: {
                                                ...testCase.metadata,
                                                tracingEnabled: true,
                                                evaluationId: this.evalRecord.id,
                                            },
                                        };
                                    }
                                    return baseTest;
                                })(),
                                nunjucksFilters: testSuite.nunjucksFilters,
                                testIdx,
                                promptIdx,
                                repeatIndex,
                                evaluateOptions: options,
                                conversations: this.conversations,
                                registers: this.registers,
                                isRedteam: testSuite.redteam != null,
                                concurrency,
                                abortSignal: options.abortSignal,
                            });
                            promptIdx++;
                        }
                    }
                    testIdx++;
                }
            }
        }
        // Pre-mark comparison rows before any filtering (used by resume logic)
        for (const evalOption of runEvalOptions) {
            if (evalOption.test.assert?.some((a) => a.type === 'select-best')) {
                rowsWithSelectBestAssertion.add(evalOption.testIdx);
            }
            if (evalOption.test.assert?.some((a) => a.type === 'max-score')) {
                rowsWithMaxScoreAssertion.add(evalOption.testIdx);
            }
        }
        // Resume support: if CLI is in resume mode, skip already-completed (testIdx,promptIdx) pairs
        if (cliState_1.default.resume && this.evalRecord.persisted) {
            try {
                const { default: EvalResult } = await Promise.resolve().then(() => __importStar(require('./models/evalResult')));
                const completedPairs = await EvalResult.getCompletedIndexPairs(this.evalRecord.id);
                const originalCount = runEvalOptions.length;
                // Filter out steps that already exist in DB
                for (let i = runEvalOptions.length - 1; i >= 0; i--) {
                    const step = runEvalOptions[i];
                    if (completedPairs.has(`${step.testIdx}:${step.promptIdx}`)) {
                        runEvalOptions.splice(i, 1);
                    }
                }
                const skipped = originalCount - runEvalOptions.length;
                if (skipped > 0) {
                    logger_1.default.info(`Resuming: skipping ${skipped} previously completed cases`);
                }
            }
            catch (err) {
                logger_1.default.warn(`Resume: failed to load completed results. Running full evaluation. ${String(err)}`);
            }
        }
        // Determine run parameters
        if (concurrency > 1) {
            const usesConversation = prompts.some((p) => p.raw.includes('_conversation'));
            const usesStoreOutputAs = tests.some((t) => t.options?.storeOutputAs);
            if (usesConversation) {
                logger_1.default.info(`Setting concurrency to 1 because the ${chalk_1.default.cyan('_conversation')} variable is used.`);
                concurrency = 1;
            }
            else if (usesStoreOutputAs) {
                logger_1.default.info(`Setting concurrency to 1 because storeOutputAs is used.`);
                concurrency = 1;
            }
        }
        // Actually run the eval
        let numComplete = 0;
        const processEvalStep = async (evalStep, index) => {
            var _a;
            if (typeof index !== 'number') {
                throw new Error('Expected index to be a number');
            }
            const beforeEachOut = await (0, evaluatorHelpers_1.runExtensionHook)(testSuite.extensions, 'beforeEach', {
                test: evalStep.test,
            });
            evalStep.test = beforeEachOut.test;
            const rows = await runEval(evalStep);
            for (const row of rows) {
                for (const varName of Object.keys(row.vars)) {
                    vars.add(varName);
                }
                // Print token usage for model-graded assertions and add to stats
                if (row.gradingResult?.tokensUsed && row.testCase?.assert) {
                    for (const assertion of row.testCase.assert) {
                        if (index_1.MODEL_GRADED_ASSERTION_TYPES.has(assertion.type)) {
                            const tokensUsed = row.gradingResult.tokensUsed;
                            if (!this.stats.tokenUsage.assertions) {
                                this.stats.tokenUsage.assertions = (0, tokenUsageUtils_1.createEmptyAssertions)();
                            }
                            // Accumulate assertion tokens using the specialized assertion function
                            (0, tokenUsageUtils_1.accumulateAssertionTokenUsage)(this.stats.tokenUsage.assertions, tokensUsed);
                            break;
                        }
                    }
                }
                // capture metrics
                if (row.success) {
                    this.stats.successes++;
                }
                else if (row.failureReason === index_2.ResultFailureReason.ERROR) {
                    this.stats.errors++;
                }
                else {
                    this.stats.failures++;
                }
                if (row.tokenUsage) {
                    (0, tokenUsageUtils_1.accumulateResponseTokenUsage)(this.stats.tokenUsage, { tokenUsage: row.tokenUsage });
                }
                if (evalStep.test.assert?.some((a) => a.type === 'select-best')) {
                    rowsWithSelectBestAssertion.add(row.testIdx);
                }
                if (evalStep.test.assert?.some((a) => a.type === 'max-score')) {
                    rowsWithMaxScoreAssertion.add(row.testIdx);
                }
                for (const assert of evalStep.test.assert || []) {
                    if (assert.type) {
                        assertionTypes.add(assert.type);
                    }
                }
                numComplete++;
                try {
                    await this.evalRecord.addResult(row);
                }
                catch (error) {
                    const resultSummary = (0, json_1.summarizeEvaluateResultForLogging)(row);
                    logger_1.default.error(`Error saving result: ${error} ${(0, json_1.safeJsonStringify)(resultSummary)}`);
                }
                for (const writer of this.fileWriters) {
                    await writer.write(row);
                }
                if (row.metadata?.simbaSessionId) {
                    (_a = this.evalRecord.config).metadata ?? (_a.metadata = {});
                    this.evalRecord.config.metadata.simbaSessionId = row.metadata.simbaSessionId;
                }
                const { promptIdx } = row;
                const metrics = prompts[promptIdx].metrics;
                (0, invariant_1.default)(metrics, 'Expected prompt.metrics to be set');
                metrics.score += row.score;
                for (const [key, value] of Object.entries(row.namedScores)) {
                    // Update named score value
                    metrics.namedScores[key] = (metrics.namedScores[key] || 0) + value;
                    // Count assertions contributing to this named score
                    let contributingAssertions = 0;
                    row.gradingResult?.componentResults?.forEach((result) => {
                        if (result.assertion?.metric === key) {
                            contributingAssertions++;
                        }
                    });
                    metrics.namedScoresCount[key] =
                        (metrics.namedScoresCount[key] || 0) + (contributingAssertions || 1);
                }
                if (testSuite.derivedMetrics) {
                    const math = await Promise.resolve().then(() => __importStar(require('mathjs')));
                    for (const metric of testSuite.derivedMetrics) {
                        if (metrics.namedScores[metric.name] === undefined) {
                            metrics.namedScores[metric.name] = 0;
                        }
                        try {
                            if (typeof metric.value === 'function') {
                                metrics.namedScores[metric.name] = metric.value(metrics.namedScores, evalStep);
                            }
                            else {
                                const evaluatedValue = math.evaluate(metric.value, metrics.namedScores);
                                metrics.namedScores[metric.name] = evaluatedValue;
                            }
                        }
                        catch (error) {
                            logger_1.default.debug(`Could not evaluate derived metric '${metric.name}': ${error.message}`);
                        }
                    }
                }
                metrics.testPassCount += row.success ? 1 : 0;
                if (!row.success) {
                    if (row.failureReason === index_2.ResultFailureReason.ERROR) {
                        metrics.testErrorCount += 1;
                    }
                    else {
                        metrics.testFailCount += 1;
                    }
                }
                metrics.assertPassCount +=
                    row.gradingResult?.componentResults?.filter((r) => r.pass).length || 0;
                metrics.assertFailCount +=
                    row.gradingResult?.componentResults?.filter((r) => !r.pass).length || 0;
                metrics.totalLatencyMs += row.latencyMs || 0;
                (0, tokenUsageUtils_1.accumulateResponseTokenUsage)(metrics.tokenUsage, row.response);
                // Add assertion token usage to the metrics
                if (row.gradingResult?.tokensUsed) {
                    updateAssertionMetrics(metrics, row.gradingResult.tokensUsed);
                }
                metrics.cost += row.cost || 0;
                await (0, evaluatorHelpers_1.runExtensionHook)(testSuite.extensions, 'afterEach', {
                    test: evalStep.test,
                    result: row,
                });
                if (options.progressCallback) {
                    options.progressCallback(numComplete, runEvalOptions.length, index, evalStep, metrics);
                }
            }
        };
        // Add a wrapper function that implements timeout
        const processEvalStepWithTimeout = async (evalStep, index) => {
            // Get timeout value from options or environment, defaults to 0 (no timeout)
            const timeoutMs = options.timeoutMs || (0, envars_1.getEvalTimeoutMs)();
            if (timeoutMs <= 0) {
                // No timeout, process normally
                return processEvalStep(evalStep, index);
            }
            // Create an AbortController to cancel the request if it times out
            const abortController = new AbortController();
            const { signal } = abortController;
            // Add the abort signal to the evalStep
            const evalStepWithSignal = {
                ...evalStep,
                abortSignal: signal,
            };
            try {
                return await Promise.race([
                    processEvalStep(evalStepWithSignal, index),
                    new Promise((_, reject) => {
                        const timeoutId = setTimeout(() => {
                            // Abort any ongoing requests
                            abortController.abort();
                            // If the provider has a cleanup method, call it
                            if (typeof evalStep.provider.cleanup === 'function') {
                                try {
                                    evalStep.provider.cleanup();
                                }
                                catch (cleanupErr) {
                                    logger_1.default.warn(`Error during provider cleanup: ${cleanupErr}`);
                                }
                            }
                            reject(new Error(`Evaluation timed out after ${timeoutMs}ms`));
                            // Clear the timeout to prevent memory leaks
                            clearTimeout(timeoutId);
                        }, timeoutMs);
                    }),
                ]);
            }
            catch (error) {
                // Create and add an error result for timeout
                const timeoutResult = {
                    provider: {
                        id: evalStep.provider.id(),
                        label: evalStep.provider.label,
                        config: evalStep.provider.config,
                    },
                    prompt: {
                        raw: evalStep.prompt.raw,
                        label: evalStep.prompt.label,
                        config: evalStep.prompt.config,
                    },
                    vars: evalStep.test.vars || {},
                    error: `Evaluation timed out after ${timeoutMs}ms: ${String(error)}`,
                    success: false,
                    failureReason: index_2.ResultFailureReason.ERROR, // Using ERROR for timeouts
                    score: 0,
                    namedScores: {},
                    latencyMs: timeoutMs,
                    promptIdx: evalStep.promptIdx,
                    testIdx: evalStep.testIdx,
                    testCase: evalStep.test,
                    promptId: evalStep.prompt.id || '',
                };
                // Add the timeout result to the evaluation record
                await this.evalRecord.addResult(timeoutResult);
                // Update stats
                this.stats.errors++;
                // Update prompt metrics
                const { metrics } = prompts[evalStep.promptIdx];
                if (metrics) {
                    metrics.testErrorCount += 1;
                    metrics.totalLatencyMs += timeoutMs;
                }
                // Progress callback
                if (options.progressCallback) {
                    options.progressCallback(numComplete, runEvalOptions.length, typeof index === 'number' ? index : 0, evalStep, metrics || {
                        score: 0,
                        testPassCount: 0,
                        testFailCount: 0,
                        testErrorCount: 1,
                        assertPassCount: 0,
                        assertFailCount: 0,
                        totalLatencyMs: timeoutMs,
                        tokenUsage: {
                            total: 0,
                            prompt: 0,
                            completion: 0,
                            cached: 0,
                            numRequests: 0,
                        },
                        namedScores: {},
                        namedScoresCount: {},
                        cost: 0,
                    });
                }
            }
        };
        // Set up progress tracking
        const originalProgressCallback = this.options.progressCallback;
        const isWebUI = Boolean(cliState_1.default.webUI);
        // Choose appropriate progress reporter
        logger_1.default.debug(`Progress bar settings: showProgressBar=${this.options.showProgressBar}, isWebUI=${isWebUI}`);
        if ((0, envars_1.isCI)() && !isWebUI) {
            // Use CI-friendly progress reporter
            ciProgressReporter = new ciProgressReporter_1.CIProgressReporter(runEvalOptions.length);
            ciProgressReporter.start();
        }
        else if (this.options.showProgressBar && process.stdout.isTTY) {
            // Use visual progress bars
            progressBarManager = new ProgressBarManager(isWebUI);
        }
        this.options.progressCallback = (completed, total, index, evalStep, metrics) => {
            if (originalProgressCallback) {
                originalProgressCallback(completed, total, index, evalStep, metrics);
            }
            if (isWebUI) {
                const provider = evalStep.provider.label || evalStep.provider.id();
                const vars = formatVarsForDisplay(evalStep.test.vars, 50);
                logger_1.default.info(`[${numComplete}/${total}] Running ${provider} with vars: ${vars}`);
            }
            else if (progressBarManager) {
                // Progress bar update is handled by the manager
                const phase = evalStep.test.options?.runSerially ? 'serial' : 'concurrent';
                progressBarManager.updateProgress(index, evalStep, phase, metrics);
            }
            else if (ciProgressReporter) {
                // CI progress reporter update
                ciProgressReporter.update(numComplete);
            }
            else {
                logger_1.default.debug(`Eval #${index + 1} complete (${numComplete} of ${runEvalOptions.length})`);
            }
        };
        // Separate serial, concurrent, and Simba eval options
        const serialRunEvalOptions = [];
        const concurrentRunEvalOptions = [];
        const simbaRunEvalOptions = [];
        for (const evalOption of runEvalOptions) {
            if ((0, util_1.isSimbaTestCase)(evalOption)) {
                simbaRunEvalOptions.push(evalOption);
            }
            else if (evalOption.test.options?.runSerially) {
                serialRunEvalOptions.push(evalOption);
            }
            else {
                concurrentRunEvalOptions.push(evalOption);
            }
        }
        // Print info messages before starting progress bar
        if (serialRunEvalOptions.length > 0) {
            logger_1.default.info(`Running ${serialRunEvalOptions.length} test cases serially...`);
        }
        if (concurrentRunEvalOptions.length > 0) {
            logger_1.default.info(`Running ${concurrentRunEvalOptions.length} test cases (up to ${concurrency} at a time)...`);
        }
        // Now start the progress bar after info messages
        if (this.options.showProgressBar && progressBarManager) {
            await progressBarManager.initialize(runEvalOptions, concurrency, 0);
        }
        try {
            if (serialRunEvalOptions.length > 0) {
                // Run serial evaluations
                for (const evalStep of serialRunEvalOptions) {
                    if (isWebUI) {
                        const provider = evalStep.provider.label || evalStep.provider.id();
                        const vars = formatVarsForDisplay(evalStep.test.vars || {}, 50);
                        logger_1.default.info(`[${numComplete}/${runEvalOptions.length}] Running ${provider} with vars: ${vars}`);
                    }
                    const idx = runEvalOptions.indexOf(evalStep);
                    await processEvalStepWithTimeout(evalStep, idx);
                    processedIndices.add(idx);
                }
                // Serial phase complete - progress is tracked automatically by updateProgress
            }
            // Then run concurrent evaluations
            await async_1.default.forEachOfLimit(concurrentRunEvalOptions, concurrency, async (evalStep) => {
                checkAbort();
                const idx = runEvalOptions.indexOf(evalStep);
                await processEvalStepWithTimeout(evalStep, idx);
                processedIndices.add(idx);
                await this.evalRecord.addPrompts(prompts);
            });
            // Finally run Simba evaluations sequentially (they have their own internal concurrency)
            if (simbaRunEvalOptions.length > 0) {
                if (progressBarManager) {
                    progressBarManager.complete();
                    progressBarManager.stop();
                }
                for (const evalStep of simbaRunEvalOptions) {
                    if (isWebUI) {
                        const provider = evalStep.provider.label || evalStep.provider.id();
                        const vars = formatVarsForDisplay(evalStep.test.vars || {}, 50);
                        logger_1.default.info(`[${numComplete}/${runEvalOptions.length}] Running ${constants_2.strategyDisplayNames.simba} ${provider} with vars: ${vars}`);
                    }
                    checkAbort();
                    const idx = runEvalOptions.indexOf(evalStep);
                    await processEvalStepWithTimeout(evalStep, idx);
                    processedIndices.add(idx);
                }
            }
        }
        catch (err) {
            if (options.abortSignal?.aborted) {
                // User interruption or max duration timeout
                evalTimedOut = evalTimedOut || maxEvalTimeMs > 0;
                if (evalTimedOut) {
                    logger_1.default.warn(`Evaluation stopped after reaching max duration (${maxEvalTimeMs}ms)`);
                }
                else {
                    logger_1.default.info('Evaluation interrupted, saving progress...');
                }
            }
            else {
                if (ciProgressReporter) {
                    ciProgressReporter.error(`Evaluation failed: ${String(err)}`);
                }
                throw err;
            }
        }
        // Do we have to run comparisons between row outputs?
        const compareRowsCount = rowsWithSelectBestAssertion.size + rowsWithMaxScoreAssertion.size;
        // Update progress reporters based on comparison count
        if (progressBarManager) {
            if (compareRowsCount > 0) {
                progressBarManager.updateTotalCount(compareRowsCount);
            }
        }
        else if (ciProgressReporter && compareRowsCount > 0) {
            // Update total tests to include comparison tests for CI reporter
            ciProgressReporter.updateTotalTests(runEvalOptions.length + compareRowsCount);
        }
        let compareCount = 0;
        for (const testIdx of rowsWithSelectBestAssertion) {
            compareCount++;
            if (isWebUI) {
                logger_1.default.info(`Running model-graded comparison ${compareCount} of ${compareRowsCount}...`);
            }
            const resultsToCompare = this.evalRecord.persisted
                ? await this.evalRecord.fetchResultsByTestIdx(testIdx)
                : this.evalRecord.results.filter((r) => r.testIdx === testIdx);
            if (resultsToCompare.length === 0) {
                logger_1.default.warn(`Expected results to be found for test index ${testIdx}`);
                continue;
            }
            const compareAssertion = resultsToCompare[0].testCase.assert?.find((a) => a.type === 'select-best');
            if (compareAssertion) {
                const outputs = resultsToCompare.map((r) => r.response?.output || '');
                // Provide context for grading providers that need originalProvider.
                // For example, simulated-user requires originalProvider to access the target provider's configuration.
                const firstResult = resultsToCompare[0];
                const providerId = firstResult.provider.id;
                const originalProvider = this.testSuite.providers.find((p) => p.id() === providerId);
                const callApiContext = originalProvider
                    ? {
                        originalProvider,
                        prompt: firstResult.prompt,
                        vars: firstResult.testCase.vars || {},
                    }
                    : undefined;
                const gradingResults = await (0, index_1.runCompareAssertion)(resultsToCompare[0].testCase, compareAssertion, outputs, callApiContext);
                for (let index = 0; index < resultsToCompare.length; index++) {
                    const result = resultsToCompare[index];
                    const gradingResult = gradingResults[index];
                    if (result.gradingResult) {
                        result.gradingResult.tokensUsed = result.gradingResult.tokensUsed || {
                            total: 0,
                            prompt: 0,
                            completion: 0,
                        };
                        // Use the helper function instead of direct updates
                        if (gradingResult.tokensUsed) {
                            if (!result.gradingResult.tokensUsed) {
                                result.gradingResult.tokensUsed = {
                                    total: 0,
                                    prompt: 0,
                                    completion: 0,
                                };
                            }
                            // Update the metrics using the helper function
                            updateAssertionMetrics({ tokenUsage: { assertions: result.gradingResult.tokensUsed } }, gradingResult.tokensUsed);
                            // Also update the metrics for the eval
                            if (gradingResult.tokensUsed && result.testCase?.assert) {
                                for (const assertion of result.testCase.assert) {
                                    if (index_1.MODEL_GRADED_ASSERTION_TYPES.has(assertion.type)) {
                                        updateAssertionMetrics({ tokenUsage: this.stats.tokenUsage }, gradingResult.tokensUsed);
                                        break;
                                    }
                                }
                            }
                        }
                        result.success = result.gradingResult.pass =
                            result.gradingResult.pass && gradingResult.pass;
                        if (!gradingResult.pass) {
                            // Failure overrides the reason and the score
                            result.gradingResult.reason = gradingResult.reason;
                            result.score = result.gradingResult.score = gradingResult.score;
                        }
                        if (!result.gradingResult.componentResults) {
                            result.gradingResult.componentResults = [];
                        }
                        result.gradingResult.componentResults.push(gradingResult);
                    }
                    else {
                        result.gradingResult = gradingResult;
                    }
                    if (this.evalRecord.persisted) {
                        await result.save();
                    }
                }
                if (progressBarManager) {
                    progressBarManager.updateComparisonProgress(resultsToCompare[0].prompt.raw);
                }
                else if (ciProgressReporter) {
                    ciProgressReporter.update(runEvalOptions.length + compareCount);
                }
                else if (!isWebUI) {
                    logger_1.default.debug(`Model-graded comparison #${compareCount} of ${compareRowsCount} complete`);
                }
            }
        }
        // Process max-score assertions
        const maxScoreRowsCount = rowsWithMaxScoreAssertion.size;
        if (maxScoreRowsCount > 0) {
            logger_1.default.info(`Processing ${maxScoreRowsCount} max-score assertions...`);
            for (const testIdx of rowsWithMaxScoreAssertion) {
                const resultsToCompare = this.evalRecord.persisted
                    ? await this.evalRecord.fetchResultsByTestIdx(testIdx)
                    : this.evalRecord.results.filter((r) => r.testIdx === testIdx);
                if (resultsToCompare.length === 0) {
                    logger_1.default.warn(`Expected results to be found for test index ${testIdx}`);
                    continue;
                }
                const maxScoreAssertion = resultsToCompare[0].testCase.assert?.find((a) => a.type === 'max-score');
                if (maxScoreAssertion) {
                    const outputs = resultsToCompare.map((r) => r.response?.output || '');
                    // Pass the results with their grading results to selectMaxScore
                    const maxScoreGradingResults = await (0, matchers_1.selectMaxScore)(outputs, resultsToCompare, maxScoreAssertion);
                    // Update progress bar
                    if (progressBarManager) {
                        progressBarManager.updateComparisonProgress(resultsToCompare[0].prompt.raw);
                    }
                    else if (ciProgressReporter) {
                        // For max-score assertions, we're still in the comparison phase
                        // so we add to the total completed count
                        ciProgressReporter.update(runEvalOptions.length + compareCount);
                    }
                    else if (!isWebUI) {
                        logger_1.default.debug(`Max-score assertion for test #${testIdx} complete`);
                    }
                    // Update results with max-score outcomes
                    for (let index = 0; index < resultsToCompare.length; index++) {
                        const result = resultsToCompare[index];
                        const maxScoreGradingResult = {
                            ...maxScoreGradingResults[index],
                            assertion: maxScoreAssertion,
                        };
                        // Preserve existing gradingResult data and add max-score result to componentResults
                        const existingComponentResults = result.gradingResult?.componentResults || [];
                        const existingGradingResult = result.gradingResult;
                        result.gradingResult = {
                            pass: maxScoreGradingResult.pass,
                            score: maxScoreGradingResult.score,
                            reason: maxScoreGradingResult.reason,
                            componentResults: [...existingComponentResults, maxScoreGradingResult],
                            namedScores: {
                                ...(existingGradingResult?.namedScores || {}),
                                ...maxScoreGradingResult.namedScores,
                            },
                            tokensUsed: existingGradingResult?.tokensUsed || maxScoreGradingResult.tokensUsed,
                            assertion: maxScoreAssertion,
                        };
                        // Don't overwrite overall success/score - max-score is just another assertion
                        // The overall result should be determined by all assertions, not just max-score
                        if (this.evalRecord.persisted) {
                            await result.save();
                        }
                    }
                }
            }
        }
        await this.evalRecord.addPrompts(prompts);
        // Clean up progress reporters and timers
        try {
            if (progressBarManager) {
                progressBarManager.complete();
                progressBarManager.stop();
            }
            else if (ciProgressReporter) {
                ciProgressReporter.finish();
            }
        }
        catch (cleanupErr) {
            logger_1.default.warn(`Error during progress reporter cleanup: ${cleanupErr}`);
        }
        if (globalTimeout) {
            clearTimeout(globalTimeout);
        }
        if (evalTimedOut) {
            for (let i = 0; i < runEvalOptions.length; i++) {
                if (!processedIndices.has(i)) {
                    const evalStep = runEvalOptions[i];
                    const timeoutResult = {
                        provider: {
                            id: evalStep.provider.id(),
                            label: evalStep.provider.label,
                            config: evalStep.provider.config,
                        },
                        prompt: {
                            raw: evalStep.prompt.raw,
                            label: evalStep.prompt.label,
                            config: evalStep.prompt.config,
                        },
                        vars: evalStep.test.vars || {},
                        error: `Evaluation exceeded max duration of ${maxEvalTimeMs}ms`,
                        success: false,
                        failureReason: index_2.ResultFailureReason.ERROR,
                        score: 0,
                        namedScores: {},
                        latencyMs: Date.now() - startTime,
                        promptIdx: evalStep.promptIdx,
                        testIdx: evalStep.testIdx,
                        testCase: evalStep.test,
                        promptId: evalStep.prompt.id || '',
                    };
                    await this.evalRecord.addResult(timeoutResult);
                    this.stats.errors++;
                    const { metrics } = prompts[evalStep.promptIdx];
                    if (metrics) {
                        metrics.testErrorCount += 1;
                        metrics.totalLatencyMs += timeoutResult.latencyMs;
                    }
                }
            }
        }
        this.evalRecord.setVars(Array.from(vars));
        await (0, evaluatorHelpers_1.runExtensionHook)(testSuite.extensions, 'afterAll', {
            prompts: this.evalRecord.prompts,
            results: this.evalRecord.results,
            suite: testSuite,
        });
        // Calculate additional metrics for telemetry
        const endTime = Date.now();
        const totalEvalTimeMs = endTime - startTime;
        // Calculate aggregated metrics
        const totalCost = prompts.reduce((acc, p) => acc + (p.metrics?.cost || 0), 0);
        const totalRequests = this.stats.tokenUsage.numRequests;
        // Calculate efficiency metrics
        const totalTokens = this.stats.tokenUsage.total;
        const cachedTokens = this.stats.tokenUsage.cached;
        // Calculate correct average latency by summing individual request latencies
        const totalLatencyMs = this.evalRecord.results.reduce((sum, result) => sum + (result.latencyMs || 0), 0);
        const avgLatencyMs = this.evalRecord.results.length > 0 ? totalLatencyMs / this.evalRecord.results.length : 0;
        // Detect key feature usage patterns
        const usesConversationVar = prompts.some((p) => p.raw.includes('_conversation'));
        const usesTransforms = Boolean(tests.some((t) => t.options?.transform || t.options?.postprocess) ||
            testSuite.providers.some((p) => Boolean(p.transform)));
        const usesScenarios = Boolean(testSuite.scenarios && testSuite.scenarios.length > 0);
        // Detect if using any promptfoo.app example provider
        const usesExampleProvider = testSuite.providers.some((provider) => {
            const url = typeof provider.config?.url === 'string' ? provider.config.url : '';
            const label = provider.label || '';
            return url.includes('promptfoo.app') || label.toLowerCase().includes('example');
        });
        // Calculate assertion metrics
        const totalAssertions = prompts.reduce((acc, p) => acc + (p.metrics?.assertPassCount || 0) + (p.metrics?.assertFailCount || 0), 0);
        const passedAssertions = prompts.reduce((acc, p) => acc + (p.metrics?.assertPassCount || 0), 0);
        // Count model-graded vs other assertion types
        const modelGradedCount = Array.from(assertionTypes).filter((type) => index_1.MODEL_GRADED_ASSERTION_TYPES.has(type)).length;
        // Calculate provider distribution (maintain exact compatibility)
        const providerPrefixes = Array.from(new Set(testSuite.providers.map((p) => {
            const idParts = p.id().split(':');
            return idParts.length > 1 ? idParts[0] : 'unknown';
        })));
        // Detect timeout occurrences (more robust than string matching)
        const timeoutOccurred = evalTimedOut ||
            this.evalRecord.results.some((r) => r.failureReason === index_2.ResultFailureReason.ERROR && r.error?.includes('timed out'));
        telemetry_1.default.record('eval_ran', {
            // Basic metrics
            numPrompts: prompts.length,
            numTests: this.stats.successes + this.stats.failures + this.stats.errors,
            numRequests: this.stats.tokenUsage.numRequests || 0,
            numResults: this.evalRecord.results.length,
            numVars: varNames.size,
            numProviders: testSuite.providers.length,
            numRepeat: options.repeat || 1,
            providerPrefixes: providerPrefixes.sort(),
            assertionTypes: Array.from(assertionTypes).sort(),
            eventSource: options.eventSource || 'default',
            ci: (0, envars_1.isCI)(),
            hasAnyPass: this.stats.successes > 0,
            // Result counts
            numPasses: this.stats.successes,
            numFails: this.stats.failures,
            numErrors: this.stats.errors,
            // Performance metrics
            totalEvalTimeMs,
            avgLatencyMs: Math.round(avgLatencyMs),
            concurrencyUsed: concurrency,
            timeoutOccurred,
            // Token and cost metrics
            totalTokens,
            promptTokens: this.stats.tokenUsage.prompt,
            completionTokens: this.stats.tokenUsage.completion,
            cachedTokens,
            totalCost,
            totalRequests,
            // Assertion metrics
            numAssertions: totalAssertions,
            passedAssertions,
            modelGradedAssertions: modelGradedCount,
            assertionPassRate: totalAssertions > 0 ? passedAssertions / totalAssertions : 0,
            // Feature usage
            usesConversationVar,
            usesTransforms,
            usesScenarios,
            usesExampleProvider,
            isPromptfooSampleTarget: testSuite.providers.some(shared_1.isPromptfooSampleTarget),
            isRedteam: Boolean(options.isRedteam),
        });
        // Update database signal file after all results are written
        (0, signal_1.updateSignalFile)();
        return this.evalRecord;
    }
    async evaluate() {
        await (0, evaluatorTracing_1.startOtlpReceiverIfNeeded)(this.testSuite);
        try {
            return await this._runEvaluation();
        }
        finally {
            if ((0, evaluatorTracing_1.isOtlpReceiverStarted)()) {
                // Add a delay to allow providers to finish exporting spans
                logger_1.default.debug('[Evaluator] Waiting for span exports to complete...');
                await (0, time_1.sleep)(3000);
            }
            await (0, evaluatorTracing_1.stopOtlpReceiverIfNeeded)();
            // Clean up Python worker pools to prevent resource leaks
            await providerRegistry_1.providerRegistry.shutdownAll();
        }
    }
}
function evaluate(testSuite, evalRecord, options) {
    const ev = new Evaluator(testSuite, evalRecord, options);
    return ev.evaluate();
}
//# sourceMappingURL=evaluator.js.map