"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMcpServer = createMcpServer;
exports.startHttpMcpServer = startHttpMcpServer;
exports.startStdioMcpServer = startStdioMcpServer;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const express_1 = __importDefault(require("express"));
const logger_1 = __importDefault(require("../../logger"));
const telemetry_1 = __importDefault(require("../../telemetry"));
const resources_1 = require("./resources");
const compareProviders_1 = require("./tools/compareProviders");
const generateDataset_1 = require("./tools/generateDataset");
const generateTestCases_1 = require("./tools/generateTestCases");
const getEvaluationDetails_1 = require("./tools/getEvaluationDetails");
const listEvaluations_1 = require("./tools/listEvaluations");
const redteamGenerate_1 = require("./tools/redteamGenerate");
const redteamRun_1 = require("./tools/redteamRun");
const runAssertion_1 = require("./tools/runAssertion");
const runEvaluation_1 = require("./tools/runEvaluation");
const shareEvaluation_1 = require("./tools/shareEvaluation");
const testProvider_1 = require("./tools/testProvider");
const validatePromptfooConfig_1 = require("./tools/validatePromptfooConfig");
/**
 * Creates an MCP server with tools for interacting with promptfoo
 */
async function createMcpServer() {
    const server = new mcp_js_1.McpServer({
        name: 'Promptfoo MCP',
        version: '1.0.0',
    });
    // Track MCP server creation
    telemetry_1.default.record('feature_used', {
        feature: 'mcp_server',
        transport: process.env.MCP_TRANSPORT || 'unknown',
    });
    // Note: Tool usage tracking would require deeper integration with MCP SDK
    // For now, we track server creation and start events
    // Register core evaluation tools
    (0, listEvaluations_1.registerListEvaluationsTool)(server);
    (0, getEvaluationDetails_1.registerGetEvaluationDetailsTool)(server);
    (0, validatePromptfooConfig_1.registerValidatePromptfooConfigTool)(server);
    (0, testProvider_1.registerTestProviderTool)(server);
    (0, runAssertion_1.registerRunAssertionTool)(server);
    (0, runEvaluation_1.registerRunEvaluationTool)(server);
    (0, shareEvaluation_1.registerShareEvaluationTool)(server);
    // Register generation tools
    (0, generateDataset_1.registerGenerateDatasetTool)(server);
    (0, generateTestCases_1.registerGenerateTestCasesTool)(server);
    (0, compareProviders_1.registerCompareProvidersTool)(server);
    // Register redteam tools
    (0, redteamRun_1.registerRedteamRunTool)(server);
    (0, redteamGenerate_1.registerRedteamGenerateTool)(server);
    // Register resources
    (0, resources_1.registerResources)(server);
    return server;
}
/**
 * Starts an MCP server with HTTP transport
 */
async function startHttpMcpServer(port) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`Invalid port number: ${port}. Port must be an integer between 1 and 65535.`);
    }
    // Set transport type for telemetry
    process.env.MCP_TRANSPORT = 'http';
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    const server = await createMcpServer();
    // Set up HTTP transport for MCP
    const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
        sessionIdGenerator: () => Math.random().toString(36).substring(2, 15),
    });
    await server.connect(transport);
    // Handle MCP requests
    app.post('/mcp', async (req, res) => {
        await transport.handleRequest(req, res, req.body);
    });
    // Handle SSE
    app.get('/mcp/sse', async (req, res) => {
        await transport.handleRequest(req, res);
    });
    // Health check
    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'OK', message: 'Promptfoo MCP server is running' });
    });
    // Start the server
    app.listen(port, () => {
        logger_1.default.info(`Promptfoo MCP server running at http://localhost:${port}`);
        logger_1.default.info(`MCP endpoint: http://localhost:${port}/mcp`);
        logger_1.default.info(`SSE endpoint: http://localhost:${port}/mcp/sse`);
        // Track server start
        telemetry_1.default.record('feature_used', {
            feature: 'mcp_server_started',
            transport: 'http',
            port,
        });
    });
}
/**
 * Starts an MCP server with stdio transport
 */
async function startStdioMcpServer() {
    // Set transport type for telemetry
    process.env.MCP_TRANSPORT = 'stdio';
    // Disable all console logging in stdio mode to prevent pollution of JSON-RPC communication
    logger_1.default.transports.forEach((transport) => {
        // Winston Console transport constructor name check
        if (transport.constructor.name === 'Console' || transport.name === 'console') {
            transport.silent = true;
        }
    });
    const server = await createMcpServer();
    // Set up stdio transport
    const transport = new stdio_js_1.StdioServerTransport();
    // Connect the server to the stdio transport
    await server.connect(transport);
    // Track server start
    telemetry_1.default.record('feature_used', {
        feature: 'mcp_server_started',
        transport: 'stdio',
    });
    // Don't log to stdout in stdio mode as it pollutes the JSON-RPC protocol
    // logger.info('Promptfoo MCP stdio server started');
}
//# sourceMappingURL=server.js.map