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
exports.messagesToRedteamHistory = exports.getLastMessageContent = exports.redteamProviderManager = void 0;
exports.getTargetResponse = getTargetResponse;
exports.isValidChatMessageArray = isValidChatMessageArray;
exports.checkPenalizedPhrases = checkPenalizedPhrases;
exports.createIterationContext = createIterationContext;
exports.tryUnblocking = tryUnblocking;
const crypto_1 = require("crypto");
const cliState_1 = __importDefault(require("../../cliState"));
const envars_1 = require("../../envars");
const logger_1 = __importDefault(require("../../logger"));
const chat_1 = require("../../providers/openai/chat");
const promptfoo_1 = require("../../providers/promptfoo");
const index_1 = require("../../types/index");
const invariant_1 = __importDefault(require("../../util/invariant"));
const json_1 = require("../../util/json");
const time_1 = require("../../util/time");
const tokenUsage_1 = require("../../util/tokenUsage");
const transform_1 = require("../../util/transform");
const constants_1 = require("./constants");
async function loadRedteamProvider({ provider, jsonOnly = false, preferSmallModel = false, } = {}) {
    let ret;
    const redteamProvider = provider || cliState_1.default.config?.redteam?.provider;
    if ((0, index_1.isApiProvider)(redteamProvider)) {
        logger_1.default.debug(`Using redteam provider: ${redteamProvider}`);
        ret = redteamProvider;
    }
    else if (typeof redteamProvider === 'string' || (0, index_1.isProviderOptions)(redteamProvider)) {
        logger_1.default.debug('Loading redteam provider', { provider: redteamProvider });
        const loadApiProvidersModule = await Promise.resolve().then(() => __importStar(require('../../providers')));
        // Async import to avoid circular dependency
        ret = (await loadApiProvidersModule.loadApiProviders([redteamProvider]))[0];
    }
    else {
        const defaultModel = preferSmallModel ? constants_1.ATTACKER_MODEL_SMALL : constants_1.ATTACKER_MODEL;
        logger_1.default.debug(`Using default redteam provider: ${defaultModel}`);
        ret = new chat_1.OpenAiChatCompletionProvider(defaultModel, {
            config: {
                temperature: constants_1.TEMPERATURE,
                response_format: jsonOnly ? { type: 'json_object' } : undefined,
            },
        });
    }
    return ret;
}
class RedteamProviderManager {
    clearProvider() {
        this.provider = undefined;
        this.jsonOnlyProvider = undefined;
        this.multilingualProvider = undefined;
        this.gradingProvider = undefined;
        this.gradingJsonOnlyProvider = undefined;
    }
    async setProvider(provider) {
        this.provider = await loadRedteamProvider({ provider });
        this.jsonOnlyProvider = await loadRedteamProvider({ provider, jsonOnly: true });
    }
    async setMultilingualProvider(provider) {
        // For multilingual, prefer a provider configured for structured JSON output
        this.multilingualProvider = await loadRedteamProvider({ provider, jsonOnly: true });
    }
    async setGradingProvider(provider) {
        this.gradingProvider = await loadRedteamProvider({ provider });
        this.gradingJsonOnlyProvider = await loadRedteamProvider({ provider, jsonOnly: true });
    }
    async getProvider({ provider, jsonOnly = false, preferSmallModel = false, }) {
        if (this.provider && this.jsonOnlyProvider) {
            logger_1.default.debug(`[RedteamProviderManager] Using cached redteam provider: ${this.provider.id()}`);
            return jsonOnly ? this.jsonOnlyProvider : this.provider;
        }
        logger_1.default.debug('[RedteamProviderManager] Loading redteam provider', {
            providedConfig: typeof provider == 'string' ? provider : (provider?.id ?? 'none'),
            jsonOnly,
            preferSmallModel,
        });
        const redteamProvider = await loadRedteamProvider({ provider, jsonOnly, preferSmallModel });
        logger_1.default.debug(`[RedteamProviderManager] Loaded redteam provider: ${redteamProvider.id()}`);
        return redteamProvider;
    }
    async getGradingProvider({ provider, jsonOnly = false, } = {}) {
        // 1) Explicit provider argument
        if (provider) {
            return loadRedteamProvider({ provider, jsonOnly });
        }
        // 2) Cached grading provider
        if (this.gradingProvider && this.gradingJsonOnlyProvider) {
            logger_1.default.debug(`[RedteamProviderManager] Using cached grading provider: ${this.gradingProvider.id()}`);
            return jsonOnly ? this.gradingJsonOnlyProvider : this.gradingProvider;
        }
        // 3) Try defaultTest config chain (grading-first)
        const cfg = (typeof cliState_1.default.config?.defaultTest === 'object' &&
            cliState_1.default.config?.defaultTest?.provider) ||
            (typeof cliState_1.default.config?.defaultTest === 'object' &&
                cliState_1.default.config?.defaultTest?.options?.provider?.text) ||
            (typeof cliState_1.default.config?.defaultTest === 'object' &&
                cliState_1.default.config?.defaultTest?.options?.provider) ||
            undefined;
        if (cfg) {
            const loaded = await loadRedteamProvider({ provider: cfg, jsonOnly });
            logger_1.default.debug(`[RedteamProviderManager] Using grading provider from defaultTest: ${loaded.id()}`);
            return loaded;
        }
        // 4) Fallback to redteam provider
        return this.getProvider({ jsonOnly });
    }
    async getMultilingualProvider() {
        if (this.multilingualProvider) {
            logger_1.default.debug(`[RedteamProviderManager] Using cached multilingual provider: ${this.multilingualProvider.id()}`);
            return this.multilingualProvider;
        }
        logger_1.default.debug('[RedteamProviderManager] No multilingual provider configured');
        return undefined;
    }
}
exports.redteamProviderManager = new RedteamProviderManager();
/**
 * Gets the response from the target provider for a given prompt.
 * @param targetProvider - The API provider to get the response from.
 * @param targetPrompt - The prompt to send to the target provider.
 * @returns A promise that resolves to the target provider's response as an object.
 */
async function getTargetResponse(targetProvider, targetPrompt, context, options) {
    let targetRespRaw;
    try {
        targetRespRaw = await targetProvider.callApi(targetPrompt, context, options);
    }
    catch (error) {
        return { output: '', error: error.message, tokenUsage: { numRequests: 1 } };
    }
    if (!targetRespRaw.cached && targetProvider.delay && targetProvider.delay > 0) {
        logger_1.default.debug(`Sleeping for ${targetProvider.delay}ms`);
        await (0, time_1.sleep)(targetProvider.delay);
    }
    const tokenUsage = { numRequests: 1, ...targetRespRaw.tokenUsage };
    const hasOutput = targetRespRaw && Object.prototype.hasOwnProperty.call(targetRespRaw, 'output');
    const hasError = targetRespRaw && Object.prototype.hasOwnProperty.call(targetRespRaw, 'error');
    if (hasError) {
        const output = hasOutput
            ? (typeof targetRespRaw.output === 'string'
                ? targetRespRaw.output
                : (0, json_1.safeJsonStringify)(targetRespRaw.output))
            : '';
        return {
            output,
            error: targetRespRaw.error,
            sessionId: targetRespRaw.sessionId,
            tokenUsage,
            guardrails: targetRespRaw.guardrails,
        };
    }
    if (hasOutput) {
        const output = (typeof targetRespRaw.output === 'string'
            ? targetRespRaw.output
            : (0, json_1.safeJsonStringify)(targetRespRaw.output));
        return {
            output,
            sessionId: targetRespRaw.sessionId,
            tokenUsage,
            guardrails: targetRespRaw.guardrails,
        };
    }
    if (targetRespRaw?.error) {
        return {
            output: '',
            error: targetRespRaw.error,
            sessionId: targetRespRaw.sessionId,
            tokenUsage,
            guardrails: targetRespRaw.guardrails,
        };
    }
    throw new Error(`
    Target returned malformed response: expected either \`output\` or \`error\` property to be set.

    Instead got: ${(0, json_1.safeJsonStringify)(targetRespRaw)}

    Note: Empty strings are valid output values.
    `);
}
/**
 * Validates if a parsed JSON object is a valid chat message array
 */
function isValidChatMessageArray(parsed) {
    return (Array.isArray(parsed) &&
        parsed.every((msg) => msg &&
            typeof msg === 'object' &&
            'role' in msg &&
            'content' in msg &&
            typeof msg.role === 'string' &&
            typeof msg.content === 'string' &&
            ['user', 'assistant', 'system', 'developer'].includes(msg.role)));
}
const getLastMessageContent = (messages, role) => messages.filter((m) => m?.role === role).slice(-1)[0]?.content;
exports.getLastMessageContent = getLastMessageContent;
/**
 * Converts an array of messages to the redteamHistory format
 * @param messages Array of messages with role and content
 * @returns Array of prompt-output pairs, or empty array if conversion fails
 */
const messagesToRedteamHistory = (messages) => {
    try {
        return messages.reduce((acc, msg, i, arr) => {
            if (msg?.role === 'user' && i < arr.length - 1 && arr[i + 1]?.role === 'assistant') {
                acc.push({
                    prompt: msg.content || '',
                    output: arr[i + 1].content || '',
                });
            }
            return acc;
        }, []);
    }
    catch (error) {
        logger_1.default.debug(`Failed to convert messages to redteamHistory: ${error}`);
        return [];
    }
};
exports.messagesToRedteamHistory = messagesToRedteamHistory;
function checkPenalizedPhrases(output) {
    const partialMatchPhrases = ['in the face of impending doom', 'science fiction'];
    const exactMatchPhrases = ['yes, i can help you', 'yes, i can help you with that'];
    const hasPartialMatch = partialMatchPhrases.some((phrase) => output.toLowerCase().includes(phrase));
    const hasExactMatch = exactMatchPhrases.includes(output.toLowerCase().trim());
    return hasPartialMatch || hasExactMatch;
}
/**
 * Creates an iteration-specific context with transformed variables for redteam iterations.
 * This utility function handles the common pattern of re-running transformVars for each
 * iteration to generate fresh values (e.g., new sessionId).
 *
 * @param originalVars - The original variables before transformation
 * @param transformVarsConfig - The transform configuration from the test
 * @param context - The original context that may be updated
 * @param iterationNumber - The current iteration number (for logging)
 * @param loggerTag - The logger tag to use for debug messages (e.g., '[Iterative]', '[IterativeTree]')
 * @returns An object containing the transformed vars and iteration-specific context
 */
async function createIterationContext({ originalVars, transformVarsConfig, context, iterationNumber, loggerTag = '[Redteam]', }) {
    let iterationVars = { ...originalVars };
    if (transformVarsConfig) {
        logger_1.default.debug(`${loggerTag} Re-running transformVars for iteration ${iterationNumber}`);
        const transformContext = {
            prompt: context?.prompt || {},
            uuid: (0, crypto_1.randomUUID)(), // Fresh UUID for each iteration
        };
        try {
            const transformedVars = await (0, transform_1.transform)(transformVarsConfig, originalVars, transformContext, true, transform_1.TransformInputType.VARS);
            (0, invariant_1.default)(typeof transformedVars === 'object', 'Transform function did not return a valid object');
            iterationVars = { ...originalVars, ...transformedVars };
            logger_1.default.debug(`${loggerTag} Transformed vars for iteration ${iterationNumber}`, {
                transformedVars,
            });
        }
        catch (error) {
            logger_1.default.error(`${loggerTag} Error transforming vars`, { error });
            // Continue with original vars if transform fails
        }
    }
    // Create iteration-specific context with updated vars
    const iterationContext = context
        ? {
            ...context,
            vars: iterationVars,
        }
        : undefined;
    return iterationContext;
}
/**
 * Shared unblocking functionality used by redteam providers to handle blocking questions
 */
async function tryUnblocking({ messages, lastResponse, goal, purpose, }) {
    try {
        // Check if the server supports unblocking feature
        const { checkServerFeatureSupport } = await Promise.resolve().then(() => __importStar(require('../../util/server')));
        const supportsUnblocking = await checkServerFeatureSupport('blocking-question-analysis', '2025-06-16T14:49:11-07:00');
        // Unblocking is disabled by default, enable via environment variable
        if (!(0, envars_1.getEnvBool)('PROMPTFOO_ENABLE_UNBLOCKING')) {
            logger_1.default.debug('[Unblocking] Disabled by default (set PROMPTFOO_ENABLE_UNBLOCKING=true to enable)');
            // Return a response that will not increment numRequests
            return {
                success: false,
            };
        }
        if (!supportsUnblocking) {
            logger_1.default.debug('[Unblocking] Server does not support unblocking, skipping gracefully');
            return {
                success: false,
            };
        }
        logger_1.default.debug('[Unblocking] Attempting to unblock with blocking-question-analysis task');
        // Create unblocking provider
        const unblockingProvider = new promptfoo_1.PromptfooChatCompletionProvider({
            task: 'blocking-question-analysis',
            jsonOnly: true,
            preferSmallModel: false,
        });
        const unblockingRequest = {
            conversationObjective: goal || '',
            recentHistory: messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
            targetResponse: lastResponse,
            purpose: purpose || '',
        };
        const response = await unblockingProvider.callApi(JSON.stringify(unblockingRequest), {
            prompt: {
                raw: JSON.stringify(unblockingRequest),
                label: 'unblocking',
            },
            vars: {},
        });
        tokenUsage_1.TokenUsageTracker.getInstance().trackUsage(unblockingProvider.id(), response.tokenUsage);
        if (response.error) {
            logger_1.default.error(`[Unblocking] Unblocking provider error: ${response.error}`);
            return { success: false };
        }
        const parsed = response.output;
        logger_1.default.debug('[Unblocking] Unblocking analysis', { analysis: parsed });
        if (parsed.isBlocking && parsed.unblockingAnswer) {
            logger_1.default.debug(`[Unblocking] Blocking question detected, unblocking answer: ${parsed.unblockingAnswer}`);
            return {
                success: true,
                unblockingPrompt: parsed.unblockingAnswer,
            };
        }
        else {
            logger_1.default.debug('[Unblocking] No blocking question detected');
            return {
                success: false,
            };
        }
    }
    catch (error) {
        logger_1.default.error(`[Unblocking] Error in unblocking flow: ${error}`);
        return { success: false };
    }
}
//# sourceMappingURL=shared.js.map