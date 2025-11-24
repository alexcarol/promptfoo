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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMcpServer = exports.startStdioMcpServer = exports.startHttpMcpServer = void 0;
exports.mcpCommand = mcpCommand;
const logger_1 = __importDefault(require("../../logger"));
const telemetry_1 = __importDefault(require("../../telemetry"));
const server_1 = require("./server");
function mcpCommand(program) {
    program
        .command('mcp')
        .description('Start an MCP server for external tool integrations')
        .option('-p, --port <number>', 'Port number for HTTP transport', '3100')
        .option('--transport <type>', 'Transport type: "http" or "stdio"', 'http')
        .action(async (cmdObj) => {
        // Validate transport type
        if (!['http', 'stdio'].includes(cmdObj.transport)) {
            logger_1.default.error(`Invalid transport type: ${cmdObj.transport}. Must be "http" or "stdio".`);
            process.exit(1);
        }
        telemetry_1.default.record('command_used', {
            name: 'mcp',
            transport: cmdObj.transport,
        });
        if (cmdObj.transport === 'stdio') {
            await (0, server_1.startStdioMcpServer)();
        }
        else {
            const port = Number.parseInt(cmdObj.port, 10);
            if (Number.isNaN(port)) {
                logger_1.default.error(`Invalid port number: ${cmdObj.port}`);
                process.exit(1);
            }
            await (0, server_1.startHttpMcpServer)(port);
        }
    });
}
// Re-export server functions for direct use
var server_2 = require("./server");
Object.defineProperty(exports, "startHttpMcpServer", { enumerable: true, get: function () { return server_2.startHttpMcpServer; } });
Object.defineProperty(exports, "startStdioMcpServer", { enumerable: true, get: function () { return server_2.startStdioMcpServer; } });
Object.defineProperty(exports, "createMcpServer", { enumerable: true, get: function () { return server_2.createMcpServer; } });
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map