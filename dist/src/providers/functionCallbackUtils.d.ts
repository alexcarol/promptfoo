import type { FunctionCall, FunctionCallbackConfig, FunctionCallResult, ToolCall } from './functionCallbackTypes';
import type { MCPClient } from './mcp/client';
/**
 * Handles function callback execution for AI providers.
 * Provides a unified way to execute function callbacks across different provider formats.
 */
export declare class FunctionCallbackHandler {
    private mcpClient?;
    private loadedCallbacks;
    private mcpToolNames;
    constructor(mcpClient?: MCPClient | undefined);
    /**
     * Processes a function call by executing its callback or returning the original call
     * @param call The function call to process (can be various formats)
     * @param callbacks Configuration mapping function names to callbacks
     * @param context Optional context to pass to the callback
     * @returns The result of processing
     */
    processCall(call: FunctionCall | ToolCall | any, callbacks?: FunctionCallbackConfig, context?: any): Promise<FunctionCallResult>;
    /**
     * Processes multiple function calls
     * @param calls Array of calls or a single call
     * @param callbacks Configuration mapping function names to callbacks
     * @param context Optional context to pass to callbacks
     * @param options Processing options
     * @returns Processed output in appropriate format
     */
    processCalls(calls: any, callbacks?: FunctionCallbackConfig, context?: any, _options?: {
        returnRawOnError?: boolean;
    }): Promise<any>;
    /**
     * Extracts function name and arguments from various call formats
     */
    private extractFunctionInfo;
    /**
     * Executes a function callback
     */
    private executeCallback;
    /**
     * Loads a function from an external file
     */
    private loadExternalFunction;
    /**
     * Executes an MCP tool
     */
    private executeMcpTool;
    /**
     * Sets the MCP client, preserving any loaded callbacks
     */
    setMcpClient(client?: MCPClient): void;
    /**
     * Clears the cached callbacks
     */
    clearCache(): void;
}
//# sourceMappingURL=functionCallbackUtils.d.ts.map