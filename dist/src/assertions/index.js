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
exports.MODEL_GRADED_ASSERTION_TYPES = void 0;
exports.isAssertionInverse = isAssertionInverse;
exports.getAssertionBaseType = getAssertionBaseType;
exports.runAssertion = runAssertion;
exports.runAssertions = runAssertions;
exports.runCompareAssertion = runCompareAssertion;
exports.readAssertions = readAssertions;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const async_1 = __importDefault(require("async"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const cliState_1 = __importDefault(require("../cliState"));
const envars_1 = require("../envars");
const deepeval_1 = require("../external/assertions/deepeval");
const deepeval_2 = require("../external/matchers/deepeval");
const logger_1 = __importDefault(require("../logger"));
const matchers_1 = require("../matchers");
const packageParser_1 = require("../providers/packageParser");
const pythonUtils_1 = require("../python/pythonUtils");
const fileExtensions_1 = require("../util/fileExtensions");
const invariant_1 = __importDefault(require("../util/invariant"));
const templates_1 = require("../util/templates");
const transform_1 = require("../util/transform");
const answerRelevance_1 = require("./answerRelevance");
const assertionsResult_1 = require("./assertionsResult");
const bleu_1 = require("./bleu");
const classifier_1 = require("./classifier");
const contains_1 = require("./contains");
const contextFaithfulness_1 = require("./contextFaithfulness");
const contextRecall_1 = require("./contextRecall");
const contextRelevance_1 = require("./contextRelevance");
const cost_1 = require("./cost");
const equals_1 = require("./equals");
const factuality_1 = require("./factuality");
const finishReason_1 = require("./finishReason");
const functionToolCall_1 = require("./functionToolCall");
const geval_1 = require("./geval");
const gleu_1 = require("./gleu");
const guardrails_1 = require("./guardrails");
const html_1 = require("./html");
const javascript_1 = require("./javascript");
const json_1 = require("./json");
const latency_1 = require("./latency");
const levenshtein_1 = require("./levenshtein");
const llmRubric_1 = require("./llmRubric");
const modelGradedClosedQa_1 = require("./modelGradedClosedQa");
const moderation_1 = require("./moderation");
const openai_1 = require("./openai");
const perplexity_1 = require("./perplexity");
const pi_1 = require("./pi");
const python_1 = require("./python");
const redteam_1 = require("./redteam");
const ruby_1 = require("./ruby");
const refusal_1 = require("./refusal");
const regex_1 = require("./regex");
const rouge_1 = require("./rouge");
const similar_1 = require("./similar");
const sql_1 = require("./sql");
const startsWith_1 = require("./startsWith");
const traceErrorSpans_1 = require("./traceErrorSpans");
const traceSpanCount_1 = require("./traceSpanCount");
const traceSpanDuration_1 = require("./traceSpanDuration");
const utils_1 = require("./utils");
const webhook_1 = require("./webhook");
const xml_1 = require("./xml");
const ASSERTIONS_MAX_CONCURRENCY = (0, envars_1.getEnvInt)('PROMPTFOO_ASSERTIONS_MAX_CONCURRENCY', 3);
exports.MODEL_GRADED_ASSERTION_TYPES = new Set([
    'answer-relevance',
    'context-faithfulness',
    'context-recall',
    'context-relevance',
    'factuality',
    'llm-rubric',
    'model-graded-closedqa',
    'model-graded-factuality',
]);
const ASSERTION_HANDLERS = {
    'answer-relevance': answerRelevance_1.handleAnswerRelevance,
    bleu: bleu_1.handleBleuScore,
    classifier: classifier_1.handleClassifier,
    contains: contains_1.handleContains,
    'contains-all': contains_1.handleContainsAll,
    'contains-any': contains_1.handleContainsAny,
    'contains-html': html_1.handleContainsHtml,
    'contains-json': json_1.handleContainsJson,
    'contains-sql': sql_1.handleContainsSql,
    'contains-xml': xml_1.handleIsXml,
    'context-faithfulness': contextFaithfulness_1.handleContextFaithfulness,
    'context-recall': contextRecall_1.handleContextRecall,
    'context-relevance': contextRelevance_1.handleContextRelevance,
    'conversation-relevance': deepeval_1.handleConversationRelevance,
    cost: cost_1.handleCost,
    equals: equals_1.handleEquals,
    factuality: factuality_1.handleFactuality,
    'finish-reason': finishReason_1.handleFinishReason,
    'g-eval': geval_1.handleGEval,
    gleu: gleu_1.handleGleuScore,
    guardrails: guardrails_1.handleGuardrails,
    icontains: contains_1.handleIContains,
    'icontains-all': contains_1.handleIContainsAll,
    'icontains-any': contains_1.handleIContainsAny,
    'is-html': html_1.handleIsHtml,
    'is-json': json_1.handleIsJson,
    'is-refusal': refusal_1.handleIsRefusal,
    'is-sql': sql_1.handleIsSql,
    'is-valid-function-call': functionToolCall_1.handleIsValidFunctionCall,
    'is-valid-openai-function-call': functionToolCall_1.handleIsValidFunctionCall,
    'is-valid-openai-tools-call': openai_1.handleIsValidOpenAiToolsCall,
    'is-xml': xml_1.handleIsXml,
    javascript: javascript_1.handleJavascript,
    latency: latency_1.handleLatency,
    levenshtein: levenshtein_1.handleLevenshtein,
    'llm-rubric': llmRubric_1.handleLlmRubric,
    meteor: async (params) => {
        try {
            const { handleMeteorAssertion } = await Promise.resolve().then(() => __importStar(require('./meteor')));
            return handleMeteorAssertion(params);
        }
        catch (error) {
            if (error instanceof Error &&
                (error.message.includes('Cannot find module') ||
                    error.message.includes('natural" package is required'))) {
                return {
                    pass: false,
                    score: 0,
                    reason: 'METEOR assertion requires the natural package. Please install it using: npm install natural@^8.1.0',
                    assertion: params.assertion,
                };
            }
            throw error;
        }
    },
    'model-graded-closedqa': modelGradedClosedQa_1.handleModelGradedClosedQa,
    'model-graded-factuality': factuality_1.handleFactuality,
    moderation: moderation_1.handleModeration,
    perplexity: perplexity_1.handlePerplexity,
    'perplexity-score': perplexity_1.handlePerplexityScore,
    pi: pi_1.handlePiScorer,
    python: python_1.handlePython,
    regex: regex_1.handleRegex,
    ruby: ruby_1.handleRuby,
    'rouge-n': rouge_1.handleRougeScore,
    similar: similar_1.handleSimilar,
    'similar:cosine': similar_1.handleSimilar,
    'similar:dot': similar_1.handleSimilar,
    'similar:euclidean': similar_1.handleSimilar,
    'starts-with': startsWith_1.handleStartsWith,
    'trace-error-spans': traceErrorSpans_1.handleTraceErrorSpans,
    'trace-span-count': traceSpanCount_1.handleTraceSpanCount,
    'trace-span-duration': traceSpanDuration_1.handleTraceSpanDuration,
    webhook: webhook_1.handleWebhook,
};
const nunjucks = (0, templates_1.getNunjucksEngine)();
/**
 * Tests whether an assertion is inverse e.g. "not-equals" is inverse of "equals"
 * or "not-contains" is inverse of "contains".
 * @param assertion - The assertion to test
 * @returns true if the assertion is inverse, false otherwise
 */
function isAssertionInverse(assertion) {
    return assertion.type.startsWith('not-');
}
/**
 * Returns the base type of an assertion i.e. "not-equals" returns "equals"
 * and "equals" returns "equals".
 * @param assertion - The assertion to get the base type.
 * @returns The base type of the assertion.
 */
function getAssertionBaseType(assertion) {
    const inverse = isAssertionInverse(assertion);
    return inverse ? assertion.type.slice(4) : assertion.type;
}
async function runAssertion({ prompt, provider, assertion, test, latencyMs, providerResponse, traceId, }) {
    const { cost, logProbs, output: originalOutput } = providerResponse;
    let output = originalOutput;
    (0, invariant_1.default)(assertion.type, `Assertion must have a type: ${JSON.stringify(assertion)}`);
    if (assertion.transform) {
        output = await (0, transform_1.transform)(assertion.transform, output, {
            vars: test.vars,
            prompt: { label: prompt },
            ...(providerResponse && providerResponse.metadata && { metadata: providerResponse.metadata }),
        });
    }
    const context = {
        prompt,
        vars: test.vars || {},
        test,
        logProbs,
        provider,
        providerResponse,
        ...(assertion.config ? { config: structuredClone(assertion.config) } : {}),
    };
    // Add trace data if traceId is available
    if (traceId) {
        try {
            const { getTraceStore } = await Promise.resolve().then(() => __importStar(require('../tracing/store')));
            const traceStore = getTraceStore();
            const traceData = await traceStore.getTrace(traceId);
            if (traceData) {
                context.trace = {
                    traceId: traceData.traceId,
                    spans: traceData.spans || [],
                };
            }
        }
        catch (error) {
            logger_1.default.debug(`Failed to fetch trace data for assertion: ${error}`);
        }
    }
    // Render assertion values
    let renderedValue = assertion.value;
    let valueFromScript;
    if (typeof renderedValue === 'string') {
        if (renderedValue.startsWith('file://')) {
            const basePath = cliState_1.default.basePath || '';
            const fileRef = renderedValue.slice('file://'.length);
            let filePath = fileRef;
            let functionName;
            if (fileRef.includes(':')) {
                const [pathPart, funcPart] = fileRef.split(':');
                filePath = pathPart;
                functionName = funcPart;
            }
            filePath = path_1.default.resolve(basePath, filePath);
            if ((0, fileExtensions_1.isJavascriptFile)(filePath)) {
                valueFromScript = await (0, utils_1.loadFromJavaScriptFile)(filePath, functionName, [output, context]);
                logger_1.default.debug(`Javascript script ${filePath} output: ${valueFromScript}`);
            }
            else if (filePath.endsWith('.py')) {
                try {
                    const pythonScriptOutput = await (0, pythonUtils_1.runPython)(filePath, functionName || 'get_assert', [
                        output,
                        context,
                    ]);
                    valueFromScript = pythonScriptOutput;
                    logger_1.default.debug(`Python script ${filePath} output: ${valueFromScript}`);
                }
                catch (error) {
                    return {
                        pass: false,
                        score: 0,
                        reason: error.message,
                        assertion,
                    };
                }
            }
            else if (filePath.endsWith('.rb')) {
                try {
                    const { runRuby } = await Promise.resolve().then(() => __importStar(require('../ruby/rubyUtils')));
                    const rubyScriptOutput = await runRuby(filePath, functionName || 'get_assert', [
                        output,
                        context,
                    ]);
                    valueFromScript = rubyScriptOutput;
                    logger_1.default.debug(`Ruby script ${filePath} output: ${valueFromScript}`);
                }
                catch (error) {
                    return {
                        pass: false,
                        score: 0,
                        reason: error.message,
                        assertion,
                    };
                }
            }
            else {
                renderedValue = (0, utils_1.processFileReference)(renderedValue);
            }
        }
        else if ((0, packageParser_1.isPackagePath)(renderedValue)) {
            const basePath = cliState_1.default.basePath || '';
            const requiredModule = await (0, packageParser_1.loadFromPackage)(renderedValue, basePath);
            if (typeof requiredModule !== 'function') {
                throw new Error(`Assertion malformed: ${renderedValue} must be a function. Received: ${typeof requiredModule}`);
            }
            valueFromScript = await Promise.resolve(requiredModule(output, context));
        }
        else {
            // It's a normal string value
            renderedValue = nunjucks.renderString(renderedValue, test.vars || {});
        }
    }
    else if (renderedValue && Array.isArray(renderedValue)) {
        // Process each element in the array
        renderedValue = renderedValue.map((v) => {
            if (typeof v === 'string') {
                if (v.startsWith('file://')) {
                    return (0, utils_1.processFileReference)(v);
                }
                return nunjucks.renderString(v, test.vars || {});
            }
            return v;
        });
    }
    // Centralized script output resolution
    // Script assertion types (javascript, python, ruby) interpret renderedValue as code to execute
    // All other types should use the script output as the comparison value
    const SCRIPT_RESULT_ASSERTIONS = new Set(['javascript', 'python', 'ruby']);
    const baseType = getAssertionBaseType(assertion);
    if (valueFromScript !== undefined && !SCRIPT_RESULT_ASSERTIONS.has(baseType)) {
        // Validate the script result type - only javascript/python/ruby can return functions
        if (typeof valueFromScript === 'function') {
            throw new Error(`Script for "${assertion.type}" assertion returned a function. ` +
                `Only javascript/python/ruby assertion types can return functions. ` +
                `For other assertion types, return the expected value (string, number, array, or object).`);
        }
        // Validate the script didn't return boolean or GradingResult
        // These are only valid for javascript/python/ruby assertion types
        if (typeof valueFromScript === 'boolean') {
            throw new Error(`Script for "${assertion.type}" assertion returned a boolean. ` +
                `Only javascript/python/ruby assertion types can return boolean values. ` +
                `For other assertion types, return the expected value (string, number, array, or object).`);
        }
        // Check if it's a GradingResult object (has 'pass' property)
        if (valueFromScript &&
            typeof valueFromScript === 'object' &&
            !Array.isArray(valueFromScript) &&
            'pass' in valueFromScript) {
            throw new Error(`Script for "${assertion.type}" assertion returned a GradingResult. ` +
                `Only javascript/python/ruby assertion types can return GradingResult objects. ` +
                `For other assertion types, return the expected value (string, number, array, or object).`);
        }
        // Update renderedValue with the script output
        // Type assertion is now safe because we've validated the type
        renderedValue = valueFromScript;
    }
    // Construct CallApiContextParams for model-graded assertions that need originalProvider
    const providerCallContext = provider
        ? {
            originalProvider: provider,
            prompt: { raw: prompt || '', label: '' },
            vars: test.vars || {},
        }
        : undefined;
    const assertionParams = {
        assertion,
        baseType: getAssertionBaseType(assertion),
        providerCallContext,
        assertionValueContext: context,
        cost,
        inverse: isAssertionInverse(assertion),
        latencyMs,
        logProbs,
        output,
        outputString: (0, utils_1.coerceString)(output),
        prompt,
        provider,
        providerResponse,
        renderedValue,
        test: (0, utils_1.getFinalTest)(test, assertion),
        valueFromScript,
    };
    // Check for redteam assertions first
    if (assertionParams.baseType.startsWith('promptfoo:redteam:')) {
        return (0, redteam_1.handleRedteam)(assertionParams);
    }
    const handler = ASSERTION_HANDLERS[assertionParams.baseType];
    if (handler) {
        const result = await handler(assertionParams);
        // Store rendered assertion value in metadata if it differs from the original template
        // This allows the UI to display substituted variable values instead of raw templates
        if (renderedValue !== undefined &&
            renderedValue !== assertion.value &&
            typeof renderedValue === 'string') {
            result.metadata = result.metadata || {};
            result.metadata.renderedAssertionValue = renderedValue;
        }
        // If weight is 0, treat this as a metric-only assertion that can't fail
        if (assertion.weight === 0) {
            return {
                ...result,
                pass: true, // Force pass for weight=0 assertions
            };
        }
        return result;
    }
    throw new Error(`Unknown assertion type: ${assertion.type}`);
}
async function runAssertions({ assertScoringFunction, latencyMs, prompt, provider, providerResponse, test, traceId, }) {
    if (!test.assert || test.assert.length < 1) {
        return assertionsResult_1.AssertionsResult.noAssertsResult();
    }
    const mainAssertResult = new assertionsResult_1.AssertionsResult({
        threshold: test.threshold,
    });
    const subAssertResults = [];
    const asserts = test.assert
        .map((assertion, i) => {
        if (assertion.type === 'assert-set') {
            const subAssertResult = new assertionsResult_1.AssertionsResult({
                threshold: assertion.threshold,
                parentAssertionSet: {
                    assertionSet: assertion,
                    index: i,
                },
            });
            subAssertResults.push(subAssertResult);
            return assertion.assert.map((subAssert, j) => {
                return {
                    assertion: subAssert,
                    assertResult: subAssertResult,
                    index: j,
                };
            });
        }
        return { assertion, assertResult: mainAssertResult, index: i };
    })
        .flat();
    await async_1.default.forEachOfLimit(asserts, ASSERTIONS_MAX_CONCURRENCY, async ({ assertion, assertResult, index }) => {
        if (assertion.type.startsWith('select-') || assertion.type === 'max-score') {
            // Select-type and max-score assertions are handled separately because they depend on multiple outputs.
            return;
        }
        const result = await runAssertion({
            prompt,
            provider,
            providerResponse,
            assertion,
            test,
            latencyMs,
            assertIndex: index,
            traceId,
        });
        assertResult.addResult({
            index,
            result,
            metric: assertion.metric,
            weight: assertion.weight,
        });
    });
    await async_1.default.forEach(subAssertResults, async (subAssertResult) => {
        const result = await subAssertResult.testResult();
        const { index, assertionSet: { metric, weight }, } = subAssertResult.parentAssertionSet;
        mainAssertResult.addResult({
            index,
            result,
            metric,
            weight,
        });
    });
    return mainAssertResult.testResult(assertScoringFunction);
}
async function runCompareAssertion(test, assertion, outputs, context) {
    (0, invariant_1.default)(typeof assertion.value === 'string', 'select-best must have a string value');
    test = (0, utils_1.getFinalTest)(test, assertion);
    const comparisonResults = await (0, matchers_1.matchesSelectBest)(assertion.value, outputs, test.options, test.vars, context);
    return comparisonResults.map((result) => ({
        ...result,
        assertion,
    }));
}
async function readAssertions(filePath) {
    try {
        const assertions = js_yaml_1.default.load(fs_1.default.readFileSync(filePath, 'utf-8'));
        if (!Array.isArray(assertions) || assertions[0]?.type === undefined) {
            throw new Error('Assertions file must be an array of assertion objects');
        }
        return assertions;
    }
    catch (err) {
        throw new Error(`Failed to read assertions from ${filePath}:\n${err}`);
    }
}
// These exports are used by the node.js package (index.ts)
exports.default = {
    runAssertion,
    runAssertions,
    matchesSimilarity: matchers_1.matchesSimilarity,
    matchesClassification: matchers_1.matchesClassification,
    matchesLlmRubric: matchers_1.matchesLlmRubric,
    matchesFactuality: matchers_1.matchesFactuality,
    matchesClosedQa: matchers_1.matchesClosedQa,
    matchesAnswerRelevance: matchers_1.matchesAnswerRelevance,
    matchesContextRecall: matchers_1.matchesContextRecall,
    matchesContextRelevance: matchers_1.matchesContextRelevance,
    matchesContextFaithfulness: matchers_1.matchesContextFaithfulness,
    matchesComparisonBoolean: matchers_1.matchesSelectBest,
    matchesModeration: matchers_1.matchesModeration,
    matchesConversationRelevance: deepeval_2.matchesConversationRelevance,
};
//# sourceMappingURL=index.js.map