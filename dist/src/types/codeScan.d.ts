import { z } from 'zod';
export declare enum CodeScanSeverity {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    NONE = "none"
}
export declare enum FileChangeStatus {
    ADDED = "added",
    MODIFIED = "modified",
    REMOVED = "removed",
    RENAMED = "renamed"
}
export interface SeverityDisplay {
    emoji: string;
    rank: number;
}
export interface SeverityCounts {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
}
/**
 * Get emoji representation for a severity level
 * @param severity - The severity level
 * @returns Emoji string representing the severity
 */
export declare function getSeverityEmoji(severity: CodeScanSeverity): string;
/**
 * Get numeric rank for a severity level (used for sorting)
 * @param severity - The severity level
 * @returns Numeric rank (higher = more severe)
 */
export declare function getSeverityRank(severity: CodeScanSeverity): number;
/**
 * Get display information for a severity level (emoji + rank)
 * @param severity - The severity level
 * @returns Object with emoji and rank properties
 */
export declare function getSeverityDisplay(severity: CodeScanSeverity): SeverityDisplay;
/**
 * Format severity level for display
 * @param severity - The severity level (optional, returns empty string if undefined)
 * @param style - Display style ('plain' or 'markdown')
 * @returns Formatted severity string
 */
export declare function formatSeverity(severity: CodeScanSeverity | undefined, style?: 'plain' | 'markdown'): string;
/**
 * Count comments by severity level
 * @param comments - Array of comments with severity property (optional severity)
 * @returns Object with counts for each severity level
 */
export declare function countBySeverity(comments: Array<{
    severity?: CodeScanSeverity;
}>): SeverityCounts;
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
export declare function validateSeverity(severity: string): CodeScanSeverity;
export declare const FileRecordSchema: z.ZodObject<{
    path: z.ZodString;
    status: z.ZodString;
    shaA: z.ZodNullable<z.ZodString>;
    shaB: z.ZodNullable<z.ZodString>;
    linesAdded: z.ZodOptional<z.ZodNumber>;
    linesRemoved: z.ZodOptional<z.ZodNumber>;
    beforeSizeBytes: z.ZodOptional<z.ZodNumber>;
    afterSizeBytes: z.ZodOptional<z.ZodNumber>;
    isText: z.ZodOptional<z.ZodBoolean>;
    skipReason: z.ZodOptional<z.ZodString>;
    patch: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    path: string;
    status: string;
    shaA: string | null;
    shaB: string | null;
    patch?: string | undefined;
    linesAdded?: number | undefined;
    linesRemoved?: number | undefined;
    beforeSizeBytes?: number | undefined;
    afterSizeBytes?: number | undefined;
    isText?: boolean | undefined;
    skipReason?: string | undefined;
}, {
    path: string;
    status: string;
    shaA: string | null;
    shaB: string | null;
    patch?: string | undefined;
    linesAdded?: number | undefined;
    linesRemoved?: number | undefined;
    beforeSizeBytes?: number | undefined;
    afterSizeBytes?: number | undefined;
    isText?: boolean | undefined;
    skipReason?: string | undefined;
}>;
export declare const GitMetadataSchema: z.ZodObject<{
    branch: z.ZodString;
    baseBranch: z.ZodString;
    baseRef: z.ZodString;
    baseSha: z.ZodString;
    compareRef: z.ZodString;
    compareSha: z.ZodString;
    commitMessages: z.ZodArray<z.ZodString, "many">;
    author: z.ZodString;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    author: string;
    branch: string;
    baseBranch: string;
    baseRef: string;
    baseSha: string;
    compareRef: string;
    compareSha: string;
    commitMessages: string[];
}, {
    timestamp: string;
    author: string;
    branch: string;
    baseBranch: string;
    baseRef: string;
    baseSha: string;
    compareRef: string;
    compareSha: string;
    commitMessages: string[];
}>;
export declare const ScanConfigSchema: z.ZodObject<{
    minimumSeverity: z.ZodNativeEnum<typeof CodeScanSeverity>;
    diffsOnly: z.ZodBoolean;
    guidance: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    minimumSeverity: CodeScanSeverity;
    diffsOnly: boolean;
    guidance?: string | undefined;
}, {
    minimumSeverity: CodeScanSeverity;
    diffsOnly: boolean;
    guidance?: string | undefined;
}>;
export declare const PullRequestContextSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    number: z.ZodNumber;
    sha: z.ZodString;
}, "strip", z.ZodTypeAny, {
    number: number;
    owner: string;
    repo: string;
    sha: string;
}, {
    number: number;
    owner: string;
    repo: string;
    sha: string;
}>;
export declare const ScanRequestSchema: z.ZodObject<{
    files: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        status: z.ZodString;
        shaA: z.ZodNullable<z.ZodString>;
        shaB: z.ZodNullable<z.ZodString>;
        linesAdded: z.ZodOptional<z.ZodNumber>;
        linesRemoved: z.ZodOptional<z.ZodNumber>;
        beforeSizeBytes: z.ZodOptional<z.ZodNumber>;
        afterSizeBytes: z.ZodOptional<z.ZodNumber>;
        isText: z.ZodOptional<z.ZodBoolean>;
        skipReason: z.ZodOptional<z.ZodString>;
        patch: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        status: string;
        shaA: string | null;
        shaB: string | null;
        patch?: string | undefined;
        linesAdded?: number | undefined;
        linesRemoved?: number | undefined;
        beforeSizeBytes?: number | undefined;
        afterSizeBytes?: number | undefined;
        isText?: boolean | undefined;
        skipReason?: string | undefined;
    }, {
        path: string;
        status: string;
        shaA: string | null;
        shaB: string | null;
        patch?: string | undefined;
        linesAdded?: number | undefined;
        linesRemoved?: number | undefined;
        beforeSizeBytes?: number | undefined;
        afterSizeBytes?: number | undefined;
        isText?: boolean | undefined;
        skipReason?: string | undefined;
    }>, "many">;
    metadata: z.ZodObject<{
        branch: z.ZodString;
        baseBranch: z.ZodString;
        baseRef: z.ZodString;
        baseSha: z.ZodString;
        compareRef: z.ZodString;
        compareSha: z.ZodString;
        commitMessages: z.ZodArray<z.ZodString, "many">;
        author: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        author: string;
        branch: string;
        baseBranch: string;
        baseRef: string;
        baseSha: string;
        compareRef: string;
        compareSha: string;
        commitMessages: string[];
    }, {
        timestamp: string;
        author: string;
        branch: string;
        baseBranch: string;
        baseRef: string;
        baseSha: string;
        compareRef: string;
        compareSha: string;
        commitMessages: string[];
    }>;
    config: z.ZodObject<{
        minimumSeverity: z.ZodNativeEnum<typeof CodeScanSeverity>;
        diffsOnly: z.ZodBoolean;
        guidance: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        minimumSeverity: CodeScanSeverity;
        diffsOnly: boolean;
        guidance?: string | undefined;
    }, {
        minimumSeverity: CodeScanSeverity;
        diffsOnly: boolean;
        guidance?: string | undefined;
    }>;
    sessionId: z.ZodString;
    pullRequest: z.ZodOptional<z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        number: z.ZodNumber;
        sha: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        number: number;
        owner: string;
        repo: string;
        sha: string;
    }, {
        number: number;
        owner: string;
        repo: string;
        sha: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    config: {
        minimumSeverity: CodeScanSeverity;
        diffsOnly: boolean;
        guidance?: string | undefined;
    };
    metadata: {
        timestamp: string;
        author: string;
        branch: string;
        baseBranch: string;
        baseRef: string;
        baseSha: string;
        compareRef: string;
        compareSha: string;
        commitMessages: string[];
    };
    sessionId: string;
    files: {
        path: string;
        status: string;
        shaA: string | null;
        shaB: string | null;
        patch?: string | undefined;
        linesAdded?: number | undefined;
        linesRemoved?: number | undefined;
        beforeSizeBytes?: number | undefined;
        afterSizeBytes?: number | undefined;
        isText?: boolean | undefined;
        skipReason?: string | undefined;
    }[];
    pullRequest?: {
        number: number;
        owner: string;
        repo: string;
        sha: string;
    } | undefined;
}, {
    config: {
        minimumSeverity: CodeScanSeverity;
        diffsOnly: boolean;
        guidance?: string | undefined;
    };
    metadata: {
        timestamp: string;
        author: string;
        branch: string;
        baseBranch: string;
        baseRef: string;
        baseSha: string;
        compareRef: string;
        compareSha: string;
        commitMessages: string[];
    };
    sessionId: string;
    files: {
        path: string;
        status: string;
        shaA: string | null;
        shaB: string | null;
        patch?: string | undefined;
        linesAdded?: number | undefined;
        linesRemoved?: number | undefined;
        beforeSizeBytes?: number | undefined;
        afterSizeBytes?: number | undefined;
        isText?: boolean | undefined;
        skipReason?: string | undefined;
    }[];
    pullRequest?: {
        number: number;
        owner: string;
        repo: string;
        sha: string;
    } | undefined;
}>;
export declare const CommentSchema: z.ZodObject<{
    file: z.ZodNullable<z.ZodString>;
    startLine: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    line: z.ZodNullable<z.ZodNumber>;
    finding: z.ZodString;
    fix: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    severity: z.ZodOptional<z.ZodNativeEnum<typeof CodeScanSeverity>>;
    aiAgentPrompt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    file: string | null;
    line: number | null;
    finding: string;
    severity?: CodeScanSeverity | undefined;
    fix?: string | null | undefined;
    startLine?: number | null | undefined;
    aiAgentPrompt?: string | null | undefined;
}, {
    file: string | null;
    line: number | null;
    finding: string;
    severity?: CodeScanSeverity | undefined;
    fix?: string | null | undefined;
    startLine?: number | null | undefined;
    aiAgentPrompt?: string | null | undefined;
}>;
export declare const PhaseResultsSchema: z.ZodObject<{
    inventory: z.ZodString;
    tracing: z.ZodString;
    analysis: z.ZodString;
    filtering: z.ZodString;
    fixes: z.ZodString;
    comments: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tracing: string;
    analysis: string;
    inventory: string;
    filtering: string;
    fixes: string;
    comments: string;
}, {
    tracing: string;
    analysis: string;
    inventory: string;
    filtering: string;
    fixes: string;
    comments: string;
}>;
export declare const ScanResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    review: z.ZodOptional<z.ZodString>;
    comments: z.ZodArray<z.ZodObject<{
        file: z.ZodNullable<z.ZodString>;
        startLine: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        line: z.ZodNullable<z.ZodNumber>;
        finding: z.ZodString;
        fix: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        severity: z.ZodOptional<z.ZodNativeEnum<typeof CodeScanSeverity>>;
        aiAgentPrompt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        file: string | null;
        line: number | null;
        finding: string;
        severity?: CodeScanSeverity | undefined;
        fix?: string | null | undefined;
        startLine?: number | null | undefined;
        aiAgentPrompt?: string | null | undefined;
    }, {
        file: string | null;
        line: number | null;
        finding: string;
        severity?: CodeScanSeverity | undefined;
        fix?: string | null | undefined;
        startLine?: number | null | undefined;
        aiAgentPrompt?: string | null | undefined;
    }>, "many">;
    commentsPosted: z.ZodOptional<z.ZodBoolean>;
    batchCount: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    comments: {
        file: string | null;
        line: number | null;
        finding: string;
        severity?: CodeScanSeverity | undefined;
        fix?: string | null | undefined;
        startLine?: number | null | undefined;
        aiAgentPrompt?: string | null | undefined;
    }[];
    error?: string | undefined;
    review?: string | undefined;
    commentsPosted?: boolean | undefined;
    batchCount?: number | undefined;
}, {
    success: boolean;
    comments: {
        file: string | null;
        line: number | null;
        finding: string;
        severity?: CodeScanSeverity | undefined;
        fix?: string | null | undefined;
        startLine?: number | null | undefined;
        aiAgentPrompt?: string | null | undefined;
    }[];
    error?: string | undefined;
    review?: string | undefined;
    commentsPosted?: boolean | undefined;
    batchCount?: number | undefined;
}>;
export type FileRecord = z.infer<typeof FileRecordSchema>;
export type GitMetadata = z.infer<typeof GitMetadataSchema>;
export type ScanConfig = z.infer<typeof ScanConfigSchema>;
export type PullRequestContext = z.infer<typeof PullRequestContextSchema>;
export type ScanRequest = z.infer<typeof ScanRequestSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type PhaseResults = z.infer<typeof PhaseResultsSchema>;
export type ScanResponse = z.infer<typeof ScanResponseSchema>;
/**
 * JSON-RPC 2.0 message structure for MCP communication
 * Used for Socket.IO transport and MCP server communication
 */
export interface JsonRpcMessage {
    jsonrpc: '2.0';
    id?: string | number | null;
    method?: string;
    params?: unknown;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
    [key: string]: unknown;
}
export interface SocketAuthCredentials {
    apiKey?: string;
    oidcToken?: string;
}
export interface ParsedGitHubPR {
    owner: string;
    repo: string;
    number: number;
}
export interface FileChange {
    path: string;
    status: FileChangeStatus;
}
/**
 * Error thrown when git operations fail
 */
export declare class GitError extends Error {
    constructor(message: string);
}
/**
 * Error thrown when git metadata extraction fails
 */
export declare class GitMetadataError extends Error {
    constructor(message: string);
}
/**
 * Error thrown when diff processing fails
 */
export declare class DiffProcessorError extends Error {
    constructor(message: string);
}
/**
 * Error thrown when MCP filesystem server startup fails
 */
export declare class FilesystemMcpError extends Error {
    constructor(message: string);
}
/**
 * Error thrown when Socket.io MCP bridge connection fails
 */
export declare class SocketIoMcpBridgeError extends Error {
    constructor(message: string);
}
/**
 * Error thrown when config file loading or parsing fails
 */
export declare class ConfigLoadError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=codeScan.d.ts.map