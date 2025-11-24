/**
 * Security utilities for MCP server operations
 */
/**
 * Validates that a file path is safe and within allowed boundaries
 */
export declare function validateFilePath(filePath: string, allowedPaths?: string[]): void;
/**
 * Sanitizes a command or provider ID to prevent injection attacks
 */
export declare function sanitizeInput(input: string): string;
/**
 * Validates provider ID format
 */
export declare function validateProviderId(providerId: string): void;
/**
 * Rate limiting tracker for preventing abuse
 */
export declare class RateLimiter {
    private maxRequests;
    private windowMs;
    private requests;
    constructor(maxRequests?: number, windowMs?: number);
    /**
     * Check if a request should be allowed
     */
    isAllowed(key: string): boolean;
    /**
     * Get remaining requests for a key
     */
    getRemaining(key: string): number;
    /**
     * Clean up old entries
     */
    private cleanup;
}
/**
 * Default rate limiter instance
 */
export declare const defaultRateLimiter: RateLimiter;
//# sourceMappingURL=security.d.ts.map