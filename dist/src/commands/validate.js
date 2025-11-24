"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.doValidate = doValidate;
exports.doValidateTarget = doValidateTarget;
exports.validateCommand = validateCommand;
const chalk_1 = __importDefault(require("chalk"));
const dedent_1 = __importDefault(require("dedent"));
const uuid_1 = require("uuid");
const zod_validation_error_1 = require("zod-validation-error");
const cache_1 = require("../cache");
const logger_1 = __importDefault(require("../logger"));
const index_1 = require("../providers/index");
const telemetry_1 = __importDefault(require("../telemetry"));
const index_2 = require("../types/index");
const cloud_1 = require("../util/cloud");
const load_1 = require("../util/config/load");
const httpProvider_1 = require("../util/httpProvider");
const index_3 = require("../util/index");
const testProvider_1 = require("../validators/testProvider");
/**
 * Test basic connectivity for a provider (Non-http)
 */
async function testBasicConnectivity(provider) {
    const providerId = typeof provider.id === 'function' ? provider.id() : provider.id;
    logger_1.default.info(`\n${chalk_1.default.bold(`Testing provider: ${providerId}`)}`);
    try {
        // Make a simple test call
        const result = await provider.callApi('Hello, world!', {
            debug: true,
            prompt: { raw: 'Hello, world!', label: 'Hello, world!' },
            vars: {},
        });
        if (result.error) {
            logger_1.default.warn(chalk_1.default.yellow(`✗ Connectivity test failed`));
            logger_1.default.warn(`  ${result.error}`);
        }
        else if (result.output) {
            logger_1.default.info(chalk_1.default.green(`✓ Connectivity test passed`));
            logger_1.default.info(`  Response: ${JSON.stringify(result.output).substring(0, 100)}...`);
        }
        else {
            logger_1.default.warn(chalk_1.default.yellow(`✗ Connectivity test returned no output`));
        }
    }
    catch (err) {
        logger_1.default.warn(chalk_1.default.yellow(`✗ Connectivity test failed`));
        logger_1.default.warn(`  Error: ${err instanceof Error ? err.message : String(err)}`);
    }
}
/**
 * Display detailed test results with suggestions
 */
function displayTestResult(result, testName) {
    if (result.success) {
        logger_1.default.info(chalk_1.default.green(`✓ ${testName} passed`));
        if (result.message && result.message !== 'Test completed') {
            logger_1.default.info(`  ${result.message}`);
        }
        if (result.sessionId) {
            logger_1.default.info(`  Session ID: ${result.sessionId}`);
        }
    }
    else {
        logger_1.default.warn(chalk_1.default.yellow(`✗ ${testName} failed`));
        if (result.message) {
            logger_1.default.warn(`  ${result.message}`);
        }
        if (result.error && result.error !== result.message) {
            logger_1.default.warn(`  ${result.error}`);
        }
        if (result.reason) {
            logger_1.default.warn(`  Reason: ${result.reason}`);
        }
    }
    // Display API analysis feedback if available (from testAnalyzerResponse)
    if (result.analysis) {
        const analysis = result.analysis;
        if (analysis.changes_needed) {
            logger_1.default.warn(chalk_1.default.yellow('\n  Configuration issues detected:'));
            if (analysis.changes_needed_reason) {
                logger_1.default.warn(`  ${analysis.changes_needed_reason}`);
            }
            if (analysis.changes_needed_suggestions &&
                Array.isArray(analysis.changes_needed_suggestions)) {
                logger_1.default.warn(chalk_1.default.yellow('\n  Suggestions:'));
                analysis.changes_needed_suggestions.forEach((suggestion, idx) => {
                    logger_1.default.warn(`  ${idx + 1}. ${suggestion}`);
                });
            }
        }
    }
    // Show transformed request if available
    if (result.transformedRequest) {
        logger_1.default.info(chalk_1.default.dim('\n  Request details:'));
        if (result.transformedRequest.url) {
            logger_1.default.info(chalk_1.default.dim(`  URL: ${result.transformedRequest.url}`));
        }
        if (result.transformedRequest.method) {
            logger_1.default.info(chalk_1.default.dim(`  Method: ${result.transformedRequest.method}`));
        }
    }
}
/**
 * Run comprehensive tests for HTTP providers
 */
async function testHttpProvider(provider) {
    const providerId = typeof provider.id === 'function' ? provider.id() : provider.id;
    logger_1.default.info(`\n${chalk_1.default.bold(`Testing HTTP provider: ${providerId}`)}`);
    // Test 1: Connectivity
    logger_1.default.info('Testing basic connectivity...');
    const connectivityResult = await (0, testProvider_1.testProviderConnectivity)(provider);
    displayTestResult(connectivityResult, 'Connectivity test');
    // Test 2: Session management (only if connectivity test passed and target is stateful)
    if (connectivityResult.success) {
        // Check if the provider is explicitly configured as non-stateful
        if (provider.config?.stateful === false) {
            logger_1.default.info(chalk_1.default.dim('\nSkipping session management test (target is not stateful)'));
        }
        else {
            logger_1.default.info('\nTesting session management...');
            const sessionResult = await (0, testProvider_1.testProviderSession)(provider, undefined, {
                skipConfigValidation: true,
            });
            displayTestResult(sessionResult, 'Session test');
        }
    }
    else {
        logger_1.default.info(chalk_1.default.dim('\nSkipping session management test (connectivity test failed)'));
    }
}
/**
 * Load provider(s) for testing - either a specific target or all providers from config
 */
async function loadProvidersForTesting(target, config) {
    if (target) {
        // Load a specific target
        let provider;
        // Cloud target
        if ((0, uuid_1.validate)(target)) {
            const providerOptions = await (0, cloud_1.getProviderFromCloud)(target);
            const patchedOptions = (0, httpProvider_1.isHttpProvider)(providerOptions)
                ? (0, httpProvider_1.patchHttpConfigForValidation)(providerOptions)
                : providerOptions;
            provider = await (0, index_1.loadApiProvider)(patchedOptions.id, {
                options: patchedOptions,
            });
        }
        else {
            // Check if it's an HTTP provider and patch config if needed
            const isHttp = target.startsWith('http:') || target.startsWith('https:');
            if (isHttp) {
                provider = await (0, index_1.loadApiProvider)(target, {
                    options: {
                        config: {
                            maxRetries: 1,
                            headers: {
                                'x-promptfoo-silent': 'true',
                            },
                        },
                    },
                });
            }
            else {
                provider = await (0, index_1.loadApiProvider)(target);
            }
        }
        return [provider];
    }
    else {
        // Load all providers from config
        if (!config.providers || (Array.isArray(config.providers) && config.providers.length === 0)) {
            logger_1.default.info('No providers found in configuration to test.');
            return [];
        }
        // Patch HTTP providers before loading (only if providers is an array)
        const patchedProviders = Array.isArray(config.providers)
            ? config.providers.map((providerOption) => (0, httpProvider_1.isHttpProvider)(providerOption)
                ? (0, httpProvider_1.patchHttpConfigForValidation)(providerOption)
                : providerOption)
            : config.providers;
        return (0, index_1.loadApiProviders)(patchedProviders, {
            env: config.env,
        });
    }
}
/**
 * Run provider tests for a specific target or all providers in config
 */
async function runProviderTests(target, config) {
    logger_1.default.info('\nRunning provider tests...');
    try {
        // Load provider(s)
        const providers = await loadProvidersForTesting(target, config);
        if (providers.length === 0) {
            return;
        }
        // Run tests on all loaded providers
        for (const provider of providers) {
            try {
                // Use detailed HTTP tests for HTTP providers, basic connectivity for others
                if ((0, httpProvider_1.isHttpProvider)(provider)) {
                    await testHttpProvider(provider);
                }
                else {
                    await testBasicConnectivity(provider);
                }
            }
            catch (err) {
                const providerId = typeof provider.id === 'function' ? provider.id() : provider.id;
                logger_1.default.warn(chalk_1.default.yellow(`Failed to test provider ${providerId}: ${err instanceof Error ? err.message : String(err)}`));
            }
        }
    }
    catch (err) {
        // Don't fail validation on test errors, just warn
        logger_1.default.warn(chalk_1.default.yellow(`Provider tests failed: ${err instanceof Error ? err.message : String(err)}`));
    }
}
async function doValidate(opts, defaultConfig, defaultConfigPath) {
    (0, index_3.setupEnv)(opts.envPath);
    const configPaths = opts.config || (defaultConfigPath ? [defaultConfigPath] : undefined);
    try {
        const { config, testSuite } = await (0, load_1.resolveConfigs)({ ...opts, config: configPaths }, defaultConfig);
        const configParse = index_2.UnifiedConfigSchema.safeParse(config);
        if (!configParse.success) {
            logger_1.default.error((0, dedent_1.default) `Configuration validation error:
Config file path(s): ${Array.isArray(configPaths) ? configPaths.join(', ') : (configPaths ?? 'N/A')}
${(0, zod_validation_error_1.fromError)(configParse.error).message}`);
            process.exitCode = 1;
            return;
        }
        const suiteParse = index_2.TestSuiteSchema.safeParse(testSuite);
        if (!suiteParse.success) {
            logger_1.default.error((0, dedent_1.default) `Test suite validation error:\n${(0, zod_validation_error_1.fromError)(suiteParse.error).message}`);
            process.exitCode = 1;
            return;
        }
        logger_1.default.info(chalk_1.default.green('Configuration is valid.'));
    }
    catch (err) {
        logger_1.default.error(`Failed to validate configuration: ${err instanceof Error ? err.message : err}`);
        process.exitCode = 1;
    }
}
/**
 * Validate a specific target (provider)
 */
async function doValidateTarget(opts, defaultConfig) {
    (0, index_3.setupEnv)(opts.envPath);
    (0, cache_1.disableCache)();
    if (!opts.target && !opts.config) {
        logger_1.default.error('Please specify either -t <provider-id> or -c <config-path>');
        process.exitCode = 1;
        return;
    }
    // If -c is provided, load config and test all providers
    if (opts.config) {
        logger_1.default.info(`Loading configuration from ${opts.config}...`);
        try {
            const { config } = await (0, load_1.resolveConfigs)({ config: [opts.config], envPath: opts.envPath }, defaultConfig);
            await runProviderTests(undefined, config);
        }
        catch (err) {
            logger_1.default.error(`Failed to load or test providers from config: ${err instanceof Error ? err.message : String(err)}`);
            process.exitCode = 1;
        }
    }
    else if (opts.target) {
        // Test a specific provider ID or cloud UUID
        logger_1.default.info('Testing provider...');
        try {
            await runProviderTests(opts.target, {});
        }
        catch (err) {
            logger_1.default.error(`Failed to test provider: ${err instanceof Error ? err.message : String(err)}`);
            process.exitCode = 1;
        }
    }
}
function validateCommand(program, defaultConfig, defaultConfigPath) {
    const validateCmd = program
        .command('validate')
        .description('Validate configuration files and test providers');
    // Add 'config' subcommand
    validateCmd
        .command('config', { isDefault: true })
        .description('Validate a promptfoo configuration file')
        .option('-c, --config <paths...>', 'Path to configuration file. Automatically loads promptfooconfig.yaml')
        .action(async (opts) => {
        telemetry_1.default.record('command_used', { name: 'validate' });
        await doValidate(opts, defaultConfig, defaultConfigPath);
    });
    // Add 'target' subcommand
    validateCmd
        .command('target')
        .description('Test providers from a config file or a specific provider')
        .option('-t, --target <id>', 'Provider ID or cloud UUID to test')
        .option('-c, --config <path>', 'Path to configuration file to test all providers')
        .action(async (opts) => {
        telemetry_1.default.record('command_used', { name: 'validate_target' });
        await doValidateTarget(opts, defaultConfig);
    });
}
//# sourceMappingURL=validate.js.map