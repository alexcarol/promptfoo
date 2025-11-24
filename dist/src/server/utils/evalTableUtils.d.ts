import type { EvaluateTableRow, Prompt } from '../../types/index';
/**
 *
 *
 *
 * Keep this in it's current order, as it is used to map the columns in the CSV, so it needs to be static.
 *
 *
 * The keys are the names of the columns in the metadata object, and the values are the names of the columns in the CSV.
 *
 * This is imported by enterprise so it doesn't need to be copied.
 *
 */
export declare const REDTEAM_METADATA_KEYS_TO_CSV_COLUMN_NAMES: {
    messages: string;
    redteamHistory: string;
    redteamTreeHistory: string;
    pluginId: string;
    strategyId: string;
    sessionId: string;
    sessionIds: string;
};
/**
 * Generates CSV data from evaluation table data
 * Includes grader reason, comment, and conversation columns similar to client-side implementation
 *
 * @param table - The evaluation table data
 * @param options - Export options
 * @returns CSV formatted string
 */
export declare function evalTableToCsv(table: {
    head: {
        prompts: Prompt[];
        vars: string[];
    };
    body: EvaluateTableRow[];
}, options?: {
    isRedteam?: boolean;
}): string;
/**
 * Generate JSON data from evaluation table
 * @param table Evaluation table data
 * @returns JSON object
 */
export declare function evalTableToJson(table: {
    head: {
        prompts: Prompt[];
        vars: string[];
    };
    body: EvaluateTableRow[];
}): any;
//# sourceMappingURL=evalTableUtils.d.ts.map