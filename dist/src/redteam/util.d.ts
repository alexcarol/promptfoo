import type { CallApiContextParams, ProviderResponse, RunEvalOptions } from '../types/index';
/**
 * Normalizes different types of apostrophes to a standard single quote
 */
export declare function normalizeApostrophes(str: string): string;
export declare function isEmptyResponse(response: string): boolean;
export declare function isBasicRefusal(response: string): boolean;
/**
 * Remove a prefix from a string.
 *
 * @param str - The string to remove the prefix from.
 * @param prefix - The prefix to remove - case insensitive.
 * @returns The string with the prefix removed.
 */
export declare function removePrefix(str: string, prefix: string): string;
/**
 * Extracts the short name from a fully qualified plugin ID.
 * Removes the 'promptfoo:redteam:' prefix if present.
 * @param pluginId The full plugin ID
 * @returns The short plugin ID
 */
export declare function getShortPluginId(pluginId: string): string;
/**
 * Extracts goal from a prompt using remote generation API.
 * @param prompt - The prompt to extract goal from.
 * @param purpose - The purpose of the system.
 * @param pluginId - Optional plugin ID to provide context about the attack type.
 * @param policy - Optional policy text for custom policy tests to improve intent extraction.
 * @returns The extracted goal, or null if extraction fails.
 */
export declare function extractGoalFromPrompt(prompt: string, purpose: string, pluginId?: string, policy?: string): Promise<string | null>;
export declare function getSessionId(response: ProviderResponse | undefined | null, context: Pick<CallApiContextParams, 'vars'> | undefined): string | undefined;
/**
 * Determines if a test case should be handled by Simba execution flow
 * based on provider ID or test metadata.
 *
 * @param evalOptions - The evaluation options to check
 * @returns Returns true if this is a Simba test case, false otherwise.
 */
export declare function isSimbaTestCase(evalOptions: RunEvalOptions): boolean;
//# sourceMappingURL=util.d.ts.map