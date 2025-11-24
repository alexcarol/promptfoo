/**
 * Calculate metrics for filtered evaluation results.
 *
 * This module implements optimized SQL aggregation to calculate metrics for
 * filtered evaluation datasets. It uses a single GROUP BY query to aggregate
 * ALL prompts at once, achieving significant performance improvements over
 * the naive approach of querying each prompt separately.
 *
 * Performance targets:
 * - Simple eval (2 prompts, 100 results): <50ms
 * - Complex eval (10 prompts, 1000 results): <150ms
 * - Large eval (10 prompts, 10000 results): <500ms
 *
 * Critical design decisions:
 * 1. Single GROUP BY query for all basic metrics + token usage
 * 2. SQL JSON aggregation for named scores (avoids memory issues)
 * 3. SQL JSON aggregation for assertions (complex nested JSON)
 * 4. OOM protection with MAX_RESULTS_FOR_METRICS limit
 */
import type { PromptMetrics } from '../types/index';
export interface FilteredMetricsOptions {
    evalId: string;
    numPrompts: number;
    whereSql: string;
    whereParams: any[];
}
/**
 * Calculates metrics for filtered results using optimized SQL aggregation.
 * Uses a SINGLE GROUP BY query to aggregate all prompts at once.
 *
 * This is the core performance optimization - instead of making 2-3 queries
 * per prompt (which would be 30 queries for 10 prompts), we make 3-4 total queries:
 * 1. Count check (OOM protection)
 * 2. Basic metrics + token usage (GROUP BY prompt_idx)
 * 3. Named scores (GROUP BY prompt_idx, metric_name)
 * 4. Assertions (GROUP BY prompt_idx)
 *
 * @param opts - Options including WHERE clause and parameters
 * @returns Array of PromptMetrics, one per prompt
 */
export declare function calculateFilteredMetrics(opts: FilteredMetricsOptions): Promise<PromptMetrics[]>;
//# sourceMappingURL=calculateFilteredMetrics.d.ts.map