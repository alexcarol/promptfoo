import type { ApiProvider, Prompt } from '../../types/index';
/**
 * Executable prompt function. Executes any script/binary and returns its output as the prompt.
 * The script receives context as JSON in its arguments.
 * @param scriptPath - Path to the executable script.
 * @param context - Context for the prompt.
 * @returns The prompt output from the script.
 */
export declare const executablePromptFunction: (scriptPath: string, context: {
    vars: Record<string, string | object>;
    provider?: ApiProvider;
    config?: Record<string, any>;
}) => Promise<string>;
/**
 * Processes an executable file to generate prompts.
 * The executable can be any script or binary that outputs prompt text to stdout.
 * It receives the context as JSON in its first argument.
 *
 * @param filePath - Path to the executable file (can include arguments).
 * @param prompt - The raw prompt data.
 * @param functionName - Not used for executables, but kept for interface consistency.
 * @returns Array of prompts generated from the executable.
 */
export declare function processExecutableFile(filePath: string, prompt: Partial<Prompt>, _functionName?: string): Promise<Prompt[]>;
//# sourceMappingURL=executable.d.ts.map