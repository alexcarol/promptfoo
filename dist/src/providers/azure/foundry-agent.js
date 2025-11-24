"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureFoundryAgentProvider = void 0;
const path_1 = __importDefault(require("path"));
const cache_1 = require("../../cache");
const cliState_1 = __importDefault(require("../../cliState"));
const esm_1 = require("../../esm");
const logger_1 = __importDefault(require("../../logger"));
const index_1 = require("../../util/index");
const fileExtensions_1 = require("../../util/fileExtensions");
const time_1 = require("../../util/time");
const shared_1 = require("../shared");
const generic_1 = require("./generic");
class AzureFoundryAgentProvider extends generic_1.AzureGenericProvider {
    constructor(deploymentName, options = {}) {
        super(deploymentName, options);
        this.loadedFunctionCallbacks = {};
        this.projectClient = null;
        this.assistantConfig = options.config || {};
        // Extract project URL from options or use environment variable
        this.projectUrl = options.config?.projectUrl || process.env.AZURE_AI_PROJECT_URL || '';
        if (!this.projectUrl) {
            throw new Error('Azure AI Project URL must be provided via projectUrl option or AZURE_AI_PROJECT_URL environment variable');
        }
        // Preload function callbacks if available
        if (this.assistantConfig.functionToolCallbacks) {
            this.preloadFunctionCallbacks();
        }
    }
    /**
     * Initialize the Azure AI Project client
     */
    async initializeClient() {
        if (this.projectClient) {
            return this.projectClient;
        }
        try {
            // Dynamic import to avoid bundling issues
            const { AIProjectClient } = await Promise.resolve().then(() => __importStar(require('@azure/ai-projects')));
            const { DefaultAzureCredential } = await Promise.resolve().then(() => __importStar(require('@azure/identity')));
            // Patch: Ensure type compatibility for Agent.name (string | null -> string)
            // @ts-expect-error: Suppress type incompatibility due to upstream SDK types
            this.projectClient = new AIProjectClient(this.projectUrl, new DefaultAzureCredential());
            logger_1.default.debug('Azure AI Project client initialized successfully');
            return this.projectClient;
        }
        catch (error) {
            logger_1.default.error(`Failed to initialize Azure AI Project client: ${error instanceof Error ? error.message : String(error)}`);
            throw new Error(`Failed to initialize Azure AI Project client: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Preloads all function callbacks to ensure they're ready when needed
     */
    async preloadFunctionCallbacks() {
        if (!this.assistantConfig.functionToolCallbacks) {
            return;
        }
        const callbacks = this.assistantConfig.functionToolCallbacks;
        for (const [name, callback] of Object.entries(callbacks)) {
            try {
                if (typeof callback === 'string') {
                    // Check if it's a file reference
                    const callbackStr = callback;
                    if (callbackStr.startsWith('file://')) {
                        const fn = await this.loadExternalFunction(callbackStr);
                        this.loadedFunctionCallbacks[name] = fn;
                        logger_1.default.debug(`Successfully preloaded function callback '${name}' from file`);
                    }
                    else {
                        // It's an inline function string
                        this.loadedFunctionCallbacks[name] = new Function('return ' + callbackStr)();
                        logger_1.default.debug(`Successfully preloaded inline function callback '${name}'`);
                    }
                }
                else if (typeof callback === 'function') {
                    this.loadedFunctionCallbacks[name] = callback;
                    logger_1.default.debug(`Successfully stored function callback '${name}'`);
                }
            }
            catch (error) {
                logger_1.default.error(`Failed to preload function callback '${name}': ${error}`);
            }
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
    async executeFunctionCallback(functionName, args, context) {
        try {
            // Check if we've already loaded this function
            let callback = this.loadedFunctionCallbacks[functionName];
            // If not loaded yet, try to load it now
            if (!callback) {
                const callbackRef = this.assistantConfig.functionToolCallbacks?.[functionName];
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
            // Execute the callback with explicit context
            logger_1.default.debug(`Executing function '${functionName}' with args: ${args}${context ? ` and context: ${JSON.stringify(context)}` : ''}`);
            const result = await callback(args, context);
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
            return JSON.stringify({
                error: `Error in ${functionName}: ${error.message || String(error)}`,
            });
        }
    }
    async callApi(prompt, context, _callApiOptions) {
        // Create a simple cache key based on the input and configuration
        const cacheKey = `azure_foundry_agent:${this.deploymentName}:${JSON.stringify({
            frequency_penalty: this.assistantConfig.frequency_penalty,
            instructions: this.assistantConfig.instructions,
            max_completion_tokens: this.assistantConfig.max_completion_tokens,
            max_tokens: this.assistantConfig.max_tokens,
            model: this.assistantConfig.modelName,
            presence_penalty: this.assistantConfig.presence_penalty,
            prompt,
            response_format: this.assistantConfig.response_format,
            seed: this.assistantConfig.seed,
            stop: this.assistantConfig.stop,
            temperature: this.assistantConfig.temperature,
            tool_choice: this.assistantConfig.tool_choice,
            tool_resources: this.assistantConfig.tool_resources,
            tools: JSON.stringify((0, index_1.maybeLoadToolsFromExternalFile)(this.assistantConfig.tools, context?.vars)),
            top_p: this.assistantConfig.top_p,
        })}`;
        // Check the cache if enabled
        if ((0, cache_1.isCacheEnabled)()) {
            try {
                const cache = await (0, cache_1.getCache)();
                const cachedResult = await cache.get(cacheKey);
                if (cachedResult) {
                    logger_1.default.debug(`Cache hit for agent prompt: ${prompt.substring(0, 50)}...`);
                    return { ...cachedResult, cached: true };
                }
            }
            catch (err) {
                logger_1.default.warn(`Error checking cache: ${err}`);
                // Continue if cache check fails
            }
        }
        try {
            // Initialize the client
            const client = await this.initializeClient();
            if (!client) {
                throw new Error('Failed to initialize Azure AI Project client');
            }
            // Get the agent (assistant)
            const agent = await client.agents.getAgent(this.deploymentName);
            logger_1.default.debug(`Retrieved agent: ${agent.name}`);
            // Create a thread
            const thread = await client.agents.threads.create();
            logger_1.default.debug(`Created thread: ${thread.id}`);
            // Create a message
            const message = await client.agents.messages.create(thread.id, 'user', prompt);
            logger_1.default.debug(`Created message: ${message.id}`);
            // Prepare run options
            const runOptions = {};
            // Add configuration parameters
            if (this.assistantConfig.temperature !== undefined) {
                runOptions.temperature = this.assistantConfig.temperature;
            }
            if (this.assistantConfig.top_p !== undefined) {
                runOptions.top_p = this.assistantConfig.top_p;
            }
            if (this.assistantConfig.frequency_penalty !== undefined) {
                runOptions.frequency_penalty = this.assistantConfig.frequency_penalty;
            }
            if (this.assistantConfig.presence_penalty !== undefined) {
                runOptions.presence_penalty = this.assistantConfig.presence_penalty;
            }
            if (this.assistantConfig.max_completion_tokens !== undefined) {
                runOptions.max_completion_tokens = this.assistantConfig.max_completion_tokens;
            }
            if (this.assistantConfig.max_tokens !== undefined) {
                runOptions.max_tokens = this.assistantConfig.max_tokens;
            }
            if (this.assistantConfig.response_format) {
                runOptions.response_format = this.assistantConfig.response_format;
            }
            if (this.assistantConfig.stop) {
                runOptions.stop = this.assistantConfig.stop;
            }
            if (this.assistantConfig.seed !== undefined) {
                runOptions.seed = this.assistantConfig.seed;
            }
            if (this.assistantConfig.tool_resources) {
                runOptions.tool_resources = this.assistantConfig.tool_resources;
            }
            if (this.assistantConfig.tool_choice) {
                runOptions.tool_choice = this.assistantConfig.tool_choice;
            }
            if (this.assistantConfig.tools) {
                runOptions.tools = (0, index_1.maybeLoadToolsFromExternalFile)(this.assistantConfig.tools, context?.vars);
            }
            if (this.assistantConfig.modelName) {
                runOptions.model = this.assistantConfig.modelName;
            }
            if (this.assistantConfig.instructions) {
                runOptions.instructions = this.assistantConfig.instructions;
            }
            // Create a run
            const run = await client.agents.runs.create(thread.id, agent.id, runOptions);
            logger_1.default.debug(`Created run: ${run.id}`);
            // Handle function calls if needed or poll for completion
            let result;
            if (this.assistantConfig.functionToolCallbacks &&
                Object.keys(this.assistantConfig.functionToolCallbacks).length > 0) {
                result = await this.pollRunWithToolCallHandling(client, thread.id, run);
            }
            else {
                // Poll for completion
                const completedRun = await this.pollRun(client, thread.id, run.id);
                // Process the completed run
                if (completedRun.status === 'completed') {
                    result = await this.processCompletedRun(client, thread.id, completedRun);
                }
                else {
                    if (completedRun.lastError) {
                        // Check if the error is a content filter error
                        const errorCode = completedRun.lastError.code || '';
                        const errorMessage = completedRun.lastError.message || '';
                        if (errorCode === 'content_filter' || this.isContentFilterError(errorMessage)) {
                            const lowerErrorMessage = errorMessage.toLowerCase();
                            const isInputFiltered = lowerErrorMessage.includes('prompt') || lowerErrorMessage.includes('input');
                            const isOutputFiltered = lowerErrorMessage.includes('output') || lowerErrorMessage.includes('response');
                            // Ensure mutual exclusivity - prioritize input if both are detected
                            const flaggedInput = isInputFiltered;
                            const flaggedOutput = !isInputFiltered && (isOutputFiltered || !isOutputFiltered);
                            result = {
                                output: "The generated content was filtered due to triggering Azure OpenAI Service's content filtering system.",
                                guardrails: {
                                    flagged: true,
                                    flaggedInput,
                                    flaggedOutput,
                                },
                            };
                        }
                        else {
                            result = {
                                error: `Thread run failed: ${errorCode} - ${errorMessage}`,
                            };
                        }
                    }
                    else {
                        result = {
                            error: `Thread run failed with status: ${completedRun.status}`,
                        };
                    }
                }
            }
            // Cache successful results if caching is enabled
            if ((0, cache_1.isCacheEnabled)() && !result.error) {
                try {
                    const cache = await (0, cache_1.getCache)();
                    await cache.set(cacheKey, result);
                    logger_1.default.debug(`Cached agent response for prompt: ${prompt.substring(0, 50)}...`);
                }
                catch (err) {
                    logger_1.default.warn(`Error caching result: ${err}`);
                    // Continue even if caching fails
                }
            }
            return result;
        }
        catch (err) {
            logger_1.default.error(`Error in Azure Foundry Agent API call: ${err}`);
            return this.formatError(err);
        }
    }
    /**
     * Format error responses consistently
     */
    formatError(err) {
        const errorMessage = err.message || String(err);
        // Handle content filter errors
        if (this.isContentFilterError(errorMessage)) {
            const lowerErrorMessage = errorMessage.toLowerCase();
            const isInputFiltered = lowerErrorMessage.includes('prompt') || lowerErrorMessage.includes('input');
            const isOutputFiltered = lowerErrorMessage.includes('output') || lowerErrorMessage.includes('response');
            return {
                output: "The generated content was filtered due to triggering Azure OpenAI Service's content filtering system.",
                guardrails: {
                    flagged: true,
                    flaggedInput: isInputFiltered,
                    flaggedOutput: isOutputFiltered || (!isInputFiltered && !isOutputFiltered), // Default to output if neither is explicitly mentioned
                },
            };
        }
        // Format specific error types
        if (errorMessage.includes("Can't add messages to thread") &&
            errorMessage.includes('while a run')) {
            return { error: `Error in Azure Foundry Agent API call: ${errorMessage}` };
        }
        if (this.isRateLimitError(errorMessage)) {
            return { error: `Rate limit exceeded: ${errorMessage}` };
        }
        if (this.isServiceError(errorMessage)) {
            return { error: `Service error: ${errorMessage}` };
        }
        return { error: `Error in Azure Foundry Agent API call: ${errorMessage}` };
    }
    /**
     * Helper methods to check for specific error types
     */
    isContentFilterError(errorMessage) {
        const lowerErrorMessage = errorMessage.toLowerCase();
        return (lowerErrorMessage.includes('content_filter') ||
            lowerErrorMessage.includes('content filter') ||
            lowerErrorMessage.includes('filtered due to') ||
            lowerErrorMessage.includes('content filtering') ||
            lowerErrorMessage.includes('inappropriate content') ||
            lowerErrorMessage.includes('safety guidelines') ||
            lowerErrorMessage.includes('guardrail'));
    }
    isRateLimitError(errorMessage) {
        return (errorMessage.includes('rate limit') ||
            errorMessage.includes('Rate limit') ||
            errorMessage.includes('429'));
    }
    isServiceError(errorMessage) {
        return (errorMessage.includes('Service unavailable') ||
            errorMessage.includes('Bad gateway') ||
            errorMessage.includes('Gateway timeout') ||
            errorMessage.includes('Server is busy') ||
            errorMessage.includes('Sorry, something went wrong'));
    }
    isServerError(errorMessage) {
        return (errorMessage.includes('500') ||
            errorMessage.includes('502') ||
            errorMessage.includes('503') ||
            errorMessage.includes('504'));
    }
    isRetryableError(code, message) {
        if (code === 'rate_limit_exceeded') {
            return true;
        }
        if (!message) {
            return false;
        }
        return (this.isRateLimitError(message) || this.isServiceError(message) || this.isServerError(message));
    }
    /**
     * Poll a run until it completes or fails
     */
    async pollRun(client, threadId, runId, pollIntervalMs = 1000) {
        // Maximum polling time (5 minutes)
        const maxPollTime = this.assistantConfig.maxPollTimeMs || 300000;
        const startTime = Date.now();
        // Poll until terminal state
        let run = await client.agents.runs.get(threadId, runId);
        while (['queued', 'in_progress'].includes(run.status)) {
            // Check timeout
            if (Date.now() - startTime > maxPollTime) {
                throw new Error(`Run polling timed out after ${maxPollTime}ms. Last status: ${run.status}`);
            }
            await (0, time_1.sleep)(pollIntervalMs);
            // Get latest status
            run = await client.agents.runs.get(threadId, runId);
            // Increase polling interval gradually for longer-running operations
            if (Date.now() - startTime > 30000) {
                // After 30 seconds
                pollIntervalMs = Math.min(pollIntervalMs * 1.5, 5000);
            }
        }
        return run;
    }
    /**
     * Handle tool calls during run polling
     */
    async pollRunWithToolCallHandling(client, threadId, initialRun) {
        // Maximum polling time (5 minutes)
        const maxPollTime = this.assistantConfig.maxPollTimeMs || 300000;
        const startTime = Date.now();
        let pollIntervalMs = 1000;
        let run = initialRun;
        // Poll until terminal state
        while (true) {
            // Check timeout
            if (Date.now() - startTime > maxPollTime) {
                return {
                    error: `Run polling timed out after ${maxPollTime}ms. The operation may still be in progress.`,
                };
            }
            try {
                // Get latest status
                run = await client.agents.runs.get(threadId, run.id);
                logger_1.default.debug(`Run status: ${run.status}`);
                // Check for required action
                if (run.status === 'requires_action') {
                    if (run.requiredAction?.type === 'submit_tool_outputs' &&
                        run.requiredAction.submitToolOutputs?.toolCalls) {
                        const toolCalls = run.requiredAction.submitToolOutputs.toolCalls;
                        // Filter for function calls that have callbacks
                        const functionCallsWithCallbacks = toolCalls.filter((toolCall) => {
                            return (toolCall.type === 'function' &&
                                toolCall.function &&
                                toolCall.function.name in (this.assistantConfig.functionToolCallbacks ?? {}));
                        });
                        if (functionCallsWithCallbacks.length === 0) {
                            // No matching callbacks found, but we should still handle the required action
                            logger_1.default.debug(`No matching callbacks found for tool calls. Available functions: ${Object.keys(this.assistantConfig.functionToolCallbacks || {}).join(', ')}. Tool calls: ${JSON.stringify(toolCalls)}`);
                            // Submit empty outputs for all tool calls
                            const emptyOutputs = toolCalls.map((toolCall) => ({
                                toolCallId: toolCall.id,
                                output: JSON.stringify({
                                    message: `No callback registered for function ${toolCall.type === 'function' ? toolCall.function?.name : toolCall.type}`,
                                }),
                            }));
                            // Submit the empty outputs to continue the run
                            try {
                                await client.agents.runs.submitToolOutputs(threadId, run.id, emptyOutputs);
                                // Continue polling after submission
                                await (0, time_1.sleep)(pollIntervalMs);
                                continue;
                            }
                            catch (error) {
                                logger_1.default.error(`Error submitting empty tool outputs: ${error.message}`);
                                return {
                                    error: `Error submitting empty tool outputs: ${error.message}`,
                                };
                            }
                        }
                        // Build context for function callbacks
                        const callbackContext = {
                            threadId,
                            runId: run.id,
                            assistantId: this.deploymentName,
                            provider: 'azure-foundry',
                        };
                        // Process tool calls that have matching callbacks
                        const toolOutputs = await Promise.all(functionCallsWithCallbacks.map(async (toolCall) => {
                            const functionName = toolCall.function.name;
                            const functionArgs = toolCall.function.arguments;
                            try {
                                logger_1.default.debug(`Calling function ${functionName} with args: ${functionArgs}`);
                                // Use our executeFunctionCallback method with context
                                const outputResult = await this.executeFunctionCallback(functionName, functionArgs, callbackContext);
                                logger_1.default.debug(`Function ${functionName} result: ${outputResult}`);
                                return {
                                    toolCallId: toolCall.id,
                                    output: outputResult,
                                };
                            }
                            catch (error) {
                                logger_1.default.error(`Error calling function ${functionName}: ${error}`);
                                return {
                                    toolCallId: toolCall.id,
                                    output: JSON.stringify({ error: String(error) }),
                                };
                            }
                        }));
                        // Submit tool outputs
                        if (toolOutputs.length === 0) {
                            logger_1.default.error('No valid tool outputs to submit');
                            break;
                        }
                        logger_1.default.debug(`Submitting tool outputs: ${JSON.stringify(toolOutputs)}`);
                        // Submit tool outputs
                        try {
                            await client.agents.runs.submitToolOutputs(threadId, run.id, toolOutputs);
                        }
                        catch (error) {
                            logger_1.default.error(`Error submitting tool outputs: ${error.message}`);
                            return {
                                error: `Error submitting tool outputs: ${error.message}`,
                            };
                        }
                    }
                    else {
                        logger_1.default.error(`Unknown required action type: ${run.requiredAction?.type}`);
                        break;
                    }
                }
                else if (['completed', 'failed', 'cancelled', 'expired'].includes(run.status)) {
                    // Run is in a terminal state
                    if (run.status !== 'completed') {
                        // Return error for failed runs
                        if (run.lastError) {
                            const errorCode = run.lastError.code || '';
                            const errorMessage = run.lastError.message || '';
                            if (errorCode === 'content_filter' || this.isContentFilterError(errorMessage)) {
                                const lowerErrorMessage = errorMessage.toLowerCase();
                                const isInputFiltered = lowerErrorMessage.includes('prompt') || lowerErrorMessage.includes('input');
                                const isOutputFiltered = lowerErrorMessage.includes('output') || lowerErrorMessage.includes('response');
                                // Ensure mutual exclusivity - prioritize input if both are detected
                                const flaggedInput = isInputFiltered;
                                const flaggedOutput = !isInputFiltered && (isOutputFiltered || !isOutputFiltered);
                                return {
                                    output: "The generated content was filtered due to triggering Azure OpenAI Service's content filtering system.",
                                    guardrails: {
                                        flagged: true,
                                        flaggedInput,
                                        flaggedOutput,
                                    },
                                };
                            }
                            return {
                                error: `Thread run failed: ${errorCode} - ${errorMessage}`,
                            };
                        }
                        return {
                            error: `Thread run failed with status: ${run.status}`,
                        };
                    }
                    break; // Exit the loop if completed successfully
                }
                // Wait before polling again
                await (0, time_1.sleep)(pollIntervalMs);
                // Increase polling interval gradually for longer-running operations
                if (Date.now() - startTime > 30000) {
                    // After 30 seconds
                    pollIntervalMs = Math.min(pollIntervalMs * 1.5, 5000);
                }
            }
            catch (error) {
                // Handle error during polling
                logger_1.default.error(`Error polling run status: ${error}`);
                const errorMessage = error.message || String(error);
                // For transient errors, return a retryable error response
                if (this.isRetryableError('', errorMessage)) {
                    return {
                        error: `Error polling run status: ${errorMessage}`,
                    };
                }
                // For other errors, just return the error without marking as retryable
                return {
                    error: `Error polling run status: ${errorMessage}`,
                };
            }
        }
        // Process the completed run
        return await this.processCompletedRun(client, threadId, run);
    }
    /**
     * Process a completed run to extract messages
     */
    async processCompletedRun(client, threadId, _run) {
        try {
            // Get all messages in the thread
            const messages = [];
            for await (const message of client.agents.messages.list(threadId, { order: 'asc' })) {
                messages.push(message);
            }
            // Process messages to create output
            const outputBlocks = [];
            // Sort messages by creation time if needed (they should already be sorted by 'asc' order)
            messages.forEach((message) => {
                const contentBlocks = message.content
                    .map((content) => content.type === 'text' && content.text
                    ? content.text.value
                    : `<${content.type} output>`)
                    .join('\n');
                outputBlocks.push(`[${(0, shared_1.toTitleCase)(message.role)}] ${contentBlocks}`);
            });
            return {
                output: outputBlocks.join('\n\n').trim(),
            };
        }
        catch (err) {
            logger_1.default.error(`Error processing run results: ${err}`);
            const errorMessage = err.message || String(err);
            return {
                error: `Error processing run results: ${errorMessage}`,
            };
        }
    }
}
exports.AzureFoundryAgentProvider = AzureFoundryAgentProvider;
//# sourceMappingURL=foundry-agent.js.map