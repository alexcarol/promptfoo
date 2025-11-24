"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiteLLMProvider = void 0;
exports.createLiteLLMProvider = createLiteLLMProvider;
const chat_1 = require("./openai/chat");
const completion_1 = require("./openai/completion");
const embedding_1 = require("./openai/embedding");
/**
 * Base class for LiteLLM providers that maintains LiteLLM identity
 */
class LiteLLMProviderWrapper {
    constructor(provider, providerType) {
        this.provider = provider;
        this.providerType = providerType;
    }
    get modelName() {
        return this.provider.modelName;
    }
    get config() {
        return this.provider.config;
    }
    id() {
        const typePrefix = this.providerType === 'chat' ? '' : `:${this.providerType}`;
        return `litellm${typePrefix}:${this.modelName}`;
    }
    toString() {
        const typeStr = this.providerType === 'chat' ? '' : ` ${this.providerType}`;
        return `[LiteLLM Provider${typeStr} ${this.modelName}]`;
    }
    toJSON() {
        return {
            provider: 'litellm',
            model: this.modelName,
            type: this.providerType,
            config: {
                ...this.config,
                ...(this.getApiKey && this.getApiKey() && { apiKey: undefined }),
            },
        };
    }
    // Delegate all other methods to the wrapped provider
    async callApi(prompt, context, options) {
        return this.provider.callApi(prompt, context, options);
    }
}
/**
 * LiteLLM Chat Provider
 */
class LiteLLMChatProvider extends LiteLLMProviderWrapper {
    constructor(modelName, options) {
        const provider = new chat_1.OpenAiChatCompletionProvider(modelName, options);
        super(provider, 'chat');
        // Bind getApiKey if it exists
        if (provider.getApiKey) {
            this.getApiKey = provider.getApiKey.bind(provider);
        }
    }
}
/**
 * LiteLLM Completion Provider
 */
class LiteLLMCompletionProvider extends LiteLLMProviderWrapper {
    constructor(modelName, options) {
        const provider = new completion_1.OpenAiCompletionProvider(modelName, options);
        super(provider, 'completion');
        if (provider.getApiKey) {
            this.getApiKey = provider.getApiKey.bind(provider);
        }
    }
}
/**
 * LiteLLM Embedding Provider
 */
class LiteLLMEmbeddingProvider extends LiteLLMProviderWrapper {
    constructor(modelName, options) {
        const provider = new embedding_1.OpenAiEmbeddingProvider(modelName, options);
        super(provider, 'embedding');
        this.embeddingProvider = provider;
        if (provider.getApiKey) {
            this.getApiKey = provider.getApiKey.bind(provider);
        }
    }
    async callEmbeddingApi(text) {
        return this.embeddingProvider.callEmbeddingApi(text);
    }
}
// For backward compatibility, export the chat provider as LiteLLMProvider
class LiteLLMProvider extends LiteLLMChatProvider {
}
exports.LiteLLMProvider = LiteLLMProvider;
/**
 * Creates a LiteLLM provider using OpenAI-compatible endpoints
 *
 * LiteLLM supports chat, completion, and embedding models through its proxy server.
 * All parameters are automatically passed through to the LiteLLM API.
 *
 * @example
 * // Chat model (default)
 * createLiteLLMProvider('litellm:gpt-4')
 * createLiteLLMProvider('litellm:chat:gpt-4')
 *
 * // Completion model
 * createLiteLLMProvider('litellm:completion:gpt-3.5-turbo-instruct')
 *
 * // Embedding model
 * createLiteLLMProvider('litellm:embedding:text-embedding-3-large')
 */
function createLiteLLMProvider(providerPath, options = {}) {
    const splits = providerPath.split(':');
    const providerType = splits[1];
    // Extract model name based on provider type
    const modelName = ['chat', 'completion', 'embedding', 'embeddings'].includes(providerType)
        ? splits.slice(2).join(':')
        : splits.slice(1).join(':');
    // Prepare LiteLLM-specific configuration
    const config = options.config?.config || {};
    // Build the config object with proper defaults
    const litellmConfigDefaults = {
        apiKeyEnvar: 'LITELLM_API_KEY',
        apiKeyRequired: false,
        apiBaseUrl: 'http://0.0.0.0:4000',
    };
    // Merge configs, with explicit config values taking precedence
    const mergedConfig = {
        ...litellmConfigDefaults,
    };
    // Only override properties that are actually defined and not null in config
    Object.keys(config).forEach((key) => {
        if (config[key] !== undefined && config[key] !== null) {
            mergedConfig[key] = config[key];
        }
    });
    // Construct the provider options
    const litellmConfig = {
        id: options.config?.id,
        label: options.config?.label,
        prompts: options.config?.prompts,
        transform: options.config?.transform,
        delay: options.config?.delay,
        env: options.config?.env,
        config: mergedConfig,
    };
    // Create the appropriate provider based on type
    switch (providerType) {
        case 'completion':
            return new LiteLLMCompletionProvider(modelName, litellmConfig);
        case 'embedding':
        case 'embeddings':
            return new LiteLLMEmbeddingProvider(modelName, litellmConfig);
        case 'chat':
            return new LiteLLMProvider(modelName, litellmConfig);
        default:
            // Default to chat for backward compatibility (e.g., 'litellm:gpt-4')
            return new LiteLLMProvider(modelName, litellmConfig);
    }
}
//# sourceMappingURL=litellm.js.map