"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiChatCompletionProvider = void 0;
const path_1 = __importDefault(require("path"));
const cache_1 = require("../../cache");
const cliState_1 = __importDefault(require("../../cliState"));
const envars_1 = require("../../envars");
const esm_1 = require("../../esm");
const logger_1 = __importDefault(require("../../logger"));
const file_1 = require("../../util/file");
const fileExtensions_1 = require("../../util/fileExtensions");
const finishReason_1 = require("../../util/finishReason");
const index_1 = require("../../util/index");
const client_1 = require("../mcp/client");
const transform_1 = require("../mcp/transform");
const shared_1 = require("../shared");
const _1 = require("./");
const util_1 = require("./util");
class OpenAiChatCompletionProvider extends _1.OpenAiGenericProvider {
    constructor(modelName, options = {}) {
        if (!OpenAiChatCompletionProvider.OPENAI_CHAT_MODEL_NAMES.includes(modelName)) {
            logger_1.default.debug(`Using unknown chat model: ${modelName}`);
        }
        super(modelName, options);
        this.mcpClient = null;
        this.initializationPromise = null;
        this.loadedFunctionCallbacks = {};
        this.config = options.config || {};
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
    /**
     * Loads a function from an external file
     * @param fileRef The file reference in the format 'file://path/to/file:functionName'
     * @returns The loaded function
     */
    async loadExternalFunction(fileRef) {
        let filePath = fileRef.slice('file://'.length);
        let functionName;
        if (filePath.includes(':')) {
            const splits = filePath.split(':');
            if (splits[0] && (0, fileExtensions_1.isJavascriptFile)(splits[0])) {
                [filePath, functionName] = splits;
            }
        }
        try {
            const resolvedPath = path_1.default.resolve(cliState_1.default.basePath || '', filePath);
            logger_1.default.debug(`Loading function from ${resolvedPath}${functionName ? `:${functionName}` : ''}`);
            const requiredModule = await (0, esm_1.importModule)(resolvedPath, functionName);
            if (typeof requiredModule === 'function') {
                return requiredModule;
            }
            else if (requiredModule &&
                typeof requiredModule === 'object' &&
                functionName &&
                functionName in requiredModule) {
                const fn = requiredModule[functionName];
                if (typeof fn === 'function') {
                    return fn;
                }
            }
            throw new Error(`Function callback malformed: ${filePath} must export ${functionName
                ? `a named function '${functionName}'`
                : 'a function or have a default export as a function'}`);
        }
        catch (error) {
            throw new Error(`Error loading function from ${filePath}: ${error.message || String(error)}`);
        }
    }
    /**
     * Executes a function callback with proper error handling
     */
    async executeFunctionCallback(functionName, args, config) {
        try {
            // Check if we've already loaded this function
            let callback = this.loadedFunctionCallbacks[functionName];
            // If not loaded yet, try to load it now
            if (!callback) {
                const callbackRef = config.functionToolCallbacks?.[functionName];
                if (callbackRef && typeof callbackRef === 'string') {
                    const callbackStr = callbackRef;
                    if (callbackStr.startsWith('file://')) {
                        callback = await this.loadExternalFunction(callbackStr);
                    }
                    else {
                        callback = new Function('return ' + callbackStr)();
                    }
                    // Cache for future use
                    this.loadedFunctionCallbacks[functionName] = callback;
                }
                else if (typeof callbackRef === 'function') {
                    callback = callbackRef;
                    this.loadedFunctionCallbacks[functionName] = callback;
                }
            }
            if (!callback) {
                throw new Error(`No callback found for function '${functionName}'`);
            }
            // Execute the callback
            logger_1.default.debug(`Executing function '${functionName}' with args: ${args}`);
            const result = await callback(args);
            // Format the result
            if (result === undefined || result === null) {
                return '';
            }
            else if (typeof result === 'object') {
                try {
                    return JSON.stringify(result);
                }
                catch (error) {
                    logger_1.default.warn(`Error stringifying result from function '${functionName}': ${error}`);
                    return String(result);
                }
            }
            else {
                return String(result);
            }
        }
        catch (error) {
            logger_1.default.error(`Error executing function '${functionName}': ${error.message || String(error)}`);
            throw error; // Re-throw so caller can handle fallback behavior
        }
    }
    isReasoningModel() {
        return (this.modelName.startsWith('o1') ||
            this.modelName.startsWith('o3') ||
            this.modelName.startsWith('o4') ||
            this.modelName.startsWith('gpt-5'));
    }
    supportsTemperature() {
        // OpenAI's o1 and o3 models don't support temperature but some 3rd
        // party reasoning models do.
        return !this.isReasoningModel();
    }
    getOpenAiBody(prompt, context, callApiOptions) {
        // Merge configs from the provider and the prompt
        const config = {
            ...this.config,
            ...context?.prompt?.config,
        };
        const messages = (0, shared_1.parseChatPrompt)(prompt, [{ role: 'user', content: prompt }]);
        const isReasoningModel = this.isReasoningModel();
        const isGPT5Model = this.modelName.startsWith('gpt-5');
        const maxCompletionTokens = isReasoningModel
            ? (config.max_completion_tokens ?? (0, envars_1.getEnvInt)('OPENAI_MAX_COMPLETION_TOKENS'))
            : undefined;
        const maxTokens = isReasoningModel || isGPT5Model
            ? undefined
            : (config.max_tokens ?? (0, envars_1.getEnvInt)('OPENAI_MAX_TOKENS', 1024));
        const temperature = this.supportsTemperature()
            ? (config.temperature ?? (0, envars_1.getEnvFloat)('OPENAI_TEMPERATURE', 0))
            : undefined;
        const reasoningEffort = isReasoningModel
            ? (0, index_1.renderVarsInObject)(config.reasoning_effort, context?.vars)
            : undefined;
        // --- MCP tool injection logic ---
        const mcpTools = this.mcpClient ? (0, transform_1.transformMCPToolsToOpenAi)(this.mcpClient.getAllTools()) : [];
        const fileTools = config.tools
            ? (0, index_1.maybeLoadToolsFromExternalFile)(config.tools, context?.vars) || []
            : [];
        const allTools = [...mcpTools, ...fileTools];
        // --- End MCP tool injection logic ---
        const body = {
            model: this.modelName,
            messages,
            seed: config.seed,
            ...(maxTokens ? { max_tokens: maxTokens } : {}),
            ...(maxCompletionTokens ? { max_completion_tokens: maxCompletionTokens } : {}),
            ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
            ...(temperature ? { temperature } : {}),
            ...(config.top_p !== undefined || (0, envars_1.getEnvString)('OPENAI_TOP_P')
                ? { top_p: config.top_p ?? (0, envars_1.getEnvFloat)('OPENAI_TOP_P', 1) }
                : {}),
            ...(config.presence_penalty !== undefined || (0, envars_1.getEnvString)('OPENAI_PRESENCE_PENALTY')
                ? {
                    presence_penalty: config.presence_penalty ?? (0, envars_1.getEnvFloat)('OPENAI_PRESENCE_PENALTY', 0),
                }
                : {}),
            ...(config.frequency_penalty !== undefined || (0, envars_1.getEnvString)('OPENAI_FREQUENCY_PENALTY')
                ? {
                    frequency_penalty: config.frequency_penalty ?? (0, envars_1.getEnvFloat)('OPENAI_FREQUENCY_PENALTY', 0),
                }
                : {}),
            ...(config.functions
                ? {
                    functions: (0, file_1.maybeLoadFromExternalFile)((0, index_1.renderVarsInObject)(config.functions, context?.vars)),
                }
                : {}),
            ...(config.function_call ? { function_call: config.function_call } : {}),
            ...(allTools.length > 0 ? { tools: allTools } : {}),
            ...(config.tool_choice ? { tool_choice: config.tool_choice } : {}),
            ...(config.tool_resources ? { tool_resources: config.tool_resources } : {}),
            ...(config.response_format
                ? {
                    response_format: (0, file_1.maybeLoadFromExternalFile)((0, index_1.renderVarsInObject)(config.response_format, context?.vars)),
                }
                : {}),
            ...(callApiOptions?.includeLogProbs ? { logprobs: callApiOptions.includeLogProbs } : {}),
            ...(config.stop ? { stop: config.stop } : {}),
            ...(config.passthrough || {}),
            ...(this.modelName.includes('audio')
                ? {
                    modalities: config.modalities || ['text', 'audio'],
                    audio: config.audio || { voice: 'alloy', format: 'wav' },
                }
                : {}),
            // GPT-5 only: attach verbosity if provided
            ...(this.modelName.startsWith('gpt-5') && config.verbosity
                ? { verbosity: config.verbosity }
                : {}),
        };
        // Handle reasoning_effort and reasoning parameters for reasoning models
        if (config.reasoning_effort &&
            (this.modelName.startsWith('o1') ||
                this.modelName.startsWith('o3') ||
                this.modelName.startsWith('o4') ||
                this.modelName.startsWith('gpt-5') ||
                this.modelName.startsWith('gpt-oss'))) {
            body.reasoning_effort = config.reasoning_effort;
        }
        if (config.reasoning &&
            (this.modelName.startsWith('o1') ||
                this.modelName.startsWith('o3') ||
                this.modelName.startsWith('o4'))) {
            body.reasoning = config.reasoning;
        }
        // Add other basic parameters
        if (config.service_tier) {
            body.service_tier = config.service_tier;
        }
        if (config.user) {
            body.user = config.user;
        }
        if (config.metadata) {
            body.metadata = config.metadata;
        }
        if (config.store !== undefined) {
            body.store = config.store;
        }
        return { body, config };
    }
    async callApi(prompt, context, callApiOptions) {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
        if (this.requiresApiKey() && !this.getApiKey()) {
            throw new Error(`API key is not set. Set the ${this.config.apiKeyEnvar || 'OPENAI_API_KEY'} environment variable or add \`apiKey\` to the provider config.`);
        }
        const { body, config } = this.getOpenAiBody(prompt, context, callApiOptions);
        let data, status, statusText;
        let cached = false;
        let latencyMs;
        try {
            ({ data, cached, status, statusText, latencyMs } = await (0, cache_1.fetchWithCache)(`${this.getApiUrl()}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.getApiKey() ? { Authorization: `Bearer ${this.getApiKey()}` } : {}),
                    ...(this.getOrganization() ? { 'OpenAI-Organization': this.getOrganization() } : {}),
                    ...config.headers,
                },
                body: JSON.stringify(body),
            }, shared_1.REQUEST_TIMEOUT_MS, 'json', context?.bustCache ?? context?.debug, this.config.maxRetries));
            if (status < 200 || status >= 300) {
                const errorMessage = `API error: ${status} ${statusText}\n${typeof data === 'string' ? data : JSON.stringify(data)}`;
                // Check if this is an invalid_prompt error code (indicates refusal)
                if (typeof data === 'object' && data?.error?.code === 'invalid_prompt') {
                    return {
                        output: errorMessage,
                        tokenUsage: data?.usage ? (0, util_1.getTokenUsage)(data, cached) : undefined,
                        latencyMs,
                        isRefusal: true,
                        guardrails: {
                            flagged: true,
                            flaggedInput: true, // This error specifically indicates input was rejected
                        },
                    };
                }
                return {
                    error: errorMessage,
                };
            }
        }
        catch (err) {
            logger_1.default.error(`API call error: ${String(err)}`);
            await data?.deleteFromCache?.();
            return {
                error: `API call error: ${String(err)}`,
            };
        }
        try {
            const message = data.choices[0].message;
            const finishReason = (0, finishReason_1.normalizeFinishReason)(data.choices[0].finish_reason);
            // Track content filtering for guardrails
            const contentFiltered = finishReason === finishReason_1.FINISH_REASON_MAP.content_filter;
            if (message.refusal) {
                return {
                    output: message.refusal,
                    tokenUsage: (0, util_1.getTokenUsage)(data, cached),
                    cached,
                    latencyMs,
                    isRefusal: true,
                    ...(finishReason && { finishReason }),
                    guardrails: { flagged: true }, // Refusal is ALWAYS a guardrail violation
                };
            }
            // Check if content was filtered
            if (contentFiltered) {
                return {
                    output: message.content || 'Content filtered by provider',
                    tokenUsage: (0, util_1.getTokenUsage)(data, cached),
                    cached,
                    latencyMs,
                    isRefusal: true,
                    finishReason: finishReason_1.FINISH_REASON_MAP.content_filter,
                    guardrails: {
                        flagged: true,
                    },
                };
            }
            let reasoning = '';
            let output = '';
            if (message.reasoning) {
                reasoning = message.reasoning;
                output = message.content;
            }
            else if (message.content && (message.function_call || message.tool_calls)) {
                if (Array.isArray(message.tool_calls) && message.tool_calls.length === 0) {
                    output = message.content;
                }
                else {
                    output = message;
                }
            }
            else if (message.content === null ||
                message.content === undefined ||
                (message.content === '' && message.tool_calls)) {
                output = message.function_call || message.tool_calls;
            }
            else {
                output = message.content;
            }
            const logProbs = data.choices[0].logprobs?.content?.map((logProbObj) => logProbObj.logprob);
            // Handle structured output
            if (config.response_format?.type === 'json_schema' && typeof output === 'string') {
                try {
                    output = JSON.parse(output);
                }
                catch (error) {
                    logger_1.default.error(`Failed to parse JSON output: ${error}`);
                }
            }
            // Handle reasoning as thinking content if present and showThinking is enabled
            if (reasoning && (this.config.showThinking ?? true)) {
                output = `Thinking: ${reasoning}\n\n${output}`;
            }
            // Handle function tool callbacks
            const functionCalls = message.function_call ? [message.function_call] : message.tool_calls;
            if (functionCalls && (config.functionToolCallbacks || this.mcpClient)) {
                const results = [];
                let hasSuccessfulCallback = false;
                for (const functionCall of functionCalls) {
                    const functionName = functionCall.name || functionCall.function?.name;
                    // Try MCP first if available
                    if (this.mcpClient) {
                        const mcpTools = this.mcpClient.getAllTools();
                        const mcpTool = mcpTools.find((tool) => tool.name === functionName);
                        if (mcpTool) {
                            try {
                                const args = functionCall.arguments || functionCall.function?.arguments || '{}';
                                const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
                                const mcpResult = await this.mcpClient.callTool(functionName, parsedArgs);
                                if (mcpResult?.error) {
                                    results.push(`MCP Tool Error (${functionName}): ${mcpResult.error}`);
                                }
                                else {
                                    // Normalize MCP content to a readable string
                                    const normalizeContent = (content) => {
                                        if (content == null) {
                                            return '';
                                        }
                                        if (typeof content === 'string') {
                                            return content;
                                        }
                                        if (Array.isArray(content)) {
                                            return content
                                                .map((part) => {
                                                if (typeof part === 'string') {
                                                    return part;
                                                }
                                                if (part && typeof part === 'object') {
                                                    if ('text' in part && part.text != null) {
                                                        return String(part.text);
                                                    }
                                                    if ('json' in part) {
                                                        return JSON.stringify(part.json);
                                                    }
                                                    if ('data' in part) {
                                                        return JSON.stringify(part.data);
                                                    }
                                                    return JSON.stringify(part);
                                                }
                                                return String(part);
                                            })
                                                .join('\n');
                                        }
                                        return JSON.stringify(content);
                                    };
                                    const content = normalizeContent(mcpResult?.content);
                                    results.push(`MCP Tool Result (${functionName}): ${content}`);
                                }
                                hasSuccessfulCallback = true;
                                continue; // Skip to next function call
                            }
                            catch (error) {
                                logger_1.default.debug(`MCP tool execution failed for ${functionName}: ${error}`);
                                results.push(`MCP Tool Error (${functionName}): ${error}`);
                                hasSuccessfulCallback = true;
                                continue; // Skip to next function call
                            }
                        }
                    }
                    // Fall back to regular function callbacks
                    if (config.functionToolCallbacks && config.functionToolCallbacks[functionName]) {
                        try {
                            const functionResult = await this.executeFunctionCallback(functionName, functionCall.arguments || functionCall.function?.arguments, config);
                            results.push(functionResult);
                            hasSuccessfulCallback = true;
                        }
                        catch (error) {
                            // If callback fails, fall back to original behavior (return the function call)
                            logger_1.default.debug(`Function callback failed for ${functionName} with error ${error}, falling back to original output`);
                            hasSuccessfulCallback = false;
                            break;
                        }
                    }
                }
                if (hasSuccessfulCallback && results.length > 0) {
                    return {
                        output: results.join('\n'),
                        tokenUsage: (0, util_1.getTokenUsage)(data, cached),
                        cached,
                        latencyMs,
                        logProbs,
                        ...(finishReason && { finishReason }),
                        cost: (0, util_1.calculateOpenAICost)(this.modelName, config, data.usage?.prompt_tokens, data.usage?.completion_tokens, data.usage?.audio_prompt_tokens, data.usage?.audio_completion_tokens),
                        guardrails: { flagged: contentFiltered },
                    };
                }
            }
            // Handle DeepSeek reasoning model's reasoning_content by prepending it to the output
            if (message.reasoning_content &&
                typeof message.reasoning_content === 'string' &&
                typeof output === 'string' &&
                (this.config.showThinking ?? true)) {
                output = `Thinking: ${message.reasoning_content}\n\n${output}`;
            }
            if (message.audio) {
                return {
                    output: message.audio.transcript || '',
                    audio: {
                        id: message.audio.id,
                        expiresAt: message.audio.expires_at,
                        data: message.audio.data,
                        transcript: message.audio.transcript,
                        format: message.audio.format || 'wav',
                    },
                    tokenUsage: (0, util_1.getTokenUsage)(data, cached),
                    cached,
                    latencyMs,
                    logProbs,
                    ...(finishReason && { finishReason }),
                    cost: (0, util_1.calculateOpenAICost)(this.modelName, config, data.usage?.prompt_tokens, data.usage?.completion_tokens, data.usage?.audio_prompt_tokens, data.usage?.audio_completion_tokens),
                    guardrails: { flagged: contentFiltered },
                };
            }
            return {
                output,
                tokenUsage: (0, util_1.getTokenUsage)(data, cached),
                cached,
                latencyMs,
                logProbs,
                ...(finishReason && { finishReason }),
                cost: (0, util_1.calculateOpenAICost)(this.modelName, config, data.usage?.prompt_tokens, data.usage?.completion_tokens, data.usage?.audio_prompt_tokens, data.usage?.audio_completion_tokens),
                guardrails: { flagged: contentFiltered },
            };
        }
        catch (err) {
            await data?.deleteFromCache?.();
            return {
                error: `API error: ${String(err)}: ${JSON.stringify(data)}`,
            };
        }
    }
}
exports.OpenAiChatCompletionProvider = OpenAiChatCompletionProvider;
OpenAiChatCompletionProvider.OPENAI_CHAT_MODELS = util_1.OPENAI_CHAT_MODELS;
OpenAiChatCompletionProvider.OPENAI_CHAT_MODEL_NAMES = util_1.OPENAI_CHAT_MODELS.map((model) => model.id);
//# sourceMappingURL=chat.js.map