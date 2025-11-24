"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicMessagesProvider = void 0;
const sdk_1 = require("@anthropic-ai/sdk");
const cache_1 = require("../../cache");
const envars_1 = require("../../envars");
const logger_1 = __importDefault(require("../../logger"));
const finishReason_1 = require("../../util/finishReason");
const file_1 = require("../../util/file");
const index_1 = require("../../util/index");
const tokenUsageUtils_1 = require("../../util/tokenUsageUtils");
const client_1 = require("../mcp/client");
const transform_1 = require("../mcp/transform");
const generic_1 = require("./generic");
const util_1 = require("./util");
class AnthropicMessagesProvider extends generic_1.AnthropicGenericProvider {
    constructor(modelName, options = {}) {
        if (!AnthropicMessagesProvider.ANTHROPIC_MODELS_NAMES.includes(modelName)) {
            logger_1.default.warn(`Using unknown Anthropic model: ${modelName}`);
        }
        super(modelName, options);
        this.mcpClient = null;
        this.initializationPromise = null;
        const { id } = options;
        this.id = id ? () => id : this.id;
        // Start initialization if MCP is enabled
        if (this.config.mcp?.enabled) {
            this.initializationPromise = this.initializeMCP();
        }
    }
    async initializeMCP() {
        this.mcpClient = new client_1.MCPClient(this.config.mcp);
        await this.mcpClient.initialize();
    }
    async cleanup() {
        if (this.mcpClient) {
            await this.initializationPromise;
            await this.mcpClient.cleanup();
            this.mcpClient = null;
        }
    }
    toString() {
        if (!this.modelName) {
            throw new Error('Anthropic model name is not set. Please provide a valid model name.');
        }
        return `[Anthropic Messages Provider ${this.modelName}]`;
    }
    async callApi(prompt, context) {
        // Wait for MCP initialization if it's in progress
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        if (!this.apiKey) {
            throw new Error('Anthropic API key is not set. Set the ANTHROPIC_API_KEY environment variable or add `apiKey` to the provider config.');
        }
        if (!this.modelName) {
            throw new Error('Anthropic model name is not set. Please provide a valid model name.');
        }
        // Merge configs from the provider and the prompt
        const config = {
            ...this.config,
            ...context?.prompt?.config,
        };
        const { system, extractedMessages, thinking } = (0, util_1.parseMessages)(prompt);
        // Get MCP tools if client is initialized
        let mcpTools = [];
        if (this.mcpClient) {
            mcpTools = (0, transform_1.transformMCPToolsToAnthropic)(this.mcpClient.getAllTools());
        }
        // Load and process tools from config (handles both external files and inline tool definitions)
        const configTools = (0, index_1.maybeLoadToolsFromExternalFile)(config.tools) || [];
        const { processedTools: processedConfigTools, requiredBetaFeatures } = (0, util_1.processAnthropicTools)(configTools);
        // Combine all tools
        const allTools = [...mcpTools, ...processedConfigTools];
        // Process output_format with external file loading and variable rendering
        let processedOutputFormat = config.output_format;
        if (config.output_format) {
            // First load the outer output_format if it's a file reference
            const renderedOutputFormat = (0, index_1.renderVarsInObject)(config.output_format, context?.vars);
            const loadedOutputFormat = (0, file_1.maybeLoadFromExternalFile)(renderedOutputFormat);
            // Then load the nested schema if it's a file reference
            if (loadedOutputFormat &&
                typeof loadedOutputFormat === 'object' &&
                'schema' in loadedOutputFormat) {
                const loadedSchema = (0, file_1.maybeLoadFromExternalFile)((0, index_1.renderVarsInObject)(loadedOutputFormat.schema, context?.vars));
                processedOutputFormat = {
                    ...loadedOutputFormat,
                    schema: loadedSchema,
                };
            }
            else {
                processedOutputFormat = loadedOutputFormat;
            }
        }
        const shouldStream = config.stream ?? false;
        const params = {
            model: this.modelName,
            ...(system ? { system } : {}),
            max_tokens: config?.max_tokens ||
                (0, envars_1.getEnvInt)('ANTHROPIC_MAX_TOKENS', config.thinking || thinking ? 2048 : 1024),
            messages: extractedMessages,
            stream: shouldStream,
            temperature: config.thinking || thinking
                ? config.temperature
                : config.temperature || (0, envars_1.getEnvFloat)('ANTHROPIC_TEMPERATURE', 0),
            ...(allTools.length > 0 ? { tools: allTools } : {}),
            ...(config.tool_choice ? { tool_choice: config.tool_choice } : {}),
            ...(config.thinking || thinking ? { thinking: config.thinking || thinking } : {}),
            ...(processedOutputFormat ? { output_format: processedOutputFormat } : {}),
            ...(typeof config?.extra_body === 'object' && config.extra_body ? config.extra_body : {}),
        };
        logger_1.default.debug('Calling Anthropic Messages API', { params });
        const headers = {
            ...(config.headers || {}),
        };
        // Add beta features header if specified
        let allBetaFeatures = [...(config.beta || []), ...requiredBetaFeatures];
        // Automatically add structured-outputs beta when output_format is used
        if (processedOutputFormat && !allBetaFeatures.includes('structured-outputs-2025-11-13')) {
            allBetaFeatures.push('structured-outputs-2025-11-13');
        }
        // Deduplicate beta features
        allBetaFeatures = [...new Set(allBetaFeatures)];
        if (allBetaFeatures.length > 0) {
            headers['anthropic-beta'] = allBetaFeatures.join(',');
        }
        const cache = await (0, cache_1.getCache)();
        const cacheKey = `anthropic:${JSON.stringify(params)}`;
        if ((0, cache_1.isCacheEnabled)()) {
            // Try to get the cached response
            const cachedResponse = await cache.get(cacheKey);
            if (cachedResponse) {
                logger_1.default.debug(`Returning cached response for ${prompt}: ${cachedResponse}`);
                try {
                    const parsedCachedResponse = JSON.parse(cachedResponse);
                    const finishReason = (0, finishReason_1.normalizeFinishReason)(parsedCachedResponse.stop_reason);
                    let output = (0, util_1.outputFromMessage)(parsedCachedResponse, config.showThinking ?? true);
                    // Handle structured JSON output parsing
                    if (processedOutputFormat?.type === 'json_schema' && typeof output === 'string') {
                        try {
                            output = JSON.parse(output);
                        }
                        catch (error) {
                            logger_1.default.error(`Failed to parse JSON output from structured outputs: ${error}`);
                        }
                    }
                    return {
                        output,
                        tokenUsage: (0, util_1.getTokenUsage)(parsedCachedResponse, true),
                        ...(finishReason && { finishReason }),
                        cost: (0, util_1.calculateAnthropicCost)(this.modelName, config, parsedCachedResponse.usage?.input_tokens, parsedCachedResponse.usage?.output_tokens),
                    };
                }
                catch {
                    // Could be an old cache item, which was just the text content from TextBlock.
                    return {
                        output: cachedResponse,
                        tokenUsage: (0, tokenUsageUtils_1.createEmptyTokenUsage)(),
                    };
                }
            }
        }
        try {
            if (shouldStream) {
                // Handle streaming request
                const stream = await this.anthropic.messages.stream(params, {
                    ...(typeof headers === 'object' && Object.keys(headers).length > 0 ? { headers } : {}),
                });
                // Wait for the stream to complete and get the final message
                const finalMessage = await stream.finalMessage();
                logger_1.default.debug(`Anthropic Messages API streaming complete`, { finalMessage });
                if ((0, cache_1.isCacheEnabled)()) {
                    try {
                        await cache.set(cacheKey, JSON.stringify(finalMessage));
                    }
                    catch (err) {
                        logger_1.default.error(`Failed to cache response: ${String(err)}`);
                    }
                }
                const finishReason = (0, finishReason_1.normalizeFinishReason)(finalMessage.stop_reason);
                let output = (0, util_1.outputFromMessage)(finalMessage, config.showThinking ?? true);
                // Handle structured JSON output parsing
                if (processedOutputFormat?.type === 'json_schema' && typeof output === 'string') {
                    try {
                        output = JSON.parse(output);
                    }
                    catch (error) {
                        logger_1.default.error(`Failed to parse JSON output from structured outputs: ${error}`);
                    }
                }
                return {
                    output,
                    tokenUsage: (0, util_1.getTokenUsage)(finalMessage, false),
                    ...(finishReason && { finishReason }),
                    cost: (0, util_1.calculateAnthropicCost)(this.modelName, config, finalMessage.usage?.input_tokens, finalMessage.usage?.output_tokens),
                };
            }
            else {
                // Handle non-streaming request
                const response = (await this.anthropic.messages.create(params, {
                    ...(typeof headers === 'object' && Object.keys(headers).length > 0 ? { headers } : {}),
                }));
                logger_1.default.debug(`Anthropic Messages API response`, { response });
                if ((0, cache_1.isCacheEnabled)()) {
                    try {
                        await cache.set(cacheKey, JSON.stringify(response));
                    }
                    catch (err) {
                        logger_1.default.error(`Failed to cache response: ${String(err)}`);
                    }
                }
                const finishReason = (0, finishReason_1.normalizeFinishReason)(response.stop_reason);
                let output = (0, util_1.outputFromMessage)(response, config.showThinking ?? true);
                // Handle structured JSON output parsing
                if (processedOutputFormat?.type === 'json_schema' && typeof output === 'string') {
                    try {
                        output = JSON.parse(output);
                    }
                    catch (error) {
                        logger_1.default.error(`Failed to parse JSON output from structured outputs: ${error}`);
                    }
                }
                return {
                    output,
                    tokenUsage: (0, util_1.getTokenUsage)(response, false),
                    ...(finishReason && { finishReason }),
                    cost: (0, util_1.calculateAnthropicCost)(this.modelName, config, response.usage?.input_tokens, response.usage?.output_tokens),
                };
            }
        }
        catch (err) {
            logger_1.default.error(`Anthropic Messages API call error: ${err instanceof Error ? err.message : String(err)}`);
            if (err instanceof sdk_1.APIError && err.error) {
                const errorDetails = err.error;
                return {
                    error: `API call error: ${errorDetails.error.message}, status ${err.status}, type ${errorDetails.error.type}`,
                };
            }
            return {
                error: `API call error: ${err instanceof Error ? err.message : String(err)}`,
            };
        }
    }
}
exports.AnthropicMessagesProvider = AnthropicMessagesProvider;
AnthropicMessagesProvider.ANTHROPIC_MODELS = util_1.ANTHROPIC_MODELS;
AnthropicMessagesProvider.ANTHROPIC_MODELS_NAMES = util_1.ANTHROPIC_MODELS.map((model) => model.id);
//# sourceMappingURL=messages.js.map