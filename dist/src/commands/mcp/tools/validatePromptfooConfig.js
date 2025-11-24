"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerValidatePromptfooConfigTool = registerValidatePromptfooConfigTool;
const dedent_1 = __importDefault(require("dedent"));
const zod_validation_error_1 = require("zod-validation-error");
const zod_1 = require("zod");
const index_1 = require("../../../types/index");
const default_1 = require("../../../util/config/default");
const load_1 = require("../../../util/config/load");
const utils_1 = require("../lib/utils");
/**
 * Tool to validate promptfoo configuration files
 */
function registerValidatePromptfooConfigTool(server) {
    server.tool('validate_promptfoo_config', {
        configPaths: zod_1.z
            .array(zod_1.z.string().min(1, 'Config path cannot be empty'))
            .optional()
            .describe((0, dedent_1.default) `
            Paths to configuration files to validate.
            Examples: ["promptfooconfig.yaml"], ["config/eval.yaml", "config/prompts.yaml"].
            Defaults to "promptfooconfig.yaml" in current directory.
          `),
    }, async (args) => {
        const { configPaths } = args;
        try {
            // Load default configuration
            let defaultConfig;
            try {
                const result = await (0, default_1.loadDefaultConfig)();
                defaultConfig = result.defaultConfig;
            }
            catch (error) {
                return (0, utils_1.createToolResponse)('validate_promptfoo_config', false, {
                    originalError: error instanceof Error ? error.message : 'Unknown error',
                    suggestion: 'Run "npm install -g promptfoo" or check your installation',
                }, 'Failed to load default configuration. Ensure promptfoo is properly installed.');
            }
            // Use the same logic as the validate command
            const configPathsArray = configPaths || (process.cwd() ? ['promptfooconfig.yaml'] : undefined);
            const { config, testSuite } = await (0, load_1.resolveConfigs)({ config: configPathsArray }, defaultConfig);
            const validationResults = {
                isValid: true,
                errors: [],
                warnings: [],
            };
            // Validate config schema
            const configParse = index_1.UnifiedConfigSchema.safeParse(config);
            if (configParse.success) {
                validationResults.config = config;
            }
            else {
                const formattedError = (0, zod_validation_error_1.fromError)(configParse.error).message;
                validationResults.errors.push(`Configuration validation error: ${formattedError}`);
                validationResults.isValid = false;
            }
            // Validate test suite schema
            const suiteParse = index_1.TestSuiteSchema.safeParse(testSuite);
            if (suiteParse.success) {
                validationResults.testSuite = testSuite;
            }
            else {
                const formattedError = (0, zod_validation_error_1.fromError)(suiteParse.error).message;
                validationResults.errors.push(`Test suite validation error: ${formattedError}`);
                validationResults.isValid = false;
            }
            // Add helpful warnings and analysis
            if (configParse.success) {
                const analysis = analyzeConfiguration(config);
                validationResults.warnings.push(...analysis.warnings);
                // Add summary information
                const summary = {
                    promptCount: analysis.promptCount,
                    providerCount: analysis.providerCount,
                    testCount: analysis.testCount,
                    totalEvaluations: analysis.totalEvaluations,
                    hasAssertions: analysis.hasAssertions,
                    configFiles: configPathsArray,
                };
                return (0, utils_1.createToolResponse)('validate_promptfoo_config', true, {
                    ...validationResults,
                    summary,
                });
            }
            return validationResults.isValid
                ? (0, utils_1.createToolResponse)('validate_promptfoo_config', true, validationResults)
                : (0, utils_1.createToolResponse)('validate_promptfoo_config', false, validationResults, 'Configuration validation failed');
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('ENOENT')) {
                return (0, utils_1.createToolResponse)('validate_promptfoo_config', false, {
                    providedPaths: configPaths,
                    suggestion: 'Run "promptfoo init" to create a new configuration file',
                }, 'Configuration file not found. Check the file path or create a new config.');
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return (0, utils_1.createToolResponse)('validate_promptfoo_config', false, undefined, `Failed to validate configuration: ${errorMessage}`);
        }
    });
}
function analyzeConfiguration(config) {
    const warnings = [];
    const promptCount = Array.isArray(config.prompts)
        ? config.prompts.length
        : config.prompts
            ? 1
            : 0;
    const providerCount = Array.isArray(config.providers)
        ? config.providers.length
        : config.providers
            ? 1
            : 0;
    const testCount = Array.isArray(config.tests) ? config.tests.length : config.tests ? 1 : 0;
    if (promptCount === 0) {
        warnings.push('No prompts defined - add prompts to evaluate model responses');
    }
    if (providerCount === 0) {
        warnings.push('No providers defined - add providers like "openai:gpt-4" to run evals');
    }
    if (testCount === 0) {
        warnings.push('No test cases defined - add test cases to validate model behavior');
    }
    const hasAssertions = config.tests &&
        Array.isArray(config.tests) &&
        config.tests.some((test) => test.assert && test.assert.length > 0);
    if (testCount > 0 && !hasAssertions) {
        warnings.push('No assertions defined in test cases - add assertions to validate outputs');
    }
    const totalEvaluations = promptCount * providerCount * testCount;
    if (promptCount > 0 && providerCount > 0 && testCount > 0) {
        warnings.push(`Configuration ready: ${promptCount} prompts × ${providerCount} providers × ${testCount} tests = ${totalEvaluations} total evals`);
    }
    return {
        warnings,
        promptCount,
        providerCount,
        testCount,
        totalEvaluations,
        hasAssertions,
    };
}
//# sourceMappingURL=validatePromptfooConfig.js.map