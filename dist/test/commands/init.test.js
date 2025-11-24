"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const commander_1 = require("commander");
const confirm_1 = __importDefault(require("@inquirer/confirm"));
const init = __importStar(require("../../src/commands/init"));
const logger_1 = __importDefault(require("../../src/logger"));
const index_1 = require("../../src/util/fetch/index");
const utils_1 = require("../util/utils");
jest.mock('../../src/redteam/commands/init', () => ({
    redteamInit: jest.fn(),
}));
jest.mock('../../src/server/server', () => ({
    startServer: jest.fn(),
    BrowserBehavior: {
        ASK: 0,
        OPEN: 1,
        SKIP: 2,
        OPEN_TO_REPORT: 3,
        OPEN_TO_REDTEAM_CREATE: 4,
    },
}));
jest.mock('../../src/util/fetch/index', () => ({
    fetchWithProxy: jest.fn(),
}));
jest.mock('fs/promises');
jest.mock('path', () => ({
    ...jest.requireActual('path'),
    resolve: jest.fn(),
}));
jest.mock('../../src/constants');
jest.mock('../../src/onboarding');
jest.mock('../../src/telemetry');
jest.mock('@inquirer/confirm');
jest.mock('@inquirer/input');
jest.mock('@inquirer/select');
const mockFetchWithProxy = jest.mocked(index_1.fetchWithProxy);
describe('init command', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFetchWithProxy.mockClear();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('downloadFile', () => {
        it('should download a file successfully', async () => {
            const mockResponse = (0, utils_1.createMockResponse)({
                ok: true,
                status: 200,
                text: () => Promise.resolve('file content'),
            });
            mockFetchWithProxy.mockResolvedValue(mockResponse);
            await init.downloadFile('https://example.com/file.txt', '/path/to/file.txt');
            expect(mockFetchWithProxy).toHaveBeenCalledWith('https://example.com/file.txt');
            expect(promises_1.default.writeFile).toHaveBeenCalledWith('/path/to/file.txt', 'file content');
        });
        it('should throw an error if download fails', async () => {
            const mockResponse = (0, utils_1.createMockResponse)({
                ok: false,
                status: 404,
                statusText: 'Not Found',
            });
            mockFetchWithProxy.mockResolvedValue(mockResponse);
            await expect(init.downloadFile('https://example.com/file.txt', '/path/to/file.txt')).rejects.toThrow('Failed to download file: Not Found');
        });
        it('should handle network errors', async () => {
            mockFetchWithProxy.mockRejectedValue(new Error('Network error'));
            await expect(init.downloadFile('https://example.com/file.txt', '/path/to/file.txt')).rejects.toThrow('Network error');
        });
    });
    describe('downloadDirectory', () => {
        it('should throw an error if fetching directory contents fails on both VERSION and main', async () => {
            const mockResponse = (0, utils_1.createMockResponse)({
                ok: false,
                statusText: 'Not Found',
            });
            mockFetchWithProxy.mockResolvedValueOnce(mockResponse).mockResolvedValueOnce(mockResponse);
            await expect(init.downloadDirectory('example', '/path/to/target')).rejects.toThrow('Failed to fetch directory contents: Not Found');
            expect(mockFetchWithProxy).toHaveBeenCalledTimes(2);
            expect(mockFetchWithProxy.mock.calls[0][0]).toContain('?ref=');
            expect(mockFetchWithProxy.mock.calls[1][0]).toContain('?ref=main');
        });
        it('should succeed if VERSION fails but main succeeds', async () => {
            const mockFailedResponse = (0, utils_1.createMockResponse)({
                ok: false,
                statusText: 'Not Found',
            });
            const mockSuccessResponse = (0, utils_1.createMockResponse)({
                ok: true,
                json: () => Promise.resolve([]),
            });
            mockFetchWithProxy
                .mockResolvedValueOnce(mockFailedResponse)
                .mockResolvedValueOnce(mockSuccessResponse);
            await init.downloadDirectory('example', '/path/to/target');
            expect(mockFetchWithProxy).toHaveBeenCalledTimes(2);
            expect(mockFetchWithProxy.mock.calls[0][0]).toContain('?ref=');
            expect(mockFetchWithProxy.mock.calls[1][0]).toContain('?ref=main');
        });
        it('should handle network errors', async () => {
            mockFetchWithProxy.mockRejectedValue(new Error('Network error'));
            await expect(init.downloadDirectory('example', '/path/to/target')).rejects.toThrow('Network error');
        });
    });
    describe('downloadExample', () => {
        it('should throw an error if directory creation fails', async () => {
            jest.spyOn(promises_1.default, 'mkdir').mockRejectedValue(new Error('Permission denied'));
            await expect(init.downloadExample('example', '/path/to/target')).rejects.toThrow('Failed to download example: Permission denied');
        });
        it('should throw an error if downloadDirectory fails', async () => {
            jest.spyOn(promises_1.default, 'mkdir').mockResolvedValue(undefined);
            // Mock fetch to simulate downloadDirectory failure
            mockFetchWithProxy.mockRejectedValue(new Error('Network error'));
            await expect(init.downloadExample('example', '/path/to/target')).rejects.toThrow('Failed to download example: Network error');
        });
    });
    describe('getExamplesList', () => {
        it('should return a list of examples', async () => {
            const mockResponse = (0, utils_1.createMockResponse)({
                ok: true,
                status: 200,
                json: () => Promise.resolve([
                    { name: 'example1', type: 'dir' },
                    { name: 'example2', type: 'dir' },
                    { name: 'not-an-example', type: 'file' },
                ]),
            });
            mockFetchWithProxy.mockResolvedValue(mockResponse);
            const examples = await init.getExamplesList();
            expect(examples).toEqual(['example1', 'example2']);
        });
        it('should return an empty array if fetching fails', async () => {
            const mockResponse = (0, utils_1.createMockResponse)({
                ok: false,
                status: 404,
                statusText: 'Not Found',
            });
            mockFetchWithProxy.mockResolvedValue(mockResponse);
            const examples = await init.getExamplesList();
            expect(examples).toEqual([]);
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining('Not Found'));
        });
        it('should handle network errors', async () => {
            mockFetchWithProxy.mockRejectedValue(new Error('Network error'));
            const examples = await init.getExamplesList();
            expect(examples).toEqual([]);
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining('Network error'));
        });
    });
    describe('handleExampleDownload', () => {
        describe('when download fails', () => {
            it('should not show success message when user declines retry', async () => {
                // Download failed
                mockFetchWithProxy.mockRejectedValue(new Error('404 Not Found'));
                // User selects not to download another example
                jest.mocked(confirm_1.default).mockResolvedValue(false);
                const loggerSpy = jest.spyOn(logger_1.default, 'info');
                const result = await init.handleExampleDownload('.', 'nonexistent-example');
                expect(result).toEqual('nonexistent-example');
                expect(loggerSpy).not.toHaveBeenCalledWith(expect.stringContaining('cd nonexistent-example && promptfoo eval'));
            });
            it('should show helpful message when user declines retry', async () => {
                // Download failed
                mockFetchWithProxy.mockRejectedValue(new Error('404 Not Found'));
                // User selects not to download another example
                jest.mocked(confirm_1.default).mockResolvedValue(false);
                const loggerSpy = jest.spyOn(logger_1.default, 'info');
                const result = await init.handleExampleDownload('.', 'nonexistent-example');
                expect(result).toEqual('nonexistent-example');
                expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('No example downloaded'));
            });
            it('should not clean up directory when it existed before', async () => {
                // Download failed
                mockFetchWithProxy.mockRejectedValue(new Error('404 Not Found'));
                // User selects not to download another example
                jest.mocked(confirm_1.default).mockResolvedValue(false);
                // Directory exists before download
                jest.spyOn(promises_1.default, 'access').mockResolvedValue(undefined);
                // Mock successful cleanup
                const rmSpy = jest.spyOn(promises_1.default, 'rm').mockResolvedValue(undefined);
                await init.handleExampleDownload('.', 'nonexistent-example');
                // Should not clean up the directory
                expect(rmSpy).not.toHaveBeenCalledWith('nonexistent-example', {
                    recursive: true,
                    force: true,
                });
            });
            it('should clean up directory when it did not exist before', async () => {
                // Download failed
                mockFetchWithProxy.mockRejectedValue(new Error('404 Not Found'));
                // User selects not to download another example
                jest.mocked(confirm_1.default).mockResolvedValue(false);
                // Directory doesn't exist before download (fs.access throws)
                jest.spyOn(promises_1.default, 'access').mockRejectedValue(new Error('ENOENT: no such file or directory'));
                // Mock successful cleanup
                const rmSpy = jest.spyOn(promises_1.default, 'rm').mockResolvedValue(undefined);
                await init.handleExampleDownload('.', 'nonexistent-example');
                // Should clean up the directory
                expect(rmSpy).toHaveBeenCalledWith('nonexistent-example', { recursive: true, force: true });
            });
        });
    });
    describe('initCommand', () => {
        let program;
        beforeEach(() => {
            program = new commander_1.Command();
            init.initCommand(program);
            const initCmd = program.commands.find((cmd) => cmd.name() === 'init');
            if (!initCmd) {
                throw new Error('initCmd not found');
            }
        });
        it('should set up the init command correctly', () => {
            const initCmd = program.commands.find((cmd) => cmd.name() === 'init');
            expect(initCmd).toBeDefined();
            expect(initCmd?.description()).toBe('Initialize project with dummy files or download an example');
            expect(initCmd?.options).toHaveLength(2);
        });
    });
});
//# sourceMappingURL=init.test.js.map