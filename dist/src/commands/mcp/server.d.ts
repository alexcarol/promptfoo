import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Creates an MCP server with tools for interacting with promptfoo
 */
export declare function createMcpServer(): Promise<McpServer>;
/**
 * Starts an MCP server with HTTP transport
 */
export declare function startHttpMcpServer(port: number): Promise<void>;
/**
 * Starts an MCP server with stdio transport
 */
export declare function startStdioMcpServer(): Promise<void>;
//# sourceMappingURL=server.d.ts.map