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
const opener_1 = __importDefault(require("opener"));
const constants_1 = require("../../src/constants");
const logger_1 = __importDefault(require("../../src/logger"));
const remoteGeneration = __importStar(require("../../src/redteam/remoteGeneration"));
const readlineUtils = __importStar(require("../../src/util/readline"));
// Import the module under test after mocks are set up
const server_1 = require("../../src/util/server");
// Mock opener
jest.mock('opener', () => jest.fn());
// Mock logger
jest.mock('../../src/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
}));
// Mock the readline utilities
jest.mock('../../src/util/readline', () => ({
    promptYesNo: jest.fn(),
    promptUser: jest.fn(),
    createReadlineInterface: jest.fn(),
}));
// Mock fetchWithProxy
jest.mock('../../src/util/fetch', () => ({
    fetchWithProxy: jest.fn(),
}));
// Mock remoteGeneration
jest.mock('../../src/redteam/remoteGeneration', () => ({
    getRemoteVersionUrl: jest.fn(),
}));
// Import the mocked fetchWithProxy for use in tests
const fetchModule = __importStar(require("../../src/util/fetch/index"));
const mockFetchWithProxy = fetchModule.fetchWithProxy;
describe('Server Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('checkServerRunning', () => {
        it('should return true when server is running with matching version', async () => {
            mockFetchWithProxy.mockResolvedValueOnce({
                json: async () => ({ status: 'OK', version: constants_1.VERSION }),
            });
            const result = await (0, server_1.checkServerRunning)();
            expect(mockFetchWithProxy).toHaveBeenCalledWith(`http://localhost:${(0, constants_1.getDefaultPort)()}/health`, {
                headers: {
                    'x-promptfoo-silent': 'true',
                },
            });
            expect(result).toBe(true);
        });
        it('should return false when server status is not OK', async () => {
            mockFetchWithProxy.mockResolvedValueOnce({
                json: async () => ({ status: 'ERROR', version: constants_1.VERSION }),
            });
            const result = await (0, server_1.checkServerRunning)();
            expect(result).toBe(false);
        });
        it('should return false when server version does not match', async () => {
            mockFetchWithProxy.mockResolvedValueOnce({
                json: async () => ({ status: 'OK', version: 'wrong-version' }),
            });
            const result = await (0, server_1.checkServerRunning)();
            expect(result).toBe(false);
        });
        it('should return false when fetch throws an error', async () => {
            mockFetchWithProxy.mockRejectedValueOnce(new Error('Connection refused'));
            const result = await (0, server_1.checkServerRunning)();
            expect(result).toBe(false);
            expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining('No existing server found'));
        });
        it('should use custom port when provided', async () => {
            const customPort = 4000;
            mockFetchWithProxy.mockResolvedValueOnce({
                json: async () => ({ status: 'OK', version: constants_1.VERSION }),
            });
            await (0, server_1.checkServerRunning)(customPort);
            expect(mockFetchWithProxy).toHaveBeenCalledWith(`http://localhost:${customPort}/health`, {
                headers: {
                    'x-promptfoo-silent': 'true',
                },
            });
        });
    });
    describe('openBrowser', () => {
        it('should open browser with default URL when BrowserBehavior.OPEN', async () => {
            await (0, server_1.openBrowser)(server_1.BrowserBehavior.OPEN);
            expect(opener_1.default).toHaveBeenCalledWith(`http://localhost:${(0, constants_1.getDefaultPort)()}`);
            expect(logger_1.default.info).toHaveBeenCalledWith(expect.stringContaining('Press Ctrl+C'));
        });
        it('should open browser with report URL when BrowserBehavior.OPEN_TO_REPORT', async () => {
            await (0, server_1.openBrowser)(server_1.BrowserBehavior.OPEN_TO_REPORT);
            expect(opener_1.default).toHaveBeenCalledWith(`http://localhost:${(0, constants_1.getDefaultPort)()}/report`);
        });
        it('should open browser with redteam setup URL when BrowserBehavior.OPEN_TO_REDTEAM_CREATE', async () => {
            await (0, server_1.openBrowser)(server_1.BrowserBehavior.OPEN_TO_REDTEAM_CREATE);
            expect(opener_1.default).toHaveBeenCalledWith(`http://localhost:${(0, constants_1.getDefaultPort)()}/redteam/setup`);
        });
        it('should not open browser when BrowserBehavior.SKIP', async () => {
            await (0, server_1.openBrowser)(server_1.BrowserBehavior.SKIP);
            expect(opener_1.default).not.toHaveBeenCalled();
            expect(logger_1.default.info).not.toHaveBeenCalled();
        });
        it('should handle opener errors gracefully', async () => {
            jest.mocked(opener_1.default).mockImplementationOnce(() => {
                throw new Error('Failed to open browser');
            });
            await (0, server_1.openBrowser)(server_1.BrowserBehavior.OPEN);
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining('Failed to open browser'));
        });
        it('should ask user before opening browser when BrowserBehavior.ASK', async () => {
            // Mock promptYesNo to return true
            jest.mocked(readlineUtils.promptYesNo).mockResolvedValueOnce(true);
            await (0, server_1.openBrowser)(server_1.BrowserBehavior.ASK);
            expect(readlineUtils.promptYesNo).toHaveBeenCalledWith('Open URL in browser?', false);
            expect(opener_1.default).toHaveBeenCalledWith(`http://localhost:${(0, constants_1.getDefaultPort)()}`);
        });
        it('should not open browser when user answers no to ASK prompt', async () => {
            // Mock promptYesNo to return false
            jest.mocked(readlineUtils.promptYesNo).mockResolvedValueOnce(false);
            await (0, server_1.openBrowser)(server_1.BrowserBehavior.ASK);
            expect(readlineUtils.promptYesNo).toHaveBeenCalledWith('Open URL in browser?', false);
            expect(opener_1.default).not.toHaveBeenCalled();
        });
        it('should use custom port when provided', async () => {
            const customPort = 5000;
            await (0, server_1.openBrowser)(server_1.BrowserBehavior.OPEN, customPort);
            expect(opener_1.default).toHaveBeenCalledWith(`http://localhost:${customPort}`);
        });
    });
    describe('checkServerFeatureSupport', () => {
        const featureName = 'test-feature';
        beforeEach(() => {
            // Clear the feature cache before each test to ensure isolation
            (0, server_1.__clearFeatureCache)();
            jest.clearAllMocks();
            // Setup default mock for getRemoteVersionUrl to return a valid URL
            jest
                .mocked(remoteGeneration.getRemoteVersionUrl)
                .mockReturnValue('https://api.promptfoo.app/version');
        });
        it('should return true when server buildDate is after required date', async () => {
            const requiredDate = '2024-01-01T00:00:00Z';
            const serverBuildDate = '2024-06-15T10:30:00Z';
            mockFetchWithProxy.mockResolvedValueOnce({
                json: async () => ({ buildDate: serverBuildDate, version: '1.0.0' }),
            });
            const result = await (0, server_1.checkServerFeatureSupport)(featureName, requiredDate);
            expect(mockFetchWithProxy).toHaveBeenCalledWith('https://api.promptfoo.app/version', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toBe(true);
            expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining(`${featureName}: buildDate=${serverBuildDate}, required=${requiredDate}, supported=true`));
        });
        it('should return false when server buildDate is before required date', async () => {
            const requiredDate = '2024-06-01T00:00:00Z';
            const serverBuildDate = '2024-01-15T10:30:00Z';
            mockFetchWithProxy.mockResolvedValueOnce({
                json: async () => ({ buildDate: serverBuildDate, version: '1.0.0' }),
            });
            const result = await (0, server_1.checkServerFeatureSupport)(featureName, requiredDate);
            expect(result).toBe(false);
            expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining(`${featureName}: buildDate=${serverBuildDate}, required=${requiredDate}, supported=false`));
        });
        it('should return false when no version info available', async () => {
            mockFetchWithProxy.mockResolvedValueOnce({
                json: async () => ({}),
            });
            const result = await (0, server_1.checkServerFeatureSupport)(featureName, '2024-01-01T00:00:00Z');
            expect(result).toBe(false);
            expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining(`${featureName}: no version info, assuming not supported`));
        });
        it('should return true when no remote URL is available (local server assumption)', async () => {
            // Mock getRemoteVersionUrl to return null for this specific test
            jest.mocked(remoteGeneration.getRemoteVersionUrl).mockReturnValueOnce(null);
            const result = await (0, server_1.checkServerFeatureSupport)(featureName, '2024-01-01T00:00:00Z');
            expect(result).toBe(true);
            expect(mockFetchWithProxy).not.toHaveBeenCalled();
            expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining(`No remote URL available for ${featureName}, assuming local server supports it`));
        });
        it('should return false when fetchWithProxy throws an error', async () => {
            mockFetchWithProxy.mockRejectedValueOnce(new Error('Network error'));
            const result = await (0, server_1.checkServerFeatureSupport)(featureName, '2024-01-01T00:00:00Z');
            expect(result).toBe(false);
            expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining(`Version check failed for ${featureName}, assuming not supported: Error: Network error`));
        });
        it('should cache results to avoid repeated API calls', async () => {
            const requiredDate = '2024-01-01T00:00:00Z';
            const serverBuildDate = '2024-06-15T10:30:00Z';
            mockFetchWithProxy.mockResolvedValue({
                json: async () => ({ buildDate: serverBuildDate, version: '1.0.0' }),
            });
            // First call
            const result1 = await (0, server_1.checkServerFeatureSupport)(featureName, requiredDate);
            // Second call with same parameters
            const result2 = await (0, server_1.checkServerFeatureSupport)(featureName, requiredDate);
            expect(result1).toBe(true);
            expect(result2).toBe(true);
            // fetchWithProxy should only be called once due to caching
            expect(mockFetchWithProxy).toHaveBeenCalledTimes(1);
        });
        it('should handle different feature names with separate cache entries', async () => {
            const feature1 = 'feature-one';
            const feature2 = 'feature-two';
            const requiredDate = '2024-01-01T00:00:00Z';
            mockFetchWithProxy
                .mockResolvedValueOnce({
                json: async () => ({ buildDate: '2024-06-15T10:30:00Z', version: '1.0.0' }),
            })
                .mockResolvedValueOnce({
                json: async () => ({ buildDate: '2023-12-15T10:30:00Z', version: '1.0.0' }),
            });
            const result1 = await (0, server_1.checkServerFeatureSupport)(feature1, requiredDate);
            const result2 = await (0, server_1.checkServerFeatureSupport)(feature2, requiredDate);
            expect(result1).toBe(true);
            expect(result2).toBe(false);
            expect(mockFetchWithProxy).toHaveBeenCalledTimes(2);
        });
        it('should handle timezone differences correctly', async () => {
            const requiredDate = '2024-06-01T00:00:00Z'; // UTC
            const serverBuildDate = '2024-06-01T08:00:00+08:00'; // Same moment in different timezone
            mockFetchWithProxy.mockResolvedValueOnce({
                json: async () => ({ buildDate: serverBuildDate, version: '1.0.0' }),
            });
            const result = await (0, server_1.checkServerFeatureSupport)(featureName, requiredDate);
            expect(result).toBe(true);
        });
    });
});
//# sourceMappingURL=server.test.js.map