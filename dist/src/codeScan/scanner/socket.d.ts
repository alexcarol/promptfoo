/**
 * Socket.IO Connection Management
 *
 * Handles creation and configuration of Socket.IO connections for code scanning.
 */
import { type Socket } from 'socket.io-client';
import type { SocketAuthCredentials } from '../../types/codeScan';
/**
 * Create and configure Socket.IO connection
 *
 * @param apiHost - API host URL to connect to
 * @param auth - Authentication credentials
 * @returns Promise resolving to connected Socket
 * @throws Error if connection fails or times out
 */
export declare function createSocketConnection(apiHost: string, auth: SocketAuthCredentials): Promise<Socket>;
//# sourceMappingURL=socket.d.ts.map