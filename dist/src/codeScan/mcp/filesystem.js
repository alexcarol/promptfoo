"use strict";
/**
 * Filesystem MCP Server Management
 *
 * Spawns and manages the @modelcontextprotocol/server-filesystem child process.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFilesystemMcpServer = startFilesystemMcpServer;
exports.stopFilesystemMcpServer = stopFilesystemMcpServer;
const child_process_1 = require("child_process");
const path_1 = require("path");
const logger_1 = __importDefault(require("../../logger"));
const codeScan_1 = require("../../types/codeScan");
/**
 * Start the filesystem MCP server as a child process
 * @param rootDir Absolute path to root directory for filesystem access
 * @returns Child process handle
 */
function startFilesystemMcpServer(rootDir) {
    // Validate rootDir is absolute
    if (!(0, path_1.isAbsolute)(rootDir)) {
        throw new codeScan_1.FilesystemMcpError(`Root directory must be an absolute path, got: ${rootDir}`);
    }
    // Normalize the absolute path for consistent usage
    const absoluteRootDir = (0, path_1.resolve)(rootDir);
    logger_1.default.debug('Starting filesystem MCP server...');
    logger_1.default.debug(`Root directory: ${absoluteRootDir}`);
    try {
        // Spawn the filesystem MCP server
        // Using npx to run @modelcontextprotocol/server-filesystem
        const mcpProcess = (0, child_process_1.spawn)('npx', ['-y', '@modelcontextprotocol/server-filesystem', absoluteRootDir], {
            stdio: ['pipe', 'pipe', 'pipe'], // stdin/stdout/stderr all piped
            cwd: absoluteRootDir,
        });
        // Filter stderr to suppress expected timeout warnings
        mcpProcess.stderr?.on('data', (chunk) => {
            const message = chunk.toString('utf8');
            // Suppress "Failed to request initial roots" warnings - these are expected
            // when using HTTP MCP transport which cannot service bidirectional requests
            if (message.includes('Failed to request initial roots from client')) {
                return;
            }
            // Log other stderr messages as debug
            logger_1.default.debug(`MCP server stderr: ${message.trim()}`);
        });
        // Handle process errors
        mcpProcess.on('error', (error) => {
            logger_1.default.error(`MCP server process error: ${error.message}`);
        });
        mcpProcess.on('exit', (code, signal) => {
            if (code !== null && code !== 0) {
                logger_1.default.debug(`MCP server exited with code ${code}`);
            }
            else if (signal) {
                logger_1.default.debug(`MCP server terminated by signal ${signal}`);
            }
        });
        logger_1.default.debug(`MCP server started (pid: ${mcpProcess.pid})`);
        return mcpProcess;
    }
    catch (error) {
        throw new codeScan_1.FilesystemMcpError(`Failed to start filesystem MCP server: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Stop the filesystem MCP server process
 * @param process Child process to terminate
 */
async function stopFilesystemMcpServer(process) {
    if (!process.pid) {
        logger_1.default.debug('MCP server already stopped');
        return;
    }
    logger_1.default.debug(`Stopping MCP server (pid: ${process.pid})...`);
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            // Force kill if graceful shutdown takes too long
            logger_1.default.debug('MCP server did not exit gracefully, force killing...');
            process.kill('SIGKILL');
            resolve();
        }, 5000); // 5 second timeout
        process.on('exit', () => {
            clearTimeout(timeout);
            logger_1.default.debug('MCP server stopped');
            resolve();
        });
        // Try graceful shutdown first
        process.kill('SIGTERM');
    });
}
//# sourceMappingURL=filesystem.js.map