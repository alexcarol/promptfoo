"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlamaApiProvider = exports.LLAMA_API_MULTIMODAL_MODELS = exports.LLAMA_API_MODELS = void 0;
exports.createLlamaApiProvider = createLlamaApiProvider;
const chat_1 = require("./openai/chat");
exports.LLAMA_API_MODELS = [
    // Llama 4 Models (Multimodal)
    {
        id: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        inputModalities: ['text', 'image'],
        outputModalities: ['text'],
        contextWindow: 128000,
        aliases: ['llama-4-maverick'],
    },
    {
        id: 'Llama-4-Scout-17B-16E-Instruct-FP8',
        inputModalities: ['text', 'image'],
        outputModalities: ['text'],
        contextWindow: 128000,
        aliases: ['llama-4-scout'],
    },
    // Llama 3.3 Models (Text-only)
    {
        id: 'Llama-3.3-70B-Instruct',
        inputModalities: ['text'],
        outputModalities: ['text'],
        contextWindow: 128000,
        aliases: ['llama-3.3-70b'],
    },
    {
        id: 'Llama-3.3-8B-Instruct',
        inputModalities: ['text'],
        outputModalities: ['text'],
        contextWindow: 128000,
        aliases: ['llama-3.3-8b'],
    },
    // Accelerated Variants (Preview)
    {
        id: 'Cerebras-Llama-4-Maverick-17B-128E-Instruct',
        inputModalities: ['text'],
        outputModalities: ['text'],
        contextWindow: 32000,
        provider: 'Cerebras',
        aliases: ['cerebras-llama-4-maverick'],
    },
    {
        id: 'Cerebras-Llama-4-Scout-17B-16E-Instruct',
        inputModalities: ['text'],
        outputModalities: ['text'],
        contextWindow: 32000,
        provider: 'Cerebras',
        aliases: ['cerebras-llama-4-scout'],
    },
    {
        id: 'Groq-Llama-4-Maverick-17B-128E-Instruct',
        inputModalities: ['text'],
        outputModalities: ['text'],
        contextWindow: 128000,
        provider: 'Groq',
        aliases: ['groq-llama-4-maverick'],
    },
];
exports.LLAMA_API_MULTIMODAL_MODELS = [
    'Llama-4-Maverick-17B-128E-Instruct-FP8',
    'Llama-4-Scout-17B-16E-Instruct-FP8',
];
class LlamaApiProvider extends chat_1.OpenAiChatCompletionProvider {
    constructor(modelName, options = {}) {
        super(modelName, {
            ...options,
            config: {
                ...options.config,
                apiBaseUrl: 'https://api.llama.com/compat/v1',
                apiKeyEnvar: 'LLAMA_API_KEY',
                passthrough: {
                    ...options.config?.passthrough,
                },
            },
        });
    }
    id() {
        return `llamaapi:${this.modelName}`;
    }
    toString() {
        return `[Llama API Provider ${this.modelName}]`;
    }
    toJSON() {
        const { apiKey: _redacted, ...restConfig } = this.config ?? {};
        return {
            provider: 'llamaapi',
            model: this.modelName,
            config: restConfig,
        };
    }
    static getModelInfo(modelName) {
        return exports.LLAMA_API_MODELS.find((m) => m.id === modelName || (m.aliases && m.aliases.includes(modelName)));
    }
    static isMultimodalModel(modelName) {
        const modelInfo = LlamaApiProvider.getModelInfo(modelName);
        return modelInfo ? modelInfo.inputModalities.includes('image') : false;
    }
    static validateModelName(modelName) {
        return exports.LLAMA_API_MODELS.some((m) => m.id === modelName || (m.aliases && m.aliases.includes(modelName)));
    }
}
exports.LlamaApiProvider = LlamaApiProvider;
/**
 * Creates a Llama API provider using OpenAI-compatible endpoints
 */
function createLlamaApiProvider(providerPath, options = {}) {
    const splits = providerPath.split(':');
    if (splits[1] === 'chat') {
        const modelName = splits.slice(2).join(':');
        return new LlamaApiProvider(modelName, {
            ...options.config,
            id: options.id,
            env: options.env,
        });
    }
    else {
        // Default to chat for llamaapi provider
        const modelName = splits.slice(1).join(':');
        return new LlamaApiProvider(modelName, {
            ...options.config,
            id: options.id,
            env: options.env,
        });
    }
}
//# sourceMappingURL=llamaApi.js.map