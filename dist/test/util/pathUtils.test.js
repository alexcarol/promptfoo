"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const pathUtils_1 = require("../../src/util/pathUtils");
/**
 * Helper to create file:// URLs in a cross-platform way
 */
function getFileUrl(path) {
    return process.platform === 'win32'
        ? `file:///C:/${path.replace(/\\/g, '/')}`
        : `file:///${path}`;
}
describe('pathUtils', () => {
    describe('safeResolve', () => {
        it('returns absolute path unchanged', () => {
            const absolutePath = path_1.default.resolve('/absolute/path/file.txt');
            expect((0, pathUtils_1.safeResolve)('some/base/path', absolutePath)).toBe(absolutePath);
        });
        it('returns file URL unchanged', () => {
            const fileUrl = getFileUrl('absolute/path/file.txt');
            expect((0, pathUtils_1.safeResolve)('some/base/path', fileUrl)).toBe(fileUrl);
        });
        it('returns Windows file URL unchanged', () => {
            const windowsFileUrl = 'file://C:/path/file.txt';
            expect((0, pathUtils_1.safeResolve)('some/base/path', windowsFileUrl)).toBe(windowsFileUrl);
        });
        it('returns HTTP URLs unchanged', () => {
            const httpUrl = 'https://example.com/file.txt';
            expect((0, pathUtils_1.safeResolve)('some/base/path', httpUrl)).toBe(httpUrl);
        });
        it('resolves relative paths', () => {
            const expected = path_1.default.resolve('base/path', 'relative/file.txt');
            expect((0, pathUtils_1.safeResolve)('base/path', 'relative/file.txt')).toBe(expected);
        });
        it('handles multiple path segments', () => {
            const absolutePath = path_1.default.resolve('/absolute/path/file.txt');
            expect((0, pathUtils_1.safeResolve)('base', 'path', absolutePath)).toBe(absolutePath);
            const expected = path_1.default.resolve('base', 'path', 'relative/file.txt');
            expect((0, pathUtils_1.safeResolve)('base', 'path', 'relative/file.txt')).toBe(expected);
        });
        it('handles empty input', () => {
            expect((0, pathUtils_1.safeResolve)()).toBe(path_1.default.resolve());
            expect((0, pathUtils_1.safeResolve)('')).toBe(path_1.default.resolve(''));
        });
    });
    describe('safeJoin', () => {
        it('returns absolute path unchanged', () => {
            const absolutePath = path_1.default.resolve('/absolute/path/file.txt');
            expect((0, pathUtils_1.safeJoin)('some/base/path', absolutePath)).toBe(absolutePath);
        });
        it('returns file URL unchanged', () => {
            const fileUrl = getFileUrl('absolute/path/file.txt');
            expect((0, pathUtils_1.safeJoin)('some/base/path', fileUrl)).toBe(fileUrl);
        });
        it('returns Windows file URL unchanged', () => {
            const windowsFileUrl = 'file://C:/path/file.txt';
            expect((0, pathUtils_1.safeJoin)('some/base/path', windowsFileUrl)).toBe(windowsFileUrl);
        });
        it('returns HTTP URLs unchanged', () => {
            const httpUrl = 'https://example.com/file.txt';
            expect((0, pathUtils_1.safeJoin)('some/base/path', httpUrl)).toBe(httpUrl);
        });
        it('joins relative paths', () => {
            const expected = path_1.default.join('base/path', 'relative/file.txt');
            expect((0, pathUtils_1.safeJoin)('base/path', 'relative/file.txt')).toBe(expected);
        });
        it('handles multiple path segments', () => {
            const absolutePath = path_1.default.resolve('/absolute/path/file.txt');
            expect((0, pathUtils_1.safeJoin)('base', 'path', absolutePath)).toBe(absolutePath);
            const expected = path_1.default.join('base', 'path', 'relative/file.txt');
            expect((0, pathUtils_1.safeJoin)('base', 'path', 'relative/file.txt')).toBe(expected);
        });
        it('handles empty input', () => {
            expect((0, pathUtils_1.safeJoin)()).toBe(path_1.default.join());
            expect((0, pathUtils_1.safeJoin)('')).toBe(path_1.default.join(''));
        });
    });
});
//# sourceMappingURL=pathUtils.test.js.map