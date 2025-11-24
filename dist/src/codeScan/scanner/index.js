"use strict";
/**
 * Core Scan Execution Logic
 *
 * Main entry point for scanner module - orchestrates the complete scan process.
 */
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeScan = executeScan;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const cliState_1 = __importDefault(require("../../cliState"));
const logger_1 = __importStar(require("../../logger"));
const loader_1 = require("../config/loader");
const auth_1 = require("../util/auth");
const github_1 = require("../util/github");
const diff_1 = require("../git/diff");
const diffProcessor_1 = require("../git/diffProcessor");
const metadata_1 = require("../git/metadata");
const index_1 = require("../mcp/index");
const filesystem_1 = require("../mcp/filesystem");
const socket_1 = require("./socket");
const cleanup_1 = require("./cleanup");
const output_1 = require("./output");
const request_1 = require("./request");
/**
 * Execute a complete security scan
 *
 * This is the main entry point for the scanner - it orchestrates:
 * - Configuration loading
 * - Socket.IO connection
 * - MCP bridge setup (if not diffs-only)
 * - Git diff processing
 * - Scan request execution
 * - Result display
 * - Cleanup
 *
 * @param repoPath - Path to repository to scan
 * @param options - Scan options from CLI
 */
async function executeScan(repoPath, options) {
    let socket = null;
    let mcpProcess = null;
    let mcpBridge = null;
    let sessionId = undefined;
    const startTime = Date.now();
    // Load and merge configuration
    const baseConfig = (0, loader_1.loadConfigOrDefault)(options.config);
    const config = (0, loader_1.mergeConfigWithOptions)(baseConfig, options);
    // Resolve guidance (CLI options take precedence)
    const guidance = (0, loader_1.resolveGuidance)(options, config);
    // Resolve repository path
    const absoluteRepoPath = path_1.default.resolve(repoPath);
    // Display startup messages (skip in JSON mode to keep stdout clean for parsing)
    if (!options.json) {
        logger_1.default.info('Beginning scan for LLM-related vulnerabilities in your code.');
        logger_1.default.info(`  Minimum severity: ${config.minimumSeverity}`);
        if (config.diffsOnly) {
            logger_1.default.info(`  Mode: diffs only`);
        }
        else {
            logger_1.default.info(`  Mode: diffs + tracing into repo`);
        }
        logger_1.default.info('');
    }
    logger_1.default.debug(`Repository: ${absoluteRepoPath}`);
    // Create mutable refs for cleanup handlers
    // This allows signal handlers to access resources even if created later
    const cleanupRefs = {
        repoPath: absoluteRepoPath,
        socket: null,
        mcpBridge: null,
        mcpProcess: null,
        spinner: null,
        abortController: null,
    };
    // Register cleanup handlers for signals (SIGINT, SIGTERM, etc.)
    (0, cleanup_1.registerCleanupHandlers)(cleanupRefs);
    // Initialize spinner (hide in JSON mode, but still show logger.info status)
    const isWebUI = Boolean(cliState_1.default.webUI);
    const spinner = (0, output_1.createSpinner)({
        json: options.json || false,
        isWebUI,
        logLevel: (0, logger_1.getLogLevel)(),
    });
    if (spinner) {
        cleanupRefs.spinner = spinner; // Update ref for signal handlers
    }
    const showSpinner = Boolean(spinner);
    try {
        // Create AbortController for cancelling the scan
        const abortController = new AbortController();
        cleanupRefs.abortController = abortController; // Update ref for signal handlers
        // Resolve auth credentials for socket.io
        const auth = (0, auth_1.resolveAuthCredentials)(options.apiKey);
        // Determine API host URL
        const apiHost = (0, loader_1.resolveApiHost)(options, config);
        logger_1.default.debug(`Promptfoo API host URL: ${apiHost}`);
        // Create Socket.IO connection
        if (!showSpinner) {
            logger_1.default.debug('Connecting to server...');
        }
        socket = await (0, socket_1.createSocketConnection)(apiHost, auth);
        cleanupRefs.socket = socket; // Update ref for signal handlers
        // Generate session ID for all scans (used for cancellation and MCP)
        sessionId = crypto_1.default.randomUUID();
        logger_1.default.debug(`Session ID: ${sessionId}`);
        // Emit scan:session to establish session on server
        socket.emit('scan:session', { sessionId });
        // Optionally start MCP filesystem server + bridge
        if (!config.diffsOnly) {
            const mcpSetup = await (0, index_1.setupMcpBridge)(socket, absoluteRepoPath, sessionId);
            mcpProcess = mcpSetup.mcpProcess;
            mcpBridge = mcpSetup.mcpBridge;
            cleanupRefs.mcpProcess = mcpProcess; // Update ref for signal handlers
            cleanupRefs.mcpBridge = mcpBridge; // Update ref for signal handlers
        }
        // Validate branch and determine base branch
        logger_1.default.debug('Processing git diff...');
        const simpleGit = (await Promise.resolve().then(() => __importStar(require('simple-git')))).default;
        const git = simpleGit(absoluteRepoPath);
        // Validate we're on a branch (only if compare ref not specified)
        if (!options.compare) {
            await (0, diff_1.validateOnBranch)(git);
        }
        // Determine base branch (use provided or auto-detect)
        let baseBranch;
        if (options.base) {
            baseBranch = options.base;
        }
        else {
            const branches = await git.branch();
            baseBranch =
                branches.all.includes('main') || branches.all.includes('origin/main')
                    ? 'main'
                    : branches.all.includes('master') || branches.all.includes('origin/master')
                        ? 'master'
                        : 'main';
        }
        // Determine compare ref (use provided or default to HEAD)
        const compareRef = options.compare || 'HEAD';
        logger_1.default.debug(`Comparing: ${baseBranch}...${compareRef}`);
        // Process diff with focused pipeline
        const files = await (0, diffProcessor_1.processDiff)(absoluteRepoPath, baseBranch, compareRef);
        const includedFiles = files.filter((f) => !f.skipReason && f.patch);
        const skippedFiles = files.filter((f) => f.skipReason);
        logger_1.default.debug(`Files changed: ${files.length} (${includedFiles.length} included, ${skippedFiles.length} skipped)`);
        // Extract git metadata
        const metadata = await (0, metadata_1.extractMetadata)(absoluteRepoPath, baseBranch, compareRef);
        logger_1.default.debug(`Compare ref: ${metadata.branch}`);
        logger_1.default.debug(`Commits: ${metadata.commitMessages.length}`);
        // Build pull request context if --github-pr flag provided
        let pullRequest = undefined;
        if (options.githubPr) {
            const parsed = (0, github_1.parseGitHubPr)(options.githubPr);
            if (!parsed) {
                throw new Error(`Invalid --github-pr format: "${options.githubPr}". Expected format: owner/repo#number (e.g., promptfoo/promptfoo#123)`);
            }
            // Get current commit SHA
            const currentCommit = await git.revparse(['HEAD']);
            pullRequest = {
                owner: parsed.owner,
                repo: parsed.repo,
                number: parsed.number,
                sha: currentCommit.trim(),
            };
            logger_1.default.debug(`GitHub PR context: ${parsed.owner}/${parsed.repo}#${parsed.number} (${pullRequest.sha.substring(0, 7)})`);
        }
        // Send scan request via Socket.IO
        if (!showSpinner) {
            logger_1.default.debug('Scanning code...');
        }
        const scanRequest = (0, request_1.buildScanRequest)(files, metadata, config, sessionId, pullRequest, guidance);
        const scanResponse = await (0, request_1.executeScanRequest)(socket, scanRequest, {
            showSpinner,
            spinner,
            abortController,
        });
        // Stop spinner silently
        if (showSpinner && spinner) {
            spinner.stop();
        }
        const endTime = Date.now();
        const duration = endTime - startTime;
        // Display results
        (0, output_1.displayScanResults)(scanResponse, duration, {
            json: options.json || false,
            githubPr: options.githubPr,
        });
    }
    catch (error) {
        const msg = `Scan failed: ${error instanceof Error ? error.message : String(error)}`;
        if (showSpinner && spinner) {
            spinner.fail(msg);
        }
        else {
            logger_1.default.error(msg);
        }
        // Store exit code to be set after all output is flushed (in main.ts finally block)
        cliState_1.default.postActionCallback = async () => {
            await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for output to be flushed
            if (error instanceof Error && error.message === 'cancelled by user') {
                process.exitCode = 130; // Standard exit code for SIGINT
            }
            else {
                process.exitCode = 1; // Error exit code
            }
        };
    }
    finally {
        // Cleanup: Stop MCP bridge and server, disconnect socket
        if (mcpBridge) {
            await mcpBridge.disconnect().catch(() => {
                logger_1.default.debug('MCP bridge cleanup completed');
            });
        }
        if (mcpProcess) {
            await (0, filesystem_1.stopFilesystemMcpServer)(mcpProcess).catch(() => {
                logger_1.default.debug('MCP server cleanup completed');
            });
        }
        if (socket) {
            socket.disconnect();
            logger_1.default.debug('Socket disconnected');
        }
    }
}
//# sourceMappingURL=index.js.map