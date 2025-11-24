"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRouterProvider = void 0;
exports.createOpenRouterProvider = createOpenRouterProvider;
const cache_1 = require("../cache");
const logger_1 = __importDefault(require("../logger"));
const finishReason_1 = require("../util/finishReason");
const chat_1 = require("./openai/chat");
const util_1 = require("./openai/util");
const shared_1 = require("./shared");
/**
 * OpenRouter provider extends OpenAI chat completion provider with special handling
 * for models like Gemini that include thinking/reasoning tokens.
 *
 * For Gemini models, the base OpenAI provider incorrectly prioritizes the reasoning
 * field over content. This provider ensures content is the primary output with
 * reasoning shown as thinking content when showThinking is enabled.
 */
class OpenRouterProvider extends chat_1.OpenAiChatCompletionProvider {
    constructor(modelName, providerOptions) {
        super(modelName, {
            ...providerOptions,
            config: {
                ...providerOptions.config,
                apiBaseUrl: 'https://openrouter.ai/api/v1',
                apiKeyEnvar: 'OPENROUTER_API_KEY',
                passthrough: {
                    // Pass through OpenRouter-specific options
                    // https://openrouter.ai/docs/requests
                    ...(providerOptions.config?.transforms && {
                        transforms: providerOptions.config.transforms,
                    }),
                    ...(providerOptions.config?.models && { models: providerOptions.config.models }),
                    ...(providerOptions.config?.route && { route: providerOptions.config.route }),
                    ...(providerOptions.config?.provider && { provider: providerOptions.config.provider }),
                    ...(providerOptions.config?.passthrough || {}),
                },
            },
        });
    }
    id() {
        return `openrouter:${this.modelName}`;
    }
    toString() {
        return `[OpenRouter Provider ${this.modelName}]`;
    }
    toJSON() {
        return {
            provider: 'openrouter',
            model: this.modelName,
            config: {
                ...this.config,
                ...(this.config.apiKey && { apiKey: undefined }),
            },
        };
    }
    async callApi(prompt, context, callApiOptions) {
        // Get the request body and config
        const { body, config } = this.getOpenAiBody(prompt, context, callApiOptions);
        // Make the API call directly
        logger_1.default.debug(`Calling OpenRouter API: model=${this.modelName}`);
        let data, status, statusText;
        let cached = false;
        try {
            ({ data, cached, status, statusText } = await (0, cache_1.fetchWithCache)(`${this.getApiUrl()}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.getApiKey()}`,
                    ...(this.getOrganization() ? { 'OpenAI-Organization': this.getOrganization() } : {}),
                    ...config.headers,
                },
                body: JSON.stringify(body),
            }, shared_1.REQUEST_TIMEOUT_MS, 'json', context?.bustCache ?? context?.debug));
            if (status < 200 || status >= 300) {
                return {
                    error: `API error: ${status} ${statusText}\n${typeof data === 'string' ? data : JSON.stringify(data)}`,
                };
            }
        }
        catch (err) {
            logger_1.default.error(`API call error: ${String(err)}`);
            return {
                error: `API call error: ${String(err)}`,
            };
        }
        if (data.error) {
            return {
                error: (0, util_1.formatOpenAiError)(data),
            };
        }
        // Process the response with special handling for Gemini
        const message = data.choices[0].message;
        const finishReason = (0, finishReason_1.normalizeFinishReason)(data.choices[0].finish_reason);
        // Prioritize tool calls over content and reasoning
        let output = '';
        const hasFunctionCall = !!(message.function_call && message.function_call.name);
        const hasToolCalls = Array.isArray(message.tool_calls) && message.tool_calls.length > 0;
        if (hasFunctionCall || hasToolCalls) {
            // Tool calls always take priority and never include thinking
            output = hasFunctionCall ? message.function_call : message.tool_calls;
        }
        else if (message.content && message.content.trim()) {
            output = message.content;
            // Add reasoning as thinking content if present and showThinking is enabled
            if (message.reasoning && (this.config.showThinking ?? true)) {
                output = `Thinking: ${message.reasoning}\n\n${output}`;
            }
        }
        else if (message.reasoning && (this.config.showThinking ?? true)) {
            // Fallback to reasoning if no content and showThinking is enabled
            output = message.reasoning;
        }
        // Handle structured output
        if (config.response_format?.type === 'json_schema') {
            // Prefer parsing the raw content to avoid the "Thinking:" prefix breaking JSON
            const jsonCandidate = typeof message?.content === 'string'
                ? message.content
                : typeof output === 'string'
                    ? output
                    : null;
            if (jsonCandidate) {
                try {
                    output = JSON.parse(jsonCandidate);
                }
                catch (error) {
                    // Keep the original output (which may include "Thinking:" prefix) if parsing fails
                    logger_1.default.warn(`Failed to parse JSON output for json_schema: ${String(error)}`);
                }
            }
        }
        return {
            output,
            tokenUsage: (0, util_1.getTokenUsage)(data, cached),
            cached,
            cost: (0, util_1.calculateOpenAICost)(this.modelName, config, data.usage?.prompt_tokens, data.usage?.completion_tokens),
            ...(finishReason && { finishReason }),
        };
    }
}
exports.OpenRouterProvider = OpenRouterProvider;
function createOpenRouterProvider(providerPath, options = {}) {
    const splits = providerPath.split(':');
    const modelName = splits.slice(1).join(':');
    return new OpenRouterProvider(modelName, options.config || {});
}
//# sourceMappingURL=openrouter.js.map