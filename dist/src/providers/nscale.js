"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNscaleProvider = createNscaleProvider;
const envars_1 = require("../envars");
const chat_1 = require("./openai/chat");
const completion_1 = require("./openai/completion");
const embedding_1 = require("./openai/embedding");
const image_1 = require("./nscale/image");
/**
 * Creates an Nscale provider using OpenAI-compatible endpoints
 *
 * Nscale provides serverless AI inference with OpenAI-compatible API endpoints.
 * All parameters are automatically passed through to the Nscale API.
 *
 * Documentation: https://docs.nscale.com/
 */
function createNscaleProvider(providerPath, options = {}) {
    const splits = providerPath.split(':');
    const config = options.config?.config || {};
    // Prefer service tokens over API keys (API keys deprecated Oct 30, 2025)
    const getApiKey = () => {
        return (config.apiKey ||
            options.env?.NSCALE_SERVICE_TOKEN ||
            (0, envars_1.getEnvString)('NSCALE_SERVICE_TOKEN') ||
            options.env?.NSCALE_API_KEY ||
            (0, envars_1.getEnvString)('NSCALE_API_KEY'));
    };
    const nscaleConfig = {
        ...options,
        config: {
            apiBaseUrl: 'https://inference.api.nscale.com/v1',
            apiKey: getApiKey(),
            passthrough: {
                ...config,
            },
        },
    };
    if (splits[1] === 'chat') {
        const modelName = splits.slice(2).join(':');
        return new chat_1.OpenAiChatCompletionProvider(modelName, nscaleConfig);
    }
    else if (splits[1] === 'completion') {
        const modelName = splits.slice(2).join(':');
        return new completion_1.OpenAiCompletionProvider(modelName, nscaleConfig);
    }
    else if (splits[1] === 'embedding' || splits[1] === 'embeddings') {
        const modelName = splits.slice(2).join(':');
        return new embedding_1.OpenAiEmbeddingProvider(modelName, nscaleConfig);
    }
    else if (splits[1] === 'image') {
        return (0, image_1.createNscaleImageProvider)(providerPath, {
            config: options.config, // Allow flexible config type for Nscale image options
            id: options.id,
            env: options.env,
        });
    }
    else {
        // If no specific type is provided, default to chat
        const modelName = splits.slice(1).join(':');
        return new chat_1.OpenAiChatCompletionProvider(modelName, nscaleConfig);
    }
}
//# sourceMappingURL=nscale.js.map