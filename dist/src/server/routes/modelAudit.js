"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelAuditRouter = void 0;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const express_1 = require("express");
const modelScan_1 = require("../../commands/modelScan");
const logger_1 = __importDefault(require("../../logger"));
const modelAudit_1 = __importDefault(require("../../models/modelAudit"));
const telemetry_1 = __importDefault(require("../../telemetry"));
const modelAuditCliParser_1 = require("../../util/modelAuditCliParser");
exports.modelAuditRouter = (0, express_1.Router)();
// Check if modelaudit is installed
exports.modelAuditRouter.get('/check-installed', async (_req, res) => {
    try {
        // First try to check if the modelaudit CLI is available
        const installed = await (0, modelScan_1.checkModelAuditInstalled)();
        res.json({ installed, cwd: process.cwd() });
    }
    catch {
        res.json({ installed: false, cwd: process.cwd() });
    }
});
// Check path type
exports.modelAuditRouter.post('/check-path', async (req, res) => {
    try {
        const { path: inputPath } = req.body;
        if (!inputPath) {
            res.status(400).json({ error: 'No path provided' });
            return;
        }
        // Handle home directory expansion
        let expandedPath = inputPath;
        if (expandedPath.startsWith('~/')) {
            expandedPath = path_1.default.join(os_1.default.homedir(), expandedPath.slice(2));
        }
        const absolutePath = path_1.default.isAbsolute(expandedPath)
            ? expandedPath
            : path_1.default.resolve(process.cwd(), expandedPath);
        // Check if path exists
        if (!fs_1.default.existsSync(absolutePath)) {
            res.json({ exists: false, type: null });
            return;
        }
        // Get path stats
        const stats = fs_1.default.statSync(absolutePath);
        const type = stats.isDirectory() ? 'directory' : 'file';
        res.json({
            exists: true,
            type,
            absolutePath,
            name: path_1.default.basename(absolutePath),
        });
    }
    catch (error) {
        logger_1.default.error(`Error checking path: ${error}`);
        res.status(500).json({ error: String(error) });
    }
});
// Run model scan
exports.modelAuditRouter.post('/scan', async (req, res) => {
    try {
        const { paths, options } = req.body;
        if (!paths || !Array.isArray(paths) || paths.length === 0) {
            res.status(400).json({ error: 'No paths provided' });
            return;
        }
        // Check if modelaudit is installed
        const installed = await (0, modelScan_1.checkModelAuditInstalled)();
        if (!installed) {
            res.status(400).json({
                error: 'ModelAudit is not installed. Please install it using: pip install modelaudit',
            });
            return;
        }
        // Resolve paths to absolute paths
        const resolvedPaths = [];
        for (const inputPath of paths) {
            // Skip empty paths
            if (!inputPath || inputPath.trim() === '') {
                continue;
            }
            // Handle home directory expansion
            let expandedPath = inputPath;
            if (expandedPath.startsWith('~/')) {
                expandedPath = path_1.default.join(os_1.default.homedir(), expandedPath.slice(2));
            }
            const absolutePath = path_1.default.isAbsolute(expandedPath)
                ? expandedPath
                : path_1.default.resolve(process.cwd(), expandedPath);
            // Check if path exists
            if (!fs_1.default.existsSync(absolutePath)) {
                res
                    .status(400)
                    .json({ error: `Path does not exist: ${inputPath} (resolved to: ${absolutePath})` });
                return;
            }
            resolvedPaths.push(absolutePath);
        }
        if (resolvedPaths.length === 0) {
            res.status(400).json({ error: 'No valid paths to scan' });
            return;
        }
        // Use the centralized CLI parser to build command arguments
        const { args } = (0, modelAuditCliParser_1.parseModelAuditArgs)(resolvedPaths, {
            ...options,
            // Force JSON format for API responses (required for parsing)
            format: 'json',
            // Enable verbose mode by default for better debugging information
            verbose: options.verbose !== false, // Allow explicit false to disable
            // Set default timeout to 1 hour for large model scans
            timeout: options.timeout || 3600,
            // Note: We handle persistence ourselves in this server route
        });
        logger_1.default.info(`Running model scan on: ${resolvedPaths.join(', ')}`);
        // Default to persisting results unless explicitly disabled
        const persist = options.persist !== false;
        // Track the scan
        telemetry_1.default.record('webui_api', {
            event: 'model_scan',
            pathCount: paths.length,
            hasBlacklist: options.blacklist?.length > 0,
            timeout: options.timeout,
            verbose: options.verbose,
            persist,
        });
        // Run the scan
        const modelAudit = (0, child_process_1.spawn)('modelaudit', args);
        let stdout = '';
        let stderr = '';
        modelAudit.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        modelAudit.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        modelAudit.on('error', (error) => {
            logger_1.default.error(`Failed to start modelaudit: ${error.message}`);
            let errorMessage = 'Failed to start model scan';
            let suggestion = 'Make sure Python and modelaudit are installed and available in your PATH.';
            if (error.message.includes('ENOENT') || error.message.includes('not found')) {
                errorMessage = 'ModelAudit command not found';
                suggestion = 'Install modelaudit using: pip install modelaudit';
            }
            else if (error.message.includes('EACCES')) {
                errorMessage = 'Permission denied when trying to execute modelaudit';
                suggestion = 'Check that modelaudit is executable and you have the necessary permissions';
            }
            res.status(500).json({
                error: errorMessage,
                originalError: error.message,
                suggestion: suggestion,
                debug: {
                    command: 'modelaudit',
                    args: args,
                    paths: resolvedPaths,
                    cwd: process.cwd(),
                },
            });
        });
        modelAudit.on('close', async (code) => {
            // ModelAudit returns exit code 1 when it finds issues, which is expected
            if (code !== null && code !== 0 && code !== 1) {
                logger_1.default.error(`Model scan process exited with code ${code}`);
                // Provide more detailed error information to the frontend
                let errorMessage = `Model scan failed with exit code ${code}`;
                let errorDetails = {};
                // Parse stderr for common error patterns and provide helpful messages
                if (stderr) {
                    const stderrLower = stderr.toLowerCase();
                    if (stderrLower.includes('permission denied') || stderrLower.includes('access denied')) {
                        errorMessage = 'Permission denied: Unable to access the specified files or directories';
                        errorDetails = {
                            type: 'permission_error',
                            suggestion: 'Check that the files exist and you have read permissions',
                        };
                    }
                    else if (stderrLower.includes('file not found') ||
                        stderrLower.includes('no such file')) {
                        errorMessage = 'Files or directories not found';
                        errorDetails = {
                            type: 'file_not_found',
                            suggestion: 'Verify the file paths are correct and the files exist',
                        };
                    }
                    else if (stderrLower.includes('out of memory') || stderrLower.includes('memory')) {
                        errorMessage = 'Insufficient memory to complete the scan';
                        errorDetails = {
                            type: 'memory_error',
                            suggestion: 'Try scanning smaller files or reducing the number of files scanned at once',
                        };
                    }
                    else if (stderrLower.includes('timeout') || stderrLower.includes('timed out')) {
                        errorMessage = 'Scan operation timed out';
                        errorDetails = {
                            type: 'timeout_error',
                            suggestion: 'Try increasing the timeout value or scanning fewer files',
                        };
                    }
                    else if (stderrLower.includes('invalid') || stderrLower.includes('malformed')) {
                        errorMessage = 'Invalid or malformed model files detected';
                        errorDetails = {
                            type: 'invalid_model',
                            suggestion: 'Ensure the files are valid model files and not corrupted',
                        };
                    }
                    else if (stderrLower.includes('unsupported')) {
                        errorMessage = 'Unsupported model format or file type';
                        errorDetails = {
                            type: 'unsupported_format',
                            suggestion: 'Check the modelaudit documentation for supported file formats',
                        };
                    }
                    else if (stderrLower.includes('connection') || stderrLower.includes('network')) {
                        errorMessage = 'Network or connection error during scan';
                        errorDetails = {
                            type: 'network_error',
                            suggestion: 'Check your internet connection if the scan requires downloading external resources',
                        };
                    }
                    else if (stderrLower.includes('disk space') || stderrLower.includes('no space')) {
                        errorMessage = 'Insufficient disk space';
                        errorDetails = {
                            type: 'disk_space_error',
                            suggestion: 'Free up disk space and try again',
                        };
                    }
                    else if (stderrLower.includes('python') && stderrLower.includes('version')) {
                        errorMessage = 'Python version compatibility issue';
                        errorDetails = {
                            type: 'python_version_error',
                            suggestion: 'Check that you have a supported Python version installed',
                        };
                    }
                    else if (stderrLower.includes('no such option') ||
                        stderrLower.includes('unrecognized option')) {
                        errorMessage = 'Invalid command line option provided to modelaudit';
                        errorDetails = {
                            type: 'invalid_option_error',
                            suggestion: 'Check that all command line options are supported by the current modelaudit version',
                        };
                    }
                    else if (stderrLower.includes('usage:') && stderrLower.includes('try')) {
                        errorMessage = 'Invalid command syntax or arguments';
                        errorDetails = {
                            type: 'usage_error',
                            suggestion: 'Review the command arguments. The modelaudit usage help is shown in stderr.',
                        };
                    }
                }
                res.status(500).json({
                    error: errorMessage,
                    exitCode: code,
                    stderr: stderr || undefined,
                    stdout: stdout || undefined,
                    ...errorDetails,
                    debug: {
                        command: 'modelaudit',
                        args: args,
                        paths: resolvedPaths,
                        cwd: process.cwd(),
                    },
                });
                return;
            }
            try {
                const jsonOutput = stdout.trim();
                if (!jsonOutput) {
                    res.status(500).json({
                        error: 'No output received from model scan',
                        stderr: stderr || undefined,
                        suggestion: 'The scan may have failed silently. Check that the model files are valid and accessible.',
                        debug: {
                            command: 'modelaudit',
                            args: args,
                            paths: resolvedPaths,
                            cwd: process.cwd(),
                            exitCode: code,
                        },
                    });
                    return;
                }
                let scanResults;
                try {
                    scanResults = JSON.parse(jsonOutput);
                }
                catch (parseError) {
                    logger_1.default.error(`Failed to parse model scan output: ${parseError}`);
                    res.status(500).json({
                        error: 'Failed to parse scan results - invalid JSON output',
                        parseError: String(parseError),
                        output: jsonOutput.substring(0, 1000), // Include first 1000 chars for debugging
                        stderr: stderr || undefined,
                        suggestion: 'The model scan may have produced invalid output. Check the raw output for error messages.',
                        debug: {
                            command: 'modelaudit',
                            args: args,
                            paths: resolvedPaths,
                            cwd: process.cwd(),
                            exitCode: code,
                        },
                    });
                    return;
                }
                // Persist to database by default
                let auditId;
                if (persist) {
                    try {
                        const audit = await modelAudit_1.default.create({
                            name: options.name || `API scan ${new Date().toISOString()}`,
                            author: options.author || null,
                            modelPath: resolvedPaths.join(', '),
                            results: {
                                ...scanResults,
                                rawOutput: jsonOutput, // Include raw output in persisted results
                            },
                            metadata: {
                                paths: resolvedPaths,
                                originalPaths: paths,
                                options: {
                                    blacklist: options.blacklist,
                                    timeout: options.timeout,
                                    maxFileSize: options.maxFileSize,
                                    maxTotalSize: options.maxTotalSize,
                                    verbose: options.verbose,
                                },
                            },
                        });
                        auditId = audit.id;
                        logger_1.default.info(`Model scan results saved to database with ID: ${auditId}`);
                    }
                    catch (dbError) {
                        logger_1.default.error(`Failed to save scan results to database: ${dbError}`);
                        // Continue - we'll still return the results even if DB save failed
                    }
                }
                // Return the scan results along with audit ID if saved
                res.json({
                    ...scanResults,
                    rawOutput: jsonOutput, // Include the raw output from the scanner
                    ...(auditId && { auditId }),
                    persisted: persist && !!auditId,
                });
            }
            catch (error) {
                logger_1.default.error(`Error processing model scan results: ${error}`);
                res.status(500).json({
                    error: 'Error processing scan results',
                    details: String(error),
                });
            }
        });
    }
    catch (error) {
        logger_1.default.error(`Error in model scan endpoint: ${error}`);
        res.status(500).json({ error: String(error) });
    }
});
// Get all model scans
exports.modelAuditRouter.get('/scans', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const audits = await modelAudit_1.default.getMany(limit);
        res.json({
            scans: audits.map((audit) => audit.toJSON()),
            total: audits.length,
        });
    }
    catch (error) {
        logger_1.default.error(`Error fetching model audits: ${error}`);
        res.status(500).json({ error: String(error) });
    }
});
// Get specific model scan by ID
exports.modelAuditRouter.get('/scans/:id', async (req, res) => {
    try {
        const audit = await modelAudit_1.default.findById(req.params.id);
        if (!audit) {
            res.status(404).json({ error: 'Model scan not found' });
            return;
        }
        res.json(audit.toJSON());
    }
    catch (error) {
        logger_1.default.error(`Error fetching model audit: ${error}`);
        res.status(500).json({ error: String(error) });
    }
});
// Delete model scan
exports.modelAuditRouter.delete('/scans/:id', async (req, res) => {
    try {
        const audit = await modelAudit_1.default.findById(req.params.id);
        if (!audit) {
            res.status(404).json({ error: 'Model scan not found' });
            return;
        }
        await audit.delete();
        res.json({ success: true, message: 'Model scan deleted successfully' });
    }
    catch (error) {
        logger_1.default.error(`Error deleting model audit: ${error}`);
        res.status(500).json({ error: String(error) });
    }
});
//# sourceMappingURL=modelAudit.js.map