"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiEmbeddingProvider = void 0;
const cache_1 = require("../../cache");
const logger_1 = __importDefault(require("../../logger"));
const shared_1 = require("../shared");
const _1 = require(".");
const util_1 = require("./util");
class OpenAiEmbeddingProvider extends _1.OpenAiGenericProvider {
    async callEmbeddingApi(text) {
        // Validate API key first (like chat provider)
        if (this.requiresApiKey() && !this.getApiKey()) {
            return {
                error: `API key is not set. Set the ${this.config.apiKeyEnvar || 'OPENAI_API_KEY'} environment variable or add \`apiKey\` to the provider config.`,
            };
        }
        // Validate input type to catch objects early
        if (typeof text !== 'string') {
            return {
                error: `Invalid input type for embedding API. Expected string, got ${typeof text}. Input: ${JSON.stringify(text)}`,
            };
        }
        const body = {
            input: text,
            model: this.modelName,
        };
        let data;
        let status;
        let statusText;
        let deleteFromCache;
        let cached = false;
        let latencyMs;
        try {
            const response = await (0, cache_1.fetchWithCache)(`${this.getApiUrl()}/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.getApiKey()}`,
                    ...(this.getOrganization() ? { 'OpenAI-Organization': this.getOrganization() } : {}),
                    ...this.config.headers,
                },
                body: JSON.stringify(body),
            }, shared_1.REQUEST_TIMEOUT_MS, 'json', false, this.config.maxRetries);
            ({ data, cached, status, statusText, latencyMs, deleteFromCache } = response);
            // Check HTTP status like chat provider
            if (status && (status < 200 || status >= 300)) {
                return {
                    error: `API error: ${status} ${statusText || 'Unknown error'}\n${typeof data === 'string' ? data : JSON.stringify(data)}`,
                };
            }
        }
        catch (err) {
            logger_1.default.error(`API call error: ${String(err)}`);
            await deleteFromCache?.();
            return {
                error: `API call error: ${String(err)}`,
            };
        }
        try {
            const embedding = data?.data?.[0]?.embedding;
            if (!embedding) {
                return {
                    error: 'No embedding found in OpenAI embeddings API response',
                };
            }
            return {
                embedding,
                latencyMs,
                tokenUsage: (0, util_1.getTokenUsage)(data, cached),
            };
        }
        catch (err) {
            logger_1.default.error(`Response parsing error: ${String(err)}`);
            await deleteFromCache?.();
            return {
                error: `API error: ${String(err)}: ${JSON.stringify(data)}`,
            };
        }
    }
}
exports.OpenAiEmbeddingProvider = OpenAiEmbeddingProvider;
//# sourceMappingURL=embedding.js.map