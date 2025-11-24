"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultSynthesizeProvider = exports.DefaultSuggestionsProvider = exports.DefaultLlmRubricProvider = exports.DefaultGradingJsonProvider = exports.DefaultGradingProvider = exports.AIStudioChatProvider = void 0;
const cache_1 = require("../../cache");
const envars_1 = require("../../envars");
const logger_1 = __importDefault(require("../../logger"));
const index_1 = require("../../util/index");
const file_1 = require("../../util/file");
const templates_1 = require("../../util/templates");
const client_1 = require("../mcp/client");
const transform_1 = require("../mcp/transform");
const shared_1 = require("../shared");
const shared_2 = require("./shared");
const util_1 = require("./util");
const DEFAULT_API_HOST = 'generativelanguage.googleapis.com';
class AIStudioGenericProvider {
    constructor(modelName, options = {}) {
        const { config, id, env } = options;
        this.env = env;
        this.modelName = modelName;
        this.config = config || {};
        this.id = id ? () => id : this.id;
    }
    id() {
        return `google:${this.modelName}`;
    }
    toString() {
        return `[Google AI Studio Provider ${this.modelName}]`;
    }
    getApiUrlDefault() {
        const renderedHost = (0, templates_1.getNunjucksEngine)().renderString(DEFAULT_API_HOST, {});
        return `https://${renderedHost}`;
    }
    getApiHost() {
        const apiHost = this.config.apiHost ||
            this.env?.GOOGLE_API_HOST ||
            this.env?.PALM_API_HOST ||
            (0, envars_1.getEnvString)('GOOGLE_API_HOST') ||
            (0, envars_1.getEnvString)('PALM_API_HOST') ||
            DEFAULT_API_HOST;
        return (0, templates_1.getNunjucksEngine)().renderString(apiHost, {});
    }
    getApiUrl() {
        // Check for apiHost first (most specific override)
        const apiHost = this.config.apiHost ||
            this.env?.GOOGLE_API_HOST ||
            this.env?.PALM_API_HOST ||
            (0, envars_1.getEnvString)('GOOGLE_API_HOST') ||
            (0, envars_1.getEnvString)('PALM_API_HOST');
        if (apiHost) {
            const renderedHost = (0, templates_1.getNunjucksEngine)().renderString(apiHost, {});
            return `https://${renderedHost}`;
        }
        // Check for apiBaseUrl (less specific override)
        return (this.config.apiBaseUrl ||
            this.env?.GOOGLE_API_BASE_URL ||
            (0, envars_1.getEnvString)('GOOGLE_API_BASE_URL') ||
            this.getApiUrlDefault());
    }
    getApiKey() {
        const apiKey = this.config.apiKey ||
            this.env?.GEMINI_API_KEY ||
            this.env?.GOOGLE_API_KEY ||
            this.env?.PALM_API_KEY ||
            (0, envars_1.getEnvString)('GEMINI_API_KEY') ||
            (0, envars_1.getEnvString)('GOOGLE_API_KEY') ||
            (0, envars_1.getEnvString)('PALM_API_KEY');
        if (apiKey) {
            return (0, templates_1.getNunjucksEngine)().renderString(apiKey, {});
        }
        return undefined;
    }
    // @ts-ignore: Prompt is not used in this implementation
    async callApi(_prompt) {
        throw new Error('Not implemented');
    }
}
class AIStudioChatProvider extends AIStudioGenericProvider {
    constructor(modelName, options = {}) {
        if (!shared_2.CHAT_MODELS.includes(modelName)) {
            logger_1.default.debug(`Using unknown Google chat model: ${modelName}`);
        }
        super(modelName, options);
        this.mcpClient = null;
        this.initializationPromise = null;
        if (this.config.mcp?.enabled) {
            this.initializationPromise = this.initializeMCP();
        }
    }
    async initializeMCP() {
        this.mcpClient = new client_1.MCPClient(this.config.mcp);
        await this.mcpClient.initialize();
    }
    async callApi(prompt, context) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        if (!this.getApiKey()) {
            throw new Error('Google API key is not set. Set the GEMINI_API_KEY or GOOGLE_API_KEY environment variable or add `apiKey` to the provider config.');
        }
        const isGemini = this.modelName.startsWith('gemini');
        if (isGemini) {
            return this.callGemini(prompt, context);
        }
        // https://developers.generativeai.google/tutorials/curl_quickstart
        // https://ai.google.dev/api/rest/v1beta/models/generateMessage
        const messages = (0, shared_1.parseChatPrompt)(prompt, [{ content: prompt }]);
        const body = {
            prompt: { messages },
            temperature: this.config.temperature,
            topP: this.config.topP,
            topK: this.config.topK,
            safetySettings: this.config.safetySettings,
            stopSequences: this.config.stopSequences,
            maxOutputTokens: this.config.maxOutputTokens,
        };
        let data, cached = false;
        try {
            ({ data, cached } = (await (0, cache_1.fetchWithCache)(`${this.getApiUrl()}/v1beta3/models/${this.modelName}:generateMessage?key=${this.getApiKey()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.headers, // Allow custom headers to be passed
                },
                body: JSON.stringify(body),
            }, shared_1.REQUEST_TIMEOUT_MS, 'json', context?.bustCache ?? context?.debug)));
        }
        catch (err) {
            return {
                error: `API call error: ${String(err)}`,
            };
        }
        if (!data?.candidates || data.candidates.length === 0) {
            return {
                error: `API did not return any candidate responses: ${JSON.stringify(data)}`,
            };
        }
        try {
            const output = data.candidates[0].content;
            const tokenUsage = cached
                ? {
                    cached: data.usageMetadata?.totalTokenCount,
                    total: data.usageMetadata?.totalTokenCount,
                    numRequests: 0,
                    ...(data.usageMetadata?.thoughtsTokenCount !== undefined && {
                        completionDetails: {
                            reasoning: data.usageMetadata.thoughtsTokenCount,
                            acceptedPrediction: 0,
                            rejectedPrediction: 0,
                        },
                    }),
                }
                : {
                    prompt: data.usageMetadata?.promptTokenCount,
                    completion: data.usageMetadata?.candidatesTokenCount,
                    total: data.usageMetadata?.totalTokenCount,
                    numRequests: 1,
                    ...(data.usageMetadata?.thoughtsTokenCount !== undefined && {
                        completionDetails: {
                            reasoning: data.usageMetadata.thoughtsTokenCount,
                            acceptedPrediction: 0,
                            rejectedPrediction: 0,
                        },
                    }),
                };
            return {
                output,
                tokenUsage,
                raw: data,
                cached,
            };
        }
        catch (err) {
            return {
                error: `API response error: ${String(err)}: ${JSON.stringify(data)}`,
            };
        }
    }
    async callGemini(prompt, context) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        if (!this.getApiKey()) {
            throw new Error('Google API key is not set. Set the GEMINI_API_KEY or GOOGLE_API_KEY environment variable or add `apiKey` to the provider config.');
        }
        // Merge configs from the provider and the prompt
        const config = {
            ...this.config,
            ...context?.prompt?.config,
        };
        const { contents, systemInstruction } = (0, util_1.geminiFormatAndSystemInstructions)(prompt, context?.vars, config.systemInstruction, { useAssistantRole: config.useAssistantRole });
        // Determine API version based on model
        const apiVersion = this.modelName === 'gemini-2.0-flash-thinking-exp' || this.modelName.startsWith('gemini-3-')
            ? 'v1alpha'
            : 'v1beta';
        // --- MCP tool injection logic ---
        const mcpTools = this.mcpClient ? (0, transform_1.transformMCPToolsToGoogle)(this.mcpClient.getAllTools()) : [];
        const allTools = [...mcpTools, ...(config.tools ? (0, util_1.loadFile)(config.tools, context?.vars) : [])];
        // --- End MCP tool injection logic ---
        const body = {
            contents,
            generationConfig: {
                ...(config.temperature !== undefined && { temperature: config.temperature }),
                ...(config.topP !== undefined && { topP: config.topP }),
                ...(config.topK !== undefined && { topK: config.topK }),
                ...(config.stopSequences !== undefined && {
                    stopSequences: config.stopSequences,
                }),
                ...(config.maxOutputTokens !== undefined && {
                    maxOutputTokens: config.maxOutputTokens,
                }),
                ...config.generationConfig,
            },
            safetySettings: config.safetySettings,
            ...(config.toolConfig ? { toolConfig: config.toolConfig } : {}),
            ...(allTools.length > 0 ? { tools: allTools } : {}),
            ...(systemInstruction ? { system_instruction: systemInstruction } : {}),
        };
        if (config.responseSchema) {
            if (body.generationConfig.response_schema) {
                throw new Error('`responseSchema` provided but `generationConfig.response_schema` already set.');
            }
            const schema = (0, file_1.maybeLoadFromExternalFile)((0, index_1.renderVarsInObject)(config.responseSchema, context?.vars));
            body.generationConfig.response_schema = schema;
            body.generationConfig.response_mime_type = 'application/json';
        }
        let data;
        let cached = false;
        try {
            ({ data, cached } = (await (0, cache_1.fetchWithCache)(`${this.getApiUrl()}/${apiVersion}/models/${this.modelName}:generateContent?key=${this.getApiKey()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.headers, // Allow custom headers to be set
                },
                body: JSON.stringify(body),
            }, shared_1.REQUEST_TIMEOUT_MS, 'json', false)));
        }
        catch (err) {
            return {
                error: `API call error: ${String(err)}`,
            };
        }
        let output, candidate;
        try {
            candidate = (0, util_1.getCandidate)(data);
            output = (0, util_1.formatCandidateContents)(candidate);
        }
        catch (err) {
            return {
                error: `${String(err)}`,
            };
        }
        try {
            let guardrails;
            if (data.promptFeedback?.safetyRatings || candidate.safetyRatings) {
                const flaggedInput = data.promptFeedback?.safetyRatings?.some((r) => r.probability !== 'NEGLIGIBLE');
                const flaggedOutput = candidate.safetyRatings?.some((r) => r.probability !== 'NEGLIGIBLE');
                const flagged = flaggedInput || flaggedOutput;
                guardrails = {
                    flaggedInput,
                    flaggedOutput,
                    flagged,
                };
            }
            const tokenUsage = cached
                ? {
                    cached: data.usageMetadata?.totalTokenCount,
                    total: data.usageMetadata?.totalTokenCount,
                    numRequests: 0,
                    ...(data.usageMetadata?.thoughtsTokenCount !== undefined && {
                        completionDetails: {
                            reasoning: data.usageMetadata.thoughtsTokenCount,
                            acceptedPrediction: 0,
                            rejectedPrediction: 0,
                        },
                    }),
                }
                : {
                    prompt: data.usageMetadata?.promptTokenCount,
                    completion: data.usageMetadata?.candidatesTokenCount,
                    total: data.usageMetadata?.totalTokenCount,
                    numRequests: 1,
                    ...(data.usageMetadata?.thoughtsTokenCount !== undefined && {
                        completionDetails: {
                            reasoning: data.usageMetadata.thoughtsTokenCount,
                            acceptedPrediction: 0,
                            rejectedPrediction: 0,
                        },
                    }),
                };
            return {
                output,
                tokenUsage,
                raw: data,
                cached,
                ...(guardrails && { guardrails }),
                metadata: {
                    ...(candidate.groundingChunks && { groundingChunks: candidate.groundingChunks }),
                    ...(candidate.groundingMetadata && { groundingMetadata: candidate.groundingMetadata }),
                    ...(candidate.groundingSupports && { groundingSupports: candidate.groundingSupports }),
                    ...(candidate.webSearchQueries && { webSearchQueries: candidate.webSearchQueries }),
                },
            };
        }
        catch (err) {
            return {
                error: `API response error: ${String(err)}: ${JSON.stringify(data)}`,
            };
        }
    }
    async cleanup() {
        if (this.mcpClient) {
            await this.initializationPromise;
            await this.mcpClient.cleanup();
            this.mcpClient = null;
        }
    }
}
exports.AIStudioChatProvider = AIStudioChatProvider;
exports.DefaultGradingProvider = new AIStudioGenericProvider('gemini-2.5-pro');
exports.DefaultGradingJsonProvider = new AIStudioGenericProvider('gemini-2.5-pro', {
    config: {
        generationConfig: {
            response_mime_type: 'application/json',
        },
    },
});
exports.DefaultLlmRubricProvider = new AIStudioGenericProvider('gemini-2.5-pro');
exports.DefaultSuggestionsProvider = new AIStudioGenericProvider('gemini-2.5-pro');
exports.DefaultSynthesizeProvider = new AIStudioGenericProvider('gemini-2.5-pro');
//# sourceMappingURL=ai.studio.js.map