"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnowflakeCortexProvider = void 0;
exports.createSnowflakeProvider = createSnowflakeProvider;
const cache_1 = require("../cache");
const logger_1 = __importDefault(require("../logger"));
const finishReason_1 = require("../util/finishReason");
const chat_1 = require("./openai/chat");
const util_1 = require("./openai/util");
const shared_1 = require("./shared");
/**
 * Snowflake Cortex provider extends OpenAI chat completion provider
 * with Snowflake-specific endpoint handling.
 *
 * Documentation: https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api
 *
 * The Snowflake Cortex REST API provides OpenAI-compatible endpoints but with
 * a different URL structure:
 * - Endpoint: https://<account_identifier>.snowflakecomputing.com/api/v2/cortex/inference:complete
 * - Authentication: Bearer token (JWT, OAuth, or programmatic access token)
 * - Supports similar parameters to OpenAI (temperature, max_tokens, etc.)
 * - Supports tool calling, structured output, and streaming
 *
 * Available models include:
 * - Claude models (claude-3-5-sonnet, claude-4-sonnet)
 * - OpenAI GPT models
 * - Mistral models
 * - Llama models
 * - Custom fine-tuned models
 *
 * Example configuration:
 * ```yaml
 * providers:
 *   - id: snowflake:mistral-large2
 *     config:
 *       accountIdentifier: "myorg-myaccount"  # or set SNOWFLAKE_ACCOUNT_IDENTIFIER
 *       apiKey: "your-bearer-token"           # or set SNOWFLAKE_API_KEY
 *       # Optional: override the base URL completely
 *       # apiBaseUrl: "https://myorg-myaccount.snowflakecomputing.com"
 * ```
 */
class SnowflakeCortexProvider extends chat_1.OpenAiChatCompletionProvider {
    constructor(modelName, providerOptions) {
        const accountIdentifier = providerOptions.config?.accountIdentifier || process.env.SNOWFLAKE_ACCOUNT_IDENTIFIER;
        if (!accountIdentifier && !providerOptions.config?.apiBaseUrl) {
            throw new Error('Snowflake provider requires an account identifier. Set SNOWFLAKE_ACCOUNT_IDENTIFIER environment variable or specify accountIdentifier in config.');
        }
        // Construct the base URL from account identifier if not provided
        const apiBaseUrl = providerOptions.config?.apiBaseUrl || `https://${accountIdentifier}.snowflakecomputing.com`;
        super(modelName, {
            ...providerOptions,
            config: {
                ...providerOptions.config,
                apiBaseUrl,
                apiKeyEnvar: 'SNOWFLAKE_API_KEY',
                passthrough: {
                    ...(providerOptions.config?.passthrough || {}),
                },
            },
        });
    }
    id() {
        return `snowflake:${this.modelName}`;
    }
    toString() {
        return `[Snowflake Cortex Provider ${this.modelName}]`;
    }
    toJSON() {
        return {
            provider: 'snowflake',
            model: this.modelName,
            config: {
                ...this.config,
                ...(this.config.apiKey && { apiKey: undefined }),
            },
        };
    }
    async callApi(prompt, context, callApiOptions) {
        // Get the request body and config from parent class
        const { body, config } = this.getOpenAiBody(prompt, context, callApiOptions);
        // Make the API call to Snowflake Cortex endpoint
        logger_1.default.debug('[Snowflake Cortex] Calling API', {
            model: this.modelName,
            apiBaseUrl: this.getApiUrl(),
        });
        let data, status, statusText, latencyMs;
        let cached = false;
        try {
            ({ data, cached, status, statusText, latencyMs } = await (0, cache_1.fetchWithCache)(`${this.getApiUrl()}/api/v2/cortex/inference:complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.getApiKey()}`,
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
            logger_1.default.error(`[Snowflake Cortex] API call error: ${String(err)}`);
            return {
                error: `API call error: ${String(err)}`,
            };
        }
        if (data.error) {
            return {
                error: (0, util_1.formatOpenAiError)(data),
            };
        }
        // Process the response (should be OpenAI-compatible)
        const message = data.choices[0].message;
        const finishReason = (0, finishReason_1.normalizeFinishReason)(data.choices[0].finish_reason);
        // Handle tool calls and content
        let output = '';
        const hasFunctionCall = !!(message.function_call && message.function_call.name);
        const hasToolCalls = Array.isArray(message.tool_calls) && message.tool_calls.length > 0;
        if (hasFunctionCall || hasToolCalls) {
            // Tool calls always take priority
            output = hasFunctionCall ? message.function_call : message.tool_calls;
        }
        else if (message.content && message.content.trim()) {
            output = message.content;
        }
        // Handle structured output
        if (config.response_format?.type === 'json_schema') {
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
                    logger_1.default.warn(`[Snowflake Cortex] Failed to parse JSON output: ${String(error)}`);
                }
            }
        }
        return {
            output,
            tokenUsage: (0, util_1.getTokenUsage)(data, cached),
            cached,
            latencyMs,
            cost: (0, util_1.calculateOpenAICost)(this.modelName, config, data.usage?.prompt_tokens, data.usage?.completion_tokens),
            ...(finishReason && { finishReason }),
        };
    }
}
exports.SnowflakeCortexProvider = SnowflakeCortexProvider;
function createSnowflakeProvider(providerPath, options = {}) {
    const splits = providerPath.split(':');
    const modelName = splits.slice(1).join(':');
    if (!modelName) {
        throw new Error('Snowflake provider requires a model name. Use format: snowflake:<model_name>');
    }
    return new SnowflakeCortexProvider(modelName, {
        ...options,
        config: options.config ?? {},
    });
}
//# sourceMappingURL=snowflake.js.map