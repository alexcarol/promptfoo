"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionCallbackHandler = void 0;
const path_1 = __importDefault(require("path"));
const cliState_1 = __importDefault(require("../cliState"));
const esm_1 = require("../esm");
const logger_1 = __importDefault(require("../logger"));
const fileExtensions_1 = require("../util/fileExtensions");
/**
 * Handles function callback execution for AI providers.
 * Provides a unified way to execute function callbacks across different provider formats.
 */
class FunctionCallbackHandler {
    constructor(mcpClient) {
        this.mcpClient = mcpClient;
        this.loadedCallbacks = {};
        this.mcpToolNames = null;
    }
    /**
     * Processes a function call by executing its callback or returning the original call
     * @param call The function call to process (can be various formats)
     * @param callbacks Configuration mapping function names to callbacks
     * @param context Optional context to pass to the callback
     * @returns The result of processing
     */
    async processCall(call, callbacks, context) {
        // Extract function information from various formats
        const functionInfo = this.extractFunctionInfo(call);
        // Check if this is an MCP tool first (before checking function callbacks)
        if (this.mcpClient && functionInfo) {
            // Lazy-load MCP tool names for efficient lookup
            if (this.mcpToolNames === null) {
                const mcpTools = this.mcpClient.getAllTools();
                this.mcpToolNames = new Set(mcpTools.map((tool) => tool.name));
            }
            if (this.mcpToolNames.has(functionInfo.name)) {
                return await this.executeMcpTool(functionInfo.name, functionInfo.arguments);
            }
        }
        if (!functionInfo || !callbacks || !callbacks[functionInfo.name]) {
            // No callback available - return stringified original
            return {
                output: typeof call === 'string' ? call : JSON.stringify(call),
                isError: false,
            };
        }
        try {
            // Execute the callback
            const result = await this.executeCallback(functionInfo.name, functionInfo.arguments || '{}', callbacks, context);
            return {
                output: result,
                isError: false,
            };
        }
        catch (error) {
            logger_1.default.debug(`Function callback failed for ${functionInfo.name}: ${error}`);
            // Return original call on error
            return {
                output: typeof call === 'string' ? call : JSON.stringify(call),
                isError: true,
            };
        }
    }
    /**
     * Processes multiple function calls
     * @param calls Array of calls or a single call
     * @param callbacks Configuration mapping function names to callbacks
     * @param context Optional context to pass to callbacks
     * @param options Processing options
     * @returns Processed output in appropriate format
     */
    async processCalls(calls, callbacks, context, _options) {
        if (!calls) {
            return calls;
        }
        const isArray = Array.isArray(calls);
        const callsArray = isArray ? calls : [calls];
        const results = await Promise.all(callsArray.map((call) => this.processCall(call, callbacks, context)));
        // If any callback succeeded, return processed results
        const hasSuccess = results.some((r, index) => !r.isError && r.output !== JSON.stringify(callsArray[index]));
        if (hasSuccess) {
            const outputs = results.map((r) => r.output);
            // For single call with successful callback, return just the output
            if (!isArray && outputs.length === 1) {
                return outputs[0];
            }
            // For multiple calls, join string results
            return outputs.every((o) => typeof o === 'string') ? outputs.join('\n') : outputs;
        }
        // All failed or no callbacks - return stringified results
        if (!isArray && results.length === 1) {
            return results[0].output;
        }
        // For arrays, return the original array
        return calls;
    }
    /**
     * Extracts function name and arguments from various call formats
     */
    extractFunctionInfo(call) {
        if (!call || typeof call !== 'object') {
            return null;
        }
        // Direct function call format
        if (call.name && typeof call.name === 'string') {
            return {
                name: call.name,
                arguments: call.arguments,
            };
        }
        // Tool call format
        if (call.type === 'function' && call.function?.name) {
            return {
                name: call.function.name,
                arguments: call.function.arguments,
            };
        }
        return null;
    }
    /**
     * Executes a function callback
     */
    async executeCallback(functionName, args, callbacks, context) {
        // Get or load the callback
        let callback = this.loadedCallbacks[functionName];
        if (!callback) {
            const callbackConfig = callbacks[functionName];
            if (typeof callbackConfig === 'string') {
                // String callback - either file reference or inline code
                if (callbackConfig.startsWith('file://')) {
                    callback = await this.loadExternalFunction(callbackConfig);
                }
                else {
                    // Inline function string
                    callback = new Function('return ' + callbackConfig)();
                }
            }
            else if (typeof callbackConfig === 'function') {
                callback = callbackConfig;
            }
            else {
                throw new Error(`Invalid callback configuration for ${functionName}`);
            }
            // Cache for future use
            this.loadedCallbacks[functionName] = callback;
        }
        // Execute the callback
        const result = await callback(args, context);
        return typeof result === 'string' ? result : JSON.stringify(result);
    }
    /**
     * Loads a function from an external file
     */
    async loadExternalFunction(fileRef) {
        let filePath = fileRef.slice('file://'.length);
        let functionName;
        // Parse file:function format
        if (filePath.includes(':')) {
            const splits = filePath.split(':');
            if (splits[0] && (0, fileExtensions_1.isJavascriptFile)(splits[0])) {
                [filePath, functionName] = splits;
            }
        }
        try {
            const resolvedPath = path_1.default.resolve(cliState_1.default.basePath || '', filePath);
            logger_1.default.debug(`Loading function from ${resolvedPath}${functionName ? `:${functionName}` : ''}`);
            const mod = await (0, esm_1.importModule)(resolvedPath);
            const func = functionName && mod[functionName] ? mod[functionName] : mod.default || mod;
            if (typeof func !== 'function') {
                throw new Error(`Expected ${resolvedPath}${functionName ? `:${functionName}` : ''} to export a function, got ${typeof func}`);
            }
            return func;
        }
        catch (error) {
            throw new Error(`Failed to load function from ${fileRef}: ${error}`);
        }
    }
    /**
     * Executes an MCP tool
     */
    async executeMcpTool(toolName, args) {
        try {
            if (!this.mcpClient) {
                throw new Error('MCP client not available');
            }
            // Parse arguments: support stringified JSON, object, or empty
            const parsedArgs = args == null || args === '' ? {} : typeof args === 'string' ? JSON.parse(args) : args;
            const result = await this.mcpClient.callTool(toolName, parsedArgs);
            if (result?.error) {
                return {
                    output: `MCP Tool Error (${toolName}): ${result.error}`,
                    isError: true,
                };
            }
            // Normalize MCP content to a readable string to avoid "[object Object]"
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
            const content = normalizeContent(result?.content);
            return { output: `MCP Tool Result (${toolName}): ${content}`, isError: false };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.default.debug(`MCP tool execution failed for ${toolName}: ${errorMessage}`);
            return {
                output: `MCP Tool Error (${toolName}): ${errorMessage}`,
                isError: true,
            };
        }
    }
    /**
     * Sets the MCP client, preserving any loaded callbacks
     */
    setMcpClient(client) {
        this.mcpClient = client;
        // Reset cached tool names when MCP client changes
        this.mcpToolNames = null;
    }
    /**
     * Clears the cached callbacks
     */
    clearCache() {
        this.loadedCallbacks = {};
    }
}
exports.FunctionCallbackHandler = FunctionCallbackHandler;
//# sourceMappingURL=functionCallbackUtils.js.map