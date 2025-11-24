import type { AssertionParams, GradingResult } from '../types/index';
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
export declare function handleContextFaithfulness({ assertion, test, output, prompt, providerResponse, providerCallContext, }: AssertionParams): Promise<GradingResult>;
//# sourceMappingURL=contextFaithfulness.d.ts.map