import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodSchema } from 'zod';
import type { BaseTool, ToolResult } from './types';
/**
 * Abstract base class for all MCP tools
 * Provides common functionality and enforces consistent structure
 */
export declare abstract class AbstractTool implements BaseTool {
    abstract readonly name: string;
    abstract readonly description: string;
    /**
     * Optional schema for validating tool arguments
     */
    protected readonly schema?: ZodSchema;
    /**
     * The main tool implementation
     */
    protected abstract execute(args: unknown): Promise<ToolResult>;
    /**
     * Register this tool with the MCP server
     */
    register(server: McpServer): void;
    /**
     * Helper method to create successful responses
     */
    protected success<T>(data: T): ToolResult<T>;
    /**
     * Helper method to create error responses
     */
    protected error(message: string, details?: unknown): ToolResult;
    /**
     * Helper method to validate required arguments
     */
    protected validateRequired<T>(value: T | undefined | null, fieldName: string): T;
    /**
     * Helper method to handle async operations with timeout
     */
    protected withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T>;
}
//# sourceMappingURL=baseTool.d.ts.map