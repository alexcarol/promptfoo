"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CometApiImageProvider = void 0;
exports.clearCometApiModelsCache = clearCometApiModelsCache;
exports.fetchCometApiModels = fetchCometApiModels;
exports.createCometApiProvider = createCometApiProvider;
const cache_1 = require("../cache");
const envars_1 = require("../envars");
const logger_1 = __importDefault(require("../logger"));
const chat_1 = require("./openai/chat");
const completion_1 = require("./openai/completion");
const embedding_1 = require("./openai/embedding");
const image_1 = require("./openai/image");
const shared_1 = require("./shared");
// Note: We no longer filter models - users specify intent via provider syntax like :chat:, :image:, :embedding:
let modelCache = null;
function clearCometApiModelsCache() {
    modelCache = null;
}
async function fetchCometApiModels(env) {
    if (modelCache) {
        return modelCache;
    }
    try {
        const apiKey = env?.COMETAPI_KEY || (0, envars_1.getEnvString)('COMETAPI_KEY');
        const headers = { Accept: 'application/json' };
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
        const { data } = await (0, cache_1.fetchWithCache)('https://api.cometapi.com/v1/models', { headers }, shared_1.REQUEST_TIMEOUT_MS);
        const raw = data?.data || data?.models || data;
        let models = [];
        if (Array.isArray(raw)) {
            models = raw.map((m) => ({
                id: m.id || m.model || m.name || (typeof m === 'string' ? m : ''),
            }));
        }
        // Return all models - let users specify their intent with :chat:, :image:, :embedding: prefixes
        modelCache = models;
    }
    catch (err) {
        logger_1.default.warn(`Failed to fetch cometapi models: ${String(err)}`);
        modelCache = [];
    }
    return modelCache;
}
/**
 * CometAPI Image Provider - extends OpenAI Image Provider for CometAPI's image generation models
 */
class CometApiImageProvider extends image_1.OpenAiImageProvider {
    constructor(modelName, options = {}) {
        super(modelName, {
            ...options,
            config: {
                ...options.config,
                apiKeyEnvar: 'COMETAPI_KEY',
                apiBaseUrl: 'https://api.cometapi.com/v1',
            },
        });
    }
    getApiKey() {
        if (this.config?.apiKey) {
            return this.config.apiKey;
        }
        return (0, envars_1.getEnvString)('COMETAPI_KEY');
    }
    getApiUrlDefault() {
        return 'https://api.cometapi.com/v1';
    }
}
exports.CometApiImageProvider = CometApiImageProvider;
/**
 * Factory for creating CometAPI providers using OpenAI-compatible endpoints.
 */
function createCometApiProvider(providerPath, options = {}) {
    const splits = providerPath.split(':');
    const type = splits[1];
    const modelName = splits.slice(2).join(':');
    const openaiOptions = {
        ...options,
        config: {
            ...(options.config || {}),
            apiBaseUrl: 'https://api.cometapi.com/v1',
            apiKeyEnvar: 'COMETAPI_KEY',
        },
    };
    if (type === 'chat') {
        return new chat_1.OpenAiChatCompletionProvider(modelName, openaiOptions);
    }
    else if (type === 'completion') {
        return new completion_1.OpenAiCompletionProvider(modelName, openaiOptions);
    }
    else if (type === 'embedding' || type === 'embeddings') {
        return new embedding_1.OpenAiEmbeddingProvider(modelName, openaiOptions);
    }
    else if (type === 'image') {
        return new CometApiImageProvider(modelName, openaiOptions);
    }
    // Default to chat provider when no type is specified
    const defaultModel = splits.slice(1).join(':');
    return new chat_1.OpenAiChatCompletionProvider(defaultModel, openaiOptions);
}
//# sourceMappingURL=cometapi.js.map