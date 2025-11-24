"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrueFoundryEmbeddingProvider = exports.TrueFoundryProvider = void 0;
exports.createTrueFoundryProvider = createTrueFoundryProvider;
const chat_1 = require("./openai/chat");
const embedding_1 = require("./openai/embedding");
/**
 * TrueFoundry LLM Gateway Provider
 *
 * Provides access to 1000+ LLMs through TrueFoundry's unified gateway with
 * enterprise-grade security, observability, and governance.
 */
class TrueFoundryProvider extends chat_1.OpenAiChatCompletionProvider {
    constructor(modelName, providerOptions = {}) {
        super(modelName, {
            ...providerOptions,
            config: {
                ...providerOptions.config,
                apiKeyEnvar: 'TRUEFOUNDRY_API_KEY',
                apiBaseUrl: providerOptions.config?.apiBaseUrl || 'https://llm-gateway.truefoundry.com',
            },
        });
    }
    /**
     * Override isReasoningModel to correctly detect GPT-5 and other reasoning models
     * despite TrueFoundry's provider-account/model-name format
     */
    isReasoningModel() {
        // Extract the actual model name after the provider prefix (e.g., "openai/gpt-5-nano" -> "gpt-5-nano")
        const actualModelName = this.modelName.split('/').pop() || this.modelName;
        return (actualModelName.startsWith('o1') ||
            actualModelName.startsWith('o3') ||
            actualModelName.startsWith('o4') ||
            actualModelName.startsWith('gpt-5'));
    }
    /**
     * Override getOpenAiBody to add TrueFoundry-specific headers and body parameters
     */
    getOpenAiBody(prompt, context, callApiOptions) {
        const { body, config } = super.getOpenAiBody(prompt, context, callApiOptions);
        // Add TrueFoundry-specific headers
        const headers = {
            ...config.headers,
        };
        const tfConfig = this.config;
        // Add metadata header if provided
        if (tfConfig.metadata) {
            headers['X-TFY-METADATA'] = JSON.stringify(tfConfig.metadata);
        }
        // Add logging config header if provided
        if (tfConfig.loggingConfig) {
            headers['X-TFY-LOGGING-CONFIG'] = JSON.stringify(tfConfig.loggingConfig);
        }
        // Add TrueFoundry-specific body parameters (MCP servers, iteration limit)
        const tfBody = {
            ...body,
        };
        // Remove metadata from body since it's sent as a header in TrueFoundry
        // The parent OpenAI class adds it to the body, but TrueFoundry uses X-TFY-METADATA header
        if (tfConfig.metadata && tfBody.metadata) {
            delete tfBody.metadata;
        }
        if (tfConfig.mcp_servers) {
            tfBody.mcp_servers = tfConfig.mcp_servers;
        }
        if (tfConfig.iteration_limit !== undefined) {
            tfBody.iteration_limit = tfConfig.iteration_limit;
        }
        return {
            body: tfBody,
            config: {
                ...config,
                headers,
            },
        };
    }
    id() {
        return `truefoundry:${this.modelName}`;
    }
    toString() {
        return `[TrueFoundry Provider ${this.modelName}]`;
    }
    toJSON() {
        return {
            provider: 'truefoundry',
            model: this.modelName,
            config: {
                ...this.config,
                ...(this.config.apiKey && { apiKey: undefined }),
            },
        };
    }
}
exports.TrueFoundryProvider = TrueFoundryProvider;
/**
 * TrueFoundry Embedding Provider
 *
 * Provides embedding capabilities through TrueFoundry's gateway
 */
class TrueFoundryEmbeddingProvider extends embedding_1.OpenAiEmbeddingProvider {
    constructor(modelName, providerOptions = {}) {
        super(modelName, {
            ...providerOptions,
            config: {
                ...providerOptions.config,
                apiKeyEnvar: 'TRUEFOUNDRY_API_KEY',
                apiBaseUrl: providerOptions.config?.apiBaseUrl || 'https://llm-gateway.truefoundry.com',
            },
        });
    }
    /**
     * Override callEmbeddingApi to add TrueFoundry-specific headers
     */
    async callEmbeddingApi(text) {
        const tfConfig = this.config;
        // Add TrueFoundry-specific headers
        const headers = {
            ...(this.config.headers || {}),
        };
        if (tfConfig.metadata) {
            headers['X-TFY-METADATA'] = JSON.stringify(tfConfig.metadata);
        }
        if (tfConfig.loggingConfig) {
            headers['X-TFY-LOGGING-CONFIG'] = JSON.stringify(tfConfig.loggingConfig);
        }
        // Temporarily set headers in config
        const originalHeaders = this.config.headers;
        this.config.headers = headers;
        try {
            // Call parent implementation
            return await super.callEmbeddingApi(text);
        }
        finally {
            // Restore original headers
            this.config.headers = originalHeaders;
        }
    }
    id() {
        return `truefoundry:${this.modelName}`;
    }
    toString() {
        return `[TrueFoundry Embedding Provider ${this.modelName}]`;
    }
    toJSON() {
        return {
            provider: 'truefoundry',
            model: this.modelName,
            config: {
                ...this.config,
                ...(this.config.apiKey && { apiKey: undefined }),
            },
        };
    }
}
exports.TrueFoundryEmbeddingProvider = TrueFoundryEmbeddingProvider;
/**
 * Creates a TrueFoundry provider
 *
 * @param providerPath - Provider path, e.g., "truefoundry:openai/gpt-4"
 * @param options - Provider options
 * @returns A TrueFoundry provider (chat or embedding based on model type)
 */
function createTrueFoundryProvider(providerPath, options = {}) {
    const splits = providerPath.split(':');
    const modelName = splits.slice(1).join(':');
    // Determine if this is an embedding model based on model name
    const isEmbeddingModel = modelName.toLowerCase().includes('embedding');
    const providerOptions = {
        ...options.config,
        env: options.env,
    };
    if (isEmbeddingModel) {
        return new TrueFoundryEmbeddingProvider(modelName, providerOptions);
    }
    return new TrueFoundryProvider(modelName, providerOptions);
}
//# sourceMappingURL=truefoundry.js.map