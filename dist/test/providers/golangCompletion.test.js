"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cache_1 = require("../../src/cache");
const golangCompletion_1 = require("../../src/providers/golangCompletion");
jest.mock('child_process');
jest.mock('../../src/cache');
jest.mock('fs');
jest.mock('path');
jest.mock('../../src/util', () => {
    const actual = jest.requireActual('../../src/util');
    return {
        ...actual,
        parsePathOrGlob: jest.fn(() => ({
            extension: 'go',
            functionName: undefined,
            isPathPattern: false,
            filePath: '/absolute/path/to/script.go',
        })),
    };
});
describe('GolangProvider', () => {
    const mockExecFile = jest.mocked(child_process_1.execFile);
    const mockGetCache = jest.mocked(cache_1.getCache);
    const mockIsCacheEnabled = jest.mocked(cache_1.isCacheEnabled);
    const mockReadFileSync = jest.mocked(fs_1.default.readFileSync);
    const mockResolve = jest.mocked(path_1.default.resolve);
    const mockMkdtempSync = jest.mocked(fs_1.default.mkdtempSync);
    const mockExistsSync = jest.mocked(fs_1.default.existsSync);
    const mockRmSync = jest.mocked(fs_1.default.rmSync);
    const mockReaddirSync = jest.mocked(fs_1.default.readdirSync);
    const mockCopyFileSync = jest.mocked(fs_1.default.copyFileSync);
    const mockMkdirSync = jest.mocked(fs_1.default.mkdirSync);
    const mockDirname = jest.mocked(path_1.default.dirname);
    const mockJoin = jest.mocked(path_1.default.join);
    const mockRelative = jest.mocked(path_1.default.relative);
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
        // Reset all mocks to default behavior
        mockGetCache.mockResolvedValue({
            get: jest.fn(),
            set: jest.fn(),
        });
        mockIsCacheEnabled.mockReturnValue(false);
        // Mock readFileSync to return content for all files
        mockReadFileSync.mockImplementation((filePath) => {
            const pathStr = filePath.toString();
            if (pathStr.includes('wrapper.go')) {
                return 'package main\n// Mock wrapper.go content';
            }
            if (pathStr.includes('script.go')) {
                return 'package main\n// Mock script.go content';
            }
            return 'mock file content';
        });
        const mockParsePathOrGlob = jest.requireMock('../../src/util').parsePathOrGlob;
        mockParsePathOrGlob.mockImplementation((basePath, runPath) => {
            if (!basePath && runPath === 'script.go') {
                return {
                    filePath: 'script.go',
                    functionName: undefined,
                    isPathPattern: false,
                    extension: 'go',
                };
            }
            return {
                filePath: runPath.replace(/^(file:\/\/|golang:)/, '').split(':')[0],
                functionName: runPath.includes(':') ? runPath.split(':')[1] : undefined,
                isPathPattern: false,
                extension: 'go',
            };
        });
        // Mock path operations
        mockResolve.mockImplementation((p) => {
            if (!p || typeof p !== 'string') {
                return '/absolute/path/undefined';
            }
            if (p === 'script.go') {
                return 'script.go';
            }
            if (p.includes('script.go')) {
                return '/absolute/path/to/script.go';
            }
            if (p.includes('wrapper.go')) {
                return '/absolute/path/to/wrapper.go';
            }
            return p.startsWith('/') ? p : `/absolute/path/to/${p}`;
        });
        mockRelative.mockImplementation((from, to) => {
            if (!from && to === 'script.go') {
                return 'script.go';
            }
            if (to.includes('script.go')) {
                return 'script.go';
            }
            return to;
        });
        mockDirname.mockImplementation((p) => {
            const paths = {
                '/absolute/path/to/script.go': '/absolute/path/to',
                '/absolute/path/to': '/absolute/path',
                '/absolute/path': '/absolute',
                '/absolute': '/',
            };
            return paths[p] || p.split('/').slice(0, -1).join('/') || '/';
        });
        mockJoin.mockImplementation((...paths) => {
            const validPaths = paths.filter((p) => p !== undefined && p !== null);
            if (validPaths.length === 0) {
                return '';
            }
            // Handle specific test cases
            if (validPaths.includes('go.mod')) {
                const basePath = validPaths.find((p) => p !== 'go.mod') || '/absolute/path/to';
                return `${basePath}/go.mod`;
            }
            if (validPaths.includes('wrapper.go')) {
                return '/tmp/golang-provider-xyz/wrapper.go';
            }
            return validPaths.join('/').replace(/\/+/g, '/');
        });
        // Mock file system operations
        mockMkdtempSync.mockReturnValue('/tmp/golang-provider-xyz');
        mockExistsSync.mockImplementation((p) => {
            const pathStr = p.toString();
            // Always return true for go.mod files and wrapper.go
            if (pathStr.includes('go.mod') || pathStr.includes('wrapper.go')) {
                return true;
            }
            return true;
        });
        // Mock directory reading to return predictable results
        mockReaddirSync.mockImplementation((p) => {
            const pathStr = p.toString();
            if (pathStr.includes('nested')) {
                return [{ name: 'nested-file.go', isDirectory: () => false }];
            }
            return [{ name: 'test.go', isDirectory: () => false }];
        });
        // Mock directory and file operations
        mockMkdirSync.mockImplementation(() => undefined);
        mockCopyFileSync.mockImplementation(() => undefined);
        mockRmSync.mockImplementation(() => undefined);
        // Mock exec with proper async behavior
        mockExecFile.mockImplementation(((file, args, optionsOrCallback, maybeCallback) => {
            // Handle both execFile(file, args, callback) and execFile(file, args, options, callback) signatures
            const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
            if (!callback) {
                return {};
            }
            // Use setImmediate to ensure proper async behavior
            setImmediate(() => {
                try {
                    if (file === 'go' && args[0] === 'build') {
                        callback(null, { stdout: '', stderr: '' }, '');
                    }
                    else if (file.includes('golang_wrapper')) {
                        callback(null, { stdout: '{"output":"test output"}', stderr: '' }, '');
                    }
                    else {
                        callback(new Error('test error'), { stdout: '', stderr: '' }, '');
                    }
                }
                catch (error) {
                    callback(error, { stdout: '', stderr: '' }, '');
                }
            });
            return {};
        }));
    });
    describe('constructor', () => {
        it('should initialize with correct properties', () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                id: 'testId',
                config: { basePath: '/absolute/path/to' },
            });
            expect(provider.id()).toBe('testId');
        });
        it('should initialize with golang: syntax', () => {
            const provider = new golangCompletion_1.GolangProvider('golang:script.go', {
                id: 'testId',
                config: { basePath: '/base' },
            });
            expect(provider.id()).toBe('testId');
        });
        it('should initialize with file:// prefix', () => {
            const provider = new golangCompletion_1.GolangProvider('file://script.go', {
                id: 'testId',
                config: { basePath: '/base' },
            });
            expect(provider.id()).toBe('testId');
        });
        it('should initialize with file:// prefix and function name', () => {
            const provider = new golangCompletion_1.GolangProvider('file://script.go:function_name', {
                id: 'testId',
                config: { basePath: '/base' },
            });
            expect(provider.id()).toBe('testId');
        });
        it('should handle undefined basePath and use default id', () => {
            const provider = new golangCompletion_1.GolangProvider('script.go');
            expect(provider.id()).toBe('golang:script.go:default');
            expect(provider.config).toEqual({});
        });
        it('should use class id() method when no id is provided in options', () => {
            const provider = new golangCompletion_1.GolangProvider('script.go:custom_function');
            expect(provider.id()).toBe('golang:script.go:custom_function');
        });
        it('should allow id() override and later retrieval', () => {
            const provider = new golangCompletion_1.GolangProvider('script.go');
            expect(provider.id()).toBe('golang:script.go:default');
            const originalId = provider.id;
            provider.id = () => 'overridden-id';
            expect(provider.id()).toBe('overridden-id');
            provider.id = originalId;
            expect(provider.id()).toBe('golang:script.go:default');
        });
    });
    describe('caching', () => {
        it('should use cached result when available', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            mockIsCacheEnabled.mockReturnValue(true);
            const mockCache = {
                get: jest.fn().mockResolvedValue(JSON.stringify({ output: 'cached result' })),
                set: jest.fn(),
            };
            mockGetCache.mockResolvedValue(mockCache);
            const result = await provider.callApi('test prompt');
            expect(mockCache.get).toHaveBeenCalledWith(expect.stringContaining('golang:'));
            expect(mockExecFile).not.toHaveBeenCalled();
            expect(result).toEqual({ output: 'cached result' });
        });
        it('should handle cache errors', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            mockIsCacheEnabled.mockReturnValue(true);
            const mockCache = {
                get: jest.fn().mockRejectedValue(new Error('Cache error')),
                set: jest.fn(),
            };
            mockGetCache.mockResolvedValue(mockCache);
            await expect(provider.callApi('test prompt')).rejects.toThrow('Cache error');
        });
        it('should handle cache set errors', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            mockIsCacheEnabled.mockReturnValue(true);
            const mockCache = {
                get: jest.fn().mockResolvedValue(null),
                set: jest.fn().mockRejectedValue(new Error('Cache set error')),
            };
            mockGetCache.mockResolvedValue(mockCache);
            await expect(provider.callApi('test prompt')).rejects.toThrow('Cache set error');
        });
        it('should not cache results that contain errors', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            mockIsCacheEnabled.mockReturnValue(true);
            const mockCache = {
                get: jest.fn().mockResolvedValue(null),
                set: jest.fn(),
            };
            mockGetCache.mockResolvedValue(mockCache);
            mockExecFile.mockImplementation(((file, _args, optionsOrCallback, maybeCallback) => {
                const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
                if (!callback) {
                    return {};
                }
                setImmediate(() => {
                    if (file.includes('golang_wrapper')) {
                        callback(null, { stdout: '{"error":"test error in result"}', stderr: '' }, '');
                    }
                    else {
                        callback(null, { stdout: '', stderr: '' }, '');
                    }
                });
                return {};
            }));
            const result = await provider.callApi('test prompt');
            expect(result).toEqual({ error: 'test error in result' });
            expect(mockCache.set).not.toHaveBeenCalled();
        });
        it('should handle circular references in vars when cache is disabled', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            mockIsCacheEnabled.mockReturnValue(false);
            const circularObj = { name: 'circular' };
            circularObj.self = circularObj;
            const spy = jest
                .spyOn(provider, 'executeGolangScript')
                .mockImplementation(() => Promise.resolve({ output: 'mocked result' }));
            const result = await provider.callApi('test prompt', {
                prompt: {
                    raw: 'test prompt',
                    label: 'test',
                },
                vars: { circular: circularObj },
            });
            expect(result).toEqual({ output: 'mocked result' });
            expect(spy).toHaveBeenCalledWith('test prompt', expect.objectContaining({
                vars: expect.objectContaining({ circular: expect.anything() }),
            }), 'call_api');
            spy.mockRestore();
        });
        it('should execute script directly when cache is not enabled', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            mockIsCacheEnabled.mockReturnValue(false);
            mockGetCache.mockResolvedValue({
                get: jest.fn().mockResolvedValue(null),
                set: jest.fn(),
            });
            mockExecFile.mockImplementation(((_file, _args, optionsOrCallback, maybeCallback) => {
                const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
                if (!callback) {
                    return {};
                }
                setImmediate(() => callback(null, { stdout: '{"output":"direct execution result"}', stderr: '' }, ''));
                return {};
            }));
            const result = await provider.callApi('test prompt');
            expect(result).toEqual({ output: 'direct execution result' });
            const mockCache = await mockGetCache.mock.results[0].value;
            expect(mockCache.set).not.toHaveBeenCalled();
        });
    });
    describe('cleanup', () => {
        it('should clean up on error', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            mockExecFile.mockImplementation(((_file, _args, optionsOrCallback, maybeCallback) => {
                const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
                if (!callback) {
                    return {};
                }
                setImmediate(() => {
                    callback(new Error('test error'), { stdout: '', stderr: '' }, '');
                });
                return {};
            }));
            await expect(provider.callApi('test prompt')).rejects.toThrow('Error running Golang script: test error');
            expect(mockRmSync).toHaveBeenCalledWith(expect.stringContaining('golang-provider'), expect.objectContaining({ recursive: true, force: true }));
        });
    });
    describe('API methods', () => {
        it('should call callEmbeddingApi successfully', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            mockExecFile.mockImplementation(((file, _args, optionsOrCallback, maybeCallback) => {
                const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
                if (!callback) {
                    return {};
                }
                setImmediate(() => {
                    callback(null, {
                        stdout: file.includes('golang_wrapper') ? '{"embedding":[0.1,0.2,0.3]}' : '',
                        stderr: '',
                    }, '');
                });
                return {};
            }));
            const result = await provider.callEmbeddingApi('test prompt');
            expect(result).toEqual({ embedding: [0.1, 0.2, 0.3] });
        });
        it('should call callClassificationApi successfully', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            mockExecFile.mockImplementation(((file, _args, optionsOrCallback, maybeCallback) => {
                const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
                if (!callback) {
                    return {};
                }
                setImmediate(() => {
                    callback(null, {
                        stdout: file.includes('golang_wrapper') ? '{"classification":"test_class"}' : '',
                        stderr: '',
                    }, '');
                });
                return {};
            }));
            const result = await provider.callClassificationApi('test prompt');
            expect(result).toEqual({ classification: 'test_class' });
        });
        it('should handle stderr output without failing', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            mockExecFile.mockImplementation(((file, _args, optionsOrCallback, maybeCallback) => {
                const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
                if (!callback) {
                    return {};
                }
                setImmediate(() => {
                    callback(null, {
                        stdout: file.includes('golang_wrapper') ? '{"output":"test"}' : '',
                        stderr: 'warning: some go warning',
                    }, '');
                });
                return {};
            }));
            const result = await provider.callApi('test prompt');
            expect(result).toEqual({ output: 'test' });
        });
    });
    describe('findModuleRoot', () => {
        it('should throw error when go.mod is not found', async () => {
            mockExistsSync.mockImplementation(() => false);
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            await expect(provider.callApi('test prompt')).rejects.toThrow('Could not find go.mod file in any parent directory');
        });
        it('should find go.mod in parent directory', async () => {
            const checkedPaths = [];
            mockExistsSync.mockImplementation((p) => {
                const pathStr = p.toString();
                checkedPaths.push(pathStr);
                return pathStr.endsWith('/absolute/path/to/go.mod');
            });
            mockDirname.mockImplementation((p) => p.split('/').slice(0, -1).join('/'));
            mockResolve.mockImplementation((p) => p.startsWith('/') ? p : `/absolute/path/to/${p}`);
            mockJoin.mockImplementation((...paths) => paths.join('/').replace(/\/+/g, '/'));
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to/subdir' },
            });
            mockExecFile.mockImplementation(((_file, _args, optionsOrCallback, maybeCallback) => {
                const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
                if (!callback) {
                    return {};
                }
                setImmediate(() => callback(null, { stdout: '{"output":"test"}', stderr: '' }, ''));
                return {};
            }));
            const result = await provider.callApi('test prompt');
            expect(result).toEqual({ output: 'test' });
            expect(checkedPaths).toContain('/absolute/path/to/go.mod');
            expect(mockExistsSync).toHaveBeenCalledWith(expect.stringContaining('/absolute/path/to/go.mod'));
        });
    });
    describe('script execution', () => {
        it('should handle JSON parsing errors', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            mockExecFile.mockImplementation(((file, _args, optionsOrCallback, maybeCallback) => {
                const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
                if (!callback) {
                    return {};
                }
                setImmediate(() => {
                    callback(null, {
                        stdout: file.includes('golang_wrapper') ? 'invalid json' : '',
                        stderr: '',
                    }, '');
                });
                return {};
            }));
            await expect(provider.callApi('test prompt')).rejects.toThrow('Error running Golang script');
        });
        it('should use custom function name when specified', async () => {
            const mockParsePathOrGlob = jest.requireMock('../../src/util').parsePathOrGlob;
            mockParsePathOrGlob.mockReturnValueOnce({
                filePath: '/absolute/path/to/script.go',
                functionName: 'custom_function',
                isPathPattern: false,
                extension: 'go',
            });
            const provider = new golangCompletion_1.GolangProvider('script.go:custom_function', {
                config: { basePath: '/absolute/path/to' },
            });
            let executedFunctionName = '';
            mockExecFile.mockImplementation(((file, args, optionsOrCallback, maybeCallback) => {
                const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
                if (!callback) {
                    return {};
                }
                if (file.includes('golang_wrapper')) {
                    executedFunctionName = args[1]; // args[1] is the function name
                }
                setImmediate(() => callback(null, { stdout: '{"output":"test"}', stderr: '' }, ''));
                return {};
            }));
            await provider.callApi('test prompt');
            expect(executedFunctionName).toBe('custom_function');
        });
        it('should use custom go executable when specified', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: {
                    basePath: '/absolute/path/to',
                    goExecutable: '/custom/go',
                },
            });
            let buildFile = '';
            mockExecFile.mockImplementation(((file, args, optionsOrCallback, maybeCallback) => {
                const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
                if (!callback) {
                    return {};
                }
                if (args?.[0] === 'build') {
                    buildFile = file;
                }
                setImmediate(() => callback(null, { stdout: '{"output":"test"}', stderr: '' }, ''));
                return {};
            }));
            await provider.callApi('test prompt');
            expect(buildFile).toBe('/custom/go');
        });
        it('should handle circular references in args', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            // Create circular reference
            const circularObj = { name: 'circular' };
            circularObj.self = circularObj;
            // We need to access a private method, so we'll create a spy using any type assertions
            const spy = jest
                .spyOn(provider, 'executeGolangScript')
                .mockImplementation(() => Promise.resolve({ output: 'mocked result' }));
            // This should not throw even with circular references
            const result = await provider.callApi('test prompt', {
                prompt: {
                    raw: 'test prompt',
                    label: 'test',
                },
                vars: { circular: circularObj },
            });
            // Verify the result and that executeGolangScript was called
            expect(result).toEqual({ output: 'mocked result' });
            expect(spy).toHaveBeenCalledWith('test prompt', expect.objectContaining({
                vars: expect.objectContaining({ circular: expect.anything() }),
            }), 'call_api');
            // Restore the original implementation
            spy.mockRestore();
        });
    });
    describe('file operations', () => {
        it('should handle directory copy errors', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            mockReaddirSync.mockImplementation(() => {
                throw new Error('Directory read error');
            });
            await expect(provider.callApi('test prompt')).rejects.toThrow('Directory read error');
        });
        it('should handle file copy errors', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            mockCopyFileSync.mockImplementation(() => {
                throw new Error('File copy error');
            });
            await expect(provider.callApi('test prompt')).rejects.toThrow('File copy error');
        });
        it('should copy main.go files without transformation', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            const mainGoContent = `
        package main

        // CallApi declaration
        var CallApi = func(prompt string) string {
          return "test"
        }

        func main() {
          // Some code
        }`;
            mockReaddirSync.mockReturnValue([{ name: 'main.go', isDirectory: () => false }]);
            mockReadFileSync.mockImplementation((p) => {
                if (p.toString().endsWith('main.go')) {
                    return mainGoContent;
                }
                return 'other content';
            });
            const copiedFiles = [];
            mockCopyFileSync.mockImplementation((src, dest) => {
                copiedFiles.push({ src: src.toString(), dest: dest.toString() });
                return undefined;
            });
            mockExecFile.mockImplementation(((_file, _args, optionsOrCallback, maybeCallback) => {
                const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
                if (!callback) {
                    return {};
                }
                setImmediate(() => callback(null, { stdout: '{"output":"test"}', stderr: '' }, ''));
                return {};
            }));
            await provider.callApi('test prompt');
            // Verify that main.go was copied, not transformed
            expect(copiedFiles).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    src: expect.stringContaining('main.go'),
                    dest: expect.stringContaining('main.go'),
                }),
            ]));
        });
        it('should correctly handle nested directories in copyDir', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            // Mock a nested directory structure
            mockReaddirSync.mockImplementation((p) => {
                if (p.toString().includes('nested')) {
                    return [{ name: 'nested-file.go', isDirectory: () => false }];
                }
                return [
                    { name: 'test.go', isDirectory: () => false },
                    { name: 'nested', isDirectory: () => true },
                ];
            });
            // Track created directories and copied files
            const createdDirs = [];
            const copiedFiles = [];
            mockMkdirSync.mockImplementation((p) => {
                createdDirs.push(p.toString());
                return undefined;
            });
            mockCopyFileSync.mockImplementation((src, dest) => {
                copiedFiles.push({ src: src.toString(), dest: dest.toString() });
                return undefined;
            });
            mockExecFile.mockImplementation(((_file, _args, optionsOrCallback, maybeCallback) => {
                const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
                if (!callback) {
                    return {};
                }
                setImmediate(() => callback(null, { stdout: '{"output":"test"}', stderr: '' }, ''));
                return {};
            }));
            await provider.callApi('test prompt');
            // Check that nested directories were created
            expect(createdDirs).toEqual(expect.arrayContaining(['/tmp/golang-provider-xyz']));
            // Check that nested files were copied
            expect(copiedFiles).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    dest: expect.stringContaining('nested-file.go'),
                }),
            ]));
        });
        it('should handle copyFileSync errors', async () => {
            const provider = new golangCompletion_1.GolangProvider('script.go', {
                config: { basePath: '/absolute/path/to' },
            });
            mockReaddirSync.mockReturnValue([{ name: 'main.go', isDirectory: () => false }]);
            mockCopyFileSync.mockImplementation(() => {
                throw new Error('Failed to copy file');
            });
            await expect(provider.callApi('test prompt')).rejects.toThrow('Failed to copy file');
        });
    });
});
//# sourceMappingURL=golangCompletion.test.js.map