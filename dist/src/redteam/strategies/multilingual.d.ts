import type { TestCase } from '../../types/index';
/**
 * ⚠️ DEPRECATED: This strategy is deprecated and will be removed in a future version.
 *
 * Use the top-level `language` configuration option instead to generate multilingual test cases.
 * The global language config applies to all plugins and strategies, providing the same functionality
 * with a simpler architecture.
 *
 * Migration guide: https://www.promptfoo.dev/docs/red-team/configuration/#language
 *
 * Example:
 * ```yaml
 * redteam:
 *   language: ['es', 'fr', 'de']  # Use this instead of multilingual strategy
 *   plugins:
 *     - harmful
 *   strategies:
 *     - jailbreak  # Remove multilingual from strategies
 * ```
 */
export declare const DEFAULT_LANGUAGES: string[];
/**
 * Helper function to get the concurrency limit from config or use default
 */
export declare function getConcurrencyLimit(config?: Record<string, any>): number;
/**
 * Translates text with adaptive batch size - falls back to smaller batches on failure
 */
export declare function translateBatch(text: string, languages: string[], initialBatchSize?: number): Promise<Record<string, string>>;
export declare function addMultilingual(testCases: TestCase[], injectVar: string, config: Record<string, any>): Promise<TestCase[]>;
//# sourceMappingURL=multilingual.d.ts.map