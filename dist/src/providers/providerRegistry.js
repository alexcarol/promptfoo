"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerRegistry = void 0;
const logger_1 = __importDefault(require("../logger"));
/**
 * Global registry of Python providers for cleanup on process exit.
 * Ensures no zombie Python processes are left running.
 */
class ProviderRegistry {
    constructor() {
        this.providers = new Set();
        this.shutdownRegistered = false;
    }
    register(provider) {
        this.providers.add(provider);
        if (!this.shutdownRegistered) {
            this.registerShutdownHandlers();
            this.shutdownRegistered = true;
        }
    }
    unregister(provider) {
        this.providers.delete(provider);
    }
    registerShutdownHandlers() {
        let shuttingDown = false;
        const shutdown = async (signal) => {
            if (shuttingDown) {
                return; // Prevent duplicate shutdown
            }
            shuttingDown = true;
            logger_1.default.debug(`Received ${signal}, shutting down ${this.providers.size} Python providers...`);
            await Promise.all(Array.from(this.providers).map((p) => p.shutdown().catch((err) => {
                logger_1.default.error(`Error shutting down provider: ${err}`);
            })));
            logger_1.default.debug('Python provider shutdown complete');
        };
        process.once('SIGINT', () => void shutdown('SIGINT'));
        process.once('SIGTERM', () => void shutdown('SIGTERM'));
        // Use beforeExit for async cleanup (exit event cannot await)
        process.once('beforeExit', () => void shutdown('beforeExit'));
    }
    async shutdownAll() {
        const results = await Promise.allSettled(Array.from(this.providers).map((p) => p.shutdown()));
        // Log any failures but don't throw - cleanup should be defensive
        for (const result of results) {
            if (result.status === 'rejected') {
                logger_1.default.warn(`Error shutting down provider: ${result.reason}`);
            }
        }
        this.providers.clear();
    }
}
exports.providerRegistry = new ProviderRegistry();
//# sourceMappingURL=providerRegistry.js.map