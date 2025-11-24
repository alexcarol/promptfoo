import type { FetchOptions } from './types';
export declare function fetchWithProxy(url: RequestInfo, options?: FetchOptions): Promise<Response>;
export declare function fetchWithTimeout(url: RequestInfo, options: FetchOptions | undefined, timeout: number): Promise<Response>;
/**
 * Check if a response indicates rate limiting
 */
export declare function isRateLimited(response: Response): boolean;
/**
 * Handle rate limiting by waiting the appropriate amount of time
 */
export declare function handleRateLimit(response: Response): Promise<void>;
/**
 * Fetch with automatic retries and rate limit handling
 */
export type { FetchOptions } from './types';
export declare function fetchWithRetries(url: RequestInfo, options: FetchOptions | undefined, timeout: number, maxRetries?: number): Promise<Response>;
//# sourceMappingURL=index.d.ts.map