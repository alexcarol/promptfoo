"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeliconeGatewayProvider = void 0;
const chat_1 = require("./openai/chat");
const envars_1 = require("../envars");
/**
 * Helicone AI Gateway provider
 * Routes requests through a self-hosted Helicone AI Gateway instance
 * Uses OpenAI-compatible interface with automatic provider routing
 */
class HeliconeGatewayProvider extends chat_1.OpenAiChatCompletionProvider {
    constructor(modelName, options = {}) {
        const config = options.config || {};
        // Default base URL to localhost Helicone AI Gateway
        const baseUrl = config.baseUrl || 'http://localhost:8080';
        // Determine endpoint based on router configuration
        let apiBaseUrl;
        if (config.router) {
            apiBaseUrl = `${baseUrl}/router/${config.router}`;
        }
        else {
            apiBaseUrl = `${baseUrl}/ai`;
        }
        // Use the model from config or the provided modelName
        const model = config.model || modelName;
        // Create the modified config for OpenAI provider
        const openAiConfig = {
            ...config,
            apiBaseUrl,
            // Use placeholder API key since Helicone Gateway handles authentication
            apiKey: config.apiKey || (0, envars_1.getEnvString)('HELICONE_API_KEY') || 'placeholder-api-key',
        };
        // Call parent constructor with the model and modified config
        super(model, {
            ...options,
            config: openAiConfig,
        });
        // Store the original Helicone config after super() call
        this.heliconeConfig = config;
    }
    id() {
        const router = this.heliconeConfig.router ? `:${this.heliconeConfig.router}` : '';
        return `helicone-gateway${router}:${this.modelName}`;
    }
    toString() {
        const baseUrl = this.config.apiBaseUrl || this.heliconeConfig.baseUrl || 'http://localhost:8080';
        return `[Helicone AI Gateway ${baseUrl}]`;
    }
}
exports.HeliconeGatewayProvider = HeliconeGatewayProvider;
//# sourceMappingURL=helicone.js.map