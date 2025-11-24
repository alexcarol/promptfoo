"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
let mockExecAsync;
jest.mock('util', () => ({
    ...jest.requireActual('util'),
    promisify: jest.fn((fn) => {
        if (fn.name === 'exec') {
            // Return a function that will use mockExecAsync when called
            return (...args) => {
                if (!mockExecAsync) {
                    mockExecAsync = jest.fn();
                }
                return mockExecAsync(...args);
            };
        }
        return jest.requireActual('util').promisify(fn);
    }),
}));
jest.mock('../src/util/fetch/index.ts', () => ({
    fetchWithTimeout: jest.fn(),
}));
jest.mock('../package.json', () => ({
    version: '0.11.0',
}));
const index_1 = require("../src/util/fetch/index");
const updates_1 = require("../src/updates");
const package_json_1 = __importDefault(require("../package.json"));
beforeEach(() => {
    mockExecAsync = jest.fn();
});
describe('getLatestVersion', () => {
    it('should return the latest version of the package', async () => {
        jest.mocked(index_1.fetchWithTimeout).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ latestVersion: '1.1.0' }),
        });
        const latestVersion = await (0, updates_1.getLatestVersion)();
        expect(latestVersion).toBe('1.1.0');
    });
    it('should throw an error if the response is not ok', async () => {
        jest.mocked(index_1.fetchWithTimeout).mockResolvedValueOnce({
            ok: false,
        });
        await expect((0, updates_1.getLatestVersion)()).rejects.toThrow('Failed to fetch package information for promptfoo');
    });
});
describe('checkForUpdates', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });
    afterEach(() => {
        jest.mocked(console.log).mockRestore();
    });
    it('should log an update message if a newer version is available - minor ver', async () => {
        jest.mocked(index_1.fetchWithTimeout).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ latestVersion: '1.1.0' }),
        });
        const result = await (0, updates_1.checkForUpdates)();
        expect(result).toBeTruthy();
    });
    it('should log an update message if a newer version is available - major ver', async () => {
        jest.mocked(index_1.fetchWithTimeout).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ latestVersion: '1.1.0' }),
        });
        const result = await (0, updates_1.checkForUpdates)();
        expect(result).toBeTruthy();
    });
    it('should not log an update message if the current version is up to date', async () => {
        jest.mocked(index_1.fetchWithTimeout).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ latestVersion: package_json_1.default.version }),
        });
        const result = await (0, updates_1.checkForUpdates)();
        expect(result).toBeFalsy();
    });
});
describe('getModelAuditLatestVersion', () => {
    it('should return the latest version from PyPI', async () => {
        jest.mocked(index_1.fetchWithTimeout).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ info: { version: '0.1.7' } }),
        });
        const version = await (0, updates_1.getModelAuditLatestVersion)();
        expect(version).toBe('0.1.7');
        expect(index_1.fetchWithTimeout).toHaveBeenCalledWith('https://pypi.org/pypi/modelaudit/json', { headers: { 'x-promptfoo-silent': 'true' } }, 10000);
    });
    it('should return null if PyPI request fails', async () => {
        jest.mocked(index_1.fetchWithTimeout).mockResolvedValueOnce({
            ok: false,
        });
        const version = await (0, updates_1.getModelAuditLatestVersion)();
        expect(version).toBeNull();
    });
    it('should return null if fetch throws', async () => {
        jest.mocked(index_1.fetchWithTimeout).mockRejectedValueOnce(new Error('Network error'));
        const version = await (0, updates_1.getModelAuditLatestVersion)();
        expect(version).toBeNull();
    });
});
describe('getModelAuditCurrentVersion', () => {
    it('should return the current version from modelaudit --version', async () => {
        mockExecAsync.mockResolvedValueOnce({
            stdout: 'modelaudit, version 0.1.5',
            stderr: '',
        });
        const version = await (0, updates_1.getModelAuditCurrentVersion)();
        expect(version).toBe('0.1.5');
    });
    it('should return null if modelaudit --version fails', async () => {
        mockExecAsync.mockRejectedValueOnce(new Error('Command failed'));
        const version = await (0, updates_1.getModelAuditCurrentVersion)();
        expect(version).toBeNull();
    });
    it('should return null if version pattern not found', async () => {
        mockExecAsync.mockResolvedValueOnce({
            stdout: 'some invalid output',
            stderr: '',
        });
        const version = await (0, updates_1.getModelAuditCurrentVersion)();
        expect(version).toBeNull();
    });
});
describe('checkModelAuditUpdates', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => { });
        delete process.env.PROMPTFOO_DISABLE_UPDATE;
    });
    afterEach(() => {
        jest.mocked(console.log).mockRestore();
        jest.clearAllMocks();
    });
    it('should return true and log message when update is available', async () => {
        mockExecAsync.mockResolvedValueOnce({
            stdout: 'modelaudit, version 0.1.5',
            stderr: '',
        });
        jest.mocked(index_1.fetchWithTimeout).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ info: { version: '0.1.7' } }),
        });
        const result = await (0, updates_1.checkModelAuditUpdates)();
        expect(result).toBeTruthy();
    });
    it('should return false when versions are equal', async () => {
        mockExecAsync.mockResolvedValueOnce({
            stdout: 'modelaudit, version 0.1.7',
            stderr: '',
        });
        jest.mocked(index_1.fetchWithTimeout).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ info: { version: '0.1.7' } }),
        });
        const result = await (0, updates_1.checkModelAuditUpdates)();
        expect(result).toBeFalsy();
    });
    it('should return false when current version is newer', async () => {
        mockExecAsync.mockResolvedValueOnce({
            stdout: 'modelaudit, version 0.2.0',
            stderr: '',
        });
        jest.mocked(index_1.fetchWithTimeout).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ info: { version: '0.1.7' } }),
        });
        const result = await (0, updates_1.checkModelAuditUpdates)();
        expect(result).toBeFalsy();
    });
    it('should return false when PROMPTFOO_DISABLE_UPDATE is set', async () => {
        process.env.PROMPTFOO_DISABLE_UPDATE = 'true';
        const result = await (0, updates_1.checkModelAuditUpdates)();
        expect(result).toBeFalsy();
        expect(index_1.fetchWithTimeout).not.toHaveBeenCalled();
    });
    it('should return false when current version cannot be determined', async () => {
        mockExecAsync.mockRejectedValueOnce(new Error('Command failed'));
        jest.mocked(index_1.fetchWithTimeout).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ info: { version: '0.1.7' } }),
        });
        const result = await (0, updates_1.checkModelAuditUpdates)();
        expect(result).toBeFalsy();
    });
    it('should return false when latest version cannot be determined', async () => {
        mockExecAsync.mockResolvedValueOnce({
            stdout: 'modelaudit, version 0.1.5',
            stderr: '',
        });
        jest.mocked(index_1.fetchWithTimeout).mockRejectedValueOnce(new Error('Network error'));
        const result = await (0, updates_1.checkModelAuditUpdates)();
        expect(result).toBeFalsy();
    });
});
//# sourceMappingURL=updates.test.js.map