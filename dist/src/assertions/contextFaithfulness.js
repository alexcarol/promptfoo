"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleContextFaithfulness = handleContextFaithfulness;
const matchers_1 = require("../matchers");
const invariant_1 = __importDefault(require("../util/invariant"));
const contextUtils_1 = require("./contextUtils");
/**
 * Handles context-faithfulness assertions by evaluating whether the LLM output
 * is faithful to the provided context without hallucinations.
 *
 * Supports extracting context from provider responses using contextTransform
 * or from test variables.
 *
 * @param params - Assertion parameters including test case, output, and configuration
 * @returns Promise resolving to grading result with pass/fail and score
 */
async function handleContextFaithfulness({ assertion, test, output, prompt, providerResponse, providerCallContext, }) {
    (0, invariant_1.default)(test.vars, 'context-faithfulness assertion requires a test with variables');
    (0, invariant_1.default)(typeof test.vars.query === 'string', 'context-faithfulness assertion requires a "query" variable with the user question');
    (0, invariant_1.default)(typeof output === 'string', 'context-faithfulness assertion requires string output from the provider');
    const context = await (0, contextUtils_1.resolveContext)(assertion, test, output, prompt, undefined, providerResponse);
    return {
        assertion,
        ...(await (0, matchers_1.matchesContextFaithfulness)(test.vars.query, output, context, assertion.threshold ?? 0, test.options, test.vars, providerCallContext)),
        metadata: {
            context,
        },
    };
}
//# sourceMappingURL=contextFaithfulness.js.map