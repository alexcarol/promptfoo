"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleContextRecall = void 0;
const matchers_1 = require("../matchers");
const invariant_1 = __importDefault(require("../util/invariant"));
const contextUtils_1 = require("./contextUtils");
/**
 * Handles context-recall assertions by evaluating whether the provided context
 * contains the information needed to answer the expected value/question.
 *
 * Supports extracting context from provider responses using contextTransform
 * or from test variables (falls back to prompt if no context variable).
 *
 * @param params - Assertion parameters including test case, output, and configuration
 * @returns Promise resolving to grading result with pass/fail and score
 */
const handleContextRecall = async ({ assertion, renderedValue, prompt, test, output, providerResponse, providerCallContext, }) => {
    (0, invariant_1.default)(typeof renderedValue === 'string', 'context-recall assertion requires a string value (expected answer or fact to verify)');
    (0, invariant_1.default)(prompt, 'context-recall assertion requires a prompt');
    const context = await (0, contextUtils_1.resolveContext)(assertion, test, output, prompt, prompt, providerResponse);
    // RAGAS context-recall checks if ground truth (renderedValue) can be attributed to context
    const result = await (0, matchers_1.matchesContextRecall)(context, // context parameter (used as {{context}} in prompt)
    renderedValue, // ground truth parameter (used as {{groundTruth}} in prompt)
    assertion.threshold ?? 0, test.options, test.vars, providerCallContext);
    return {
        assertion,
        ...result,
        metadata: {
            context,
            ...(result.metadata || {}),
        },
    };
};
exports.handleContextRecall = handleContextRecall;
//# sourceMappingURL=contextRecall.js.map