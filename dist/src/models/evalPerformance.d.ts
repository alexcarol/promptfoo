import type { EvalResultsFilterMode } from '../types/index';
export declare function getCachedResultsCount(evalId: string): Promise<number>;
export declare function clearCountCache(evalId?: string): void;
export declare function queryTestIndicesOptimized(evalId: string, opts: {
    offset?: number;
    limit?: number;
    filterMode?: EvalResultsFilterMode;
    searchQuery?: string;
    filters?: string[];
}): Promise<{
    testIndices: number[];
    filteredCount: number;
}>;
//# sourceMappingURL=evalPerformance.d.ts.map