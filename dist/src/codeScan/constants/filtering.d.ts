/**
 * File Filtering Constants
 *
 * Shared constants for code scan file filtering used by both CLI and server.
 * Extracted to avoid pulling in ESM dependencies (like execa) into server tests.
 */
export declare const DENYLIST_PATTERNS: string[];
export declare const MAX_BLOB_SIZE_BYTES: number;
export declare const MAX_PATCH_SIZE_BYTES: number;
export declare function isInDenylist(filePath: string): boolean;
//# sourceMappingURL=filtering.d.ts.map