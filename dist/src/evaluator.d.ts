import { type EvaluateOptions, type EvaluateResult, type Prompt, type RunEvalOptions, type TestSuite } from './types/index';
import type Eval from './models/eval';
/**
 * Validates if a given prompt is allowed based on the provided list of allowed
 * prompt labels. Providers can be configured with a `prompts` attribute, which
 * corresponds to an array of prompt labels. Labels can either refer to a group
 * (for example from a file) or to individual prompts. If the attribute is
 * present, this function validates that the prompt labels fit the matching
 * criteria of the provider. Examples:
 *
 * - `prompts: ['examplePrompt']` matches `examplePrompt` exactly
 * - `prompts: ['exampleGroup:*']` matches any prompt that starts with `exampleGroup:`
 *
 * If no `prompts` attribute is present, all prompts are allowed by default.
 *
 * @param prompt - The prompt object to check.
 * @param allowedPrompts - The list of allowed prompt labels.
 * @returns Returns true if the prompt is allowed, false otherwise.
 */
export declare function isAllowedPrompt(prompt: Prompt, allowedPrompts: string[] | undefined): boolean;
/**
 * Runs a single test case.
 * @param options - The options for running the test case.
 * {
 *   provider - The provider to use for the test case.
 *   prompt - The raw prompt to use for the test case.
 *   test - The test case to run with assertions, etc.
 *   delay - A delay in ms to wait before any provider calls
 *   nunjucksFilters - The nunjucks filters to use for the test case.
 *   evaluateOptions - Currently unused
 *   testIdx - The index of the test case among all tests (row in the results table).
 *   promptIdx - The index of the prompt among all prompts (column in the results table).
 *   conversations - Evals can be run serially across multiple turns of a conversation. This gives access to the conversation history.
 *   registers - The registers to use for the test case to store values for later tests.
 *   isRedteam - Whether the test case is a redteam test case.
 * }
 * @returns The result of the test case.
 */
export declare function runEval({ provider, prompt, // raw prompt
test, delay, nunjucksFilters: filters, evaluateOptions, testIdx, promptIdx, repeatIndex, conversations, registers, isRedteam, abortSignal, }: RunEvalOptions): Promise<EvaluateResult[]>;
/**
 * Safely formats variables for display in progress bars and logs.
 * Handles extremely large variables that could cause RangeError crashes.
 *
 * @param vars - Variables to format
 * @param maxLength - Maximum length of the final formatted string
 * @returns Formatted variables string or fallback message
 */
export declare function formatVarsForDisplay(vars: Record<string, any> | undefined, maxLength: number): string;
export declare function generateVarCombinations(vars: Record<string, string | string[] | any>): Record<string, string | any[]>[];
export declare function evaluate(testSuite: TestSuite, evalRecord: Eval, options: EvaluateOptions): Promise<Eval>;
//# sourceMappingURL=evaluator.d.ts.map