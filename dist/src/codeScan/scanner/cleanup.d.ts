/**
 * Cleanup and Signal Handling
 *
 * Manages graceful shutdown and resource cleanup for scan operations.
 */
import type { ChildProcess } from 'child_process';
import type { Socket } from 'socket.io-client';
import type ora from 'ora';
import type { SocketIoMcpBridge } from '../mcp/transport';
/**
 * Mutable references for cleanup handlers
 * Allows signal handlers to access updated MCP resources
 */
export interface CleanupRefs {
    repoPath: string;
    socket: Socket | null;
    mcpBridge: SocketIoMcpBridge | null;
    mcpProcess: ChildProcess | null;
    spinner: ReturnType<typeof ora> | null;
    abortController: AbortController | null;
}
/**
 * Register cleanup handlers for process signals
 *
 * Handles SIGINT (Ctrl+C), SIGTERM, and SIGQUIT signals to ensure
 * graceful shutdown of resources (socket, MCP bridge, spinner).
 *
 * @param refs - Mutable references to resources that need cleanup
 */
export declare function registerCleanupHandlers(refs: CleanupRefs): void;
//# sourceMappingURL=cleanup.d.ts.map