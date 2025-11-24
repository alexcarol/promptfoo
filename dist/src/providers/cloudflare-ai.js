"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudflareAiEmbeddingProvider = exports.CloudflareAiCompletionProvider = exports.CloudflareAiChatCompletionProvider = void 0;
exports.createCloudflareAiProvider = createCloudflareAiProvider;
const envars_1 = require("../envars");
const invariant_1 = __importDefault(require("../util/invariant"));
const chat_1 = require("./openai/chat");
const completion_1 = require("./openai/completion");
const embedding_1 = require("./openai/embedding");
function getCloudflareApiConfig(config, env) {
    const apiTokenCandidate = config?.apiKey ||
        (config?.apiKeyEnvar
            ? (0, envars_1.getEnvString)(config.apiKeyEnvar) ||
                env?.[config.apiKeyEnvar]
            : undefined) ||
        env?.CLOUDFLARE_API_KEY ||
        (0, envars_1.getEnvString)('CLOUDFLARE_API_KEY');
    (0, invariant_1.default)(apiTokenCandidate, 'Cloudflare API token required. Supply it via config apiKey or apiKeyEnvar, or the CLOUDFLARE_API_KEY environment variable');
    const accountIdCandidate = config?.accountId ||
        (config?.accountIdEnvar
            ? (0, envars_1.getEnvString)(config.accountIdEnvar) ||
                env?.[config.accountIdEnvar]
            : undefined) ||
        env?.CLOUDFLARE_ACCOUNT_ID ||
        (0, envars_1.getEnvString)('CLOUDFLARE_ACCOUNT_ID');
    (0, invariant_1.default)(accountIdCandidate, 'Cloudflare account ID required. Supply it via config accountId or accountIdEnvar, or the CLOUDFLARE_ACCOUNT_ID environment variable');
    return {
        apiToken: apiTokenCandidate,
        accountId: accountIdCandidate,
    };
}
function getApiBaseUrl(config, env) {
    // If custom API base URL is provided, use it
    if (config?.apiBaseUrl) {
        return config.apiBaseUrl;
    }
    // Otherwise, construct the default Cloudflare AI API URL
    const { accountId } = getCloudflareApiConfig(config, env);
    return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`;
}
function getPassthroughConfig(config) {
    // Extract Cloudflare-specific config keys that shouldn't be passed through
    const { accountId: _accountId, accountIdEnvar: _accountIdEnvar, apiKey: _apiKey, apiKeyEnvar: _apiKeyEnvar, apiBaseUrl: _apiBaseUrl, ...passthrough } = config || {};
    return passthrough;
}
class CloudflareAiChatCompletionProvider extends chat_1.OpenAiChatCompletionProvider {
    constructor(modelName, providerOptions) {
        const apiBaseUrl = getApiBaseUrl(providerOptions.config, providerOptions.env);
        const passthrough = getPassthroughConfig(providerOptions.config);
        const config = {
            ...providerOptions.config,
            apiKeyEnvar: 'CLOUDFLARE_API_KEY',
            apiBaseUrl,
            passthrough,
        };
        super(modelName, {
            ...providerOptions,
            config,
        });
        this.modelType = 'chat';
        this.cloudflareConfig = providerOptions.config || {};
    }
    id() {
        return `cloudflare-ai:${this.modelType}:${this.modelName}`;
    }
    toString() {
        return `[Cloudflare AI ${this.modelType} Provider ${this.modelName}]`;
    }
    getApiKey() {
        const { apiToken } = getCloudflareApiConfig(this.cloudflareConfig, this.env);
        return apiToken;
    }
    toJSON() {
        return {
            provider: 'cloudflare-ai',
            model: this.modelName,
            modelType: this.modelType,
            config: {
                ...this.config,
                ...(this.getApiKey() && { apiKey: undefined }),
            },
        };
    }
}
exports.CloudflareAiChatCompletionProvider = CloudflareAiChatCompletionProvider;
class CloudflareAiCompletionProvider extends completion_1.OpenAiCompletionProvider {
    constructor(modelName, providerOptions) {
        const apiBaseUrl = getApiBaseUrl(providerOptions.config, providerOptions.env);
        const passthrough = getPassthroughConfig(providerOptions.config);
        const config = {
            ...providerOptions.config,
            apiKeyEnvar: 'CLOUDFLARE_API_KEY',
            apiBaseUrl,
            passthrough,
        };
        super(modelName, {
            ...providerOptions,
            config,
        });
        this.modelType = 'completion';
        this.cloudflareConfig = providerOptions.config || {};
    }
    id() {
        return `cloudflare-ai:${this.modelType}:${this.modelName}`;
    }
    toString() {
        return `[Cloudflare AI ${this.modelType} Provider ${this.modelName}]`;
    }
    getApiKey() {
        const { apiToken } = getCloudflareApiConfig(this.cloudflareConfig, this.env);
        return apiToken;
    }
    toJSON() {
        return {
            provider: 'cloudflare-ai',
            model: this.modelName,
            modelType: this.modelType,
            config: {
                ...this.config,
                ...(this.getApiKey() && { apiKey: undefined }),
            },
        };
    }
}
exports.CloudflareAiCompletionProvider = CloudflareAiCompletionProvider;
class CloudflareAiEmbeddingProvider extends embedding_1.OpenAiEmbeddingProvider {
    constructor(modelName, providerOptions) {
        const apiBaseUrl = getApiBaseUrl(providerOptions.config, providerOptions.env);
        const passthrough = getPassthroughConfig(providerOptions.config);
        const config = {
            ...providerOptions.config,
            apiKeyEnvar: 'CLOUDFLARE_API_KEY',
            apiBaseUrl,
            passthrough,
        };
        super(modelName, {
            ...providerOptions,
            config,
        });
        this.modelType = 'embedding';
        this.cloudflareConfig = providerOptions.config || {};
    }
    id() {
        return `cloudflare-ai:${this.modelType}:${this.modelName}`;
    }
    toString() {
        return `[Cloudflare AI ${this.modelType} Provider ${this.modelName}]`;
    }
    getApiKey() {
        const { apiToken } = getCloudflareApiConfig(this.cloudflareConfig, this.env);
        return apiToken;
    }
    toJSON() {
        return {
            provider: 'cloudflare-ai',
            model: this.modelName,
            modelType: this.modelType,
            config: {
                ...this.config,
                ...(this.getApiKey() && { apiKey: undefined }),
            },
        };
    }
}
exports.CloudflareAiEmbeddingProvider = CloudflareAiEmbeddingProvider;
function createCloudflareAiProvider(providerPath, options = {}) {
    const splits = providerPath.split(':');
    const modelType = splits[1];
    const modelName = splits.slice(2).join(':');
    (0, invariant_1.default)(modelName, 'Model name is required');
    switch (modelType) {
        case 'chat':
            return new CloudflareAiChatCompletionProvider(modelName, options);
        case 'completion':
            return new CloudflareAiCompletionProvider(modelName, options);
        case 'embedding':
        case 'embeddings':
            return new CloudflareAiEmbeddingProvider(modelName, options);
        default:
            throw new Error(`Unknown Cloudflare AI model type: ${modelType}`);
    }
}
//# sourceMappingURL=cloudflare-ai.js.map