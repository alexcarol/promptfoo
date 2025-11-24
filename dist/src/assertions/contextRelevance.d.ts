import type { AssertionParams, GradingResult } from '../types/index';
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
export declare const handleContextRelevance: ({ assertion, test, output, prompt, providerResponse, providerCallContext, }: AssertionParams) => Promise<GradingResult>;
//# sourceMappingURL=contextRelevance.d.ts.map