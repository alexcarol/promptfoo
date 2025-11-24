"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DMREmbeddingProvider = exports.DMRCompletionProvider = exports.DMRChatCompletionProvider = void 0;
exports.fetchLocalModels = fetchLocalModels;
exports.hasLocalModel = hasLocalModel;
exports.parseProviderPath = parseProviderPath;
exports.createDockerProvider = createDockerProvider;
const chat_1 = require("./openai/chat");
const completion_1 = require("./openai/completion");
const embedding_1 = require("./openai/embedding");
const envars_1 = require("../envars");
const cache_1 = require("../cache");
const logger_1 = __importDefault(require("../logger"));
async function fetchLocalModels(apiBaseUrl) {
    try {
        const { data } = await (0, cache_1.fetchWithCache)(`${apiBaseUrl}/models`, undefined, undefined, 'json', true, 0);
        return data?.data ?? [];
    }
    catch (e) {
        throw new Error(`Failed to connect to Docker Model Runner. Is it enabled? Are the API endpoints enabled? For details, see https://docs.docker.com/ai/model-runner. \n${e.message}`);
    }
}
async function hasLocalModel(modelId, apiBaseUrl) {
    const localModels = await fetchLocalModels(apiBaseUrl);
    return localModels.some((model) => model && model.id?.toLocaleLowerCase() === modelId?.toLocaleLowerCase());
}
function parseProviderPath(providerPath) {
    const splits = providerPath.split(':');
    const type = splits[1];
    switch (type) {
        case 'chat':
        case 'completion':
        case 'embeddings':
            return {
                type,
                model: splits.slice(2).join(':'),
            };
        case 'embedding':
            // Map 'embedding' to 'embeddings' for compatibility with the OpenAI API
            // This allows users to use either 'docker:embedding:model' or 'docker:embeddings:model'
            return {
                type: 'embeddings',
                model: splits.slice(2).join(':'),
            };
        default:
            return {
                type: 'chat',
                model: splits.slice(1).join(':'),
            };
    }
}
/**
 * Factory for creating Docker Model Runner providers using OpenAI-compatible endpoints.
 */
function createDockerProvider(providerPath, options = {}) {
    const apiUrl = options?.env?.DOCKER_MODEL_RUNNER_BASE_URL ??
        (0, envars_1.getEnvString)('DOCKER_MODEL_RUNNER_BASE_URL') ??
        'http://localhost:12434';
    const apiBaseUrl = apiUrl + '/engines/v1';
    const apiKey = options?.env?.DOCKER_MODEL_RUNNER_API_KEY ??
        (0, envars_1.getEnvString)('DOCKER_MODEL_RUNNER_API_KEY') ??
        'dmr';
    const openaiOptions = {
        ...options,
        config: {
            ...(options.config || {}),
            apiBaseUrl,
            apiKey,
        },
    };
    const { type, model } = parseProviderPath(providerPath);
    switch (type) {
        case 'chat':
        default:
            return new DMRChatCompletionProvider(model, openaiOptions);
        case 'completion':
            return new DMRCompletionProvider(model, openaiOptions);
        case 'embeddings':
            return new DMREmbeddingProvider(model, openaiOptions);
    }
}
class DMRChatCompletionProvider extends chat_1.OpenAiChatCompletionProvider {
    async callApi(prompt, context, callApiOptions) {
        if (!(await hasLocalModel(this.modelName, this.getApiUrl()))) {
            logger_1.default.warn(`Model '${this.modelName}' not found. Run 'docker model pull ${this.modelName}'.`);
        }
        return super.callApi(prompt, context, callApiOptions);
    }
}
exports.DMRChatCompletionProvider = DMRChatCompletionProvider;
class DMRCompletionProvider extends completion_1.OpenAiCompletionProvider {
    async callApi(prompt, context, callApiOptions) {
        if (!(await hasLocalModel(this.modelName, this.getApiUrl()))) {
            logger_1.default.warn(`Model '${this.modelName}' not found. Run 'docker model pull ${this.modelName}'.`);
        }
        return super.callApi(prompt, context, callApiOptions);
    }
}
exports.DMRCompletionProvider = DMRCompletionProvider;
class DMREmbeddingProvider extends embedding_1.OpenAiEmbeddingProvider {
    async callEmbeddingApi(text) {
        if (!(await hasLocalModel(this.modelName, this.getApiUrl()))) {
            logger_1.default.warn(`Model '${this.modelName}' not found. Run 'docker model pull ${this.modelName}'.`);
        }
        return super.callEmbeddingApi(text);
    }
}
exports.DMREmbeddingProvider = DMREmbeddingProvider;
//# sourceMappingURL=docker.js.map