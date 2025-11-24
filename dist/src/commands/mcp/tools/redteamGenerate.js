"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRedteamGenerateTool = registerRedteamGenerateTool;
const dedent_1 = __importDefault(require("dedent"));
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const constants_1 = require("../../../constants");
const logger_1 = __importDefault(require("../../../logger"));
const generate_1 = require("../../../redteam/commands/generate");
const constants_2 = require("../../../redteam/constants");
const default_1 = require("../../../util/config/default");
const redteam_1 = require("../../../validators/redteam");
const utils_1 = require("../utils");
/**
 * Generate adversarial test cases for redteam security testing
 *
 * Use this tool to:
 * - Create targeted attack probes for AI vulnerability testing
 * - Generate test cases for specific security plugins and strategies
 * - Create custom adversarial examples for your application domain
 * - Build comprehensive test suites for AI safety validation
 *
 * Features:
 * - Multiple attack plugins (harmful content, PII, prompt injection, etc.)
 * - Configurable attack strategies and generation parameters
 * - Support for custom test generation instructions
 * - Output in various formats (YAML, Burp Suite, etc.)
 *
 * Perfect for:
 * - Building custom redteam test suites
 * - Generating domain-specific attack vectors
 * - Creating test cases for specific compliance requirements
 * - Preparing for security audits and penetration testing
 */
function registerRedteamGenerateTool(server) {
    server.tool('redteam_generate', {
        configPath: zod_1.z
            .string()
            .optional()
            .describe((0, dedent_1.default) `
            Path to the promptfoo configuration file.
            Defaults to "promptfooconfig.yaml" in current directory.
            Example: "./my-config.yaml"
          `),
        output: zod_1.z
            .string()
            .optional()
            .describe((0, dedent_1.default) `
            Path to output file for generated tests.
            Defaults to "redteam.yaml" in current directory.
            Example: "./my-redteam-tests.yaml"
          `),
        purpose: zod_1.z
            .string()
            .optional()
            .describe((0, dedent_1.default) `
            Describe the purpose/domain of your AI system.
            This helps generate more targeted attack vectors.
            Example: "Customer service chatbot for banking"
          `),
        plugins: zod_1.z
            .array(zod_1.z.string())
            .optional()
            .describe((0, dedent_1.default) `
            List of redteam plugins to use for generating attacks.
            
            Default plugins: ${Array.from(constants_2.DEFAULT_PLUGINS).sort().join(', ')}
            
            Additional plugins: ${Array.from(constants_2.ADDITIONAL_PLUGINS).sort().join(', ')}
            
            Example: ["harmful", "pii", "prompt-injection"]
          `),
        strategies: zod_1.z
            .array(zod_1.z.string())
            .optional()
            .describe((0, dedent_1.default) `
            List of attack strategies to use.
            
            Default strategies: ${Array.from(constants_2.DEFAULT_STRATEGIES).sort().join(', ')}
            
            Additional strategies: ${Array.from(constants_2.ADDITIONAL_STRATEGIES).sort().join(', ')}
            
            Example: ["jailbreak", "prompt-injection"]
          `),
        numTests: zod_1.z
            .number()
            .min(1)
            .max(100)
            .optional()
            .describe('Number of test cases to generate per plugin (1-100)'),
        maxConcurrency: zod_1.z
            .number()
            .min(1)
            .max(10)
            .optional()
            .default(constants_1.DEFAULT_MAX_CONCURRENCY)
            .describe('Maximum number of concurrent API calls (1-10)'),
        delay: zod_1.z.number().min(0).optional().describe('Delay in milliseconds between API calls'),
        language: zod_1.z
            .string()
            .optional()
            .describe((0, dedent_1.default) `
            Language for generated test cases.
            Example: "English", "Spanish", "French"
          `),
        provider: zod_1.z
            .string()
            .optional()
            .describe((0, dedent_1.default) `
            Provider to use for generating adversarial tests.
            Defaults to: ${constants_2.REDTEAM_MODEL}
            Example: "openai:gpt-4-turbo"
          `),
        force: zod_1.z
            .boolean()
            .optional()
            .default(false)
            .describe('Force generation even if no changes are detected'),
        write: zod_1.z
            .boolean()
            .optional()
            .default(false)
            .describe('Write results to the promptfoo configuration file instead of separate output'),
        remote: zod_1.z
            .boolean()
            .optional()
            .default(false)
            .describe('Force remote inference wherever possible'),
        progressBar: zod_1.z
            .boolean()
            .optional()
            .default(true)
            .describe('Show progress bar during generation'),
    }, async (args) => {
        try {
            const { configPath, output, purpose, plugins, strategies, numTests, maxConcurrency = constants_1.DEFAULT_MAX_CONCURRENCY, delay, language, provider, force = false, write = false, remote = false, progressBar = true, } = args;
            // Load default config
            let defaultConfig;
            let defaultConfigPath;
            try {
                const result = await (0, default_1.loadDefaultConfig)();
                defaultConfig = result.defaultConfig;
                defaultConfigPath = result.defaultConfigPath;
            }
            catch (error) {
                return (0, utils_1.createToolResponse)('redteam_generate', false, undefined, `Failed to load default config: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            // Prepare generation options
            const options = {
                config: configPath,
                output: output || (write ? undefined : 'redteam.yaml'),
                purpose,
                plugins: plugins?.map((p) => ({ id: p })),
                strategies,
                numTests,
                maxConcurrency,
                delay,
                language,
                provider,
                force,
                write,
                remote,
                progressBar,
                cache: true,
                defaultConfig,
                defaultConfigPath,
            };
            // Validate options
            const optionsParse = redteam_1.RedteamGenerateOptionsSchema.safeParse(options);
            if (!optionsParse.success) {
                return (0, utils_1.createToolResponse)('redteam_generate', false, undefined, `Options validation error: ${(0, zod_validation_error_1.fromError)(optionsParse.error).message}`);
            }
            logger_1.default.debug(`Generating redteam tests with config: ${configPath || 'promptfooconfig.yaml'}`);
            // Generate test cases
            const startTime = Date.now();
            const result = await (0, generate_1.doGenerateRedteam)(optionsParse.data);
            const endTime = Date.now();
            if (!result) {
                return (0, utils_1.createToolResponse)('redteam_generate', false, undefined, 'Test case generation completed but no results were returned. This may indicate configuration issues or that no test cases could be generated.');
            }
            // Prepare detailed response
            const generationData = {
                generation: {
                    status: 'completed',
                    duration: endTime - startTime,
                    timestamp: new Date().toISOString(),
                    configPath: configPath || 'promptfooconfig.yaml',
                    outputPath: output || (write ? 'written to config' : 'redteam.yaml'),
                },
                configuration: {
                    purpose: result.defaultTest &&
                        typeof result.defaultTest === 'object' &&
                        'metadata' in result.defaultTest
                        ? result.defaultTest.metadata?.purpose
                        : purpose,
                    plugins: plugins || Array.from(constants_2.DEFAULT_PLUGINS).map((p) => p),
                    strategies: strategies || Array.from(constants_2.DEFAULT_STRATEGIES).map((s) => s),
                    numTests,
                    maxConcurrency,
                    delay,
                    language,
                    provider: provider || constants_2.REDTEAM_MODEL,
                    force,
                    write,
                    remote,
                },
                results: {
                    totalTestCases: Array.isArray(result.tests) ? result.tests.length : 0,
                    testCasesByPlugin: Array.isArray(result.tests)
                        ? result.tests.reduce((acc, test) => {
                            const plugin = test.metadata?.plugin || 'unknown';
                            acc[plugin] = (acc[plugin] || 0) + 1;
                            return acc;
                        }, {})
                        : {},
                    sampleTestCases: Array.isArray(result.tests)
                        ? result.tests.slice(0, 5).map((test, index) => ({
                            index,
                            description: test.description || 'No description',
                            plugin: test.metadata?.plugin || 'unknown',
                            strategy: test.metadata?.strategy || 'unknown',
                            vars: test.vars ? Object.keys(test.vars).slice(0, 3) : [],
                            attack: test.vars?.attack
                                ? typeof test.vars.attack === 'string'
                                    ? test.vars.attack.slice(0, 100) +
                                        (test.vars.attack.length > 100 ? '...' : '')
                                    : JSON.stringify(test.vars.attack).slice(0, 100)
                                : 'N/A',
                        }))
                        : [],
                },
                metadata: {
                    purpose: result.defaultTest &&
                        typeof result.defaultTest === 'object' &&
                        'metadata' in result.defaultTest
                        ? result.defaultTest.metadata?.purpose
                        : purpose,
                    entities: result.defaultTest &&
                        typeof result.defaultTest === 'object' &&
                        'metadata' in result.defaultTest
                        ? result.defaultTest.metadata?.entities || []
                        : [],
                    generatedAt: new Date().toISOString(),
                    language,
                    provider: provider || constants_2.REDTEAM_MODEL,
                },
                nextSteps: {
                    runEvaluation: write
                        ? 'Run "redteam_run" to execute the generated tests'
                        : `Run "redteam_run" with output: "${output || 'redteam.yaml'}" to execute the tests`,
                    viewConfig: write
                        ? `Generated tests were added to your config file: ${configPath || 'promptfooconfig.yaml'}`
                        : `Generated tests were written to: ${output || 'redteam.yaml'}`,
                },
            };
            return (0, utils_1.createToolResponse)('redteam_generate', true, generationData);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            logger_1.default.error(`Redteam generation failed: ${errorMessage}`);
            const errorData = {
                configuration: {
                    configPath: args.configPath || 'promptfooconfig.yaml',
                    output: args.output,
                    purpose: args.purpose,
                    plugins: args.plugins,
                    numTests: args.numTests,
                },
                error: errorMessage,
                troubleshooting: {
                    commonIssues: [
                        'Configuration file not found or invalid format',
                        'Invalid plugin or strategy names specified',
                        'Provider authentication or configuration errors',
                        'Network connectivity issues',
                        'Insufficient permissions to write output files',
                    ],
                    configurationTips: [
                        'Ensure your config file exists or use standalone generation with "purpose"',
                        'Use valid plugin names from the supported list',
                        'Check that provider credentials are properly configured',
                        'Verify write permissions for output directory',
                    ],
                    supportedPlugins: Array.from(constants_2.DEFAULT_PLUGINS)
                        .concat(Array.from(constants_2.ADDITIONAL_PLUGINS))
                        .sort(),
                    supportedStrategies: [...Array.from(constants_2.DEFAULT_STRATEGIES), ...Array.from(constants_2.ADDITIONAL_STRATEGIES)].sort(),
                    exampleUsage: {
                        basic: '{"purpose": "Test my chatbot", "plugins": ["harmful", "pii"]}',
                        withOutput: '{"purpose": "Banking chatbot", "output": "./bank-redteam.yaml", "numTests": 20}',
                        writeToConfig: '{"configPath": "./my-config.yaml", "write": true, "force": true}',
                    },
                },
            };
            return (0, utils_1.createToolResponse)('redteam_generate', false, errorData);
        }
    });
}
//# sourceMappingURL=redteamGenerate.js.map