"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenUsageTracker = void 0;
const logger_1 = __importDefault(require("../logger"));
const tokenUsageUtils_1 = require("./tokenUsageUtils");
/**
 * A utility class for tracking token usage across an evaluation
 */
class TokenUsageTracker {
    constructor() {
        this.providersMap = new Map();
    }
    /**
     * Get the singleton instance of TokenUsageTracker
     */
    static getInstance() {
        if (!TokenUsageTracker.instance) {
            TokenUsageTracker.instance = new TokenUsageTracker();
        }
        return TokenUsageTracker.instance;
    }
    /**
     * Track token usage for a provider
     * @param provider The provider to track usage for
     * @param usage The token usage to track
     */
    trackUsage(providerId, usage = { numRequests: 1 }) {
        const current = this.providersMap.get(providerId) ?? (0, tokenUsageUtils_1.createEmptyTokenUsage)();
        // Create a copy and accumulate the usage
        const updated = { ...current };
        (0, tokenUsageUtils_1.accumulateTokenUsage)(updated, usage);
        this.providersMap.set(providerId, updated);
        logger_1.default.debug(`Tracked token usage for ${providerId}: total=${usage.total ?? 0}, cached=${usage.cached ?? 0}`);
    }
    /**
     * Get the cumulative token usage for a specific provider
     * @param providerId The ID of the provider to get usage for
     * @returns The token usage for the provider
     */
    getProviderUsage(providerId) {
        return this.providersMap.get(providerId);
    }
    /**
     * Get all provider IDs that have token usage tracked
     * @returns Array of provider IDs
     */
    getProviderIds() {
        return Array.from(this.providersMap.keys());
    }
    /**
     * Get aggregated token usage across all providers
     * @returns Aggregated token usage
     */
    getTotalUsage() {
        const result = (0, tokenUsageUtils_1.createEmptyTokenUsage)();
        // Accumulate totals from all providers
        for (const usage of this.providersMap.values()) {
            (0, tokenUsageUtils_1.accumulateTokenUsage)(result, usage);
        }
        return result;
    }
    /**
     * Reset token usage for a specific provider
     * @param providerId The ID of the provider to reset
     */
    resetProviderUsage(providerId) {
        this.providersMap.delete(providerId);
    }
    /**
     * Reset token usage for all providers
     */
    resetAllUsage() {
        this.providersMap.clear();
    }
    /**
     * Cleanup method to prevent memory leaks
     */
    cleanup() {
        this.providersMap.clear();
    }
}
exports.TokenUsageTracker = TokenUsageTracker;
//# sourceMappingURL=tokenUsage.js.map