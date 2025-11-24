/**
 * Git raw diff parser
 * Extracted for testing without ESM dependencies
 */
export interface RawDiffEntry {
    path: string;
    oldPath?: string;
    status: string;
    shaA: string | null;
    shaB: string | null;
}
/**
 * Parse git diff --raw -z output
 *
 * Format for normal operations (M, A, D):
 *   :oldmode newmode oldsha newsha status\0path\0
 *
 * Format for renames/copies (R, C):
 *   :oldmode newmode oldsha newsha status\0oldpath\0newpath\0
 *
 * Note: Rename/Copy status includes similarity (e.g., R100, R90, C100)
 */
export declare function parseRawDiff(rawOutput: string): RawDiffEntry[];
//# sourceMappingURL=rawDiffParser.d.ts.map