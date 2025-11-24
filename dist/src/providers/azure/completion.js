"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureCompletionProvider = void 0;
const cache_1 = require("../../cache");
const envars_1 = require("../../envars");
const logger_1 = __importDefault(require("../../logger"));
const finishReason_1 = require("../../util/finishReason");
const invariant_1 = __importDefault(require("../../util/invariant"));
const shared_1 = require("../shared");
const defaults_1 = require("./defaults");
const generic_1 = require("./generic");
const util_1 = require("./util");
class AzureCompletionProvider extends generic_1.AzureGenericProvider {
    async callApi(prompt, context, _callApiOptions) {
        await this.ensureInitialized();
        (0, invariant_1.default)(this.authHeaders, 'auth headers are not initialized');
        if (!this.getApiBaseUrl()) {
            throw new Error('Azure API host must be set.');
        }
        let stop;
        try {
            const stopEnvVar = (0, envars_1.getEnvString)('OPENAI_STOP');
            stop = stopEnvVar ? JSON.parse(stopEnvVar) : (this.config.stop ?? '');
        }
        catch (err) {
            throw new Error(`OPENAI_STOP is not a valid JSON string: ${err}`);
        }
        const body = {
            model: this.deploymentName,
            prompt,
            max_tokens: this.config.max_tokens ?? (0, envars_1.getEnvInt)('OPENAI_MAX_TOKENS', 1024),
            temperature: this.config.temperature ?? (0, envars_1.getEnvFloat)('OPENAI_TEMPERATURE', 0),
            top_p: this.config.top_p ?? (0, envars_1.getEnvFloat)('OPENAI_TOP_P', 1),
            presence_penalty: this.config.presence_penalty ?? (0, envars_1.getEnvFloat)('OPENAI_PRESENCE_PENALTY', 0),
            frequency_penalty: this.config.frequency_penalty ?? (0, envars_1.getEnvFloat)('OPENAI_FREQUENCY_PENALTY', 0),
            best_of: this.config.best_of ?? (0, envars_1.getEnvInt)('OPENAI_BEST_OF', 1),
            ...(stop ? { stop } : {}),
            ...(this.config.passthrough || {}),
        };
        let data;
        let cached = false;
        try {
            ({ data, cached } = (await (0, cache_1.fetchWithCache)(`${this.getApiBaseUrl()}/openai/deployments/${this.deploymentName}/completions?api-version=${this.config.apiVersion || defaults_1.DEFAULT_AZURE_API_VERSION}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.authHeaders,
                    ...this.config.headers,
                },
                body: JSON.stringify(body),
            }, shared_1.REQUEST_TIMEOUT_MS, 'json', context?.bustCache ?? context?.debug)));
        }
        catch (err) {
            return {
                error: `API call error: ${String(err)}`,
            };
        }
        try {
            // Handle content filter errors (HTTP 400 with content_filter code)
            if (data.error) {
                if (data.error.code === 'content_filter' && data.error.status === 400) {
                    return {
                        output: data.error.message,
                        guardrails: {
                            flagged: true,
                            flaggedInput: true,
                            flaggedOutput: false,
                        },
                    };
                }
                return {
                    error: `API response error: ${data.error.code} ${data.error.message}`,
                };
            }
            const choice = data.choices[0];
            const finishReason = (0, finishReason_1.normalizeFinishReason)(choice?.finish_reason);
            // Check if content was filtered based on finish_reason
            const contentFilterTriggered = finishReason === 'content_filter';
            let output = choice.text;
            if (output == null) {
                if (contentFilterTriggered) {
                    output =
                        "The generated content was filtered due to triggering Azure OpenAI Service's content filtering system.";
                }
                else {
                    output = '';
                }
            }
            // Check for content filter results in the response
            const contentFilterResults = choice?.content_filter_results;
            const promptFilterResults = data.prompt_filter_results;
            // Determine if input was flagged
            const flaggedInput = promptFilterResults?.some((result) => Object.values(result.content_filter_results || {}).some((filter) => filter.filtered)) ?? false;
            // Determine if output was flagged
            const flaggedOutput = contentFilterTriggered ||
                Object.values(contentFilterResults || {}).some((filter) => filter.filtered);
            if (flaggedOutput) {
                logger_1.default.warn(`Azure model ${this.deploymentName} output was flagged by content filter: ${JSON.stringify(contentFilterResults)}`);
            }
            if (flaggedInput) {
                logger_1.default.warn(`Azure model ${this.deploymentName} input was flagged by content filter: ${JSON.stringify(promptFilterResults)}`);
            }
            const guardrailsTriggered = flaggedInput || flaggedOutput;
            return {
                output,
                tokenUsage: cached
                    ? { cached: data.usage.total_tokens, total: data.usage.total_tokens }
                    : {
                        total: data.usage.total_tokens,
                        prompt: data.usage.prompt_tokens,
                        completion: data.usage.completion_tokens,
                    },
                ...(finishReason && { finishReason }),
                cost: (0, util_1.calculateAzureCost)(this.deploymentName, this.config, data.usage?.prompt_tokens, data.usage?.completion_tokens),
                ...(guardrailsTriggered
                    ? {
                        guardrails: {
                            flagged: true,
                            flaggedInput,
                            flaggedOutput,
                        },
                    }
                    : {}),
            };
        }
        catch (err) {
            return {
                error: `API response error: ${String(err)}: ${JSON.stringify(data)}`,
                tokenUsage: cached
                    ? {
                        cached: data.usage.total_tokens,
                        total: data.usage.total_tokens,
                    }
                    : {
                        total: data?.usage?.total_tokens,
                        prompt: data?.usage?.prompt_tokens,
                        completion: data?.usage?.completion_tokens,
                    },
            };
        }
    }
}
exports.AzureCompletionProvider = AzureCompletionProvider;
//# sourceMappingURL=completion.js.map