"use strict";
/**
 * Cleanup and Signal Handling
 *
 * Manages graceful shutdown and resource cleanup for scan operations.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCleanupHandlers = registerCleanupHandlers;
const logger_1 = __importDefault(require("../../logger"));
/**
 * Register cleanup handlers for process signals
 *
 * Handles SIGINT (Ctrl+C), SIGTERM, and SIGQUIT signals to ensure
 * graceful shutdown of resources (socket, MCP bridge, spinner).
 *
 * @param refs - Mutable references to resources that need cleanup
 */
function registerCleanupHandlers(refs) {
    const cleanup = (signal) => {
        logger_1.default.debug(`Received ${signal}, cleaning up...`);
        // Abort the scan Promise - this will trigger the catch/finally blocks
        // which handle all the actual resource cleanup
        if (refs.abortController) {
            refs.abortController.abort();
        }
        // Exit code will be set in the catch block after output is flushed
        // This prevents output from appearing after the shell prompt
    };
    // Register handlers for common termination signals
    // Use process.once() to prevent duplicate registrations
    process.once('SIGINT', () => cleanup('SIGINT')); // Ctrl+C
    process.once('SIGTERM', () => cleanup('SIGTERM')); // Termination signal
    process.once('SIGQUIT', () => cleanup('SIGQUIT')); // Quit signal
}
//# sourceMappingURL=cleanup.js.map