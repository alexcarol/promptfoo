"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const commander_1 = require("commander");
const export_1 = require("../../src/commands/export");
const logger_1 = __importDefault(require("../../src/logger"));
const eval_1 = __importDefault(require("../../src/models/eval"));
const index_1 = require("../../src/util/index");
const manage_1 = require("../../src/util/config/manage");
jest.mock('../../src/telemetry', () => ({
    record: jest.fn(),
}));
jest.mock('../../src/util', () => ({
    writeOutput: jest.fn(),
    createOutputMetadata: jest.fn().mockReturnValue({
        promptfooVersion: '1.0.0',
        nodeVersion: 'v20.0.0',
        platform: 'linux',
        arch: 'x64',
        exportedAt: '2025-07-01T00:00:00.000Z',
        evaluationCreatedAt: '2025-07-01T00:00:00.000Z',
        author: 'test-author',
    }),
}));
jest.mock('../../src/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
}));
jest.mock('../../src/util/config/manage', () => ({
    getConfigDirectoryPath: jest.fn(),
}));
jest.mock('fs', () => ({
    existsSync: jest.fn(),
    readdirSync: jest.fn(),
    statSync: jest.fn(),
    readFileSync: jest.fn(),
    createWriteStream: jest.fn(),
}));
jest.mock('zlib', () => ({
    createGzip: jest.fn(),
    gzip: jest.fn(),
}));
jest.mock('../../src/database', () => ({
    getDbInstance: jest.fn(),
}));
describe('exportCommand', () => {
    let program;
    let mockExit;
    let mockEval;
    const mockFs = fs_1.default;
    const mockGetConfigDirectoryPath = manage_1.getConfigDirectoryPath;
    beforeEach(() => {
        program = new commander_1.Command();
        mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
        mockEval = {
            id: 'test-id',
            createdAt: '2025-07-01T00:00:00.000Z',
            author: 'test-author',
            config: { test: 'config' },
            toEvaluateSummary: jest.fn().mockResolvedValue({ test: 'summary' }),
        };
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2025-07-01T00:00:00.000Z'));
    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });
    it('should export latest eval record', async () => {
        jest.spyOn(eval_1.default, 'latest').mockResolvedValue(mockEval);
        (0, export_1.exportCommand)(program);
        await program.parseAsync(['node', 'test', 'export', 'eval', 'latest', '--output', 'test.json']);
        expect(eval_1.default.latest).toHaveBeenCalledWith();
        expect(index_1.writeOutput).toHaveBeenCalledWith('test.json', mockEval, null);
        expect(mockExit).not.toHaveBeenCalled();
    });
    it('should export eval record by id', async () => {
        jest.spyOn(eval_1.default, 'findById').mockResolvedValue(mockEval);
        (0, export_1.exportCommand)(program);
        await program.parseAsync([
            'node',
            'test',
            'export',
            'eval',
            'test-id',
            '--output',
            'test.json',
        ]);
        expect(eval_1.default.findById).toHaveBeenCalledWith('test-id');
        expect(index_1.writeOutput).toHaveBeenCalledWith('test.json', mockEval, null);
        expect(mockExit).not.toHaveBeenCalled();
    });
    it('should log JSON data when no output specified', async () => {
        jest.spyOn(eval_1.default, 'findById').mockResolvedValue(mockEval);
        (0, export_1.exportCommand)(program);
        await program.parseAsync(['node', 'test', 'export', 'eval', 'test-id']);
        const expectedJson = {
            evalId: 'test-id',
            results: { test: 'summary' },
            config: { test: 'config' },
            shareableUrl: null,
            metadata: {
                promptfooVersion: '1.0.0',
                nodeVersion: 'v20.0.0',
                platform: 'linux',
                arch: 'x64',
                exportedAt: '2025-07-01T00:00:00.000Z',
                evaluationCreatedAt: '2025-07-01T00:00:00.000Z',
                author: 'test-author',
            },
        };
        expect(logger_1.default.info).toHaveBeenCalledWith(JSON.stringify(expectedJson, null, 2));
    });
    it('should exit with error when eval not found', async () => {
        jest.spyOn(eval_1.default, 'findById').mockResolvedValue(undefined);
        (0, export_1.exportCommand)(program);
        await program.parseAsync(['node', 'test', 'export', 'eval', 'non-existent-id']);
        expect(mockExit).toHaveBeenCalledWith(1);
    });
    it('should handle export errors', async () => {
        jest.spyOn(eval_1.default, 'findById').mockRejectedValue(new Error('Export failed'));
        (0, export_1.exportCommand)(program);
        await program.parseAsync(['node', 'test', 'export', 'eval', 'test-id']);
        expect(mockExit).toHaveBeenCalledWith(1);
    });
    describe('logs export', () => {
        const mockConfigDir = '/test/config';
        const _mockLogDir = '/test/config/logs';
        beforeEach(() => {
            mockGetConfigDirectoryPath.mockReturnValue(mockConfigDir);
            // Reset all mocks for clean state
            jest.clearAllMocks();
        });
        it('should handle missing log directory', async () => {
            mockFs.existsSync.mockReturnValue(false);
            (0, export_1.exportCommand)(program);
            await program.parseAsync(['node', 'test', 'export', 'logs']);
            expect(logger_1.default.error).toHaveBeenCalledWith('No log directory found. Logs have not been created yet.');
            expect(mockExit).toHaveBeenCalledWith(1);
        });
        it('should handle no log files found', async () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readdirSync.mockReturnValue([]);
            (0, export_1.exportCommand)(program);
            await program.parseAsync(['node', 'test', 'export', 'logs']);
            expect(logger_1.default.error).toHaveBeenCalledWith('No log files found in the logs directory.');
            expect(mockExit).toHaveBeenCalledWith(1);
        });
        it('should handle invalid count parameter', async () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readdirSync.mockReturnValue(['promptfoo-2025-01-01.log']);
            (0, export_1.exportCommand)(program);
            await program.parseAsync(['node', 'test', 'export', 'logs', '--count', 'invalid']);
            expect(logger_1.default.error).toHaveBeenCalledWith('Count must be a positive number');
            expect(mockExit).toHaveBeenCalledWith(1);
        });
        it('should handle zero count parameter', async () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.readdirSync.mockReturnValue(['promptfoo-2025-01-01.log']);
            (0, export_1.exportCommand)(program);
            await program.parseAsync(['node', 'test', 'export', 'logs', '--count', '0']);
            expect(logger_1.default.error).toHaveBeenCalledWith('Count must be a positive number');
            expect(mockExit).toHaveBeenCalledWith(1);
        });
    });
});
//# sourceMappingURL=export.test.js.map