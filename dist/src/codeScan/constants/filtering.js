"use strict";
/**
 * File Filtering Constants
 *
 * Shared constants for code scan file filtering used by both CLI and server.
 * Extracted to avoid pulling in ESM dependencies (like execa) into server tests.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_PATCH_SIZE_BYTES = exports.MAX_BLOB_SIZE_BYTES = exports.DENYLIST_PATTERNS = void 0;
exports.isInDenylist = isInDenylist;
const minimatch_1 = require("minimatch");
exports.DENYLIST_PATTERNS = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/.venv/**',
    '**/__pycache__/**',
    '**/*.lock',
    '**/package-lock.json',
    '**/yarn.lock',
    '**/pnpm-lock.yaml',
    '**/Cargo.lock',
    '**/poetry.lock',
    '**/composer.lock',
    '**/Pipfile.lock',
    '**/*.min.js',
    '**/*.map',
    '**/*.bin',
    '**/*.exe',
    '**/*.dll',
    '**/*.so',
    '**/*.dylib',
    '**/*.zip',
    '**/*.tar',
    '**/*.gz',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.png',
    '**/*.gif',
    '**/*.pdf',
    '**/*.mp4',
    '**/*.mov',
];
exports.MAX_BLOB_SIZE_BYTES = 500 * 1024; // 500 KB
exports.MAX_PATCH_SIZE_BYTES = 200 * 1024; // 200 KB
function isInDenylist(filePath) {
    return exports.DENYLIST_PATTERNS.some((pattern) => (0, minimatch_1.minimatch)(filePath, pattern));
}
//# sourceMappingURL=filtering.js.map