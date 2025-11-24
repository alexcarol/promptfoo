import type { TokenUsage } from '../types/shared';
/**
 * A utility class for tracking token usage across an evaluation
 */
export declare class TokenUsageTracker {
    private static instance;
    private providersMap;
    private constructor();
    /**
     * Get the singleton instance of TokenUsageTracker
     */
    static getInstance(): TokenUsageTracker;
    /**
     * Track token usage for a provider
     * @param provider The provider to track usage for
     * @param usage The token usage to track
     */
    trackUsage(providerId: string, usage?: TokenUsage): void;
    /**
     * Get the cumulative token usage for a specific provider
     * @param providerId The ID of the provider to get usage for
     * @returns The token usage for the provider
     */
    getProviderUsage(providerId: string): TokenUsage | undefined;
    /**
     * Get all provider IDs that have token usage tracked
     * @returns Array of provider IDs
     */
    getProviderIds(): string[];
    /**
     * Get aggregated token usage across all providers
     * @returns Aggregated token usage
     */
    getTotalUsage(): TokenUsage;
    /**
     * Reset token usage for a specific provider
     * @param providerId The ID of the provider to reset
     */
    resetProviderUsage(providerId: string): void;
    /**
     * Reset token usage for all providers
     */
    resetAllUsage(): void;
    /**
     * Cleanup method to prevent memory leaks
     */
    cleanup(): void;
}
//# sourceMappingURL=tokenUsage.d.ts.map