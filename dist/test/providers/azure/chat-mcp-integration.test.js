"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chat_1 = require("../../../src/providers/azure/chat");
const client_1 = require("../../../src/providers/mcp/client");
// Mock external dependencies
jest.mock('../../../src/cache');
jest.mock('../../../src/logger');
jest.mock('../../../src/providers/mcp/client');
describe('AzureChatCompletionProvider MCP Integration', () => {
    let provider;
    let mockMCPClient;
    beforeEach(() => {
        // Create a mock MCP client
        mockMCPClient = {
            initialize: jest.fn().mockResolvedValue(undefined),
            cleanup: jest.fn().mockResolvedValue(undefined),
            getAllTools: jest.fn().mockReturnValue([
                {
                    name: 'list_resources',
                    description: 'List available token system resources',
                    inputSchema: { type: 'object' },
                },
            ]),
            callTool: jest.fn().mockResolvedValue({
                content: 'Available resources: [button-tokens.json, color-tokens.json, spacing-tokens.json]',
            }),
        };
        // Mock the MCPClient constructor to return our mock
        client_1.MCPClient.mockImplementation(() => mockMCPClient);
        // Create provider with MCP enabled
        provider = new chat_1.AzureChatCompletionProvider('test-deployment', {
            config: {
                apiKey: 'test-key',
                apiHost: 'https://test.openai.azure.com',
                mcp: {
                    enabled: true,
                    server: {
                        command: 'npx',
                        args: ['@fluentui-contrib/token-analyzer-mcp'],
                        name: 'test-token-mcp',
                    },
                },
            },
        });
    });
    afterEach(async () => {
        await provider.cleanup();
        jest.clearAllMocks();
    });
    it('should integrate MCP tools with FunctionCallbackHandler', async () => {
        // Wait for MCP initialization
        await provider.initializationPromise;
        // Verify MCP client was initialized
        expect(mockMCPClient.initialize).toHaveBeenCalled();
        // Test that the function callback handler now has the MCP client
        const handler = provider.functionCallbackHandler;
        expect(handler).toBeDefined();
        expect(handler.mcpClient).toBe(mockMCPClient);
    });
    it('should execute MCP tool through FunctionCallbackHandler', async () => {
        // Wait for MCP initialization
        await provider.initializationPromise;
        const handler = provider.functionCallbackHandler;
        // Simulate a tool call that matches an MCP tool
        const toolCall = {
            name: 'list_resources',
            arguments: '{}',
        };
        const result = await handler.processCall(toolCall, {});
        // Verify MCP tool was called
        expect(mockMCPClient.callTool).toHaveBeenCalledWith('list_resources', {});
        // Verify result format matches expected pattern (not [object Object])
        expect(result).toEqual({
            output: 'MCP Tool Result (list_resources): Available resources: [button-tokens.json, color-tokens.json, spacing-tokens.json]',
            isError: false,
        });
        // Ensure it's not the problematic [object Object] output
        expect(result.output).not.toContain('[object Object]');
    });
    it('should handle MCP tool errors gracefully', async () => {
        // Wait for MCP initialization
        await provider.initializationPromise;
        // Configure mock to return an error
        mockMCPClient.callTool.mockResolvedValue({
            content: '',
            error: 'MCP server connection failed',
        });
        const handler = provider.functionCallbackHandler;
        const toolCall = {
            name: 'list_resources',
            arguments: '{}',
        };
        const result = await handler.processCall(toolCall, {});
        expect(result).toEqual({
            output: 'MCP Tool Error (list_resources): MCP server connection failed',
            isError: true,
        });
    });
    it('should work without MCP enabled (backwards compatibility)', () => {
        // Create provider without MCP
        const providerWithoutMCP = new chat_1.AzureChatCompletionProvider('test-deployment', {
            config: {
                apiKey: 'test-key',
                apiHost: 'https://test.openai.azure.com',
                // No MCP config
            },
        });
        // Should not have MCP client
        expect(providerWithoutMCP.mcpClient).toBeNull();
        // FunctionCallbackHandler should work without MCP client
        const handler = providerWithoutMCP.functionCallbackHandler;
        expect(handler).toBeDefined();
        expect(handler.mcpClient).toBeUndefined();
    });
    it('should prioritize MCP tools over function callbacks', async () => {
        // Wait for MCP initialization
        await provider.initializationPromise;
        const handler = provider.functionCallbackHandler;
        // Create a function callback with the same name as an MCP tool
        const functionCallbacks = {
            list_resources: jest.fn().mockResolvedValue('Function callback result'),
        };
        const toolCall = {
            name: 'list_resources',
            arguments: '{}',
        };
        const result = await handler.processCall(toolCall, functionCallbacks);
        // Should call MCP tool, not function callback
        expect(mockMCPClient.callTool).toHaveBeenCalledWith('list_resources', {});
        expect(functionCallbacks.list_resources).not.toHaveBeenCalled();
        // Result should be from MCP tool
        expect(result.output).toContain('MCP Tool Result');
    });
});
//# sourceMappingURL=chat-mcp-integration.test.js.map