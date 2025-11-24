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
exports.EvalCommandSchema = void 0;
exports.showRedteamProviderLabelMissingWarning = showRedteamProviderLabelMissingWarning;
exports.formatTokenUsage = formatTokenUsage;
exports.doEval = doEval;
exports.evalCommand = evalCommand;
const fs_1 = __importDefault(require("fs"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const chokidar_1 = __importDefault(require("chokidar"));
const dedent_1 = __importDefault(require("dedent"));
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const cache_1 = require("../cache");
const cliState_1 = __importDefault(require("../cliState"));
const envars_1 = require("../envars");
const constants_1 = require("../constants");
const evaluator_1 = require("../evaluator");
const accounts_1 = require("../globalConfig/accounts");
const cloud_1 = require("../globalConfig/cloud");
const logger_1 = __importStar(require("../logger"));
const migrate_1 = require("../migrate");
const eval_1 = __importDefault(require("../models/eval"));
const index_1 = require("../providers/index");
const share_1 = require("../share");
const table_1 = require("../table");
const telemetry_1 = __importDefault(require("../telemetry"));
const index_2 = require("../types/index");
const providers_1 = require("../types/providers");
const cloud_2 = require("../util/cloud");
const default_1 = require("../util/config/default");
const load_1 = require("../util/config/load");
const file_1 = require("../util/file");
const formatDuration_1 = require("../util/formatDuration");
const index_3 = require("../util/index");
const invariant_1 = __importDefault(require("../util/invariant"));
const promptfooCommand_1 = require("../util/promptfooCommand");
const tokenUsage_1 = require("../util/tokenUsage");
const tokenUsageUtils_1 = require("../util/tokenUsageUtils");
const filterProviders_1 = require("./eval/filterProviders");
const filterTests_1 = require("./eval/filterTests");
const retry_1 = require("./retry");
const share_2 = require("./share");
const email_1 = require("../types/email");
const EvalCommandSchema = index_2.CommandLineOptionsSchema.extend({
    help: zod_1.z.boolean().optional(),
    interactiveProviders: zod_1.z.boolean().optional(),
    remote: zod_1.z.boolean().optional(),
    noShare: zod_1.z.boolean().optional(),
    retryErrors: zod_1.z.boolean().optional(),
    // Allow --resume or --resume <id>
    // TODO(ian): Temporarily disabled to troubleshoot database corruption issues with SIGINT.
    // resume: z.union([z.string(), z.boolean()]).optional(),
}).partial();
exports.EvalCommandSchema = EvalCommandSchema;
function showRedteamProviderLabelMissingWarning(testSuite) {
    const hasProviderWithoutLabel = testSuite.providers.some((p) => !p.label);
    if (hasProviderWithoutLabel) {
        logger_1.default.warn((0, dedent_1.default) `
      ${chalk_1.default.bold.yellow('Warning')}: Your target (provider) does not have a label specified.

      Labels are used to uniquely identify redteam targets. Please set a meaningful and unique label (e.g., 'helpdesk-search-agent') for your targets/providers in your redteam config.

      Provider ID will be used as a fallback if no label is specified.
      `);
    }
}
/**
 * Format token usage for display in CLI output
 */
function formatTokenUsage(usage) {
    const parts = [];
    if (usage.total !== undefined) {
        parts.push(`${usage.total.toLocaleString()} total`);
    }
    if (usage.prompt !== undefined) {
        parts.push(`${usage.prompt.toLocaleString()} prompt`);
    }
    if (usage.completion !== undefined) {
        parts.push(`${usage.completion.toLocaleString()} completion`);
    }
    if (usage.cached !== undefined) {
        parts.push(`${usage.cached.toLocaleString()} cached`);
    }
    if (usage.completionDetails?.reasoning !== undefined) {
        parts.push(`${usage.completionDetails.reasoning.toLocaleString()} reasoning`);
    }
    return parts.join(' / ');
}
async function doEval(cmdObj, defaultConfig, defaultConfigPath, evaluateOptions) {
    // Phase 1: Load environment from CLI args (preserves existing behavior)
    (0, index_3.setupEnv)(cmdObj.envPath);
    let config = undefined;
    let testSuite = undefined;
    let _basePath = undefined;
    let commandLineOptions = undefined;
    const runEvaluation = async (initialization) => {
        const startTime = Date.now();
        telemetry_1.default.record('command_used', {
            name: 'eval - started',
            watch: Boolean(cmdObj.watch),
            // Only set when redteam is enabled for sure, because we don't know if config is loaded yet
            ...(Boolean(config?.redteam) && { isRedteam: true }),
        });
        if (cmdObj.write) {
            await (0, migrate_1.runDbMigrations)();
        }
        // Reload default config - because it may have changed.
        if (defaultConfigPath) {
            const configDir = path.dirname(defaultConfigPath);
            const configName = path.basename(defaultConfigPath, path.extname(defaultConfigPath));
            const { defaultConfig: newDefaultConfig } = await (0, default_1.loadDefaultConfig)(configDir, configName);
            defaultConfig = newDefaultConfig;
        }
        if (cmdObj.config !== undefined) {
            const configPaths = Array.isArray(cmdObj.config) ? cmdObj.config : [cmdObj.config];
            for (const configPath of configPaths) {
                if (fs_1.default.existsSync(configPath) && fs_1.default.statSync(configPath).isDirectory()) {
                    const { defaultConfig: dirConfig, defaultConfigPath: newConfigPath } = await (0, default_1.loadDefaultConfig)(configPath);
                    if (newConfigPath) {
                        cmdObj.config = cmdObj.config.filter((path) => path !== configPath);
                        cmdObj.config.push(newConfigPath);
                        defaultConfig = { ...defaultConfig, ...dirConfig };
                    }
                    else {
                        logger_1.default.warn(`No configuration file found in directory: ${configPath}`);
                    }
                }
            }
        }
        // Check for conflicting options
        const resumeRaw = cmdObj.resume;
        const retryErrors = cmdObj.retryErrors;
        if (resumeRaw && retryErrors) {
            logger_1.default.error(chalk_1.default.red('Cannot use --resume and --retry-errors together. Please use one or the other.'));
            process.exitCode = 1;
            return new eval_1.default({}, { persisted: false });
        }
        // If resuming, load config from existing eval and avoid CLI filters that could change indices
        let resumeEval;
        const resumeId = resumeRaw === true || resumeRaw === undefined ? 'latest' : resumeRaw;
        if (resumeRaw) {
            // Check if --no-write is set with --resume
            if (cmdObj.write === false) {
                logger_1.default.error(chalk_1.default.red('Cannot use --resume with --no-write. Resume functionality requires database persistence.'));
                process.exitCode = 1;
                return new eval_1.default({}, { persisted: false });
            }
            resumeEval = resumeId === 'latest' ? await eval_1.default.latest() : await eval_1.default.findById(resumeId);
            if (!resumeEval) {
                logger_1.default.error(`Could not find evaluation to resume: ${resumeId}`);
                process.exitCode = 1;
                return new eval_1.default({}, { persisted: false });
            }
            logger_1.default.info(chalk_1.default.cyan(`Resuming evaluation ${resumeEval.id}...`));
            // Use the saved config as our base to ensure identical test ordering
            ({
                config,
                testSuite,
                basePath: _basePath,
                commandLineOptions,
            } = await (0, load_1.resolveConfigs)({}, resumeEval.config));
            // Ensure prompts exactly match the previous run to preserve IDs and content
            if (Array.isArray(resumeEval.prompts) && resumeEval.prompts.length > 0) {
                testSuite.prompts = resumeEval.prompts.map((p) => ({
                    raw: p.raw,
                    label: p.label,
                    config: p.config,
                }));
            }
            // Mark resume mode in CLI state so evaluator can skip completed work
            cliState_1.default.resume = true;
        }
        else if (retryErrors) {
            // Check if --no-write is set with --retry-errors
            if (cmdObj.write === false) {
                logger_1.default.error(chalk_1.default.red('Cannot use --retry-errors with --no-write. Retry functionality requires database persistence.'));
                process.exitCode = 1;
                return new eval_1.default({}, { persisted: false });
            }
            logger_1.default.info('🔄 Retrying ERROR results from latest evaluation...');
            // Find the latest evaluation
            const latestEval = await eval_1.default.latest();
            if (!latestEval) {
                logger_1.default.error('No previous evaluation found to retry errors from');
                process.exitCode = 1;
                return new eval_1.default({}, { persisted: false });
            }
            // Get all ERROR result IDs
            const errorResultIds = await (0, retry_1.getErrorResultIds)(latestEval.id);
            if (errorResultIds.length === 0) {
                logger_1.default.info('✅ No ERROR results found in the latest evaluation');
                return latestEval;
            }
            logger_1.default.info(`Found ${errorResultIds.length} ERROR results to retry`);
            // Delete the ERROR results so they will be re-evaluated when we run with resume
            await (0, retry_1.deleteErrorResults)(errorResultIds);
            // Recalculate prompt metrics after deleting ERROR results to avoid double-counting
            await (0, retry_1.recalculatePromptMetrics)(latestEval);
            logger_1.default.info(`🔄 Running evaluation with resume mode to retry ${errorResultIds.length} test cases...`);
            // Set up for resume mode
            resumeEval = latestEval;
            // Use the saved config as our base to ensure identical test ordering
            ({
                config,
                testSuite,
                basePath: _basePath,
                commandLineOptions,
            } = await (0, load_1.resolveConfigs)({}, resumeEval.config));
            // Ensure prompts exactly match the previous run to preserve IDs and content
            if (Array.isArray(resumeEval.prompts) && resumeEval.prompts.length > 0) {
                testSuite.prompts = resumeEval.prompts.map((p) => ({
                    raw: p.raw,
                    label: p.label,
                    config: p.config,
                }));
            }
            // Mark resume mode in CLI state so evaluator can skip completed work
            cliState_1.default.resume = true;
        }
        else {
            ({
                config,
                testSuite,
                basePath: _basePath,
                commandLineOptions,
            } = await (0, load_1.resolveConfigs)(cmdObj, defaultConfig));
        }
        // Phase 2: Load environment from config files if not already set via CLI
        if (!cmdObj.envPath && commandLineOptions?.envPath) {
            logger_1.default.debug(`Loading additional environment from config: ${commandLineOptions.envPath}`);
            (0, index_3.setupEnv)(commandLineOptions.envPath);
        }
        // Check if config has redteam section but no test cases
        if (config.redteam &&
            (!testSuite.tests || testSuite.tests.length === 0) &&
            (!testSuite.scenarios || testSuite.scenarios.length === 0)) {
            logger_1.default.warn(chalk_1.default.yellow((0, dedent_1.default) `
        Warning: Config file has a redteam section but no test cases.
        Did you mean to run ${chalk_1.default.bold('promptfoo redteam generate')} instead?
        `));
        }
        // TODO(faizan): Crazy condition to see when we run the example redteam config.
        // Remove this once we have a better way to track this.
        if (config.redteam &&
            Array.isArray(config.providers) &&
            config.providers.length > 0 &&
            typeof config.providers[0] === 'object' &&
            config.providers[0].id === 'http') {
            const maybeUrl = config.providers[0]?.config?.url;
            if (typeof maybeUrl === 'string' && maybeUrl.includes('promptfoo.app')) {
                telemetry_1.default.record('feature_used', {
                    feature: 'redteam_run_with_example',
                });
            }
        }
        // Ensure evaluateOptions from the config file are applied
        if (config.evaluateOptions) {
            evaluateOptions = {
                ...evaluateOptions,
                ...config.evaluateOptions,
            };
        }
        // Resolve runtime options. If resuming, prefer persisted options stored with the eval.
        let repeat;
        let cache;
        let maxConcurrency;
        let delay;
        if (resumeRaw) {
            const persisted = (resumeEval?.runtimeOptions ||
                config.evaluateOptions ||
                {});
            repeat =
                Number.isSafeInteger(persisted.repeat || 0) && persisted.repeat > 0
                    ? persisted.repeat
                    : 1;
            cache = persisted.cache ?? true;
            maxConcurrency = persisted.maxConcurrency ?? constants_1.DEFAULT_MAX_CONCURRENCY;
            delay = persisted.delay ?? 0;
        }
        else {
            // Misc settings with proper CLI vs config priority
            // CLI values explicitly provided by user should override config, but defaults should not
            const iterations = cmdObj.repeat ?? evaluateOptions.repeat ?? Number.NaN;
            repeat = Number.isSafeInteger(iterations) && iterations > 0 ? iterations : 1;
            cache = cmdObj.cache ?? evaluateOptions.cache ?? true;
            maxConcurrency =
                cmdObj.maxConcurrency ?? evaluateOptions.maxConcurrency ?? constants_1.DEFAULT_MAX_CONCURRENCY;
            delay = cmdObj.delay ?? evaluateOptions.delay ?? 0;
        }
        if (cache === false || repeat > 1) {
            logger_1.default.info('Cache is disabled.');
            (0, cache_1.disableCache)();
        }
        if (delay > 0) {
            maxConcurrency = 1;
            logger_1.default.info(`Running at concurrency=1 because ${delay}ms delay was requested between API calls`);
        }
        // Apply filtering only when not resuming, to preserve test indices
        if (!resumeEval) {
            const filterOptions = {
                failing: cmdObj.filterFailing,
                errorsOnly: cmdObj.filterErrorsOnly,
                firstN: cmdObj.filterFirstN,
                metadata: cmdObj.filterMetadata,
                pattern: cmdObj.filterPattern,
                sample: cmdObj.filterSample,
            };
            testSuite.tests = await (0, filterTests_1.filterTests)(testSuite, filterOptions);
        }
        if (config.redteam &&
            config.redteam.plugins &&
            config.redteam.plugins.length > 0 &&
            testSuite.tests &&
            testSuite.tests.length > 0) {
            // Prompt for email until we get a valid one
            // Other status problems apart from bad emails (like 'exceeded_limit') just log and exit
            let hasValidEmail = false;
            while (!hasValidEmail) {
                const { emailNeedsValidation } = await (0, accounts_1.promptForEmailUnverified)();
                const res = await (0, accounts_1.checkEmailStatusAndMaybeExit)({ validate: emailNeedsValidation });
                hasValidEmail = res === email_1.EMAIL_OK_STATUS;
            }
        }
        if (!resumeEval) {
            testSuite.providers = (0, filterProviders_1.filterProviders)(testSuite.providers, cmdObj.filterProviders || cmdObj.filterTargets);
        }
        await (0, cloud_2.checkCloudPermissions)(config);
        const options = {
            ...evaluateOptions,
            showProgressBar: (0, logger_1.getLogLevel)() === 'debug'
                ? false
                : cmdObj.progressBar !== undefined
                    ? cmdObj.progressBar !== false
                    : evaluateOptions.showProgressBar !== undefined
                        ? evaluateOptions.showProgressBar
                        : true,
            repeat,
            delay: !Number.isNaN(delay) && delay > 0 ? delay : undefined,
            maxConcurrency,
            cache,
        };
        if (!resumeEval && cmdObj.grader) {
            if (typeof testSuite.defaultTest === 'string') {
                testSuite.defaultTest = {};
            }
            testSuite.defaultTest = testSuite.defaultTest || {};
            testSuite.defaultTest.options = testSuite.defaultTest.options || {};
            testSuite.defaultTest.options.provider = await (0, index_1.loadApiProvider)(cmdObj.grader);
        }
        if (!resumeEval && cmdObj.var) {
            if (typeof testSuite.defaultTest === 'string') {
                testSuite.defaultTest = {};
            }
            testSuite.defaultTest = testSuite.defaultTest || {};
            testSuite.defaultTest.vars = { ...testSuite.defaultTest.vars, ...cmdObj.var };
        }
        if (!resumeEval && (cmdObj.generateSuggestions ?? commandLineOptions?.generateSuggestions)) {
            options.generateSuggestions = true;
        }
        // load scenarios or tests from an external file
        if (testSuite.scenarios) {
            testSuite.scenarios = (await (0, file_1.maybeLoadFromExternalFile)(testSuite.scenarios));
            // Flatten the scenarios array in case glob patterns were used
            testSuite.scenarios = testSuite.scenarios.flat();
        }
        for (const scenario of testSuite.scenarios || []) {
            if (scenario.tests) {
                scenario.tests = await (0, file_1.maybeLoadFromExternalFile)(scenario.tests);
            }
        }
        const testSuiteSchema = index_2.TestSuiteSchema.safeParse(testSuite);
        if (!testSuiteSchema.success) {
            const validationError = (0, zod_validation_error_1.fromError)(testSuiteSchema.error);
            logger_1.default.warn(chalk_1.default.yellow((0, dedent_1.default) `
      TestSuite Schema Validation Error:

        ${validationError.toString()}

      Please review your promptfooconfig.yaml configuration.`));
        }
        // Create or load eval record
        const evalRecord = resumeEval
            ? resumeEval
            : cmdObj.write
                ? await eval_1.default.create(config, testSuite.prompts, { runtimeOptions: options })
                : new eval_1.default(config, { runtimeOptions: options });
        // Graceful pause support via Ctrl+C (only when writing to database)
        // TODO(ian): Temporarily disabled to troubleshoot database corruption issues with SIGINT.
        /*
        const abortController = new AbortController();
        const previousAbortSignal = evaluateOptions.abortSignal;
        evaluateOptions.abortSignal = previousAbortSignal
          ? AbortSignal.any([previousAbortSignal, abortController.signal])
          : abortController.signal;
        let sigintHandler: ((...args: any[]) => void) | undefined;
        let paused = false;
    
        // Only set up pause/resume handler when writing to database
        if (cmdObj.write !== false) {
          sigintHandler = () => {
            if (paused) {
              // Second Ctrl+C: force exit
              logger.warn('Force exiting...');
              process.exit(130);
            }
            paused = true;
            logger.info(
              chalk.yellow('Pausing evaluation... Saving progress. Press Ctrl+C again to force exit.'),
            );
            abortController.abort();
          };
          process.once('SIGINT', sigintHandler);
        }
        */
        // Run the evaluation!!!!!!
        const ret = await (0, evaluator_1.evaluate)(testSuite, evalRecord, {
            ...options,
            eventSource: 'cli',
            abortSignal: evaluateOptions.abortSignal,
            isRedteam: Boolean(config.redteam),
        });
        // Cleanup signal handler
        /*
        if (sigintHandler) {
          process.removeListener('SIGINT', sigintHandler);
        }
        // Clear resume flag after run completes
        cliState.resume = false;
    
        // If paused, print minimal guidance and skip the rest of the reporting
        if (paused && cmdObj.write !== false) {
          printBorder();
          logger.info(`${chalk.yellow('⏸')} Evaluation paused. ID: ${chalk.cyan(evalRecord.id)}`);
          logger.info(
            `» Resume with: ${chalk.greenBright.bold('promptfoo eval --resume ' + evalRecord.id)}`,
          );
          printBorder();
          return ret;
        }
          */
        // Clear results from memory to avoid memory issues
        evalRecord.clearResults();
        // Determine sharing with explicit precedence handling
        let wantsToShare;
        if (cmdObj.share === false ||
            cmdObj.noShare === true ||
            (0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_SHARING')) {
            // Explicit disable via CLI or env var takes highest priority
            wantsToShare = false;
        }
        else if (cmdObj.share === true) {
            // Explicit enable via CLI
            wantsToShare = true;
        }
        else if (commandLineOptions?.share !== undefined) {
            // Config file commandLineOptions.share (can be true or false)
            wantsToShare = commandLineOptions.share;
        }
        else if (config.sharing !== undefined) {
            // Config file sharing setting (can be false, true, or object)
            wantsToShare = Boolean(config.sharing);
        }
        else {
            // Default: auto-share when cloud is enabled
            wantsToShare = cloud_1.cloudConfig.isEnabled();
        }
        const canShareEval = (0, share_1.isSharingEnabled)(evalRecord);
        logger_1.default.debug(`Wants to share: ${wantsToShare}`);
        logger_1.default.debug(`Can share eval: ${canShareEval}`);
        const shareableUrl = wantsToShare && canShareEval ? await (0, share_1.createShareableUrl)(evalRecord) : null;
        logger_1.default.debug(`Shareable URL: ${shareableUrl}`);
        if (shareableUrl) {
            evalRecord.shared = true;
        }
        let successes = 0;
        let failures = 0;
        let errors = 0;
        const tokenUsage = (0, tokenUsageUtils_1.createEmptyTokenUsage)();
        // Calculate our total successes and failures
        for (const prompt of evalRecord.prompts) {
            if (prompt.metrics?.testPassCount) {
                successes += prompt.metrics.testPassCount;
            }
            if (prompt.metrics?.testFailCount) {
                failures += prompt.metrics.testFailCount;
            }
            if (prompt.metrics?.testErrorCount) {
                errors += prompt.metrics.testErrorCount;
            }
            (0, tokenUsageUtils_1.accumulateTokenUsage)(tokenUsage, prompt.metrics?.tokenUsage);
        }
        const totalTests = successes + failures + errors;
        const passRate = (successes / totalTests) * 100;
        if (cmdObj.table && (0, logger_1.getLogLevel)() !== 'debug' && totalTests < 500) {
            const table = await evalRecord.getTable();
            // Output CLI table
            const outputTable = (0, table_1.generateTable)(table);
            logger_1.default.info('\n' + outputTable.toString());
            if (table.body.length > 25) {
                const rowsLeft = table.body.length - 25;
                logger_1.default.info(`... ${rowsLeft} more row${rowsLeft === 1 ? '' : 's'} not shown ...\n`);
            }
        }
        else if (failures !== 0) {
            logger_1.default.debug(`At least one evaluation failure occurred. This might be caused by the underlying call to the provider, or a test failure. Context: \n${JSON.stringify(evalRecord.prompts)}`);
        }
        if (totalTests >= 500) {
            logger_1.default.info('Skipping table output because there are more than 500 tests.');
        }
        const { outputPath } = config;
        // We're removing JSONL from paths since we already wrote to that during the evaluation
        const paths = (Array.isArray(outputPath) ? outputPath : [outputPath]).filter((p) => typeof p === 'string' && p.length > 0 && !p.endsWith('.jsonl'));
        if (paths.length) {
            await (0, index_3.writeMultipleOutputs)(paths, evalRecord, shareableUrl);
            logger_1.default.info(chalk_1.default.yellow(`Writing output to ${paths.join(', ')}`));
        }
        (0, index_3.printBorder)();
        if (cmdObj.write) {
            if (shareableUrl) {
                logger_1.default.info(`${chalk_1.default.green('✔')} Evaluation complete: ${shareableUrl}`);
            }
            else if (wantsToShare && !(0, share_1.isSharingEnabled)(evalRecord)) {
                (0, share_2.notCloudEnabledShareInstructions)();
            }
            else {
                logger_1.default.info(`${chalk_1.default.green('✔')} Evaluation complete. ID: ${chalk_1.default.cyan(evalRecord.id)}\n`);
                logger_1.default.info(`» Run ${chalk_1.default.greenBright.bold('promptfoo view')} to use the local web viewer`);
                if (cloud_1.cloudConfig.isEnabled()) {
                    logger_1.default.info(`» Run ${chalk_1.default.greenBright.bold('promptfoo share')} to create a shareable URL`);
                }
                else {
                    logger_1.default.info(`» Do you want to share this with your team? Sign up for free at ${chalk_1.default.greenBright.bold('https://promptfoo.app')}`);
                }
                logger_1.default.info(`» This project needs your feedback. What's one thing we can improve? ${chalk_1.default.greenBright.bold('https://promptfoo.dev/feedback')}`);
            }
        }
        else {
            logger_1.default.info(`${chalk_1.default.green('✔')} Evaluation complete`);
        }
        (0, index_3.printBorder)();
        // Format and display duration
        const duration = Math.round((Date.now() - startTime) / 1000);
        const durationDisplay = (0, formatDuration_1.formatDuration)(duration);
        const isRedteam = Boolean(config.redteam);
        const tracker = tokenUsage_1.TokenUsageTracker.getInstance();
        // Handle token usage display
        if (tokenUsage.total > 0 || (tokenUsage.prompt || 0) + (tokenUsage.completion || 0) > 0) {
            const combinedTotal = (tokenUsage.prompt || 0) + (tokenUsage.completion || 0);
            const evalTokens = {
                prompt: tokenUsage.prompt || 0,
                completion: tokenUsage.completion || 0,
                total: tokenUsage.total || combinedTotal,
                cached: tokenUsage.cached || 0,
                completionDetails: tokenUsage.completionDetails || {
                    reasoning: 0,
                    acceptedPrediction: 0,
                    rejectedPrediction: 0,
                },
            };
            logger_1.default.info(chalk_1.default.bold('Token Usage Summary:'));
            if (isRedteam) {
                logger_1.default.info(`  ${chalk_1.default.cyan('Probes:')} ${chalk_1.default.white.bold(tokenUsage.numRequests.toLocaleString())}`);
            }
            // Eval tokens
            logger_1.default.info(`\n  ${chalk_1.default.yellow.bold('Evaluation:')}`);
            logger_1.default.info(`    ${chalk_1.default.gray('Total:')} ${chalk_1.default.white(evalTokens.total.toLocaleString())}`);
            logger_1.default.info(`    ${chalk_1.default.gray('Prompt:')} ${chalk_1.default.white(evalTokens.prompt.toLocaleString())}`);
            logger_1.default.info(`    ${chalk_1.default.gray('Completion:')} ${chalk_1.default.white(evalTokens.completion.toLocaleString())}`);
            if (evalTokens.cached > 0) {
                logger_1.default.info(`    ${chalk_1.default.gray('Cached:')} ${chalk_1.default.green(evalTokens.cached.toLocaleString())}`);
            }
            if (evalTokens.completionDetails?.reasoning && evalTokens.completionDetails.reasoning > 0) {
                logger_1.default.info(`    ${chalk_1.default.gray('Reasoning:')} ${chalk_1.default.white(evalTokens.completionDetails.reasoning.toLocaleString())}`);
            }
            // Provider breakdown
            const providerIds = tracker.getProviderIds();
            if (providerIds.length > 1) {
                logger_1.default.info(`\n  ${chalk_1.default.cyan.bold('Provider Breakdown:')}`);
                // Sort providers by total token usage (descending)
                const sortedProviders = providerIds
                    .map((id) => ({ id, usage: tracker.getProviderUsage(id) }))
                    .sort((a, b) => (b.usage.total || 0) - (a.usage.total || 0));
                for (const { id, usage } of sortedProviders) {
                    if ((usage.total || 0) > 0 || (usage.prompt || 0) + (usage.completion || 0) > 0) {
                        const displayTotal = usage.total || (usage.prompt || 0) + (usage.completion || 0);
                        // Extract just the provider ID part (remove class name in parentheses)
                        const displayId = id.includes(' (') ? id.substring(0, id.indexOf(' (')) : id;
                        logger_1.default.info(`    ${chalk_1.default.gray(displayId + ':')} ${chalk_1.default.white(displayTotal.toLocaleString())} (${usage.numRequests} requests)`);
                        // Show breakdown if there are individual components
                        if (usage.prompt || usage.completion || usage.cached) {
                            const details = [];
                            if (usage.prompt) {
                                details.push(`${usage.prompt.toLocaleString()} prompt`);
                            }
                            if (usage.completion) {
                                details.push(`${usage.completion.toLocaleString()} completion`);
                            }
                            if (usage.cached) {
                                details.push(`${usage.cached.toLocaleString()} cached`);
                            }
                            if (usage.completionDetails?.reasoning) {
                                details.push(`${usage.completionDetails.reasoning.toLocaleString()} reasoning`);
                            }
                            if (details.length > 0) {
                                logger_1.default.info(`      ${chalk_1.default.dim('(' + details.join(', ') + ')')}`);
                            }
                        }
                    }
                }
            }
            // Grading tokens
            if (tokenUsage.assertions && tokenUsage.assertions.total && tokenUsage.assertions.total > 0) {
                logger_1.default.info(`\n  ${chalk_1.default.magenta.bold('Grading:')}`);
                logger_1.default.info(`    ${chalk_1.default.gray('Total:')} ${chalk_1.default.white(tokenUsage.assertions.total.toLocaleString())}`);
                if (tokenUsage.assertions.prompt) {
                    logger_1.default.info(`    ${chalk_1.default.gray('Prompt:')} ${chalk_1.default.white(tokenUsage.assertions.prompt.toLocaleString())}`);
                }
                if (tokenUsage.assertions.completion) {
                    logger_1.default.info(`    ${chalk_1.default.gray('Completion:')} ${chalk_1.default.white(tokenUsage.assertions.completion.toLocaleString())}`);
                }
                if (tokenUsage.assertions.cached && tokenUsage.assertions.cached > 0) {
                    logger_1.default.info(`    ${chalk_1.default.gray('Cached:')} ${chalk_1.default.green(tokenUsage.assertions.cached.toLocaleString())}`);
                }
                if (tokenUsage.assertions.completionDetails?.reasoning &&
                    tokenUsage.assertions.completionDetails.reasoning > 0) {
                    logger_1.default.info(`    ${chalk_1.default.gray('Reasoning:')} ${chalk_1.default.white(tokenUsage.assertions.completionDetails.reasoning.toLocaleString())}`);
                }
            }
            // Grand total
            const grandTotal = evalTokens.total + (tokenUsage.assertions.total || 0);
            logger_1.default.info(`\n  ${chalk_1.default.blue.bold('Grand Total:')} ${chalk_1.default.white.bold(grandTotal.toLocaleString())} tokens`);
            (0, index_3.printBorder)();
        }
        logger_1.default.info(chalk_1.default.gray(`Duration: ${durationDisplay} (concurrency: ${maxConcurrency})`));
        logger_1.default.info(chalk_1.default.green.bold(`Successes: ${successes}`));
        logger_1.default.info(chalk_1.default.red.bold(`Failures: ${failures}`));
        if (!Number.isNaN(errors)) {
            logger_1.default.info(chalk_1.default.red.bold(`Errors: ${errors}`));
        }
        if (!Number.isNaN(passRate)) {
            logger_1.default.info(chalk_1.default.blue.bold(`Pass Rate: ${passRate.toFixed(2)}%`));
        }
        (0, index_3.printBorder)();
        telemetry_1.default.record('command_used', {
            name: 'eval',
            watch: Boolean(cmdObj.watch),
            duration: Math.round((Date.now() - startTime) / 1000),
            isRedteam,
        });
        if (cmdObj.watch && !resumeEval) {
            if (initialization) {
                const configPaths = (cmdObj.config || [defaultConfigPath]).filter(Boolean);
                if (!configPaths.length) {
                    logger_1.default.error('Could not locate config file(s) to watch');
                    process.exitCode = 1;
                    return ret;
                }
                const basePath = path.dirname(configPaths[0]);
                const promptPaths = Array.isArray(config.prompts)
                    ? config.prompts
                        .map((p) => {
                        if (typeof p === 'string' && p.startsWith('file://')) {
                            return path.resolve(basePath, p.slice('file://'.length));
                        }
                        else if (typeof p === 'object' && p.id && p.id.startsWith('file://')) {
                            return path.resolve(basePath, p.id.slice('file://'.length));
                        }
                        return null;
                    })
                        .filter(Boolean)
                    : [];
                const providerPaths = Array.isArray(config.providers)
                    ? config.providers
                        .map((p) => typeof p === 'string' && p.startsWith('file://')
                        ? path.resolve(basePath, p.slice('file://'.length))
                        : null)
                        .filter(Boolean)
                    : [];
                const varPaths = Array.isArray(config.tests)
                    ? config.tests
                        .flatMap((t) => {
                        if (typeof t === 'string' && t.startsWith('file://')) {
                            return path.resolve(basePath, t.slice('file://'.length));
                        }
                        else if (typeof t !== 'string' && 'vars' in t && t.vars) {
                            return Object.values(t.vars).flatMap((v) => {
                                if (typeof v === 'string' && v.startsWith('file://')) {
                                    return path.resolve(basePath, v.slice('file://'.length));
                                }
                                return [];
                            });
                        }
                        return [];
                    })
                        .filter(Boolean)
                    : [];
                const watchPaths = Array.from(new Set([...configPaths, ...promptPaths, ...providerPaths, ...varPaths]));
                const watcher = chokidar_1.default.watch(watchPaths, { ignored: /^\./, persistent: true });
                watcher
                    .on('change', async (path) => {
                    (0, index_3.printBorder)();
                    logger_1.default.info(`File change detected: ${path}`);
                    (0, index_3.printBorder)();
                    (0, default_1.clearConfigCache)();
                    await runEvaluation();
                })
                    .on('error', (error) => logger_1.default.error(`Watcher error: ${error}`))
                    .on('ready', () => watchPaths.forEach((watchPath) => logger_1.default.info(`Watching for file changes on ${watchPath} ...`)));
            }
        }
        else {
            const passRateThreshold = (0, envars_1.getEnvFloat)('PROMPTFOO_PASS_RATE_THRESHOLD', 100);
            const failedTestExitCode = (0, envars_1.getEnvInt)('PROMPTFOO_FAILED_TEST_EXIT_CODE', 100);
            if (passRate < (Number.isFinite(passRateThreshold) ? passRateThreshold : 100)) {
                if ((0, envars_1.getEnvFloat)('PROMPTFOO_PASS_RATE_THRESHOLD') !== undefined) {
                    logger_1.default.info(chalk_1.default.white(`Pass rate ${chalk_1.default.red.bold(passRate.toFixed(2))}${chalk_1.default.red('%')} is below the threshold of ${chalk_1.default.red.bold(passRateThreshold)}${chalk_1.default.red('%')}`));
                }
                process.exitCode = Number.isSafeInteger(failedTestExitCode) ? failedTestExitCode : 100;
                return ret;
            }
        }
        if (testSuite.redteam) {
            showRedteamProviderLabelMissingWarning(testSuite);
        }
        // Clean up any WebSocket connections
        if (testSuite.providers.length > 0) {
            for (const provider of testSuite.providers) {
                if ((0, providers_1.isApiProvider)(provider)) {
                    const cleanup = provider?.cleanup?.();
                    if (cleanup instanceof Promise) {
                        await cleanup;
                    }
                }
            }
        }
        return ret;
    };
    return await runEvaluation(true /* initialization */);
}
function evalCommand(program, defaultConfig, defaultConfigPath) {
    const evaluateOptions = {};
    if (defaultConfig.evaluateOptions) {
        evaluateOptions.generateSuggestions = defaultConfig.evaluateOptions.generateSuggestions;
        evaluateOptions.maxConcurrency = defaultConfig.evaluateOptions.maxConcurrency;
        evaluateOptions.showProgressBar = defaultConfig.evaluateOptions.showProgressBar;
    }
    const evalCmd = program
        .command('eval')
        .description('Evaluate prompts')
        // Core configuration
        .option('-c, --config <paths...>', 'Path to configuration file. Automatically loads promptfooconfig.yaml')
        // Input sources
        .option('-a, --assertions <path>', 'Path to assertions file')
        .option('-p, --prompts <paths...>', 'Paths to prompt files (.txt)')
        .option('-r, --providers <name or path...>', 'One of: openai:chat, openai:completion, openai:<model name>, or path to custom API caller module')
        .option('-t, --tests <path>', 'Path to CSV with test cases')
        .option('-v, --vars <path>', 'Path to CSV with test cases (alias for --tests)', defaultConfig?.commandLineOptions?.vars)
        .option('--model-outputs <path>', 'Path to JSON containing list of LLM output strings')
        // Prompt modification
        .option('--prompt-prefix <path>', 'This prefix is prepended to every prompt', typeof defaultConfig.defaultTest === 'object'
        ? defaultConfig.defaultTest?.options?.prefix
        : undefined)
        .option('--prompt-suffix <path>', 'This suffix is appended to every prompt.', typeof defaultConfig.defaultTest === 'object'
        ? defaultConfig.defaultTest?.options?.suffix
        : undefined)
        .option('--var <key=value>', 'Set a variable in key=value format', (value, previous) => {
        const [key, val] = value.split('=');
        if (!key || val === undefined) {
            throw new Error('--var must be specified in key=value format.');
        }
        return { ...previous, [key]: val };
    }, {})
        // Execution control
        .option('-j, --max-concurrency <number>', `Maximum number of concurrent API calls (default: ${constants_1.DEFAULT_MAX_CONCURRENCY})`)
        .option('--repeat <number>', 'Number of times to run each test (default: 1)')
        .option('--delay <number>', 'Delay between each test (in milliseconds) (default: 0)')
        .option('--no-cache', 'Do not read or write results to disk cache', defaultConfig?.commandLineOptions?.cache ?? defaultConfig?.evaluateOptions?.cache)
        .option('--remote', 'Force remote inference wherever possible (used for red teams)', false)
        // Filtering and subset selection
        .option('-n, --filter-first-n <number>', 'Only run the first N tests')
        .option('--filter-pattern <pattern>', 'Only run tests whose description matches the regular expression pattern')
        .option('--filter-providers, --filter-targets <providers>', 'Only run tests with these providers (regex match)')
        .option('--filter-sample <number>', 'Only run a random sample of N tests')
        .option('--filter-failing <path or id>', 'Path to json output file or eval ID to filter failing tests from')
        .option('--filter-errors-only <path or id>', 'Path to json output file or eval ID to filter error tests from')
        .option('--filter-metadata <key=value>', 'Only run tests whose metadata matches the key=value pair (e.g. --filter-metadata pluginId=debug-access)')
        // Output configuration
        .option('-o, --output <paths...>', 'Path to output file (csv, txt, json, yaml, yml, html), default is no output file')
        .option('--table', 'Output table in CLI', defaultConfig?.commandLineOptions?.table ?? true)
        .option('--no-table', 'Do not output table in CLI', defaultConfig?.commandLineOptions?.table)
        .option('--table-cell-max-length <number>', 'Truncate console table cells to this length', '250')
        .option('--share', 'Create a shareable URL', defaultConfig?.commandLineOptions?.share)
        .option('--no-share', 'Do not share, this overrides the config file')
        .option('--resume [evalId]', 'Resume a paused/incomplete evaluation. Defaults to latest when omitted')
        .option('--retry-errors', 'Retry all ERROR results from the latest evaluation')
        .option('--no-write', 'Do not write results to promptfoo directory', defaultConfig?.commandLineOptions?.write)
        // Additional features
        .option('--grader <provider>', 'Model that will grade outputs', defaultConfig?.commandLineOptions?.grader)
        .option('--suggest-prompts <number>', 'Generate N new prompts and append them to the prompt list')
        .option('-w, --watch', 'Watch for changes in config and re-run')
        // Miscellaneous
        .option('--description <description>', 'Description of the eval run')
        .option('--no-progress-bar', 'Do not show progress bar')
        .action(async (opts, command) => {
        let validatedOpts;
        try {
            validatedOpts = EvalCommandSchema.parse(opts);
        }
        catch (err) {
            const validationError = (0, zod_validation_error_1.fromError)(err);
            logger_1.default.error((0, dedent_1.default) `
        Invalid command options:
        ${validationError.toString()}
        `);
            process.exitCode = 1;
            return;
        }
        if (command.args.length > 0) {
            if (command.args[0] === 'help') {
                evalCmd.help();
                return;
            }
            logger_1.default.warn(`Unknown command: ${command.args[0]}. Did you mean -c ${command.args[0]}?`);
        }
        if (validatedOpts.help) {
            evalCmd.help();
            return;
        }
        if (validatedOpts.interactiveProviders) {
            const runCommand = (0, promptfooCommand_1.promptfooCommand)('eval');
            logger_1.default.warn(chalk_1.default.yellow((0, dedent_1.default) `
          Warning: The --interactive-providers option has been removed.

          Instead, use -j 1 to run evaluations with a concurrency of 1:
          ${chalk_1.default.green(`${runCommand} -j 1`)}
        `));
            process.exitCode = 2;
            return;
        }
        if (validatedOpts.remote) {
            cliState_1.default.remote = true;
        }
        for (const maybeFilePath of validatedOpts.output ?? []) {
            const { data: extension } = index_2.OutputFileExtension.safeParse(maybeFilePath.split('.').pop()?.toLowerCase());
            (0, invariant_1.default)(extension, `Unsupported output file format: ${maybeFilePath}. Please use one of: ${index_2.OutputFileExtension.options.join(', ')}.`);
        }
        doEval(validatedOpts, defaultConfig, defaultConfigPath, evaluateOptions);
    });
    return evalCmd;
}
//# sourceMappingURL=eval.js.map