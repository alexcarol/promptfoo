/**
 * Performance utilities for MCP server operations
 */
/**
 * Simple in-memory cache for evaluation results
 */
export declare class EvaluationCache {
    private cache;
    constructor(maxSize?: number, ttlMs?: number);
    get(key: string): any;
    set(key: string, value: any): void;
    has(key: string): boolean;
    clear(): void;
    getStats(): {
        size: number;
        calculatedSize: number;
    };
}
/**
 * Pagination helper for large result sets
 */
export interface PaginationOptions {
    page?: number;
    pageSize?: number;
    maxPageSize?: number;
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
export declare function paginate<T>(items: T[], options?: PaginationOptions): PaginatedResult<T>;
/**
 * Batch processor for handling multiple operations efficiently
 */
export declare class BatchProcessor<T, R> {
    private processor;
    private batchSize;
    private delayMs;
    private queue;
    private processing;
    constructor(processor: (batch: T[]) => Promise<R[]>, batchSize?: number, delayMs?: number);
    add(item: T): Promise<R>;
    private processQueue;
}
/**
 * Stream processor for handling large datasets
 */
export declare function streamProcess<T, R>(items: T[], processor: (item: T) => Promise<R>, concurrency?: number): AsyncGenerator<R, void, unknown>;
/**
 * Default cache instances
 */
export declare const evaluationCache: EvaluationCache;
export declare const configCache: EvaluationCache;
//# sourceMappingURL=performance.d.ts.map