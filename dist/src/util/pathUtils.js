"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeResolve = safeResolve;
exports.safeJoin = safeJoin;
/**
 * Path resolution utilities that work with both regular paths and file:// URLs
 */
const node_url_1 = require("node:url");
const path_1 = __importDefault(require("path"));
/**
 * Check if a file path is absolute, handling both regular paths and URLs
 * @param filePath - The file path to check
 * @returns True if the path is absolute
 */
function isAbsolute(filePath) {
    if (!filePath) {
        return false;
    }
    // Treat any URL scheme as absolute to avoid mangling URLs in join/resolve
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(filePath)) {
        if (filePath.startsWith('file://')) {
            try {
                return path_1.default.isAbsolute((0, node_url_1.fileURLToPath)(filePath));
            }
            catch {
                // Handle non-standard but common variants like file://C:/...
                return true;
            }
        }
        return true; // e.g., http(s)://, data://, etc.
    }
    return path_1.default.isAbsolute(filePath);
}
/**
 * Safely resolves a path - only calls resolve() if the last path is relative
 * Leaves absolute paths and absolute URLs unchanged
 *
 * @param paths - The path segments to resolve
 * @returns The resolved path if last path is relative, or the last path if it's absolute
 */
function safeResolve(...paths) {
    const lastPath = paths[paths.length - 1] || '';
    if (isAbsolute(lastPath)) {
        return lastPath;
    }
    return path_1.default.resolve(...paths);
}
/**
 * Safely joins paths - only joins if the last path is relative
 * If the last path is absolute or an absolute URL, returns it directly
 *
 * @param paths - The path segments to join
 * @returns The joined path if last path is relative, or the last path if it's absolute
 */
function safeJoin(...paths) {
    const lastPath = paths[paths.length - 1] || '';
    if (isAbsolute(lastPath)) {
        return lastPath;
    }
    return path_1.default.join(...paths);
}
//# sourceMappingURL=pathUtils.js.map