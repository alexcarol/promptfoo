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
exports.ArgsSchema = exports.TargetPurposeDiscoveryTaskResponseSchema = exports.TargetPurposeDiscoveryRequestSchema = void 0;
exports.normalizeTargetPurposeDiscoveryResult = normalizeTargetPurposeDiscoveryResult;
exports.doTargetPurposeDiscovery = doTargetPurposeDiscovery;
exports.discoverCommand = discoverCommand;
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const cli_progress_1 = __importDefault(require("cli-progress"));
const dedent_1 = __importDefault(require("dedent"));
const zod_1 = require("zod");
const constants_1 = require("../../constants");
const evaluatorHelpers_1 = require("../../evaluatorHelpers");
const accounts_1 = require("../../globalConfig/accounts");
const cloud_1 = require("../../globalConfig/cloud");
const logger_1 = __importDefault(require("../../logger"));
const index_1 = require("../../providers/index");
const http_1 = require("../../providers/http");
const telemetry_1 = __importDefault(require("../../telemetry"));
const cloud_2 = require("../../util/cloud");
const load_1 = require("../../util/config/load");
const index_2 = require("../../util/fetch/index");
const invariant_1 = __importDefault(require("../../util/invariant"));
const remoteGeneration_1 = require("../remoteGeneration");
// ========================================================
// Schemas
// ========================================================
const TargetPurposeDiscoveryStateSchema = zod_1.z.object({
    currentQuestionIndex: zod_1.z.number(),
    answers: zod_1.z.array(zod_1.z.any()),
});
exports.TargetPurposeDiscoveryRequestSchema = zod_1.z.object({
    state: TargetPurposeDiscoveryStateSchema,
    task: zod_1.z.literal('target-purpose-discovery'),
    version: zod_1.z.string(),
    email: zod_1.z.string().optional().nullable(),
});
const TargetPurposeDiscoveryResultSchema = zod_1.z.object({
    purpose: zod_1.z.string().nullable(),
    limitations: zod_1.z.string().nullable(),
    user: zod_1.z.string().nullable(),
    tools: zod_1.z.array(zod_1.z
        .object({
        name: zod_1.z.string(),
        description: zod_1.z.string(),
        arguments: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            description: zod_1.z.string(),
            type: zod_1.z.string(),
        })),
    })
        .nullable()),
});
exports.TargetPurposeDiscoveryTaskResponseSchema = zod_1.z.object({
    done: zod_1.z.boolean(),
    question: zod_1.z.string().optional(),
    purpose: TargetPurposeDiscoveryResultSchema.optional(),
    state: TargetPurposeDiscoveryStateSchema,
    error: zod_1.z.string().optional(),
});
exports.ArgsSchema = zod_1.z
    .object({
    config: zod_1.z.string().optional(),
    target: zod_1.z.string().optional(),
})
    // Config and target are mutually exclusive:
    .refine((data) => !(data.config && data.target), {
    message: 'Cannot specify both config and target!',
    path: ['config', 'target'],
});
// ========================================================
// Constants
// ========================================================
const DEFAULT_TURN_COUNT = 5;
const MAX_TURN_COUNT = 10;
const LOG_PREFIX = '[Target Discovery Agent]';
const COMMAND = 'discover';
// ========================================================
// Utils
// ========================================================
// Helper function to check if a string value should be considered null
const isNullLike = (value) => {
    return !value || value === 'null' || value.trim() === '';
};
// Helper function to clean tools array
const cleanTools = (tools) => {
    if (!tools || !Array.isArray(tools)) {
        return [];
    }
    return tools.filter((tool) => tool !== null && typeof tool === 'object');
};
/**
 * Normalizes a TargetPurposeDiscoveryResult by converting null-like values to actual null
 * and cleaning up empty or meaningless content.
 */
function normalizeTargetPurposeDiscoveryResult(result) {
    return {
        purpose: isNullLike(result.purpose) ? null : result.purpose,
        limitations: isNullLike(result.limitations) ? null : result.limitations,
        user: isNullLike(result.user) ? null : result.user,
        tools: cleanTools(result.tools),
    };
}
/**
 * Queries Cloud for the purpose-discovery logic, sends each logic to the target,
 * and summarizes the results.
 *
 * @param target - The target API provider.
 * @param prompt - The prompt to use for the discovery.
 * @param showProgress - Whether to show the progress bar.
 * @returns The discovery result.
 */
async function doTargetPurposeDiscovery(target, prompt, showProgress = true) {
    // Generate a unique session id to pass to the target across all turns.
    const sessionId = (0, crypto_1.randomUUID)();
    let pbar;
    if (showProgress) {
        pbar = new cli_progress_1.default.SingleBar({
            format: `Mapping the target {bar} {percentage}% | {value}${DEFAULT_TURN_COUNT ? '/{total}' : ''} turns`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
            gracefulExit: true,
        });
        pbar.start(DEFAULT_TURN_COUNT, 0);
    }
    let done = false;
    let question;
    let discoveryResult;
    let state = TargetPurposeDiscoveryStateSchema.parse({
        currentQuestionIndex: 0,
        answers: [],
    });
    let turn = 0;
    while (!done && turn < MAX_TURN_COUNT) {
        try {
            turn++;
            logger_1.default.debug(`${LOG_PREFIX} Discovery loop turn: ${turn}`);
            const response = await (0, index_2.fetchWithProxy)((0, remoteGeneration_1.getRemoteGenerationUrl)(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${cloud_1.cloudConfig.getApiKey()}`,
                },
                body: JSON.stringify(exports.TargetPurposeDiscoveryRequestSchema.parse({
                    state: {
                        currentQuestionIndex: state.currentQuestionIndex,
                        answers: state.answers,
                    },
                    task: 'target-purpose-discovery',
                    version: constants_1.VERSION,
                    email: (0, accounts_1.getUserEmail)(),
                })),
            });
            if (!response.ok) {
                const error = await response.text();
                logger_1.default.error(`${LOG_PREFIX} Error getting the next question from remote server: ${error}`);
                continue;
            }
            const responseData = await response.json();
            const data = exports.TargetPurposeDiscoveryTaskResponseSchema.parse(responseData);
            logger_1.default.debug(`${LOG_PREFIX} Received response from remote server: ${JSON.stringify(data, null, 2)}`);
            done = data.done;
            question = data.question;
            discoveryResult = data.purpose;
            state = data.state;
            if (data.error) {
                const errorMessage = `Error from remote server: ${data.error}`;
                logger_1.default.error(`${LOG_PREFIX} ${errorMessage}`);
                throw new Error(errorMessage);
            }
            // Should another question be asked?
            else if (!done) {
                (0, invariant_1.default)(question, 'Question should always be defined if `done` is falsy.');
                const renderedPrompt = prompt
                    ? await (0, evaluatorHelpers_1.renderPrompt)(prompt, { prompt: question }, {}, target)
                    : question;
                const targetResponse = await target.callApi(renderedPrompt, {
                    prompt: { raw: question, label: 'Target Discovery Question' },
                    vars: { sessionId },
                    bustCache: true,
                });
                if (targetResponse.error) {
                    const errorMessage = `Error from target: ${targetResponse.error}`;
                    logger_1.default.error(`${LOG_PREFIX} ${errorMessage}`);
                    throw new Error(errorMessage);
                }
                if (turn > MAX_TURN_COUNT) {
                    const errorMessage = `Too many retries, giving up.`;
                    logger_1.default.error(`${LOG_PREFIX} ${errorMessage}`);
                    throw new Error(errorMessage);
                }
                logger_1.default.debug(`${LOG_PREFIX} Received response from target: ${JSON.stringify(targetResponse, null, 2)}`);
                // If the target is an HTTP provider and has no transformResponse defined, and the response is an object,
                // prompt the user to define a transformResponse.
                if (target instanceof http_1.HttpProvider &&
                    target.config.transformResponse === undefined &&
                    typeof targetResponse.output === 'object' &&
                    targetResponse.output !== null) {
                    logger_1.default.warn(`${LOG_PREFIX} Target response is an object; should a \`transformResponse\` function be defined?`);
                }
                state.answers.push(targetResponse.output);
            }
        }
        finally {
            if (showProgress) {
                pbar?.increment(1);
            }
        }
    }
    if (showProgress) {
        pbar?.stop();
    }
    return discoveryResult ? normalizeTargetPurposeDiscoveryResult(discoveryResult) : undefined;
}
// ========================================================
// Command
// ========================================================
/**
 * Registers the `discover` command with the CLI.
 */
function discoverCommand(program, defaultConfig, defaultConfigPath) {
    program
        .command(COMMAND)
        .description((0, dedent_1.default) `
        Run the Target Discovery Agent to automatically discover and report a target application's purpose,
        limitations, and tools, enhancing attack probe efficacy.

        If neither a config file nor a target ID is provided, the current working directory will be checked for a promptfooconfig.yaml file,
        and the first provider in that config will be used.
      `)
        .option('-c, --config <path>', 'Path to `promptfooconfig.yaml` configuration file.')
        .option('-t, --target <id>', 'UUID of a target defined in Promptfoo Cloud to scan.')
        .action(async (rawArgs) => {
        // Check that remote generation is enabled:
        if ((0, remoteGeneration_1.neverGenerateRemote)()) {
            logger_1.default.error((0, dedent_1.default) `
          Target discovery relies on remote generation which is disabled.

          To enable remote generation, unset the PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION environment variable.
        `);
            process.exit(1);
        }
        // Validate the arguments:
        const { success, data: args, error } = exports.ArgsSchema.safeParse(rawArgs);
        if (!success) {
            logger_1.default.error('Invalid options:');
            error.issues.forEach((issue) => {
                logger_1.default.error(`  ${issue.path.join('.')}: ${issue.message}`);
            });
            process.exitCode = 1;
            return;
        }
        // Record telemetry:
        telemetry_1.default.record('command_used', {
            name: `redteam ${COMMAND}`,
        });
        telemetry_1.default.record('redteam discover', {});
        let config = null;
        // Although the providers/targets property supports multiple values, Redteaming only supports
        // a single target at a time.
        let target = undefined;
        // Fallback to the default config path:
        // If user provides a config, read the target from it:
        if (args.config) {
            // Validate that the config is a valid path:
            if (!fs.existsSync(args.config)) {
                throw new Error(`Config not found at ${args.config}`);
            }
            config = await (0, load_1.readConfig)(args.config);
            if (!config) {
                throw new Error(`Config is invalid at ${args.config}`);
            }
            if (!config.providers) {
                throw new Error('Config must contain a target');
            }
            const providers = await (0, index_1.loadApiProviders)(config.providers);
            target = providers[0];
        }
        // If the target flag is provided, load it from Cloud:
        else if (args.target) {
            // Let the internal error handling bubble up:
            const providerOptions = await (0, cloud_2.getProviderFromCloud)(args.target);
            target = await (0, index_1.loadApiProvider)(providerOptions.id, { options: providerOptions });
        }
        // Check the current working directory for a promptfooconfig.yaml file:
        else if (defaultConfig) {
            if (!defaultConfig) {
                throw new Error(`Config is invalid at ${defaultConfigPath}`);
            }
            if (!defaultConfig.providers) {
                throw new Error('Config must contain a target or provider');
            }
            const providers = await (0, index_1.loadApiProviders)(defaultConfig.providers);
            target = providers[0];
            // Alert the user that we're using a config from the current working directory:
            logger_1.default.info(`Using config from ${chalk_1.default.italic(defaultConfigPath)}`);
        }
        else {
            logger_1.default.error('No config found, please specify a config file with the --config flag, a target with the --target flag, or run this command from a directory with a promptfooconfig.yaml file.');
            process.exitCode = 1;
            return;
        }
        try {
            const discoveryResult = await doTargetPurposeDiscovery(target);
            if (discoveryResult) {
                if (discoveryResult.purpose) {
                    logger_1.default.info(chalk_1.default.bold(chalk_1.default.green('\n1. The target believes its purpose is:\n')));
                    logger_1.default.info(discoveryResult.purpose);
                }
                if (discoveryResult.limitations) {
                    logger_1.default.info(chalk_1.default.bold(chalk_1.default.green('\n2. The target believes its limitations to be:\n')));
                    logger_1.default.info(discoveryResult.limitations);
                }
                if (discoveryResult.tools && discoveryResult.tools.length > 0) {
                    logger_1.default.info(chalk_1.default.bold(chalk_1.default.green('\n3. The target divulged access to these tools:\n')));
                    logger_1.default.info(JSON.stringify(discoveryResult.tools, null, 2));
                }
                if (discoveryResult.user) {
                    logger_1.default.info(chalk_1.default.bold(chalk_1.default.green('\n4. The target believes the user of the application is:\n')));
                    logger_1.default.info(discoveryResult.user);
                }
                // If no meaningful information was discovered, inform the user
                if (!discoveryResult.purpose &&
                    !discoveryResult.limitations &&
                    (!discoveryResult.tools || discoveryResult.tools.length === 0) &&
                    !discoveryResult.user) {
                    logger_1.default.info(chalk_1.default.yellow('\nNo meaningful information was discovered about the target.'));
                }
            }
        }
        catch (error) {
            logger_1.default.error(`An unexpected error occurred during target scan: ${error instanceof Error ? error.message : String(error)}\n${error instanceof Error ? error.stack : ''}`);
            process.exit(1);
        }
        process.exit();
    });
}
//# sourceMappingURL=discover.js.map