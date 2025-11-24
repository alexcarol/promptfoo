import type { ToolResult } from './types';
/**
 * Creates a standardized tool response with proper typing
 */
export declare function createToolResponse<T = unknown>(tool: string, success: boolean, data?: T, error?: string): ToolResult<T>;
/**
 * Creates a promise that rejects after the specified timeout
 */
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T>;
/**
 * Safely stringify objects, handling circular references and BigInt
 */
export declare function safeStringify(value: unknown, space?: string | number, replacer?: (key: string, value: unknown) => unknown): string;
/**
 * Type-safe object key checking
 */
export declare function hasKey<K extends string>(obj: Record<string, unknown>, key: K): obj is Record<K, unknown>;
/**
 * Type-safe property access with default value
 */
export declare function getProperty<T>(obj: Record<string, unknown>, key: string, defaultValue: T): T;
/**
 * Validate that a value is not null or undefined
 */
export declare function assertNotNull<T>(value: T | null | undefined, message?: string): T;
/**
 * Type-safe array filtering that removes null/undefined values
 */
export declare function filterNonNull<T>(array: (T | null | undefined)[]): T[];
/**
 * Debounce function for rate limiting
 */
export declare function debounce<T extends unknown[]>(func: (...args: T) => void, wait: number): (...args: T) => void;
/**
 * Create a retry function with exponential backoff
 */
export declare function retry<T>(operation: () => Promise<T>, options?: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
}): Promise<T>;
/**
 * Format duration in milliseconds to human readable format
 */
export declare function formatDuration(ms: number): string;
/**
 * Truncate text to specified length with ellipsis
 */
export declare function truncateText(text: string, maxLength: number): string;
//# sourceMappingURL=utils.d.ts.map