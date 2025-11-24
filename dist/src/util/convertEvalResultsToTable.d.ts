import { type EvaluateTable, type ResultsFile } from '../types/index';
/**
 * Converts evaluation results from a ResultsFile into a table format for display.
 * Processes test results, formats variables (including pretty-printing objects/arrays as JSON),
 * handles redteam prompts, and structures data for console table and HTML output.
 *
 * @param eval_ - The results file containing evaluation data (requires version >= 4)
 * @returns An EvaluateTable with formatted headers and body rows for display
 */
export declare function convertResultsToTable(eval_: ResultsFile): EvaluateTable;
//# sourceMappingURL=convertEvalResultsToTable.d.ts.map