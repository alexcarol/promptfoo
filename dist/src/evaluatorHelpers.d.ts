import { type ApiProvider, type CompletedPrompt, type EvaluateResult, type NunjucksFilterMap, type Prompt, type TestCase, type TestSuite } from './types/index';
import type EvalResult from './models/evalResult';
type FileMetadata = Record<string, {
    path: string;
    type: string;
    format?: string;
}>;
export declare function extractTextFromPDF(pdfPath: string): Promise<string>;
export declare function resolveVariables(variables: Record<string, string | object>): Record<string, string | object>;
/**
 * Collects metadata about file variables in the vars object.
 * @param vars The variables object containing potential file references
 * @returns An object mapping variable names to their file metadata
 */
export declare function collectFileMetadata(vars: Record<string, string | object>): FileMetadata;
/**
 * Renders a prompt template with variable substitution using Nunjucks.
 *
 * @param prompt - The prompt template to render
 * @param vars - Variables to substitute into the template
 * @param nunjucksFilters - Optional custom Nunjucks filters
 * @param provider - Optional API provider for context
 * @param skipRenderVars - Optional array of variable names to skip template rendering for.
 *                         This is critical for red team testing where injection variables
 *                         contain attack payloads (e.g., SSTI, XSS) that should NOT be
 *                         evaluated by Promptfoo's template engine before reaching the target.
 * @returns The rendered prompt string
 */
export declare function renderPrompt(prompt: Prompt, vars: Record<string, string | object>, nunjucksFilters?: NunjucksFilterMap, provider?: ApiProvider, skipRenderVars?: string[]): Promise<string>;
type BeforeAllExtensionHookContext = {
    suite: TestSuite;
};
type BeforeEachExtensionHookContext = {
    test: TestCase;
};
type AfterEachExtensionHookContext = {
    test: TestCase;
    result: EvaluateResult;
};
type AfterAllExtensionHookContext = {
    suite: TestSuite;
    results: EvalResult[];
    prompts: CompletedPrompt[];
};
type HookContextMap = {
    beforeAll: BeforeAllExtensionHookContext;
    beforeEach: BeforeEachExtensionHookContext;
    afterEach: AfterEachExtensionHookContext;
    afterAll: AfterAllExtensionHookContext;
};
/**
 * Runs extension hooks for the given hook name and context. The hook will be called with the context object,
 * and can update the context object to persist data into provider calls.
 * @param extensions - An array of extension paths, or null.
 * @param hookName - The name of the hook to run.
 * @param context - The context object to pass to the hook. T depends on the type of the hook.
 * @returns A Promise that resolves with one of the following:
 *  - The original context object, if no extensions are provided OR if the returned context is not valid.
 *  - The updated context object, if the extension hook returns a valid context object. The updated context,
 *    if defined, must conform to the type T; otherwise, a validation error is thrown.
 */
export declare function runExtensionHook<HookName extends keyof HookContextMap>(extensions: string[] | null | undefined, hookName: HookName, context: HookContextMap[HookName]): Promise<HookContextMap[HookName]>;
export {};
//# sourceMappingURL=evaluatorHelpers.d.ts.map