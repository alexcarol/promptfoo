"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetEvaluationDetailsTool = registerGetEvaluationDetailsTool;
const dedent_1 = __importDefault(require("dedent"));
const zod_1 = require("zod");
const database_1 = require("../../../util/database");
const utils_1 = require("../lib/utils");
/**
 * Tool to retrieve detailed results for a specific evaluation run
 */
function registerGetEvaluationDetailsTool(server) {
    server.tool('get_evaluation_details', {
        id: zod_1.z
            .string()
            .min(1, 'Eval ID cannot be empty')
            .regex(/^[a-zA-Z0-9_:-]+$/, 'Invalid eval ID format')
            .describe((0, dedent_1.default) `
            Unique eval ID.
            Example: "eval-8h1-2025-11-15T14:17:18"
            Get this from list_evaluations.
          `),
    }, async (args) => {
        const { id } = args;
        try {
            const result = await (0, database_1.readResult)(id);
            if (!result) {
                return (0, utils_1.createToolResponse)('get_evaluation_details', false, {
                    providedId: id,
                    suggestion: 'Check if the evaluation ID is correct or if it has been deleted.',
                }, `Evaluation with ID '${id}' not found. Use list_evaluations to find valid IDs.`);
            }
            // Extract key metrics for easier consumption
            const evalData = result.result;
            const summary = {
                id,
            };
            // Handle different eval data structures
            if ('results' in evalData && Array.isArray(evalData.results)) {
                summary.totalTests = evalData.results.length;
                summary.passedTests = evalData.results.filter((r) => r.success).length;
                summary.failedTests = evalData.results.filter((r) => !r.success).length;
            }
            else {
                summary.totalTests = 0;
                summary.passedTests = 0;
                summary.failedTests = 0;
            }
            if ('table' in evalData && evalData.table) {
                const table = evalData.table;
                if (table.head) {
                    summary.providers = table.head.providers || [];
                    summary.prompts = table.head.prompts?.length || 0;
                }
                else {
                    summary.providers = [];
                    summary.prompts = 0;
                }
            }
            else {
                summary.providers = [];
                summary.prompts = 0;
            }
            return (0, utils_1.createToolResponse)('get_evaluation_details', true, {
                evaluation: evalData,
                summary,
            });
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('database')) {
                return (0, utils_1.createToolResponse)('get_evaluation_details', false, { originalError: error.message }, 'Failed to access evaluation database. Ensure promptfoo is properly initialized.');
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return (0, utils_1.createToolResponse)('get_evaluation_details', false, undefined, `Failed to retrieve evaluation details: ${errorMessage}`);
        }
    });
}
//# sourceMappingURL=getEvaluationDetails.js.map