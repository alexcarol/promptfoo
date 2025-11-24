import Eval from '../models/eval';
import type { Command } from 'commander';
interface RetryCommandOptions {
    config?: string;
    verbose?: boolean;
    maxConcurrency?: number;
    delay?: number;
}
/**
 * Gets all ERROR results from an evaluation and returns their IDs
 */
export declare function getErrorResultIds(evalId: string): Promise<string[]>;
/**
 * Deletes ERROR results to prepare for retry
 */
export declare function deleteErrorResults(resultIds: string[]): Promise<void>;
/**
 * Recalculates prompt metrics based on current results after ERROR results have been deleted
 */
export declare function recalculatePromptMetrics(evalRecord: Eval): Promise<void>;
/**
 * Main retry function
 */
export declare function retryCommand(evalId: string, cmdObj: RetryCommandOptions): Promise<Eval>;
/**
 * Set up the retry command
 */
export declare function setupRetryCommand(program: Command): void;
export {};
//# sourceMappingURL=retry.d.ts.map