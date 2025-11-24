"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRunAssertionTool = registerRunAssertionTool;
const dedent_1 = __importDefault(require("dedent"));
const zod_1 = require("zod");
const index_1 = require("../../../assertions/index");
const logger_1 = __importDefault(require("../../../logger"));
const utils_1 = require("../utils");
/**
 * Run an assertion against an LLM output to test grading logic
 *
 * Use this tool to:
 * - Test assertion configurations before using them in evaluations
 * - Debug why specific outputs are passing or failing assertions
 * - Validate grading logic for custom assertions
 * - Experiment with different assertion parameters
 *
 * Supports all promptfoo assertion types including:
 * - Content checks: contains, equals, regex, starts-with
 * - LLM-graded: llm-rubric, factuality, answer-relevance
 * - Format validation: is-json, is-xml, is-sql
 * - Quality metrics: similarity, perplexity, cost, latency
 * - Custom: javascript, python, webhook assertions
 */
function registerRunAssertionTool(server) {
    server.tool('run_assertion', {
        output: zod_1.z.string().describe((0, dedent_1.default) `
            The LLM output to test the assertion against.
            Example: "Paris is the capital of France"
          `),
        assertion: zod_1.z
            .object({
            type: zod_1.z.string().describe('Assertion type (e.g., "contains", "llm-rubric", "equals")'),
            value: zod_1.z.any().optional().describe('Expected value or criteria for the assertion'),
            threshold: zod_1.z.number().optional().describe('Score threshold for pass/fail (0-1)'),
            weight: zod_1.z.number().optional().describe('Weight of this assertion (default: 1)'),
            metric: zod_1.z.string().optional().describe('Name this assertion as a metric'),
            provider: zod_1.z.any().optional().describe('LLM provider config for model-graded assertions'),
            transform: zod_1.z.string().optional().describe('Transform the output before assertion'),
            config: zod_1.z.record(zod_1.z.any()).optional().describe('Additional assertion configuration'),
        })
            .describe((0, dedent_1.default) `
            The assertion configuration to run.
            Example: {"type": "contains", "value": "Paris"}
          `),
        prompt: zod_1.z
            .string()
            .optional()
            .describe((0, dedent_1.default) `
            The original prompt used to generate the output.
            Optional but helpful for context-aware assertions.
          `),
        vars: zod_1.z
            .record(zod_1.z.any())
            .optional()
            .describe((0, dedent_1.default) `
            Variables used in the prompt.
            Example: {"city": "Paris", "country": "France"}
          `),
        latencyMs: zod_1.z
            .number()
            .optional()
            .describe('Response latency in milliseconds for latency assertions'),
    }, async (args) => {
        try {
            const { output, assertion, prompt, vars = {}, latencyMs } = args;
            // Create a minimal test case for the assertion
            const testCase = {
                vars,
                assert: [assertion],
            };
            // Create a mock provider response
            const providerResponse = {
                output,
                tokenUsage: {},
                cost: 0,
                cached: false,
            };
            logger_1.default.debug(`Running assertion ${assertion.type} on output: ${output.slice(0, 100)}...`);
            // Run the assertions using the proper runAssertions function
            const result = await (0, index_1.runAssertions)({
                prompt,
                provider: undefined, // We don't have a provider in this context
                providerResponse,
                test: testCase,
                latencyMs,
            });
            const assertionData = {
                assertion: {
                    type: assertion.type,
                    value: assertion.value,
                    threshold: assertion.threshold,
                    weight: assertion.weight || 1,
                    metric: assertion.metric,
                },
                result: {
                    pass: result.pass,
                    score: result.score,
                    reason: result.reason,
                    namedScores: result.namedScores || {},
                    tokensUsed: result.tokensUsed || null,
                    componentResults: result.componentResults || [],
                },
                input: {
                    output: output.slice(0, 200) + (output.length > 200 ? '...' : ''),
                    prompt: prompt?.slice(0, 100) + (prompt && prompt.length > 100 ? '...' : ''),
                    vars: Object.keys(vars).length > 0 ? vars : null,
                    latencyMs,
                },
                evaluation: {
                    passed: result.pass,
                    scoreDescription: result.score === 1
                        ? 'Perfect'
                        : result.score >= 0.8
                            ? 'Good'
                            : result.score >= 0.5
                                ? 'Moderate'
                                : 'Poor',
                    hasNamedMetrics: Object.keys(result.namedScores || {}).length > 0,
                    usedTokens: result.tokensUsed ? result.tokensUsed.total || 0 : 0,
                },
            };
            return (0, utils_1.createToolResponse)('run_assertion', true, assertionData);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            logger_1.default.error(`Assertion execution failed: ${errorMessage}`);
            const errorData = {
                assertion: {
                    type: args.assertion?.type || 'unknown',
                    value: args.assertion?.value,
                },
                error: errorMessage,
                input: {
                    output: args.output?.slice(0, 100) + (args.output && args.output.length > 100 ? '...' : ''),
                    prompt: args.prompt?.slice(0, 100) + (args.prompt && args.prompt.length > 100 ? '...' : ''),
                },
                troubleshooting: {
                    commonIssues: [
                        'Invalid assertion type - check spelling and supported types',
                        'Missing required assertion value or configuration',
                        'Provider required for model-graded assertions (llm-rubric, factuality, etc.)',
                        'Transform script errors - check syntax and file paths',
                    ],
                    supportedTypes: [
                        'contains',
                        'equals',
                        'regex',
                        'starts-with',
                        'llm-rubric',
                        'factuality',
                        'answer-relevance',
                        'is-json',
                        'is-xml',
                        'is-sql',
                        'similar',
                        'javascript',
                        'python',
                        'webhook',
                    ],
                },
            };
            return (0, utils_1.createToolResponse)('run_assertion', false, errorData);
        }
    });
}
//# sourceMappingURL=runAssertion.js.map