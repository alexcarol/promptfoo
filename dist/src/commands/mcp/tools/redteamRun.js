"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRedteamRunTool = registerRedteamRunTool;
const dedent_1 = __importDefault(require("dedent"));
const zod_1 = require("zod");
const constants_1 = require("../../../constants");
const logger_1 = __importDefault(require("../../../logger"));
const shared_1 = require("../../../redteam/shared");
const default_1 = require("../../../util/config/default");
const utils_1 = require("../utils");
/**
 * Run a redteam scan to test AI systems for vulnerabilities
 *
 * Use this tool to:
 * - Execute comprehensive security testing against AI applications
 * - Generate and run adversarial test cases automatically
 * - Test for jailbreaks, prompt injections, and harmful outputs
 * - Validate AI safety guardrails and content filters
 *
 * The redteam run performs a two-step process:
 * 1. Generates dynamic attack probes tailored to your target application
 * 2. Evaluates the generated probes against your target application
 *
 * Perfect for:
 * - Security auditing of AI systems
 * - Compliance testing and safety validation
 * - Red team exercises and penetration testing
 * - Finding vulnerabilities before deployment
 */
function registerRedteamRunTool(server) {
    server.tool('redteam_run', {
        configPath: zod_1.z
            .string()
            .optional()
            .describe((0, dedent_1.default) `
            Path to the promptfoo configuration file.
            Defaults to "promptfooconfig.yaml" in current directory.
            Example: "./my-redteam-config.yaml"
          `),
        output: zod_1.z
            .string()
            .optional()
            .describe((0, dedent_1.default) `
            Path to output file for generated tests.
            Defaults to "redteam.yaml" in the same directory as the config file.
            Example: "./my-redteam-tests.yaml"
          `),
        force: zod_1.z
            .boolean()
            .optional()
            .default(false)
            .describe('Force generation even if no changes are detected'),
        maxConcurrency: zod_1.z
            .number()
            .min(1)
            .max(10)
            .optional()
            .default(constants_1.DEFAULT_MAX_CONCURRENCY)
            .describe('Maximum number of concurrent API calls (1-10)'),
        delay: zod_1.z.number().min(0).optional().describe('Delay in milliseconds between API calls'),
        filterProviders: zod_1.z
            .string()
            .optional()
            .describe((0, dedent_1.default) `
            Only run tests with these providers (regex pattern).
            Example: "openai|anthropic" to test only OpenAI and Anthropic providers
          `),
        remote: zod_1.z
            .boolean()
            .optional()
            .default(false)
            .describe('Force remote inference wherever possible'),
        progressBar: zod_1.z
            .boolean()
            .optional()
            .default(true)
            .describe('Show progress bar during execution'),
    }, async (args) => {
        try {
            const { configPath, output, force = false, maxConcurrency = constants_1.DEFAULT_MAX_CONCURRENCY, delay, filterProviders, remote = false, progressBar = true, } = args;
            // Load default config
            try {
                await (0, default_1.loadDefaultConfig)();
            }
            catch (error) {
                return (0, utils_1.createToolResponse)('redteam_run', false, undefined, `Failed to load default config: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            // Prepare redteam options
            const options = {
                config: configPath,
                output,
                force,
                maxConcurrency,
                delay,
                filterProviders,
                remote,
                progressBar,
                cache: true,
                verbose: false,
            };
            logger_1.default.debug(`Running redteam scan with config: ${configPath || 'promptfooconfig.yaml'}`);
            // Run the redteam scan
            const startTime = Date.now();
            const evalResult = await (0, shared_1.doRedteamRun)(options);
            const endTime = Date.now();
            if (!evalResult) {
                return (0, utils_1.createToolResponse)('redteam_run', false, undefined, 'Redteam scan completed but no results were generated. This may indicate no test cases were created or no vulnerabilities were found.');
            }
            // Get summary data
            const summary = await evalResult.toEvaluateSummary();
            // Prepare detailed response
            const scanData = {
                scan: {
                    id: evalResult.id,
                    status: 'completed',
                    duration: endTime - startTime,
                    timestamp: new Date().toISOString(),
                    configPath: configPath || 'promptfooconfig.yaml',
                    outputPath: output || 'redteam.yaml',
                },
                configuration: {
                    force,
                    maxConcurrency,
                    delay,
                    filterProviders,
                    remote,
                },
                results: {
                    stats: summary.stats,
                    totalTests: summary.results.length,
                    successRate: summary.results.length > 0
                        ? ((summary.stats.successes / summary.results.length) * 100).toFixed(1) + '%'
                        : '0%',
                    failureRate: summary.results.length > 0
                        ? ((summary.stats.failures / summary.results.length) * 100).toFixed(1) + '%'
                        : '0%',
                    vulnerabilities: summary.results.filter((r) => !r.success).length,
                    findings: summary.results
                        .filter((r) => !r.success)
                        .slice(0, 10) // Show first 10 failures as sample findings
                        .map((result, index) => ({
                        index,
                        severity: result.namedScores?.severity || 'unknown',
                        plugin: result.testCase.metadata?.plugin || 'unknown',
                        description: result.testCase.description || 'No description',
                        attack: typeof result.vars?.attack === 'string'
                            ? result.vars.attack.slice(0, 100) +
                                (result.vars.attack.length > 100 ? '...' : '')
                            : 'N/A',
                        response: result.response?.output
                            ? typeof result.response.output === 'string'
                                ? result.response.output.slice(0, 200) +
                                    (result.response.output.length > 200 ? '...' : '')
                                : JSON.stringify(result.response.output).slice(0, 200)
                            : null,
                        failureReason: result.failureReason
                            ? String(result.failureReason).slice(0, 150) +
                                (String(result.failureReason).length > 150 ? '...' : '')
                            : '',
                    })),
                },
                evaluation: {
                    totalEvals: summary.results.length,
                    passedEvals: summary.stats.successes,
                    failedEvals: summary.stats.failures,
                    errorEvals: summary.stats.errors || 0,
                    hasVulnerabilities: summary.stats.failures > 0,
                    riskLevel: summary.stats.failures === 0
                        ? 'Low'
                        : summary.stats.failures / summary.results.length > 0.3
                            ? 'High'
                            : summary.stats.failures / summary.results.length > 0.1
                                ? 'Medium'
                                : 'Low',
                },
            };
            return (0, utils_1.createToolResponse)('redteam_run', true, scanData);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            logger_1.default.error(`Redteam scan failed: ${errorMessage}`);
            const errorData = {
                configuration: {
                    configPath: args.configPath || 'promptfooconfig.yaml',
                    output: args.output,
                    force: args.force,
                    maxConcurrency: args.maxConcurrency,
                },
                error: errorMessage,
                troubleshooting: {
                    commonIssues: [
                        'Configuration file not found or invalid format',
                        'No redteam configuration in config file',
                        'Provider authentication or configuration errors',
                        'Insufficient test cases generated',
                        'Network connectivity issues',
                        'API rate limiting or quota exceeded',
                    ],
                    configurationTips: [
                        'Ensure your config file has a "redteam" section with plugins and targets',
                        'Check that provider credentials are properly configured',
                        'Verify your targets/providers have proper labels',
                        'Consider running "promptfoo redteam init" to create a proper config',
                    ],
                    exampleConfig: {
                        basic: (0, dedent_1.default) `
                redteam:
                  purpose: "Test my chatbot for safety issues"
                  plugins: ["harmful", "pii", "prompt-injection"]
                targets:
                  - id: "my-model"
                    config:
                      provider: "openai:gpt-4"
              `,
                    },
                },
            };
            return (0, utils_1.createToolResponse)('redteam_run', false, errorData);
        }
    });
}
//# sourceMappingURL=redteamRun.js.map