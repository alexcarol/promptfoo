"use strict";
/**
 * Socket.io MCP Transport Bridge (CLI Side)
 *
 * Bridges MCP stdio communication with socket.io:
 * - Reads from MCP stdout → emits to socket
 * - Listens to socket → writes to MCP stdin
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIoMcpBridge = void 0;
const logger_1 = __importDefault(require("../../logger"));
const codeScan_1 = require("../../types/codeScan");
/**
 * Bridge between MCP stdio and socket.io
 */
class SocketIoMcpBridge {
    constructor(mcpProcess, socket, sessionId) {
        this.mcpProcess = mcpProcess;
        this.socket = socket;
        this.sessionId = sessionId;
        this.readBuffer = '';
        this.wireIdSeq = 0; // Sequence counter for unique wire IDs
        this.wireIdMap = new Map(); // Wire ID → original ID mapping
    }
    /**
     * Start bridging MCP stdio with the provided socket
     */
    async connect() {
        if (!this.socket.connected) {
            throw new codeScan_1.SocketIoMcpBridgeError('Socket must be connected before starting bridge');
        }
        logger_1.default.debug(`Using existing socket connection (id: ${this.socket.id})`);
        this.startBridging();
    }
    /**
     * Start bridging MCP stdio and socket.io
     */
    startBridging() {
        if (!this.socket) {
            throw new codeScan_1.SocketIoMcpBridgeError('Socket not initialized');
        }
        // Bridge 1: MCP stdout → Socket.io (classify as response/request/notification)
        this.mcpProcess.stdout?.on('data', (chunk) => {
            this.readBuffer += chunk.toString('utf8');
            // Process complete lines (JSON-RPC messages are newline-delimited)
            while (true) {
                const newlineIndex = this.readBuffer.indexOf('\n');
                if (newlineIndex === -1) {
                    break;
                }
                const line = this.readBuffer.slice(0, newlineIndex);
                this.readBuffer = this.readBuffer.slice(newlineIndex + 1);
                if (!line.trim()) {
                    continue; // Skip empty lines
                }
                try {
                    const message = JSON.parse(line);
                    // Classify JSON-RPC message type
                    const isResponse = 'result' in message || 'error' in message;
                    const isRequest = 'method' in message && !isResponse;
                    // For responses, restore original ID from wire ID
                    let batchId;
                    let restoredMessage = message;
                    if (isResponse && message.id !== undefined) {
                        const wireId = String(message.id);
                        const mapping = this.wireIdMap.get(wireId);
                        if (mapping) {
                            // Restore original ID and extract batch ID
                            batchId = mapping.batchId;
                            restoredMessage = { ...message, id: mapping.originalId };
                            this.wireIdMap.delete(wireId); // Clean up
                        }
                        else {
                            // No mapping found - use message as-is (shouldn't happen)
                            batchId = 0;
                        }
                    }
                    // Route to appropriate event based on message type
                    if (isResponse) {
                        // JSON-RPC response (has result or error)
                        this.socket?.emit('mcp:response', {
                            session_id: this.sessionId,
                            batch_id: batchId ?? 0,
                            message: restoredMessage,
                        });
                    }
                    else if (isRequest) {
                        // Server-initiated request (has method, no result/error)
                        this.socket?.emit('mcp:server-request', {
                            session_id: this.sessionId,
                            batch_id: batchId ?? 0,
                            message,
                        });
                    }
                    else {
                        // Server-initiated notification (no id, method only)
                        this.socket?.emit('mcp:server-notification', {
                            session_id: this.sessionId,
                            batch_id: batchId ?? 0,
                            message,
                        });
                    }
                }
                catch (_error) {
                    logger_1.default.debug(`Failed to parse MCP output: ${line}`);
                }
            }
        });
        // Bridge 2: Socket.io (mcp:request) → MCP stdin
        this.socket.on('mcp:request', (message) => {
            try {
                // Extract batch ID
                const batchId = message._batch_id ?? 0;
                // Remove _batch_id before processing (not part of JSON-RPC spec)
                const { _batch_id, ...cleanMessage } = message;
                // Generate wire ID and store mapping if this message has an ID
                let messageToSend = cleanMessage;
                if (cleanMessage.id !== undefined && cleanMessage.id !== null) {
                    // Use sequence counter to guarantee uniqueness even if (batch, id) pair is reused
                    const seq = this.wireIdSeq++;
                    const wireId = `b${batchId}:${String(cleanMessage.id)}:${seq}`;
                    this.wireIdMap.set(wireId, { batchId, originalId: cleanMessage.id });
                    messageToSend = { ...cleanMessage, id: wireId };
                }
                // Write JSON-RPC message to MCP stdin with newline
                const jsonLine = JSON.stringify(messageToSend) + '\n';
                this.mcpProcess.stdin?.write(jsonLine);
            }
            catch (error) {
                logger_1.default.error(`Failed to write to MCP stdin: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        logger_1.default.debug('MCP ↔ Socket.io bridge active');
    }
    /**
     * Stop bridging (socket lifecycle managed externally)
     */
    async disconnect() {
        logger_1.default.debug('Stopping MCP bridge...');
        // Clear wire ID map to prevent stale mappings
        this.wireIdMap.clear();
        this.wireIdSeq = 0;
        logger_1.default.debug('MCP bridge stopped');
    }
    /**
     * Get socket ID (if connected)
     */
    get socketId() {
        return this.socket?.id || null;
    }
    /**
     * Check if currently connected
     */
    get connected() {
        return this.socket?.connected === true;
    }
}
exports.SocketIoMcpBridge = SocketIoMcpBridge;
//# sourceMappingURL=transport.js.map