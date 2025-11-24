"use strict";
/**
 * Diff Processor
 *
 * Focused pipeline for processing git diffs:
 * 1. Discover changed files
 * 2. Filter denylist (early exit)
 * 3. Collect blob sizes and filter large files
 * 4. Determine text/binary status
 * 5. Generate per-file patches
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDiff = processDiff;
const path_1 = __importDefault(require("path"));
const binary_extensions_1 = __importDefault(require("binary-extensions"));
const execa_1 = require("execa");
const istextorbinary_1 = require("istextorbinary");
const async_1 = __importDefault(require("async"));
const text_extensions_1 = __importDefault(require("text-extensions"));
const diffAnnotator_1 = require("./diffAnnotator");
const filtering_1 = require("../constants/filtering");
const codeScan_1 = require("../../types/codeScan");
const logger_1 = __importDefault(require("../../logger"));
const PATCH_CONCURRENCY = 8;
const TEXT_DETECTION_CONCURRENCY = 16;
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
function parseRawDiff(rawOutput) {
    const entries = rawOutput.split('\0').filter(Boolean);
    const results = [];
    let i = 0;
    while (i < entries.length) {
        const metaLine = entries[i];
        i++;
        if (!metaLine || i >= entries.length) {
            break;
        }
        // Parse: :100644 100644 abc123... def456... M (or R100, C100, etc)
        const parts = metaLine.trim().split(/\s+/);
        if (parts.length < 5) {
            continue;
        }
        const shaA = parts[2] === '0000000000000000000000000000000000000000' ? null : parts[2];
        const shaB = parts[3] === '0000000000000000000000000000000000000000' ? null : parts[3];
        const status = parts[4];
        // Check if this is a rename or copy operation
        // Status will be like: R100, R90, C100, C95, etc.
        const isRenameOrCopy = status.startsWith('R') || status.startsWith('C');
        if (isRenameOrCopy) {
            // Renames and copies have TWO paths: oldpath and newpath
            // Format: metadata\0oldpath\0newpath\0
            const oldPath = entries[i];
            i++;
            const newPath = entries[i];
            i++;
            if (!oldPath || !newPath) {
                continue;
            }
            // Use the new/destination path as the main path
            results.push({ path: newPath, oldPath, status, shaA, shaB });
        }
        else {
            // Normal operations (M, A, D) have ONE path
            // Format: metadata\0path\0
            const filePath = entries[i];
            i++;
            if (!filePath) {
                continue;
            }
            results.push({ path: filePath, status, shaA, shaB });
        }
    }
    return results;
}
/**
 * Parse git diff --numstat output
 * Format: added\tremoved\tpath
 */
function parseNumstat(numstatOutput) {
    const map = new Map();
    for (const line of numstatOutput.split('\n')) {
        if (!line.trim()) {
            continue;
        }
        const parts = line.split('\t');
        if (parts.length < 3) {
            continue;
        }
        const added = parts[0] === '-' ? 0 : Number.parseInt(parts[0], 10);
        const removed = parts[1] === '-' ? 0 : Number.parseInt(parts[1], 10);
        const path = parts[2];
        map.set(path, { linesAdded: added, linesRemoved: removed });
    }
    return map;
}
async function discoverChangedFiles(repoPath, base, compare) {
    // Run git diff --raw and --numstat in parallel
    const [rawResult, numstatResult] = await Promise.all([
        (0, execa_1.execa)('git', ['diff', '--raw', '-z', '--no-color', '--no-ext-diff', '--no-abbrev', `${base}...${compare}`], {
            cwd: repoPath,
        }),
        (0, execa_1.execa)('git', ['diff', '--numstat', `${base}...${compare}`], {
            cwd: repoPath,
        }),
    ]);
    const rawFiles = parseRawDiff(rawResult.stdout);
    const numstatMap = parseNumstat(numstatResult.stdout);
    // Merge the data
    return rawFiles.map((file) => {
        const stats = numstatMap.get(file.path);
        return {
            path: file.path,
            status: file.status,
            shaA: file.shaA,
            shaB: file.shaB,
            linesAdded: stats?.linesAdded,
            linesRemoved: stats?.linesRemoved,
        };
    });
}
function filterDenylist(files) {
    return files.map((file) => {
        if ((0, filtering_1.isInDenylist)(file.path)) {
            return { ...file, skipReason: 'denylist' };
        }
        return file;
    });
}
async function collectBlobSizes(repoPath, files) {
    const shas = new Set();
    for (const file of files) {
        if (file.skipReason) {
            continue; // Skip files already marked for skipping
        }
        if (file.shaA) {
            shas.add(file.shaA);
        }
        if (file.shaB) {
            shas.add(file.shaB);
        }
    }
    if (shas.size === 0) {
        return new Map();
    }
    // Use git cat-file --batch-check
    const shaList = Array.from(shas).join('\n');
    const result = await (0, execa_1.execa)('git', ['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'], {
        cwd: repoPath,
        input: shaList,
    });
    const sizeMap = new Map();
    for (const line of result.stdout.split('\n')) {
        if (!line.trim()) {
            continue;
        }
        const parts = line.split(/\s+/);
        if (parts.length < 3) {
            continue;
        }
        const sha = parts[0];
        const size = Number.parseInt(parts[2], 10);
        sizeMap.set(sha, size);
    }
    return sizeMap;
}
function attachBlobSizesAndFilter(files, sizeMap) {
    return files.map((file) => {
        if (file.skipReason) {
            return file; // Already skipped
        }
        const beforeSize = file.shaA ? sizeMap.get(file.shaA) : undefined;
        const afterSize = file.shaB ? sizeMap.get(file.shaB) : undefined;
        // Check if either side exceeds threshold
        if ((beforeSize !== undefined && beforeSize > filtering_1.MAX_BLOB_SIZE_BYTES) ||
            (afterSize !== undefined && afterSize > filtering_1.MAX_BLOB_SIZE_BYTES)) {
            return {
                ...file,
                beforeSizeBytes: beforeSize,
                afterSizeBytes: afterSize,
                skipReason: 'too large',
            };
        }
        return {
            ...file,
            beforeSizeBytes: beforeSize,
            afterSizeBytes: afterSize,
        };
    });
}
async function isBlobText(repoPath, sha) {
    try {
        const result = await (0, execa_1.execa)('git', ['cat-file', 'blob', sha], {
            cwd: repoPath,
            encoding: 'buffer',
            maxBuffer: 4096,
        });
        // Convert Uint8Array to Buffer and check if text
        const buffer = Buffer.from(result.stdout);
        const textCheck = (0, istextorbinary_1.isText)(null, buffer);
        // isText can return boolean | null, treat null as false
        return textCheck === true;
    }
    catch {
        return false;
    }
}
/**
 * Check file extension against known text and binary extension lists
 * @returns 'text' if known text extension, 'binary' if known binary extension, 'unknown' otherwise
 */
function getExtensionType(filePath) {
    const ext = path_1.default.extname(filePath).toLowerCase().slice(1); // Remove leading dot
    if (text_extensions_1.default.includes(ext)) {
        return 'text';
    }
    if (binary_extensions_1.default.includes(ext)) {
        return 'binary';
    }
    return 'unknown';
}
/**
 * Determine text/binary status for a single file
 * Uses 2-tier approach: extension lists first, then blob content analysis for unknown extensions
 */
async function determineTextStatusForFile(repoPath, file) {
    if (file.skipReason) {
        return file;
    }
    // Step 1: Check against known text/binary extension lists
    const extensionType = getExtensionType(file.path);
    if (extensionType === 'text') {
        return {
            ...file,
            isText: true,
        };
    }
    if (extensionType === 'binary') {
        return {
            ...file,
            isText: false,
            skipReason: 'binary',
        };
    }
    // Step 2: For unknown extensions, analyze blob content
    const checkSha = file.shaB || file.shaA;
    if (!checkSha) {
        return {
            ...file,
            isText: false,
            skipReason: 'binary',
        };
    }
    const textStatus = await isBlobText(repoPath, checkSha);
    if (textStatus) {
        return {
            ...file,
            isText: true,
        };
    }
    else {
        return {
            ...file,
            isText: false,
            skipReason: 'binary',
        };
    }
}
async function determineTextStatus(repoPath, files) {
    return async_1.default.mapLimit(files, TEXT_DETECTION_CONCURRENCY, async (file) => determineTextStatusForFile(repoPath, file));
}
async function generatePatchForFile(repoPath, base, compare, filePath) {
    try {
        const result = await (0, execa_1.execa)('git', [
            'diff',
            '--patch',
            '--unified=3',
            '--no-color',
            '--no-ext-diff',
            `${base}...${compare}`,
            '--',
            filePath,
        ], {
            cwd: repoPath,
            maxBuffer: filtering_1.MAX_PATCH_SIZE_BYTES,
        });
        const patch = result.stdout;
        // Double check patch size
        const patchSize = Buffer.byteLength(patch, 'utf8');
        if (patchSize > filtering_1.MAX_PATCH_SIZE_BYTES) {
            return { success: false, skipReason: 'patch too large' };
        }
        // Annotate the patch with line numbers for easier LLM processing
        const annotatedPatch = (0, diffAnnotator_1.annotateSingleFileDiffWithLineNumbers)(patch);
        return { success: true, patch: annotatedPatch };
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        // Check if error is due to maxBuffer exceeded
        if (errorMessage.includes('maxBuffer') || errorMessage.includes('stdout maxBuffer')) {
            logger_1.default.debug(`git diff --patch ${filePath} exceeded maxBuffer (${filtering_1.MAX_PATCH_SIZE_BYTES} bytes) - patch too large`);
            return { success: false, skipReason: 'patch too large' };
        }
        // Other git diff errors
        logger_1.default.debug(`git diff --patch ${filePath} failed: ${errorMessage} - skipping file`);
        return { success: false, skipReason: 'diff error' };
    }
}
async function generatePatches(repoPath, base, compare, files) {
    return async_1.default.mapLimit(files, PATCH_CONCURRENCY, async (file) => {
        if (file.skipReason) {
            return file;
        }
        const result = await generatePatchForFile(repoPath, base, compare, file.path);
        if (!result.success) {
            return {
                ...file,
                skipReason: result.skipReason,
            };
        }
        return {
            ...file,
            patch: result.patch,
        };
    });
}
async function processDiff(repoPath, base, compare = 'HEAD') {
    try {
        // Step 1: Discover changed files
        let files = await discoverChangedFiles(repoPath, base, compare);
        if (files.length === 0) {
            throw new codeScan_1.DiffProcessorError('No changed files found');
        }
        // Step 2: Filter denylist (early exit)
        files = filterDenylist(files);
        // Count remaining files
        const remainingAfterDenylist = files.filter((f) => !f.skipReason).length;
        if (remainingAfterDenylist === 0) {
            throw new codeScan_1.DiffProcessorError('All files filtered by denylist');
        }
        // Step 3: Collect blob sizes and filter large files
        const sizeMap = await collectBlobSizes(repoPath, files);
        files = attachBlobSizesAndFilter(files, sizeMap);
        // Count remaining files
        const remainingAfterSizeFilter = files.filter((f) => !f.skipReason).length;
        if (remainingAfterSizeFilter === 0) {
            throw new codeScan_1.DiffProcessorError('All files filtered by size threshold');
        }
        // Step 4: Determine text/binary status
        files = await determineTextStatus(repoPath, files);
        // Count remaining files
        const remainingAfterBinaryFilter = files.filter((f) => !f.skipReason).length;
        if (remainingAfterBinaryFilter === 0) {
            throw new codeScan_1.DiffProcessorError('All files filtered as binary');
        }
        // Step 5: Generate per-file patches
        files = await generatePatches(repoPath, base, compare, files);
        // Final count
        const finalIncludedFiles = files.filter((f) => !f.skipReason && f.patch).length;
        if (finalIncludedFiles === 0) {
            throw new codeScan_1.DiffProcessorError('No files included after processing');
        }
        return files;
    }
    catch (error) {
        if (error instanceof codeScan_1.DiffProcessorError) {
            throw error;
        }
        throw new codeScan_1.DiffProcessorError(`Failed to process diff: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=diffProcessor.js.map