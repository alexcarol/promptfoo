import type { AssertionParams, GradingResult } from '../types/index';
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
export declare const handleContextRecall: ({ assertion, renderedValue, prompt, test, output, providerResponse, providerCallContext, }: AssertionParams) => Promise<GradingResult>;
//# sourceMappingURL=contextRecall.d.ts.map