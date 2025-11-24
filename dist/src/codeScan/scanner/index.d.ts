/**
 * Core Scan Execution Logic
 *
 * Main entry point for scanner module - orchestrates the complete scan process.
 */
/**
 * Options for executing a scan
 * These are the CLI options that get passed in
 */
export interface ScanOptions {
    config?: string;
    apiHost?: string;
    apiKey?: string;
    diffsOnly?: boolean;
    base?: string;
    compare?: string;
    json?: boolean;
    githubPr?: string;
    minimumSeverity?: string;
    minSeverity?: string;
    guidance?: string;
    guidanceFile?: string;
}
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
export declare function executeScan(repoPath: string, options: ScanOptions): Promise<void>;
//# sourceMappingURL=index.d.ts.map