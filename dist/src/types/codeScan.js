"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoadError = exports.SocketIoMcpBridgeError = exports.FilesystemMcpError = exports.DiffProcessorError = exports.GitMetadataError = exports.GitError = exports.ScanResponseSchema = exports.PhaseResultsSchema = exports.CommentSchema = exports.ScanRequestSchema = exports.PullRequestContextSchema = exports.ScanConfigSchema = exports.GitMetadataSchema = exports.FileRecordSchema = exports.FileChangeStatus = exports.CodeScanSeverity = void 0;
exports.getSeverityEmoji = getSeverityEmoji;
exports.getSeverityRank = getSeverityRank;
exports.getSeverityDisplay = getSeverityDisplay;
exports.formatSeverity = formatSeverity;
exports.countBySeverity = countBySeverity;
exports.validateSeverity = validateSeverity;
const zod_1 = require("zod");
// ============================================================================
// Enums
// ============================================================================
var CodeScanSeverity;
(function (CodeScanSeverity) {
    CodeScanSeverity["CRITICAL"] = "critical";
    CodeScanSeverity["HIGH"] = "high";
    CodeScanSeverity["MEDIUM"] = "medium";
    CodeScanSeverity["LOW"] = "low";
    CodeScanSeverity["NONE"] = "none";
})(CodeScanSeverity || (exports.CodeScanSeverity = CodeScanSeverity = {}));
var FileChangeStatus;
(function (FileChangeStatus) {
    FileChangeStatus["ADDED"] = "added";
    FileChangeStatus["MODIFIED"] = "modified";
    FileChangeStatus["REMOVED"] = "removed";
    FileChangeStatus["RENAMED"] = "renamed";
})(FileChangeStatus || (exports.FileChangeStatus = FileChangeStatus = {}));
// ============================================================================
// Severity Utility Functions
// ============================================================================
/**
 * Get emoji representation for a severity level
 * @param severity - The severity level
 * @returns Emoji string representing the severity
 */
function getSeverityEmoji(severity) {
    switch (severity) {
        case CodeScanSeverity.CRITICAL:
            return '🔴';
        case CodeScanSeverity.HIGH:
            return '🟠';
        case CodeScanSeverity.MEDIUM:
            return '🟡';
        case CodeScanSeverity.LOW:
            return '🔵';
        case CodeScanSeverity.NONE:
            return '👍';
    }
}
/**
 * Get numeric rank for a severity level (used for sorting)
 * @param severity - The severity level
 * @returns Numeric rank (higher = more severe)
 */
function getSeverityRank(severity) {
    switch (severity) {
        case CodeScanSeverity.CRITICAL:
            return 4;
        case CodeScanSeverity.HIGH:
            return 3;
        case CodeScanSeverity.MEDIUM:
            return 2;
        case CodeScanSeverity.LOW:
            return 1;
        case CodeScanSeverity.NONE:
            return -1;
    }
}
/**
 * Get display information for a severity level (emoji + rank)
 * @param severity - The severity level
 * @returns Object with emoji and rank properties
 */
function getSeverityDisplay(severity) {
    return {
        emoji: getSeverityEmoji(severity),
        rank: getSeverityRank(severity),
    };
}
/**
 * Format severity level for display
 * @param severity - The severity level (optional, returns empty string if undefined)
 * @param style - Display style ('plain' or 'markdown')
 * @returns Formatted severity string
 */
function formatSeverity(severity, style = 'plain') {
    if (!severity) {
        return '';
    }
    const emoji = getSeverityEmoji(severity);
    const displayText = severity === CodeScanSeverity.NONE ? 'All Clear' : capitalize(severity);
    if (style === 'markdown') {
        return `_${emoji} ${displayText}_\n\n`;
    }
    return `${emoji} ${displayText}`;
}
/**
 * Count comments by severity level
 * @param comments - Array of comments with severity property (optional severity)
 * @returns Object with counts for each severity level
 */
function countBySeverity(comments) {
    const validSeverities = [
        CodeScanSeverity.CRITICAL,
        CodeScanSeverity.HIGH,
        CodeScanSeverity.MEDIUM,
        CodeScanSeverity.LOW,
    ];
    const issuesOnly = comments.filter((c) => c.severity && validSeverities.includes(c.severity));
    return {
        total: issuesOnly.length,
        critical: issuesOnly.filter((c) => c.severity === CodeScanSeverity.CRITICAL).length,
        high: issuesOnly.filter((c) => c.severity === CodeScanSeverity.HIGH).length,
        medium: issuesOnly.filter((c) => c.severity === CodeScanSeverity.MEDIUM).length,
        low: issuesOnly.filter((c) => c.severity === CodeScanSeverity.LOW).length,
    };
}
/**
 * Helper function to capitalize the first letter of a string
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
/**
 * Validates and parses a severity string into CodeScanSeverity enum
 * Normalizes input by trimming whitespace and converting to lowercase
 * @param severity - String input to validate (e.g., "high", "CRITICAL", " medium ")
 * @returns Validated CodeScanSeverity enum value
 * @throws {z.ZodError} if severity is not a valid CodeScanSeverity value
 * @example
 * validateSeverity('high') // Returns CodeScanSeverity.HIGH
 * validateSeverity('CRITICAL') // Returns CodeScanSeverity.CRITICAL
 * validateSeverity('invalid') // Throws ZodError
 */
function validateSeverity(severity) {
    // Normalize input: trim whitespace and convert to lowercase
    const normalized = severity.trim().toLowerCase();
    // Validate against enum using zod
    return zod_1.z.nativeEnum(CodeScanSeverity).parse(normalized);
}
// ============================================================================
// Scan Request/Response Schemas (API endpoint payload)
// ============================================================================
exports.FileRecordSchema = zod_1.z.object({
    path: zod_1.z.string(),
    status: zod_1.z.string(),
    shaA: zod_1.z.string().nullable(),
    shaB: zod_1.z.string().nullable(),
    linesAdded: zod_1.z.number().optional(),
    linesRemoved: zod_1.z.number().optional(),
    beforeSizeBytes: zod_1.z.number().optional(),
    afterSizeBytes: zod_1.z.number().optional(),
    isText: zod_1.z.boolean().optional(),
    skipReason: zod_1.z.string().optional(),
    patch: zod_1.z.string().optional(),
});
exports.GitMetadataSchema = zod_1.z.object({
    branch: zod_1.z.string(),
    baseBranch: zod_1.z.string(),
    baseRef: zod_1.z.string(), // Original git ref (e.g., "main", "v1.0")
    baseSha: zod_1.z.string(), // Resolved SHA (e.g., "a1b2c3d...")
    compareRef: zod_1.z.string(), // Original git ref (e.g., "feature-branch")
    compareSha: zod_1.z.string(), // Resolved SHA
    commitMessages: zod_1.z.array(zod_1.z.string()),
    author: zod_1.z.string(),
    timestamp: zod_1.z.string(),
});
exports.ScanConfigSchema = zod_1.z.object({
    minimumSeverity: zod_1.z.nativeEnum(CodeScanSeverity),
    diffsOnly: zod_1.z.boolean(),
    guidance: zod_1.z.string().optional(),
});
exports.PullRequestContextSchema = zod_1.z.object({
    owner: zod_1.z.string(),
    repo: zod_1.z.string(),
    number: zod_1.z.number(),
    sha: zod_1.z.string(),
});
exports.ScanRequestSchema = zod_1.z.object({
    files: zod_1.z.array(exports.FileRecordSchema).min(1, 'Files array cannot be empty'),
    metadata: exports.GitMetadataSchema,
    config: exports.ScanConfigSchema,
    sessionId: zod_1.z.string(),
    pullRequest: exports.PullRequestContextSchema.optional(),
});
exports.CommentSchema = zod_1.z.object({
    file: zod_1.z.string().nullable(),
    startLine: zod_1.z.number().nullable().optional(),
    line: zod_1.z.number().nullable(),
    finding: zod_1.z.string(),
    fix: zod_1.z.string().nullable().optional(),
    severity: zod_1.z.nativeEnum(CodeScanSeverity).optional(),
    aiAgentPrompt: zod_1.z.string().nullable().optional(),
});
exports.PhaseResultsSchema = zod_1.z.object({
    inventory: zod_1.z.string(),
    tracing: zod_1.z.string(),
    analysis: zod_1.z.string(),
    filtering: zod_1.z.string(),
    fixes: zod_1.z.string(),
    comments: zod_1.z.string(),
});
exports.ScanResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    review: zod_1.z.string().optional(),
    comments: zod_1.z.array(exports.CommentSchema),
    commentsPosted: zod_1.z.boolean().optional(), // True if server posted comments, false if action should post them
    batchCount: zod_1.z.number().optional(),
    error: zod_1.z.string().optional(),
});
// ============================================================================
// Error Classes
// ============================================================================
/**
 * Error thrown when git operations fail
 */
class GitError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GitError';
    }
}
exports.GitError = GitError;
/**
 * Error thrown when git metadata extraction fails
 */
class GitMetadataError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GitMetadataError';
    }
}
exports.GitMetadataError = GitMetadataError;
/**
 * Error thrown when diff processing fails
 */
class DiffProcessorError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DiffProcessorError';
    }
}
exports.DiffProcessorError = DiffProcessorError;
/**
 * Error thrown when MCP filesystem server startup fails
 */
class FilesystemMcpError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FilesystemMcpError';
    }
}
exports.FilesystemMcpError = FilesystemMcpError;
/**
 * Error thrown when Socket.io MCP bridge connection fails
 */
class SocketIoMcpBridgeError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SocketIoMcpBridgeError';
    }
}
exports.SocketIoMcpBridgeError = SocketIoMcpBridgeError;
/**
 * Error thrown when config file loading or parsing fails
 */
class ConfigLoadError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConfigLoadError';
    }
}
exports.ConfigLoadError = ConfigLoadError;
//# sourceMappingURL=codeScan.js.map