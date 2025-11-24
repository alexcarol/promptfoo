"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDTEAM_METADATA_KEYS_TO_CSV_COLUMN_NAMES = void 0;
exports.evalTableToCsv = evalTableToCsv;
exports.evalTableToJson = evalTableToJson;
const sync_1 = require("csv-stringify/sync");
const index_1 = require("../../types/index");
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
exports.REDTEAM_METADATA_KEYS_TO_CSV_COLUMN_NAMES = {
    messages: 'Messages',
    redteamHistory: 'RedteamHistory',
    redteamTreeHistory: 'RedteamTreeHistory',
    pluginId: 'pluginId',
    strategyId: 'strategyId',
    sessionId: 'sessionId',
    sessionIds: 'sessionIds',
};
const REDTEAM_METADATA_COLUMNS = Object.values(exports.REDTEAM_METADATA_KEYS_TO_CSV_COLUMN_NAMES);
/**
 * Generates CSV data from evaluation table data
 * Includes grader reason, comment, and conversation columns similar to client-side implementation
 *
 * @param table - The evaluation table data
 * @param options - Export options
 * @returns CSV formatted string
 */
function evalTableToCsv(table, options = { isRedteam: false }) {
    const csvRows = [];
    const { isRedteam } = options;
    // Check if any rows have descriptions
    const hasDescriptions = table.body.some((row) => row.test.description);
    // Create headers with additional columns for grader reason, comment, and conversation
    const headers = [
        ...(hasDescriptions ? ['Description'] : []),
        ...table.head.vars,
        ...table.head.prompts.flatMap((prompt) => {
            // Handle both Prompt and CompletedPrompt types
            const provider = prompt.provider || '';
            const label = provider ? `[${provider}] ${prompt.label}` : prompt.label;
            return [label, 'Grader Reason', 'Comment'];
        }),
    ];
    if (isRedteam) {
        headers.push(...REDTEAM_METADATA_COLUMNS);
    }
    csvRows.push(headers);
    // Compute stable key ordering for redteam metadata columns
    const redteamKeys = Object.keys(exports.REDTEAM_METADATA_KEYS_TO_CSV_COLUMN_NAMES);
    // Process body rows with pass/fail prefixes and conversation data
    table.body.forEach((row) => {
        const rowValues = [
            ...(hasDescriptions ? [row.test.description || ''] : []),
            ...row.vars,
            ...row.outputs.flatMap((output) => {
                if (!output) {
                    return ['', '', ''];
                }
                return [
                    // Add pass/fail/error prefix to text
                    (output.pass
                        ? '[PASS] '
                        : output.failureReason === index_1.ResultFailureReason.ASSERT
                            ? '[FAIL] '
                            : '[ERROR] ') + (output.text || ''),
                    // Add grader reason
                    output.gradingResult?.reason || '',
                    // Add comment
                    output.gradingResult?.comment || '',
                ];
            }),
        ];
        // Add redteam metadata once per row (using first output's metadata)
        if (isRedteam) {
            const firstOutputMetadata = row.outputs[0]?.metadata;
            for (const key of redteamKeys) {
                const value = firstOutputMetadata?.[key];
                if (value === null || value === undefined) {
                    rowValues.push('');
                }
                else if (typeof value === 'string' ||
                    typeof value === 'number' ||
                    typeof value === 'boolean') {
                    // Don't stringify primitives - add them directly
                    rowValues.push(value.toString());
                }
                else {
                    // Stringify objects and arrays
                    rowValues.push(JSON.stringify(value));
                }
            }
        }
        csvRows.push(rowValues);
    });
    return (0, sync_1.stringify)(csvRows);
}
/**
 * Generate JSON data from evaluation table
 * @param table Evaluation table data
 * @returns JSON object
 */
function evalTableToJson(table) {
    return table;
}
//# sourceMappingURL=evalTableUtils.js.map