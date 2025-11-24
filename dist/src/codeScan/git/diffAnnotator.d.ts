/**
 * Diff Annotator
 *
 * Adds absolute line numbers to unified diff format for easier LLM processing.
 * This eliminates the need for LLMs to manually calculate line numbers from hunk headers.
 */
/**
 * Annotate a single file unified diff patch with absolute line numbers.
 *
 * For each line that exists in the NEW file (context lines and added lines),
 * prepends the absolute line number in the format "L##: ".
 *
 * Removed lines (starting with "-") are not annotated since they don't exist in the new file.
 *
 * @param patch - Raw unified diff patch string from git diff
 * @returns Annotated patch with line numbers prepended to new file lines
 *
 * @example
 * Input:
 * ```
 * @@ -18,20 +20,64 @@
 *   context line
 * - removed line
 * + added line
 * ```
 *
 * Output:
 * ```
 * @@ -18,20 +20,64 @@
 * L20:   context line
 * -     removed line
 * L21: + added line
 * ```
 */
export declare function annotateSingleFileDiffWithLineNumbers(patch: string): string;
//# sourceMappingURL=diffAnnotator.d.ts.map