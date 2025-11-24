/**
 * Scan Request Building and Execution
 *
 * Handles building scan requests and executing them via Socket.IO.
 */
import type ora from 'ora';
import type { Socket } from 'socket.io-client';
import type { ScanRequest, ScanResponse, PullRequestContext, FileRecord, GitMetadata } from '../../types/codeScan';
import type { Config } from '../config/schema';
/**
 * Options for scan execution
 */
export interface ScanExecutionOptions {
    showSpinner: boolean;
    spinner?: ReturnType<typeof ora>;
    abortController: AbortController;
}
/**
 * Build scan request from inputs
 *
 * @param files - Files to scan
 * @param metadata - Git metadata
 * @param config - Scan configuration
 * @param sessionId - Session ID for scan tracking and cancellation
 * @param pullRequest - Optional PR context
 * @param guidance - Optional custom guidance
 * @returns Scan request object
 */
export declare function buildScanRequest(files: FileRecord[], metadata: GitMetadata, config: Config, sessionId: string, pullRequest?: PullRequestContext, guidance?: string): ScanRequest;
/**
 * Execute scan request via Socket.IO
 *
 * @param socket - Connected Socket.IO socket
 * @param request - Scan request to send
 * @param options - Execution options
 * @returns Promise resolving to scan response
 * @throws Error if scan fails, connection lost, or user cancels
 */
export declare function executeScanRequest(socket: Socket, request: ScanRequest, options: ScanExecutionOptions): Promise<ScanResponse>;
//# sourceMappingURL=request.d.ts.map