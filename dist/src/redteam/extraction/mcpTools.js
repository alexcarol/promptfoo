"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMcpToolsInfo = extractMcpToolsInfo;
const logger_1 = __importDefault(require("../../logger"));
const index_1 = require("../../providers/mcp/index");
/**
 * Helper function to check if a provider path indicates an MCP provider
 */
function isMcpProviderPath(providerPath) {
    return providerPath === 'mcp' || providerPath.startsWith('mcp:');
}
/**
 * Helper function to get provider path from ApiProvider
 */
function getProviderPath(provider) {
    // Try to get the provider ID/path - this might vary depending on how providers store their identifier
    if (typeof provider.id === 'function') {
        return provider.id();
    }
    if (typeof provider.id === 'string') {
        return provider.id;
    }
    return null;
}
/**
 * Extract tools information from MCP providers and format for red team purpose
 */
async function extractMcpToolsInfo(providers) {
    const mcpProviders = [];
    // Find MCP providers
    for (const provider of providers) {
        const providerPath = getProviderPath(provider);
        if (providerPath && isMcpProviderPath(providerPath) && provider instanceof index_1.MCPProvider) {
            mcpProviders.push(provider);
        }
    }
    if (mcpProviders.length === 0) {
        return '';
    }
    const toolsInfo = [];
    for (const mcpProvider of mcpProviders) {
        try {
            // Wait a moment for MCP provider initialization to complete
            // The MCPProvider initializes automatically in the constructor
            await mcpProvider;
            const tools = await mcpProvider.getAvailableTools();
            if (tools.length > 0) {
                toolsInfo.push('\nAvailable MCP tools:');
                for (const tool of tools) {
                    toolsInfo.push(JSON.stringify(tool));
                }
            }
        }
        catch (error) {
            logger_1.default.warn(`Failed to get tools from MCP provider: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return toolsInfo.join('\n');
}
//# sourceMappingURL=mcpTools.js.map