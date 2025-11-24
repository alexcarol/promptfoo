"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractTool = void 0;
const errors_1 = require("./errors");
const utils_1 = require("./utils");
/**
 * Abstract base class for all MCP tools
 * Provides common functionality and enforces consistent structure
 */
class AbstractTool {
    /**
     * Register this tool with the MCP server
     */
    register(server) {
        // Pass the Zod schema directly - MCP SDK handles conversion to JSON Schema
        server.tool(this.name, this.schema || {}, async (args) => {
            try {
                // Validate arguments if schema is provided
                if (this.schema) {
                    const validationResult = this.schema.safeParse(args);
                    if (!validationResult.success) {
                        return (0, utils_1.createToolResponse)(this.name, false, undefined, `Invalid arguments: ${validationResult.error.message}`);
                    }
                    args = validationResult.data;
                }
                // Execute the tool
                return await this.execute(args);
            }
            catch (error) {
                const mcpError = (0, errors_1.toMcpError)(error);
                return (0, utils_1.createToolResponse)(this.name, false, (0, errors_1.isMcpError)(error) ? error.toJSON() : undefined, mcpError.message);
            }
        });
    }
    /**
     * Helper method to create successful responses
     */
    success(data) {
        return (0, utils_1.createToolResponse)(this.name, true, data);
    }
    /**
     * Helper method to create error responses
     */
    error(message, details) {
        return (0, utils_1.createToolResponse)(this.name, false, details, message);
    }
    /**
     * Helper method to validate required arguments
     */
    validateRequired(value, fieldName) {
        if (value === undefined || value === null) {
            throw new Error(`Missing required field: ${fieldName}`);
        }
        return value;
    }
    /**
     * Helper method to handle async operations with timeout
     */
    async withTimeout(promise, timeoutMs, operation) {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)),
        ]);
    }
}
exports.AbstractTool = AbstractTool;
//# sourceMappingURL=baseTool.js.map