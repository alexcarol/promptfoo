"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptfooSimulatedUserProvider = exports.REDTEAM_SIMULATED_USER_TASK_ID = exports.PromptfooChatCompletionProvider = exports.PromptfooHarmfulCompletionProvider = void 0;
const dedent_1 = __importDefault(require("dedent"));
const constants_1 = require("../constants");
const accounts_1 = require("../globalConfig/accounts");
const logger_1 = __importDefault(require("../logger"));
const remoteGeneration_1 = require("../redteam/remoteGeneration");
const index_1 = require("../util/fetch/index");
const shared_1 = require("./shared");
/**
 * Provider for generating harmful/adversarial content using Promptfoo's unaligned models.
 * Used by red team plugins to generate test cases for harmful content categories.
 */
class PromptfooHarmfulCompletionProvider {
    constructor(options) {
        this.harmCategory = options.harmCategory;
        this.n = options.n;
        this.purpose = options.purpose;
        this.config = options.config;
    }
    id() {
        return `promptfoo:redteam:${this.harmCategory}`;
    }
    toString() {
        return `[Promptfoo Harmful Completion Provider ${this.purpose} - ${this.harmCategory}]`;
    }
    async callApi(_prompt, _context, _callApiOptions) {
        // Check if remote generation is disabled
        if ((0, remoteGeneration_1.neverGenerateRemote)()) {
            return {
                error: (0, dedent_1.default) `
          Remote generation is disabled. Harmful content generation requires Promptfoo's unaligned models.

          To enable:
          - Remove PROMPTFOO_DISABLE_REMOTE_GENERATION (or PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION)
          - Or configure an alternative unaligned model provider

          Learn more: https://www.promptfoo.dev/docs/red-team/configuration#remote-generation
        `,
            };
        }
        const body = {
            email: (0, accounts_1.getUserEmail)(),
            harmCategory: this.harmCategory,
            n: this.n,
            purpose: this.purpose,
            version: constants_1.VERSION,
            config: this.config,
        };
        try {
            logger_1.default.debug(`[HarmfulCompletionProvider] Calling generate harmful API (${(0, remoteGeneration_1.getRemoteGenerationUrlForUnaligned)()}) with body: ${JSON.stringify(body)}`);
            // We're using the promptfoo API to avoid having users provide their own unaligned model.
            const response = await (0, index_1.fetchWithRetries)((0, remoteGeneration_1.getRemoteGenerationUrlForUnaligned)(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            }, 580000, 2);
            if (!response.ok) {
                throw new Error(`API call failed with status ${response.status}: ${await response.text()}`);
            }
            const data = await response.json();
            const validOutputs = (Array.isArray(data.output) ? data.output : [data.output]).filter((item) => typeof item === 'string' && item.length > 0);
            return {
                output: validOutputs,
            };
        }
        catch (err) {
            logger_1.default.info(`[HarmfulCompletionProvider] ${err}`);
            return {
                error: `[HarmfulCompletionProvider] ${err}`,
            };
        }
    }
}
exports.PromptfooHarmfulCompletionProvider = PromptfooHarmfulCompletionProvider;
/**
 * Provider for red team adversarial strategies using Promptfoo's task-specific models.
 * Supports multi-turn attack strategies like crescendo, goat, and iterative attacks.
 */
class PromptfooChatCompletionProvider {
    constructor(options) {
        this.options = options;
    }
    id() {
        return this.options.id || 'promptfoo:chatcompletion';
    }
    toString() {
        return `[Promptfoo Chat Completion Provider]`;
    }
    async callApi(prompt, context, _callApiOptions) {
        // Check if remote generation is disabled
        if ((0, remoteGeneration_1.neverGenerateRemote)()) {
            return {
                error: (0, dedent_1.default) `
          Remote generation is disabled. This red team strategy requires Promptfoo's task-specific models.

          To enable:
          - Remove PROMPTFOO_DISABLE_REMOTE_GENERATION (or PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION)
          - Or provide OPENAI_API_KEY for local generation (may have lower quality)

          Learn more: https://www.promptfoo.dev/docs/red-team/configuration#remote-generation
        `,
            };
        }
        const body = {
            jsonOnly: this.options.jsonOnly,
            preferSmallModel: this.options.preferSmallModel,
            prompt,
            step: context?.prompt.label,
            task: this.options.task,
            email: (0, accounts_1.getUserEmail)(),
        };
        try {
            const response = await (0, index_1.fetchWithRetries)((0, remoteGeneration_1.getRemoteGenerationUrl)(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            }, shared_1.REQUEST_TIMEOUT_MS);
            const data = await response.json();
            if (!data.result) {
                logger_1.default.error(`Error from promptfoo completion provider. Status: ${response.status} ${response.statusText} ${JSON.stringify(data)} `);
                return {
                    error: 'LLM did not return a result, likely refusal',
                };
            }
            return {
                output: data.result,
                tokenUsage: data.tokenUsage,
            };
        }
        catch (err) {
            return {
                error: `API call error: ${String(err)}`,
            };
        }
    }
}
exports.PromptfooChatCompletionProvider = PromptfooChatCompletionProvider;
// Task ID constants for simulated user provider
exports.REDTEAM_SIMULATED_USER_TASK_ID = 'mischievous-user-redteam';
/**
 * Provider for simulating realistic user conversations using Promptfoo's conversation models.
 * Supports both regular simulated users and adversarial red team users.
 */
class PromptfooSimulatedUserProvider {
    constructor(options = {}, taskId) {
        this.options = options;
        this.taskId = taskId;
    }
    id() {
        return this.options.id || 'promptfoo:agent';
    }
    toString() {
        return '[Promptfoo Agent Provider]';
    }
    async callApi(prompt, _context, _callApiOptions) {
        // Check if this is a redteam task
        const isRedteamTask = this.taskId === exports.REDTEAM_SIMULATED_USER_TASK_ID;
        // For redteam tasks, check the redteam-specific flag
        // For regular tasks, only check the general flag
        const shouldDisable = isRedteamTask
            ? (0, remoteGeneration_1.neverGenerateRemote)() // Checks both flags
            : (0, remoteGeneration_1.neverGenerateRemoteForRegularEvals)(); // Only checks general flag
        if (shouldDisable) {
            const relevantFlag = isRedteamTask
                ? 'PROMPTFOO_DISABLE_REMOTE_GENERATION or PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION'
                : 'PROMPTFOO_DISABLE_REMOTE_GENERATION';
            const docsUrl = isRedteamTask
                ? 'https://www.promptfoo.dev/docs/red-team/configuration#remote-generation'
                : 'https://www.promptfoo.dev/docs/providers/simulated-user#remote-generation';
            return {
                error: (0, dedent_1.default) `
          Remote generation is disabled.

          SimulatedUser requires Promptfoo's conversation simulation models.

          To enable, remove ${relevantFlag}

          Learn more: ${docsUrl}
        `,
            };
        }
        const messages = JSON.parse(prompt);
        const body = {
            task: this.taskId,
            instructions: this.options.instructions,
            history: messages,
            email: (0, accounts_1.getUserEmail)(),
            version: constants_1.VERSION,
        };
        try {
            const response = await (0, index_1.fetchWithRetries)((0, remoteGeneration_1.getRemoteGenerationUrl)(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            }, shared_1.REQUEST_TIMEOUT_MS);
            if (!response.ok) {
                throw new Error(`API call failed with status ${response.status}: ${await response.text()}`);
            }
            const data = (await response.json());
            return {
                output: data.result,
                tokenUsage: data.tokenUsage,
            };
        }
        catch (err) {
            return {
                error: `API call error: ${String(err)}`,
            };
        }
    }
}
exports.PromptfooSimulatedUserProvider = PromptfooSimulatedUserProvider;
//# sourceMappingURL=promptfoo.js.map