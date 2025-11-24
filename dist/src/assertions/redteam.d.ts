import type { AssertionParams, GradingResult } from '../types/index';
/**
 * As the name implies, this function "handles" redteam assertions by either calling the
 * grader or preferably returning a `storedGraderResult` if it exists on the provider response.
 */
export declare const handleRedteam: ({ assertion, baseType, test, prompt, outputString, provider, renderedValue, providerResponse, }: AssertionParams) => Promise<GradingResult>;
//# sourceMappingURL=redteam.d.ts.map