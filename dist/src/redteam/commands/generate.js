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
exports.doGenerateRedteam = doGenerateRedteam;
exports.redteamGenerateCommand = redteamGenerateCommand;
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const dedent_1 = __importDefault(require("dedent"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const cache_1 = require("../../cache");
const cliState_1 = __importDefault(require("../../cliState"));
const constants_1 = require("../../constants");
const accounts_1 = require("../../globalConfig/accounts");
const cloud_1 = require("../../globalConfig/cloud");
const logger_1 = __importDefault(require("../../logger"));
const index_1 = require("../../providers/index");
const shared_1 = require("../../providers/shared");
const telemetry_1 = __importDefault(require("../../telemetry"));
const cloud_2 = require("../../util/cloud");
const load_1 = require("../../util/config/load");
const writer_1 = require("../../util/config/writer");
const generation_1 = require("../../util/generation");
const index_2 = require("../../util/index");
const promptfooCommand_1 = require("../../util/promptfooCommand");
const invariant_1 = __importDefault(require("../../util/invariant"));
const redteam_1 = require("../../validators/redteam");
const __1 = require("../");
const constants_2 = require("../constants");
const mcpTools_1 = require("../extraction/mcpTools");
const utils_1 = require("../plugins/policy/utils");
const remoteGeneration_1 = require("../remoteGeneration");
function getConfigHash(configPath) {
    const content = fs.readFileSync(configPath, 'utf8');
    return (0, crypto_1.createHash)('md5').update(`${constants_1.VERSION}:${content}`).digest('hex');
}
function createHeaderComments({ title, timestampLabel, author, cloudHost, testCasesCount, plugins, strategies, isUpdate = false, }) {
    const sectionLabel = isUpdate ? 'Changes:' : 'Test Configuration:';
    const countLabel = isUpdate
        ? `Added ${testCasesCount} new test cases`
        : `Total cases: ${testCasesCount}`;
    return [
        `===================================================================`,
        title,
        `===================================================================`,
        `${timestampLabel} ${new Date().toISOString()}`,
        author ? `Author:    ${author}` : undefined,
        cloudHost ? `Cloud:     ${cloudHost}` : `Cloud:     Not logged in`,
        ``,
        sectionLabel,
        `  ${countLabel}`,
        `  Plugins:     ${plugins.map((p) => p.id).join(', ')}`,
        `  Strategies:  ${strategies.map((s) => s.id).join(', ')}`,
        `===================================================================`,
    ].filter(Boolean);
}
async function doGenerateRedteam(options) {
    (0, index_2.setupEnv)(options.envFile);
    if (!options.cache) {
        logger_1.default.info('Cache is disabled');
        (0, cache_1.disableCache)();
    }
    let testSuite;
    let redteamConfig;
    let configPath = options.config || options.defaultConfigPath;
    const outputPath = options.output || 'redteam.yaml';
    let resolvedConfigMetadata;
    // Write a remote config to a temporary file
    if (options.configFromCloud) {
        // Write configFromCloud to a temporary file
        const filename = `redteam-generate-${Date.now()}.yaml`;
        const tmpFile = path_1.default.join('', filename);
        fs.mkdirSync(path_1.default.dirname(tmpFile), { recursive: true });
        fs.writeFileSync(tmpFile, js_yaml_1.default.dump(options.configFromCloud));
        configPath = tmpFile;
        logger_1.default.debug(`Using Promptfoo Cloud-originated config at ${tmpFile}`);
    }
    // Check for updates to the config file and decide whether to generate
    let shouldGenerate = options.force || options.configFromCloud; // Always generate for live configs
    if (!options.force &&
        !options.configFromCloud &&
        fs.existsSync(outputPath) &&
        configPath &&
        fs.existsSync(configPath)) {
        // Skip hash check for .burp files since they're not YAML
        if (!outputPath.endsWith('.burp')) {
            const redteamContent = js_yaml_1.default.load(fs.readFileSync(outputPath, 'utf8'));
            const storedHash = redteamContent.metadata?.configHash;
            const currentHash = getConfigHash(configPath);
            shouldGenerate = storedHash !== currentHash;
            if (!shouldGenerate) {
                logger_1.default.warn('No changes detected in redteam configuration. Skipping generation (use --force to generate anyway)');
                return redteamContent;
            }
        }
    }
    else {
        shouldGenerate = true;
    }
    let pluginSeverityOverrides = new Map();
    let pluginSeverityOverridesId;
    if (configPath) {
        const resolved = await (0, load_1.resolveConfigs)({
            config: [configPath],
        }, options.defaultConfig || {});
        testSuite = resolved.testSuite;
        redteamConfig = resolved.config.redteam;
        resolvedConfigMetadata = resolved.config.metadata;
        await (0, cloud_2.checkCloudPermissions)(resolved.config);
        // Warn if both tests section and redteam config are present
        if (redteamConfig && resolved.testSuite.tests && resolved.testSuite.tests.length > 0) {
            logger_1.default.warn(chalk_1.default.yellow((0, dedent_1.default) `
            ⚠️  Warning: Found both 'tests' section and 'redteam' configuration in your config file.

            The 'tests' section is ignored when generating red team tests. Red team automatically
            generates its own test cases based on the plugins and strategies you've configured.

            If you want to use custom test variables with red team, consider:
            1. Using the \`defaultTest\` key to set your vars
            2. Using environment variables with {{env.VAR_NAME}} syntax
            3. Using a transformRequest function in your target config
            4. Using multiple target configurations
          `));
        }
        try {
            // If the provider is a cloud provider, check for plugin severity overrides:
            const providerId = (0, index_1.getProviderIds)(resolved.config.providers)[0];
            if ((0, cloud_2.isCloudProvider)(providerId)) {
                const cloudId = (0, cloud_2.getCloudDatabaseId)(providerId);
                const overrides = await (0, cloud_2.getPluginSeverityOverridesFromCloud)(cloudId);
                if (overrides) {
                    pluginSeverityOverrides = new Map(Object.entries(overrides.severities));
                    pluginSeverityOverridesId = overrides.id;
                }
            }
        }
        catch (error) {
            logger_1.default.error(`Plugin severity override check failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    else if (options.purpose) {
        // There is a purpose, so we can just have a dummy test suite for standalone invocation
        testSuite = {
            prompts: [],
            providers: [],
            tests: [],
        };
    }
    else {
        logger_1.default.info(chalk_1.default.red(`\nCan't generate without configuration - run ${chalk_1.default.yellow.bold((0, promptfooCommand_1.promptfooCommand)('redteam init'))} first`));
        return null;
    }
    const startTime = Date.now();
    telemetry_1.default.record('command_used', {
        name: 'generate redteam - started',
        numPrompts: testSuite.prompts.length,
        numTestsExisting: (testSuite.tests || []).length,
        plugins: redteamConfig?.plugins?.map((p) => (typeof p === 'string' ? p : p.id)) || [],
        strategies: redteamConfig?.strategies?.map((s) => (typeof s === 'string' ? s : s.id)) || [],
        isPromptfooSampleTarget: testSuite.providers.some(shared_1.isPromptfooSampleTarget),
    });
    telemetry_1.default.record('redteam generate', {
        phase: 'started',
        numPrompts: testSuite.prompts.length,
        numTestsExisting: (testSuite.tests || []).length,
        plugins: redteamConfig?.plugins?.map((p) => (typeof p === 'string' ? p : p.id)) || [],
        strategies: redteamConfig?.strategies?.map((s) => (typeof s === 'string' ? s : s.id)) || [],
        isPromptfooSampleTarget: testSuite.providers.some(shared_1.isPromptfooSampleTarget),
    });
    let plugins = [];
    // If plugins are defined in the config file
    if (redteamConfig?.plugins && redteamConfig.plugins.length > 0) {
        plugins = redteamConfig.plugins.map((plugin) => {
            // Base configuration that all plugins will have
            const pluginConfig = {
                // Handle both string-style ('pluginName') and object-style ({ id: 'pluginName' }) plugins
                id: typeof plugin === 'string' ? plugin : plugin.id,
                // Use plugin-specific numTests if available, otherwise fall back to global settings
                numTests: (typeof plugin === 'object' && plugin.numTests) ||
                    options.numTests ||
                    redteamConfig?.numTests,
            };
            // If plugin has additional config options, include them
            if (typeof plugin === 'object') {
                if (plugin.config) {
                    pluginConfig.config = plugin.config;
                }
                if (plugin.severity) {
                    pluginConfig.severity = plugin.severity;
                }
            }
            return pluginConfig;
        });
    }
    else {
        // If no plugins specified, use default plugins
        plugins = Array.from(constants_2.DEFAULT_PLUGINS).map((plugin) => ({
            id: plugin,
            numTests: options.numTests ?? redteamConfig?.numTests,
        }));
    }
    // override plugins with command line options
    if (Array.isArray(options.plugins) && options.plugins.length > 0) {
        plugins = options.plugins.map((plugin) => {
            const pluginConfig = {
                id: plugin.id,
                numTests: plugin.numTests || options.numTests || redteamConfig?.numTests,
                ...(plugin.config && { config: plugin.config }),
            };
            return pluginConfig;
        });
    }
    (0, invariant_1.default)(plugins && Array.isArray(plugins) && plugins.length > 0, 'No plugins found');
    // Apply plugin severity overrides
    if (pluginSeverityOverrides.size > 0) {
        let intersectionCount = 0;
        plugins = plugins.map((plugin) => {
            if (pluginSeverityOverrides.has(plugin.id)) {
                intersectionCount++;
                return {
                    ...plugin,
                    severity: pluginSeverityOverrides.get(plugin.id),
                };
            }
            return plugin;
        });
        logger_1.default.info(`Applied ${intersectionCount} custom plugin severity levels`);
    }
    // Resolve policy references.
    // Each reference is an id of the policy record stored in Promptfoo Cloud; load their respective texts.
    const policyPluginsWithRefs = plugins.filter((plugin) => plugin.config?.policy && (0, utils_1.isValidPolicyObject)(plugin.config?.policy));
    if (policyPluginsWithRefs.length > 0) {
        // Load the calling user's team id; all policies must belong to the same team.
        const teamId = resolvedConfigMetadata?.teamId ??
            options?.liveRedteamConfig?.metadata?.teamId ??
            (await (0, cloud_2.resolveTeamId)()).id;
        const policiesById = await (0, generation_1.getCustomPolicies)(policyPluginsWithRefs, teamId);
        // Assign, in-place, the policy texts and severities to the plugins
        for (const policyPlugin of policyPluginsWithRefs) {
            const policyId = policyPlugin.config.policy.id;
            const policyData = policiesById.get(policyId);
            if (policyData) {
                // Set the policy details
                policyPlugin.config.policy = {
                    id: policyId,
                    name: policyData.name,
                    text: policyData.text,
                };
                // Set the plugin severity if it hasn't been set already; this allows the user to override the severity
                // on a per-config basis if necessary.
                if (policyPlugin.severity == null) {
                    policyPlugin.severity = policyData.severity;
                }
            }
        }
    }
    let strategies = redteamConfig?.strategies ?? constants_2.DEFAULT_STRATEGIES.map((s) => ({ id: s }));
    if (options.strategies) {
        strategies = options.strategies;
    }
    const strategyObjs = strategies.map((s) => typeof s === 'string' ? { id: s } : s);
    try {
        logger_1.default.debug(`plugins: ${plugins.map((p) => p.id).join(', ')}`);
        logger_1.default.debug(`strategies: ${strategyObjs.map((s) => s.id ?? s).join(', ')}`);
    }
    catch (error) {
        logger_1.default.error('Error logging plugins and strategies. One did not have a valid id.');
        logger_1.default.error(`Error details: ${error instanceof Error ? error.message : String(error)}`);
    }
    const config = {
        injectVar: redteamConfig?.injectVar || options.injectVar,
        language: redteamConfig?.language || options.language,
        maxConcurrency: options.maxConcurrency,
        numTests: redteamConfig?.numTests ?? options.numTests,
        entities: redteamConfig?.entities,
        plugins,
        provider: redteamConfig?.provider || options.provider,
        purpose: redteamConfig?.purpose ?? options.purpose,
        strategies: strategyObjs,
        delay: redteamConfig?.delay || options.delay,
        sharing: redteamConfig?.sharing || options.sharing,
        excludeTargetOutputFromAgenticAttackGeneration: redteamConfig?.excludeTargetOutputFromAgenticAttackGeneration,
        ...(redteamConfig?.testGenerationInstructions
            ? { testGenerationInstructions: redteamConfig.testGenerationInstructions }
            : {}),
    };
    const parsedConfig = redteam_1.RedteamConfigSchema.safeParse(config);
    if (!parsedConfig.success) {
        const errorMessage = (0, zod_validation_error_1.fromError)(parsedConfig.error).toString();
        throw new Error(`Invalid redteam configuration:\n${errorMessage}`);
    }
    const targetLabels = testSuite.providers
        .map((provider) => provider?.label)
        .filter(Boolean);
    // Extract MCP tools information and add to purpose
    let enhancedPurpose = parsedConfig.data.purpose || '';
    let augmentedTestGenerationInstructions = config.testGenerationInstructions ?? '';
    try {
        const mcpToolsInfo = await (0, mcpTools_1.extractMcpToolsInfo)(testSuite.providers);
        if (mcpToolsInfo) {
            enhancedPurpose = enhancedPurpose
                ? `${enhancedPurpose}\n\n${mcpToolsInfo}\n\n`
                : mcpToolsInfo;
            logger_1.default.info('Added MCP tools information to red team purpose');
            augmentedTestGenerationInstructions += `\nGenerate every test case prompt as a json string encoding the tool call and parameters, and choose a specific function to call. The specific format should be: {"tool": "function_name", "args": {...}}.`;
        }
    }
    catch (error) {
        logger_1.default.warn(`Failed to extract MCP tools information: ${error instanceof Error ? error.message : String(error)}`);
    }
    const { testCases: redteamTests, purpose, entities, injectVar: finalInjectVar, } = await (0, __1.synthesize)({
        ...parsedConfig.data,
        purpose: enhancedPurpose,
        numTests: config.numTests,
        prompts: testSuite.prompts.map((prompt) => prompt.raw),
        maxConcurrency: config.maxConcurrency,
        delay: config.delay,
        abortSignal: options.abortSignal,
        targetLabels,
        showProgressBar: options.progressBar !== false,
        testGenerationInstructions: augmentedTestGenerationInstructions,
    });
    if (redteamTests.length === 0) {
        logger_1.default.warn('No test cases generated. Please check for errors and try again.');
        return null;
    }
    const updatedRedteamConfig = {
        purpose,
        entities,
        strategies: strategyObjs || [],
        plugins: plugins || [],
        sharing: config.sharing,
    };
    let ret;
    if (options.output && options.output.endsWith('.burp')) {
        // Write in Burp Intruder compatible format
        const outputLines = redteamTests
            .map((test) => {
            const value = String(test.vars?.[finalInjectVar] ?? '');
            if (options.burpEscapeJson) {
                return encodeURIComponent(JSON.stringify(value).slice(1, -1));
            }
            return encodeURIComponent(value);
        })
            .filter((line) => line.length > 0)
            .join('\n');
        fs.writeFileSync(options.output, outputLines);
        logger_1.default.info(chalk_1.default.green(`Wrote ${redteamTests.length} test cases to ${chalk_1.default.bold(options.output)}`));
        // No need to return anything, Burp outputs are only invoked via command line.
        return {};
    }
    else if (options.output) {
        const existingYaml = configPath
            ? js_yaml_1.default.load(fs.readFileSync(configPath, 'utf8'))
            : {};
        const existingDefaultTest = typeof existingYaml.defaultTest === 'object' ? existingYaml.defaultTest : {};
        const updatedYaml = {
            ...existingYaml,
            defaultTest: {
                ...existingDefaultTest,
                metadata: {
                    ...(existingDefaultTest?.metadata || {}),
                    purpose,
                    entities,
                },
            },
            tests: redteamTests,
            redteam: { ...(existingYaml.redteam || {}), ...updatedRedteamConfig },
            metadata: {
                ...(existingYaml.metadata || {}),
                ...(configPath && redteamTests.length > 0
                    ? { configHash: getConfigHash(configPath) }
                    : { configHash: 'force-regenerate' }),
                ...(pluginSeverityOverridesId ? { pluginSeverityOverridesId } : {}),
            },
        };
        const author = (0, accounts_1.getAuthor)();
        const userEmail = (0, accounts_1.getUserEmail)();
        const cloudHost = userEmail ? cloud_1.cloudConfig.getApiHost() : null;
        const headerComments = createHeaderComments({
            title: 'REDTEAM CONFIGURATION',
            timestampLabel: 'Generated:',
            author,
            cloudHost,
            testCasesCount: redteamTests.length,
            plugins,
            strategies: strategyObjs,
        });
        ret = (0, writer_1.writePromptfooConfig)(updatedYaml, options.output, headerComments);
        (0, index_2.printBorder)();
        const relativeOutputPath = path_1.default.relative(process.cwd(), options.output);
        logger_1.default.info(`Wrote ${redteamTests.length} test cases to ${relativeOutputPath}`);
        // Provider cleanup step. Note that this should always be run,
        // since the providers are re-initialized when running the red team,
        // hence it's safe and necessary to clean-up, particularly for MCP servers
        try {
            logger_1.default.debug('Cleaning up provider');
            const provider = testSuite.providers[0];
            if (provider && typeof provider.cleanup === 'function') {
                const cleanupResult = provider.cleanup();
                if (cleanupResult instanceof Promise) {
                    await cleanupResult;
                }
            }
        }
        catch (cleanupErr) {
            logger_1.default.warn(`Error during provider cleanup: ${cleanupErr}`);
        }
        if (!options.inRedteamRun) {
            logger_1.default.info('\n' +
                chalk_1.default.green(`Run ${chalk_1.default.bold(relativeOutputPath === 'redteam.yaml'
                    ? (0, promptfooCommand_1.promptfooCommand)('redteam eval')
                    : (0, promptfooCommand_1.promptfooCommand)(`redteam eval -c ${relativeOutputPath}`))} to run the red team!`));
        }
        (0, index_2.printBorder)();
    }
    else if (options.write && configPath) {
        const existingConfig = js_yaml_1.default.load(fs.readFileSync(configPath, 'utf8'));
        const existingTests = existingConfig.tests;
        let testsArray = [];
        if (Array.isArray(existingTests)) {
            testsArray = existingTests;
        }
        else if (existingTests) {
            testsArray = [existingTests];
        }
        const existingConfigDefaultTest = typeof existingConfig.defaultTest === 'object' ? existingConfig.defaultTest : {};
        existingConfig.defaultTest = {
            ...existingConfigDefaultTest,
            metadata: {
                ...(existingConfigDefaultTest?.metadata || {}),
                purpose,
                entities,
            },
        };
        existingConfig.tests = [...testsArray, ...redteamTests];
        existingConfig.redteam = { ...(existingConfig.redteam || {}), ...updatedRedteamConfig };
        // Add the config hash to metadata
        existingConfig.metadata = {
            ...(existingConfig.metadata || {}),
            configHash: getConfigHash(configPath),
        };
        const author = (0, accounts_1.getAuthor)();
        const userEmail = (0, accounts_1.getUserEmail)();
        const cloudHost = userEmail ? cloud_1.cloudConfig.getApiHost() : null;
        const headerComments = createHeaderComments({
            title: 'REDTEAM CONFIGURATION UPDATE',
            timestampLabel: 'Updated:',
            author,
            cloudHost,
            testCasesCount: redteamTests.length,
            plugins,
            strategies: strategyObjs,
            isUpdate: true,
        });
        ret = (0, writer_1.writePromptfooConfig)(existingConfig, configPath, headerComments);
        logger_1.default.info(`\nWrote ${redteamTests.length} new test cases to ${path_1.default.relative(process.cwd(), configPath)}`);
        const command = configPath.endsWith('promptfooconfig.yaml')
            ? (0, promptfooCommand_1.promptfooCommand)('eval')
            : (0, promptfooCommand_1.promptfooCommand)(`eval -c ${path_1.default.relative(process.cwd(), configPath)}`);
        logger_1.default.info('\n' + chalk_1.default.green(`Run ${chalk_1.default.bold(`${command}`)} to run the red team!`));
    }
    else {
        const author = (0, accounts_1.getAuthor)();
        const userEmail = (0, accounts_1.getUserEmail)();
        const cloudHost = userEmail ? cloud_1.cloudConfig.getApiHost() : null;
        const headerComments = createHeaderComments({
            title: 'REDTEAM CONFIGURATION',
            timestampLabel: 'Generated:',
            author,
            cloudHost,
            testCasesCount: redteamTests.length,
            plugins,
            strategies: strategyObjs,
        });
        ret = (0, writer_1.writePromptfooConfig)({ tests: redteamTests }, 'redteam.yaml', headerComments);
    }
    telemetry_1.default.record('command_used', {
        duration: Math.round((Date.now() - startTime) / 1000),
        name: 'generate redteam',
        numPrompts: testSuite.prompts.length,
        numTestsExisting: (testSuite.tests || []).length,
        numTestsGenerated: redteamTests.length,
        plugins: plugins.map((p) => p.id),
        strategies: strategies.map((s) => (typeof s === 'string' ? s : s.id)),
        isPromptfooSampleTarget: testSuite.providers.some(shared_1.isPromptfooSampleTarget),
    });
    telemetry_1.default.record('redteam generate', {
        phase: 'completed',
        duration: Math.round((Date.now() - startTime) / 1000),
        numPrompts: testSuite.prompts.length,
        numTestsExisting: (testSuite.tests || []).length,
        numTestsGenerated: redteamTests.length,
        plugins: plugins.map((p) => p.id),
        strategies: strategies.map((s) => (typeof s === 'string' ? s : s.id)),
        isPromptfooSampleTarget: testSuite.providers.some(shared_1.isPromptfooSampleTarget),
    });
    return ret;
}
function redteamGenerateCommand(program, command, defaultConfig, defaultConfigPath) {
    program
        .command(command) // generate or redteam depending on if called from redteam or generate
        .description('Generate adversarial test cases')
        .option('-c, --config [path]', 'Path to configuration file or cloud config UUID. Defaults to promptfooconfig.yaml')
        .option('-o, --output [path]', 'Path to output file')
        .option('-w, --write', 'Write results to promptfoo configuration file', false)
        .option('-t, --target <id>', 'Cloud provider target ID to run the scan on')
        .option('--purpose <purpose>', 'Set the system purpose. If not set, the system purpose will be inferred from the config file')
        .option('--provider <provider>', `Provider to use for generating adversarial tests. Defaults to: ${constants_2.REDTEAM_MODEL}`)
        .option('--injectVar <varname>', 'Override the {{variable}} that represents user input in the prompt. Default value is inferred from your prompts')
        .option('--plugins <plugins>', (0, dedent_1.default) `Comma-separated list of plugins to use. Use 'default' to include default plugins.

        Defaults to:
        - default (includes: ${Array.from(constants_2.DEFAULT_PLUGINS).sort().join(', ')})

        Optional:
        - ${Array.from(constants_2.ADDITIONAL_PLUGINS).sort().join(', ')}
      `, (val) => val.split(',').map((x) => x.trim()))
        .option('--strategies <strategies>', (0, dedent_1.default) `Comma-separated list of strategies to use. Use 'default' to include default strategies.

        Defaults to:
        - default (includes: ${Array.from(constants_2.DEFAULT_STRATEGIES).sort().join(', ')})

        Optional:
        - ${Array.from(constants_2.ADDITIONAL_STRATEGIES).sort().join(', ')}
      `, (val) => val.split(',').map((x) => x.trim()))
        .option('-n, --num-tests <number>', 'Number of test cases to generate per plugin', (val) => (Number.isInteger(val) ? val : Number.parseInt(val, 10)), undefined)
        .option('--language <language>', 'Specify the language for generated tests. Defaults to English')
        .option('--no-cache', 'Do not read or write results to disk cache', false)
        .option('-j, --max-concurrency <number>', 'Maximum number of concurrent API calls', (val) => Number.parseInt(val, 10), defaultConfig.evaluateOptions?.maxConcurrency || 5)
        .option('--delay <number>', 'Delay in milliseconds between plugin API calls', (val) => Number.parseInt(val, 10))
        .option('--remote', 'Force remote inference wherever possible', false)
        .option('--force', 'Force generation even if no changes are detected', false)
        .option('--no-progress-bar', 'Do not show progress bar')
        .option('--burp-escape-json', 'Escape quotes in Burp payloads', false)
        .action(async (opts) => {
        // Handle cloud config with target
        if (opts.config && (0, uuid_1.validate)(opts.config)) {
            // If target is provided, it must be a valid UUID. This check is nested because the target flag is mutually inclusive with a config that's set to a
            // Cloud-defined config UUID i.e. a cloud target cannot be used with a local config.
            if (opts.target && !(0, uuid_1.validate)(opts.target)) {
                throw new Error('Invalid target ID, it must be a valid UUID');
            }
            const configObj = await (0, cloud_2.getConfigFromCloud)(opts.config, opts.target);
            // backwards compatible for old cloud servers
            if (opts.target &&
                (0, uuid_1.validate)(opts.target) &&
                (!configObj.targets || configObj.targets?.length === 0)) {
                configObj.targets = [{ id: `${constants_1.CLOUD_PROVIDER_PREFIX}${opts.target}`, config: {} }];
            }
            opts.configFromCloud = configObj;
            opts.config = undefined;
        }
        else if (opts.target) {
            logger_1.default.error(`Target ID (-t) can only be used when -c is used with a cloud config UUID. To use a cloud target inside of a config set the id of the target to ${constants_1.CLOUD_PROVIDER_PREFIX}${opts.target}.`);
            process.exitCode = 1;
            return;
        }
        if (opts.remote) {
            cliState_1.default.remote = true;
        }
        if ((0, remoteGeneration_1.shouldGenerateRemote)()) {
            logger_1.default.debug('Remote generation enabled');
        }
        else {
            logger_1.default.debug('Remote generation disabled');
        }
        try {
            let overrides = {};
            if (opts.plugins && opts.plugins.length > 0) {
                const parsed = redteam_1.RedteamConfigSchema.safeParse({
                    plugins: opts.plugins,
                    strategies: opts.strategies,
                    numTests: opts.numTests,
                });
                if (!parsed.success) {
                    logger_1.default.error('Invalid options:');
                    parsed.error.errors.forEach((err) => {
                        logger_1.default.error(`  ${err.path.join('.')}: ${err.message}`);
                    });
                    process.exit(1);
                }
                overrides = parsed.data;
            }
            if (!opts.write && !opts.output) {
                logger_1.default.info('No output file specified, writing to redteam.yaml in the current directory');
                opts.output = 'redteam.yaml';
            }
            const validatedOpts = redteam_1.RedteamGenerateOptionsSchema.parse({
                ...opts,
                ...overrides,
                defaultConfig,
                defaultConfigPath,
            });
            await doGenerateRedteam(validatedOpts);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                logger_1.default.error('Invalid options:');
                error.errors.forEach((err) => {
                    logger_1.default.error(`  ${err.path.join('.')}: ${err.message}`);
                });
            }
            else {
                // Log the stack trace, which already includes the error message
                logger_1.default.error(error instanceof Error && error.stack
                    ? error.stack
                    : `An unexpected error occurred during generation: ${error instanceof Error ? error.message : String(error)}`);
            }
            process.exit(1);
        }
    });
}
//# sourceMappingURL=generate.js.map