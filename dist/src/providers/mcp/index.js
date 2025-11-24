"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPProvider = void 0;
const logger_1 = __importDefault(require("../../logger"));
const client_1 = require("./client");
class MCPProvider {
    constructor(options = {}) {
        this.config = options.config || { enabled: true };
        this.defaultArgs = options.defaultArgs || {};
        this.mcpClient = new client_1.MCPClient(this.config);
        this.initializationPromise = this.initialize();
        // Set id function if provided
        if (options.id) {
            this.id = () => options.id;
        }
    }
    id() {
        return 'mcp';
    }
    toString() {
        return `[MCP Provider]`;
    }
    async initialize() {
        await this.mcpClient.initialize();
        if (this.config.verbose) {
            const tools = this.mcpClient.getAllTools();
            console.log('MCP Provider initialized with tools:', tools.map((t) => t.name));
        }
    }
    async callApi(_prompt, context, _options) {
        try {
            // Ensure initialization is complete
            await this.initializationPromise;
            // Parse the prompt as JSON to extract tool call information
            let toolCallData;
            try {
                toolCallData = JSON.parse(context?.vars.prompt);
            }
            catch {
                return {
                    error: 'Invalid JSON in prompt. MCP provider expects a JSON payload with tool call information.',
                };
            }
            // Extract tool name from various possible fields
            const toolName = toolCallData.tool ||
                toolCallData.toolName ||
                toolCallData.function ||
                toolCallData.functionName ||
                toolCallData.name;
            if (!toolName || typeof toolName !== 'string') {
                return {
                    error: 'No tool name found in JSON payload. Expected format: {"tool": "function_name", "args": {...}}',
                };
            }
            // Extract tool arguments from various possible fields
            let toolArgs = toolCallData.args ||
                toolCallData.arguments ||
                toolCallData.params ||
                toolCallData.parameters ||
                {};
            // Ensure toolArgs is an object
            if (typeof toolArgs !== 'object' || toolArgs === null || Array.isArray(toolArgs)) {
                toolArgs = {};
            }
            // Merge with default args
            const finalArgs = {
                ...this.defaultArgs,
                ...toolArgs,
            };
            logger_1.default.debug(`MCP Provider calling tool ${toolName} with args: ${JSON.stringify(finalArgs)}`);
            // Call the MCP tool
            const result = await this.mcpClient.callTool(toolName, finalArgs);
            if (result.error) {
                return {
                    error: `MCP tool error: ${result.error}`,
                    raw: result,
                };
            }
            return {
                output: result.content,
                raw: result,
                metadata: {
                    toolName,
                    toolArgs: finalArgs,
                    originalPayload: toolCallData,
                },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.default.error(`MCP Provider error: ${errorMessage}`);
            return {
                error: `MCP Provider error: ${errorMessage}`,
            };
        }
    }
    async cleanup() {
        try {
            await this.mcpClient.cleanup();
        }
        catch (error) {
            logger_1.default.error(`Error during MCP provider cleanup: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Method to call specific MCP tools directly
    async callTool(toolName, args) {
        try {
            await this.initializationPromise;
            const result = await this.mcpClient.callTool(toolName, args);
            if (result.error) {
                return {
                    error: `MCP tool error: ${result.error}`,
                };
            }
            return {
                output: result.content,
                raw: result,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                error: `MCP tool call error: ${errorMessage}`,
            };
        }
    }
    // Get all available tools
    async getAvailableTools() {
        await this.initializationPromise;
        return this.mcpClient.getAllTools();
    }
    // Get connected servers
    getConnectedServers() {
        return this.mcpClient.connectedServers;
    }
}
exports.MCPProvider = MCPProvider;
//# sourceMappingURL=index.js.map