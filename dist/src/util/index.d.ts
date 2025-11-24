import { type EvaluateResult, type NunjucksFilterMap, type OutputFile, type TestCase } from '../types/index';
import type Eval from '../models/eval';
import type { Vars } from '../types/index';
export declare function createOutputMetadata(evalRecord: Eval): {
    promptfooVersion: string;
    nodeVersion: string;
    platform: NodeJS.Platform;
    arch: NodeJS.Architecture;
    exportedAt: string;
    evaluationCreatedAt: string | undefined;
    author: string | undefined;
};
export declare function writeOutput(outputPath: string, evalRecord: Eval, shareableUrl: string | null): Promise<void>;
export declare function writeMultipleOutputs(outputPaths: string[], evalRecord: Eval, shareableUrl: string | null): Promise<void>;
export declare function readOutput(outputPath: string): Promise<OutputFile>;
export declare function readFilters(filters: Record<string, string>, basePath?: string): Promise<NunjucksFilterMap>;
export declare function printBorder(): void;
export declare function setupEnv(envPath: string | undefined): void;
export declare function providerToIdentifier(provider: TestCase['provider'] | {
    id?: string;
    label?: string;
} | undefined): string | undefined;
export declare function varsMatch(vars1: Vars | undefined, vars2: Vars | undefined): boolean;
export declare function resultIsForTestCase(result: EvaluateResult, testCase: TestCase): boolean;
/**
 * Renders ONLY environment variable templates in an object, leaving all other templates untouched.
 * This allows env vars to be resolved at provider load time while preserving runtime var templates.
 *
 * Supports full Nunjucks syntax for env vars including filters and expressions:
 * - {{ env.VAR_NAME }}
 * - {{ env['VAR-NAME'] }}
 * - {{ env["VAR-NAME"] }}
 * - {{ env.VAR | default('fallback') }}
 * - {{ env.VAR | upper }}
 *
 * Preserves non-env templates for runtime rendering:
 * - {{ vars.x }} - preserved as literal
 * - {{ prompt }} - preserved as literal
 *
 * Implementation: Uses regex to find env templates, delegates to Nunjucks for rendering.
 * This ensures full Nunjucks feature support while preserving non-env templates.
 *
 * @param obj - The object to process
 * @returns The object with only env templates rendered
 */
export declare function renderEnvOnlyInObject<T>(obj: T): T;
export declare function renderVarsInObject<T>(obj: T, vars?: Record<string, string | object>): T;
/**
 * Parses a file path or glob pattern to extract function names and file extensions.
 * Function names can be specified in the filename like this:
 * prompt.py:myFunction or prompts.js:myFunction.
 * @param basePath - The base path for file resolution.
 * @param promptPath - The path or glob pattern.
 * @returns Parsed details including function name, file extension, and directory status.
 */
export declare function parsePathOrGlob(basePath: string, promptPath: string): {
    extension?: string;
    functionName?: string;
    isPathPattern: boolean;
    filePath: string;
};
export declare function isRunningUnderNpx(): boolean;
/**
 * Renders variables in a tools object and loads from external file if applicable.
 * This function combines renderVarsInObject and maybeLoadFromExternalFile into a single step
 * specifically for handling tools configurations.
 *
 * @param tools - The tools configuration object or array to process.
 * @param vars - Variables to use for rendering.
 * @returns The processed tools configuration with variables rendered and content loaded from files if needed.
 */
export declare function maybeLoadToolsFromExternalFile(tools: any, vars?: Record<string, string | object>): any;
//# sourceMappingURL=index.d.ts.map