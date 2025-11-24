import { type CompletedPrompt, type EvalSummary, type EvaluateResult, type EvaluateStats, type EvaluateSummaryV2, type EvaluateSummaryV3, type EvaluateTable, type EvaluateTableRow, type Prompt, type ResultsFile, type UnifiedConfig } from '../types/index';
import EvalResult from './evalResult';
import type { EvalResultsFilterMode } from '../types/index';
export declare function createEvalId(createdAt?: Date): string;
/** Result from queries extracting variable keys with eval IDs */
export interface VarKeyWithEvalIdResult {
    key: string;
    eval_id: string;
}
/** Result from queries extracting variable keys */
export interface VarKeyResult {
    key: string;
}
export declare class EvalQueries {
    static getVarsFromEvals(evals: Eval[]): Promise<Record<string, string[]>>;
    static getVarsFromEval(evalId: string): Promise<string[]>;
    static setVars(evalId: string, vars: string[]): Promise<void>;
    static getMetadataKeysFromEval(evalId: string, comparisonEvalIds?: string[]): Promise<string[]>;
    /**
     * Queries all unique metadata values for a given metadata key.
     * @param evalId - The ID of the eval to get the metadata values from.
     * @param key - The key of the metadata to get the values from.
     * @returns An array of unique metadata values.
     */
    static getMetadataValuesFromEval(evalId: string, key: string): string[];
}
export default class Eval {
    id: string;
    createdAt: number;
    author?: string;
    description?: string;
    config: Partial<UnifiedConfig>;
    results: EvalResult[];
    datasetId?: string;
    prompts: CompletedPrompt[];
    oldResults?: EvaluateSummaryV2;
    persisted: boolean;
    vars: string[];
    _resultsLoaded: boolean;
    runtimeOptions?: Partial<import('../types').EvaluateOptions>;
    _shared: boolean;
    static latest(): Promise<Eval | undefined>;
    static findById(id: string): Promise<Eval | undefined>;
    static getMany(limit?: number): Promise<Eval[]>;
    static create(config: Partial<UnifiedConfig>, renderedPrompts: Prompt[], // The config doesn't contain the actual prompts, so we need to pass them in separately
    opts?: {
        id?: string;
        createdAt?: Date;
        author?: string;
        results?: EvalResult[];
        vars?: string[];
        runtimeOptions?: Partial<import('../types').EvaluateOptions>;
        completedPrompts?: CompletedPrompt[];
    }): Promise<Eval>;
    constructor(config: Partial<UnifiedConfig>, opts?: {
        id?: string;
        createdAt?: Date;
        author?: string;
        description?: string;
        prompts?: CompletedPrompt[];
        datasetId?: string;
        persisted?: boolean;
        vars?: string[];
        runtimeOptions?: Partial<import('../types').EvaluateOptions>;
    });
    version(): 4 | 3;
    useOldResults(): boolean;
    setTable(table: EvaluateTable): void;
    save(): Promise<void>;
    setVars(vars: string[]): void;
    addVar(varName: string): void;
    getPrompts(): {
        provider: string;
        raw: string;
        label: string;
        function?: ((args_0: {
            vars: Record<string, any>;
            provider?: import("../types/providers").ApiProvider | undefined;
        }, ...args: unknown[]) => Promise<any>) | undefined;
        id?: string | undefined;
        display?: string | undefined;
        config?: any;
        metrics?: {
            cost: number;
            tokenUsage: {
                prompt?: number | undefined;
                completion?: number | undefined;
                cached?: number | undefined;
                total?: number | undefined;
                numRequests?: number | undefined;
                completionDetails?: {
                    reasoning?: number | undefined;
                    acceptedPrediction?: number | undefined;
                    rejectedPrediction?: number | undefined;
                } | undefined;
                assertions?: {
                    prompt?: number | undefined;
                    completion?: number | undefined;
                    cached?: number | undefined;
                    total?: number | undefined;
                    numRequests?: number | undefined;
                    completionDetails?: {
                        reasoning?: number | undefined;
                        acceptedPrediction?: number | undefined;
                        rejectedPrediction?: number | undefined;
                    } | undefined;
                } | undefined;
            };
            score: number;
            testPassCount: number;
            testFailCount: number;
            testErrorCount: number;
            assertPassCount: number;
            assertFailCount: number;
            totalLatencyMs: number;
            namedScores: Record<string, number>;
            namedScoresCount: Record<string, number>;
            redteam?: {
                pluginPassCount: Record<string, number>;
                pluginFailCount: Record<string, number>;
                strategyPassCount: Record<string, number>;
                strategyFailCount: Record<string, number>;
            } | undefined;
        } | undefined;
    }[];
    getTable(): Promise<EvaluateTable>;
    addResult(result: EvaluateResult): Promise<void>;
    fetchResultsBatched(batchSize?: number): AsyncGenerator<EvalResult[], void, unknown>;
    getResultsCount(): Promise<number>;
    fetchResultsByTestIdx(testIdx: number): Promise<EvalResult[]>;
    /**
     * CRITICAL: Builds the WHERE SQL clause for filtering results.
     * This is the single source of truth for all filtering logic.
     * Used by both queryTestIndices() (pagination) and getFilteredMetrics().
     *
     * Any changes to filter logic MUST be made here to ensure consistency
     * between displayed rows and calculated metrics.
     *
     * @returns SQL WHERE clause string (without "WHERE" keyword)
     */
    private buildFilterWhereSql;
    /**
     * Private helper method to build filter conditions and query for test indices
     */
    private queryTestIndices;
    /**
     * CRITICAL: Calculates metrics for filtered results.
     * Uses the SAME WHERE clause as queryTestIndices() to ensure consistency.
     *
     * This method is called from the API route when filters are active to provide
     * metrics that accurately reflect the filtered dataset.
     *
     * @returns Array of PromptMetrics, one per prompt
     */
    getFilteredMetrics(opts: {
        filterMode?: EvalResultsFilterMode;
        searchQuery?: string;
        filters?: string[];
    }): Promise<import('../types').PromptMetrics[]>;
    getTablePage(opts: {
        offset?: number;
        limit?: number;
        filterMode?: EvalResultsFilterMode;
        testIndices?: number[];
        searchQuery?: string;
        filters?: string[];
    }): Promise<{
        head: {
            prompts: Prompt[];
            vars: string[];
        };
        body: EvaluateTableRow[];
        totalCount: number;
        filteredCount: number;
        id: string;
    }>;
    addPrompts(prompts: CompletedPrompt[]): Promise<void>;
    setResults(results: EvalResult[]): Promise<void>;
    loadResults(): Promise<void>;
    getResults(): Promise<EvaluateResult[] | EvalResult[]>;
    clearResults(): void;
    getStats(): EvaluateStats;
    toEvaluateSummary(): Promise<EvaluateSummaryV3 | EvaluateSummaryV2>;
    toResultsFile(): Promise<ResultsFile>;
    delete(): Promise<void>;
    /**
     * Creates a deep copy of this eval including all results.
     * Uses batching to avoid memory exhaustion on large evals.
     * @param description - Optional description for the new eval
     * @param distinctTestCount - Optional pre-computed test count to avoid duplicate query
     */
    copy(description?: string, distinctTestCount?: number): Promise<Eval>;
    get shared(): boolean;
    set shared(shared: boolean);
}
/**
 * Queries summaries of all evals, optionally for a given dataset.
 *
 * @param datasetId - An optional dataset ID to filter by.
 * @param type - An optional eval type to filter by.
 * @param includeProviders - An optional flag to include providers in the summary.
 * @returns A list of eval summaries.
 */
export declare function getEvalSummaries(datasetId?: string, type?: 'redteam' | 'eval', includeProviders?: boolean): Promise<EvalSummary[]>;
//# sourceMappingURL=eval.d.ts.map