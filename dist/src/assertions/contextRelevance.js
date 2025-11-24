"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleContextRelevance = void 0;
const matchers_1 = require("../matchers");
const invariant_1 = __importDefault(require("../util/invariant"));
const contextUtils_1 = require("./contextUtils");
/**
 * Handles context-relevance assertions by evaluating whether the provided context
 * is relevant to the given query/question.
 *
 * Supports extracting context from provider responses using contextTransform
 * or from test variables.
 *
 * @param params - Assertion parameters including test case, output, and configuration
 * @returns Promise resolving to grading result with pass/fail and score
 */
const handleContextRelevance = async ({ assertion, test, output, prompt, providerResponse, providerCallContext, }) => {
    (0, invariant_1.default)(test.vars, 'context-relevance assertion requires a test with variables');
    (0, invariant_1.default)(typeof test.vars.query === 'string', 'context-relevance assertion requires a "query" variable with the user question');
    const context = await (0, contextUtils_1.resolveContext)(assertion, test, output, prompt, undefined, providerResponse);
    const result = await (0, matchers_1.matchesContextRelevance)(test.vars.query, context, assertion.threshold ?? 0, test.options, providerCallContext);
    return {
        assertion,
        ...result,
        metadata: {
            context,
            ...(result.metadata || {}),
        },
    };
};
exports.handleContextRelevance = handleContextRelevance;
//# sourceMappingURL=contextRelevance.js.map