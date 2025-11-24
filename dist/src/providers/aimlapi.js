"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAimlApiModelsCache = clearAimlApiModelsCache;
exports.fetchAimlApiModels = fetchAimlApiModels;
exports.createAimlApiProvider = createAimlApiProvider;
const cache_1 = require("../cache");
const envars_1 = require("../envars");
const logger_1 = __importDefault(require("../logger"));
const chat_1 = require("./openai/chat");
const completion_1 = require("./openai/completion");
const embedding_1 = require("./openai/embedding");
const shared_1 = require("./shared");
let modelCache = null;
function clearAimlApiModelsCache() {
    modelCache = null;
}
async function fetchAimlApiModels(env) {
    if (modelCache) {
        return modelCache;
    }
    try {
        const apiKey = env?.AIML_API_KEY || (0, envars_1.getEnvString)('AIML_API_KEY');
        const headers = {};
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
        const { data } = await (0, cache_1.fetchWithCache)('https://api.aimlapi.com/models', { headers }, shared_1.REQUEST_TIMEOUT_MS);
        const models = data?.data || data?.models || data;
        if (Array.isArray(models)) {
            modelCache = models.map((m) => ({ id: m.id || m.model || m.name || m }));
        }
        else {
            modelCache = [];
        }
    }
    catch (err) {
        logger_1.default.warn(`Failed to fetch aimlapi models: ${String(err)}`);
        modelCache = [];
    }
    return modelCache;
}
/**
 * Factory for creating AI/ML API providers using OpenAI-compatible endpoints.
 */
function createAimlApiProvider(providerPath, options = {}) {
    const splits = providerPath.split(':');
    const type = splits[1];
    const modelName = splits.slice(2).join(':');
    const openaiOptions = {
        ...options,
        config: {
            ...(options.config || {}),
            apiBaseUrl: 'https://api.aimlapi.com/v1',
            apiKeyEnvar: 'AIML_API_KEY',
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
    // Default to chat provider when no type is specified
    const defaultModel = splits.slice(1).join(':');
    return new chat_1.OpenAiChatCompletionProvider(defaultModel, openaiOptions);
}
//# sourceMappingURL=aimlapi.js.map