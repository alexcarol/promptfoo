import type { FetchOptions } from './types';
/**
 * Enhanced fetch wrapper that adds logging, authentication, error handling, and optional compression
 */
export declare function monkeyPatchFetch(url: string | URL | Request, options?: FetchOptions): Promise<Response>;
//# sourceMappingURL=monkeyPatchFetch.d.ts.map