import type { Assertion, AtomicTestCase } from '../types/index';
/**
 * Resolves the context value for context-based assertions.
 * Supports extracting context from test variables or transforming from output.
 * Can return either a single context string or an array of context chunks.
 *
 * @param assertion - The assertion configuration
 * @param test - The test case
 * @param output - The provider output (after provider transform, before test transform)
 * @param prompt - The prompt text
 * @param fallbackContext - Optional fallback context (e.g., prompt for context-recall)
 * @param providerResponse - Optional full provider response for contextTransform
 * @returns The resolved context string or array of strings
 * @throws Error if context cannot be resolved or transform fails
 */
export declare function resolveContext(assertion: Assertion, test: AtomicTestCase, output: string | object, prompt?: string, fallbackContext?: string, providerResponse?: any): Promise<string | string[]>;
/**
 * Serializes context (string or string[]) to a single string for prompts.
 * Joins chunks with double newlines to preserve separation.
 */
export declare function serializeContext(context: string | string[]): string;
//# sourceMappingURL=contextUtils.d.ts.map