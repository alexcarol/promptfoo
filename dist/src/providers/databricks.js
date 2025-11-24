"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabricksMosaicAiChatCompletionProvider = void 0;
const envars_1 = require("../envars");
const chat_1 = require("./openai/chat");
/**
 * Databricks Foundation Model APIs provider
 *
 * Supports:
 * - Pay-per-token endpoints (e.g., databricks-meta-llama-3-3-70b-instruct)
 * - Provisioned throughput endpoints (custom deployed models)
 * - External model endpoints (proxies to OpenAI, Anthropic, etc.)
 *
 * @see https://docs.databricks.com/en/machine-learning/foundation-models/index.html
 */
class DatabricksMosaicAiChatCompletionProvider extends chat_1.OpenAiChatCompletionProvider {
    constructor(modelName, providerOptions) {
        const workspaceUrl = providerOptions.config?.workspaceUrl || (0, envars_1.getEnvString)('DATABRICKS_WORKSPACE_URL');
        if (!workspaceUrl) {
            throw new Error('Databricks workspace URL is required. Set it in the config or DATABRICKS_WORKSPACE_URL environment variable.');
        }
        // Ensure workspace URL doesn't have trailing slash
        const cleanWorkspaceUrl = workspaceUrl.replace(/\/$/, '');
        // For pay-per-token endpoints, the model name is the full endpoint name
        // For custom endpoints, we use the serving-endpoints path
        const apiBaseUrl = providerOptions.config?.isPayPerToken
            ? cleanWorkspaceUrl
            : `${cleanWorkspaceUrl}/serving-endpoints`;
        const mergedConfig = {
            ...providerOptions.config,
            apiKeyEnvar: providerOptions.config?.apiKeyEnvar || 'DATABRICKS_TOKEN',
            apiBaseUrl,
            // Pass through usage context and AI Gateway config as extra body params
            ...(providerOptions.config?.usageContext && {
                extraBodyParams: {
                    ...providerOptions.config.extraBodyParams,
                    usage_context: providerOptions.config.usageContext,
                },
            }),
        };
        super(modelName, {
            ...providerOptions,
            config: mergedConfig,
        });
        // Set the config property with the full Databricks-specific configuration
        this.config = mergedConfig;
    }
    /**
     * Override getApiUrl to handle Databricks-specific endpoint patterns
     */
    getApiUrl() {
        // For pay-per-token endpoints, use the model name directly in the path
        if (this.config.isPayPerToken) {
            return `${this.config.apiBaseUrl}/serving-endpoints/${this.modelName}/invocations`;
        }
        // For custom endpoints, use standard OpenAI chat completions path
        return super.getApiUrl();
    }
}
exports.DatabricksMosaicAiChatCompletionProvider = DatabricksMosaicAiChatCompletionProvider;
//# sourceMappingURL=databricks.js.map