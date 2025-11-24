"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const commander_1 = require("commander");
const modelScan_1 = require("../../src/commands/modelScan");
const logger_1 = __importDefault(require("../../src/logger"));
jest.mock('child_process');
jest.mock('../../src/logger');
jest.mock('../../src/models/modelAudit', () => ({
    __esModule: true,
    default: {
        create: jest.fn().mockResolvedValue({ id: 'scan-abc-2025-01-01T00:00:00' }),
    },
}));
jest.mock('../../src/updates', () => ({
    checkModelAuditUpdates: jest.fn().mockResolvedValue(undefined),
}));
describe('modelScanCommand', () => {
    let program;
    let mockExit;
    beforeEach(() => {
        program = new commander_1.Command();
        mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
        jest.clearAllMocks();
    });
    afterEach(() => {
        mockExit.mockRestore();
    });
    it('should exit if no paths are provided', async () => {
        // Mock logger.error to capture the output
        const loggerErrorSpy = jest.spyOn(logger_1.default, 'error').mockImplementation();
        // Mock for checkModelAuditInstalled (modelaudit --version)
        const versionCheckProcess = {
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0); // Simulate successful version check
                }
                return versionCheckProcess;
            }),
        };
        // Mock for any potential scan process (shouldn't be reached but needed for safety)
        const mockScanProcess = {
            stdout: { on: jest.fn() },
            stderr: { on: jest.fn() },
            on: jest.fn(),
        };
        // Set up spawn mock: first for version check, then default for any other calls
        child_process_1.spawn
            .mockReturnValueOnce(versionCheckProcess)
            .mockReturnValue(mockScanProcess);
        (0, modelScan_1.modelScanCommand)(program);
        const command = program.commands.find((cmd) => cmd.name() === 'scan-model');
        await command?.parseAsync(['scan-model']);
        expect(loggerErrorSpy).toHaveBeenCalledWith('No paths specified. Please provide at least one model file or directory to scan.');
        expect(mockExit).toHaveBeenCalledWith(1);
        loggerErrorSpy.mockRestore();
    });
    it('should exit if modelaudit is not installed', async () => {
        // Mock logger.error to capture the output
        const loggerErrorSpy = jest.spyOn(logger_1.default, 'error').mockImplementation();
        // Mock for checkModelAuditInstalled (modelaudit --version) - simulate not installed
        const versionCheckProcess = {
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'error') {
                    callback(new Error('command not found'));
                }
                return versionCheckProcess;
            }),
        };
        // Mock for any potential scan process (shouldn't be reached but needed for safety)
        const mockScanProcess = {
            stdout: { on: jest.fn() },
            stderr: { on: jest.fn() },
            on: jest.fn(),
        };
        // Set up spawn mock: first for version check, then default for any other calls
        child_process_1.spawn
            .mockReturnValueOnce(versionCheckProcess)
            .mockReturnValue(mockScanProcess);
        (0, modelScan_1.modelScanCommand)(program);
        const command = program.commands.find((cmd) => cmd.name() === 'scan-model');
        await command?.parseAsync(['scan-model', 'path/to/model']);
        expect(loggerErrorSpy).toHaveBeenCalledWith('ModelAudit is not installed.');
        expect(mockExit).toHaveBeenCalledWith(1);
        loggerErrorSpy.mockRestore();
    });
    it('should spawn modelaudit process with correct arguments', async () => {
        // Mock for checkModelAuditInstalled (modelaudit --version)
        const versionCheckProcess = {
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
                return versionCheckProcess;
            }),
        };
        const mockChildProcess = {
            stdout: {
                on: jest.fn(),
            },
            stderr: {
                on: jest.fn(),
            },
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
                return mockChildProcess;
            }),
        };
        // First call for version check, second for actual scan
        child_process_1.spawn
            .mockReturnValueOnce(versionCheckProcess)
            .mockReturnValueOnce(mockChildProcess);
        (0, modelScan_1.modelScanCommand)(program);
        const command = program.commands.find((cmd) => cmd.name() === 'scan-model');
        await command.parseAsync([
            'node',
            'scan-model',
            'path1',
            'path2',
            '--blacklist',
            'pattern1',
            '--format',
            'json',
            '--timeout',
            '600',
            '--verbose',
            '--max-size',
            '1GB',
            '--strict',
            '--dry-run',
            '--quiet',
            '--progress',
        ]);
        expect(child_process_1.spawn).toHaveBeenCalledWith('modelaudit', ['--version']);
        expect(child_process_1.spawn).toHaveBeenCalledWith('modelaudit', [
            'scan',
            'path1',
            'path2',
            '--blacklist',
            'pattern1',
            '--format',
            'json',
            '--verbose',
            '--quiet',
            '--strict',
            '--progress',
            '--timeout',
            '600',
            '--max-size',
            '1GB',
            '--dry-run',
        ], {
            env: {
                ...process.env,
                PROMPTFOO_DELEGATED: 'true',
            },
        });
    });
    it('should handle modelaudit process error', async () => {
        // Mock logger.error to capture the output
        const loggerErrorSpy = jest.spyOn(logger_1.default, 'error').mockImplementation();
        // Mock for checkModelAuditInstalled (modelaudit --version)
        const versionCheckProcess = {
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
                return versionCheckProcess;
            }),
        };
        const mockChildProcess = {
            stdout: {
                on: jest.fn(),
            },
            stderr: {
                on: jest.fn(),
            },
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'error') {
                    callback(new Error('spawn error'));
                }
                return mockChildProcess;
            }),
        };
        // First call for version check, second for actual scan
        child_process_1.spawn
            .mockReturnValueOnce(versionCheckProcess)
            .mockReturnValueOnce(mockChildProcess);
        (0, modelScan_1.modelScanCommand)(program);
        const command = program.commands.find((cmd) => cmd.name() === 'scan-model');
        await command?.parseAsync(['scan-model', 'path/to/model']);
        expect(loggerErrorSpy).toHaveBeenCalledWith('Failed to start modelaudit: spawn error');
        expect(mockExit).toHaveBeenCalledWith(1);
        loggerErrorSpy.mockRestore();
    });
    it('should handle exit code 1 (scan completed with issues)', async () => {
        // Mock for checkModelAuditInstalled (modelaudit --version)
        const versionCheckProcess = {
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
                return versionCheckProcess;
            }),
        };
        const mockOutput = JSON.stringify({
            total_checks: 10,
            passed_checks: 8,
            failed_checks: 2,
            files_scanned: 5,
            bytes_scanned: 1024,
            duration: 1000,
            has_errors: true,
            issues: [
                {
                    severity: 'error',
                    message: 'Test issue 1',
                    location: 'test/file1.py',
                },
                {
                    severity: 'warning',
                    message: 'Test issue 2',
                    location: 'test/file2.py',
                },
            ],
        });
        const mockChildProcess = {
            stdout: {
                on: jest.fn().mockImplementation((event, callback) => {
                    if (event === 'data') {
                        callback(Buffer.from(mockOutput));
                    }
                }),
            },
            stderr: {
                on: jest.fn(),
            },
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(1);
                }
                return mockChildProcess;
            }),
        };
        // First call for version check, second for actual scan
        child_process_1.spawn
            .mockReturnValueOnce(versionCheckProcess)
            .mockReturnValueOnce(mockChildProcess);
        (0, modelScan_1.modelScanCommand)(program);
        const command = program.commands.find((cmd) => cmd.name() === 'scan-model');
        await command?.parseAsync(['node', 'scan-model', 'path/to/model']);
        // When saving to database (default), the command just exits with the code
        // without logging a specific error message for exit code 1
        expect(mockExit).toHaveBeenCalledWith(1);
    });
    it('should handle exit code 2 (scan process error)', async () => {
        // Mock logger.error to capture the output
        const loggerErrorSpy = jest.spyOn(logger_1.default, 'error').mockImplementation();
        // Mock for checkModelAuditInstalled (modelaudit --version)
        const versionCheckProcess = {
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
                return versionCheckProcess;
            }),
        };
        const mockChildProcess = {
            stdout: {
                on: jest.fn(),
            },
            stderr: {
                on: jest.fn().mockImplementation((event, callback) => {
                    if (event === 'data') {
                        callback(Buffer.from('Some error output'));
                    }
                }),
            },
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(2);
                }
                return mockChildProcess;
            }),
        };
        // First call for version check, second for actual scan
        child_process_1.spawn
            .mockReturnValueOnce(versionCheckProcess)
            .mockReturnValueOnce(mockChildProcess);
        (0, modelScan_1.modelScanCommand)(program);
        const command = program.commands.find((cmd) => cmd.name() === 'scan-model');
        await command?.parseAsync(['node', 'scan-model', 'path/to/model']);
        expect(loggerErrorSpy).toHaveBeenCalledWith('Model scan process exited with code 2');
        expect(loggerErrorSpy).toHaveBeenCalledWith('Error output: Some error output');
        expect(mockExit).toHaveBeenCalledWith(2);
        loggerErrorSpy.mockRestore();
    });
});
describe('checkModelAuditInstalled', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should return true if modelaudit is installed', async () => {
        const mockChildProcess = {
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
                return mockChildProcess;
            }),
        };
        child_process_1.spawn.mockReturnValue(mockChildProcess);
        const result = await (0, modelScan_1.checkModelAuditInstalled)();
        expect(result).toBe(true);
        expect(child_process_1.spawn).toHaveBeenCalledWith('modelaudit', ['--version']);
    });
    it('should return false if modelaudit is not installed', async () => {
        const mockChildProcess = {
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'error') {
                    callback(new Error('command not found'));
                }
                return mockChildProcess;
            }),
        };
        child_process_1.spawn.mockReturnValue(mockChildProcess);
        const result = await (0, modelScan_1.checkModelAuditInstalled)();
        expect(result).toBe(false);
        expect(child_process_1.spawn).toHaveBeenCalledWith('modelaudit', ['--version']);
    });
    it('should return true if modelaudit exits with code 1', async () => {
        const mockChildProcess = {
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(1);
                }
                return mockChildProcess;
            }),
        };
        child_process_1.spawn.mockReturnValue(mockChildProcess);
        const result = await (0, modelScan_1.checkModelAuditInstalled)();
        expect(result).toBe(true);
        expect(child_process_1.spawn).toHaveBeenCalledWith('modelaudit', ['--version']);
    });
    it('should return false if modelaudit exits with non-0/1 code', async () => {
        const mockChildProcess = {
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(2);
                }
                return mockChildProcess;
            }),
        };
        child_process_1.spawn.mockReturnValue(mockChildProcess);
        const result = await (0, modelScan_1.checkModelAuditInstalled)();
        expect(result).toBe(false);
        expect(child_process_1.spawn).toHaveBeenCalledWith('modelaudit', ['--version']);
    });
});
describe('Command Options Validation', () => {
    let program;
    let mockExit;
    beforeEach(() => {
        program = new commander_1.Command();
        mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
        jest.clearAllMocks();
    });
    afterEach(() => {
        mockExit.mockRestore();
    });
    it('should register only supported CLI options', () => {
        (0, modelScan_1.modelScanCommand)(program);
        const command = program.commands.find((cmd) => cmd.name() === 'scan-model');
        expect(command).toBeDefined();
        const options = command?.options || [];
        const optionNames = options.map((opt) => opt.long);
        // Valid options that should be present
        const validOptions = [
            '--blacklist',
            '--output',
            '--format',
            '--sbom',
            '--no-write',
            '--name',
            '--timeout',
            '--max-size',
            '--strict',
            '--dry-run',
            '--no-cache',
            '--quiet',
            '--progress',
            '--stream',
            '--verbose',
        ];
        validOptions.forEach((option) => {
            expect(optionNames).toContain(option);
        });
        // Invalid options that should NOT be present
        const invalidOptions = [
            '--registry-uri',
            '--max-file-size',
            '--max-total-size',
            '--jfrog-api-token',
            '--jfrog-access-token',
            '--max-download-size',
            '--cache-dir',
            '--preview',
            '--all-files',
            '--selective',
            '--scan-and-delete',
            '--skip-files',
            '--no-skip-files',
            '--strict-license',
            '--no-large-model-support',
            '--no-progress',
            '--progress-log',
            '--progress-format',
            '--progress-interval',
        ];
        invalidOptions.forEach((option) => {
            expect(optionNames).not.toContain(option);
        });
    });
    it('should only pass valid arguments to modelaudit', async () => {
        const versionCheckProcess = {
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
                return versionCheckProcess;
            }),
        };
        const mockScanProcess = {
            stdout: { on: jest.fn() },
            stderr: { on: jest.fn() },
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
                return mockScanProcess;
            }),
        };
        child_process_1.spawn
            .mockReturnValueOnce(versionCheckProcess)
            .mockReturnValueOnce(mockScanProcess);
        (0, modelScan_1.modelScanCommand)(program);
        const command = program.commands.find((cmd) => cmd.name() === 'scan-model');
        await command.parseAsync([
            'node',
            'scan-model',
            'model.pkl',
            '--blacklist',
            'pattern1',
            '--max-size',
            '1GB',
            '--strict',
            '--dry-run',
            '--no-cache',
            '--no-write',
        ]);
        const spawnCalls = child_process_1.spawn.mock.calls;
        const scanCall = spawnCalls.find((call) => call[1].includes('scan'));
        expect(scanCall).toBeDefined();
        const args = scanCall[1];
        // Should contain valid arguments
        expect(args).toContain('--blacklist');
        expect(args).toContain('pattern1');
        expect(args).toContain('--max-size');
        expect(args).toContain('1GB');
        expect(args).toContain('--strict');
        expect(args).toContain('--dry-run');
        expect(args).toContain('--no-cache');
        // Should NOT contain invalid arguments
        expect(args).not.toContain('--max-file-size');
        expect(args).not.toContain('--preview');
        expect(args).not.toContain('--registry-uri');
        expect(args).not.toContain('--jfrog-api-token');
    });
    it('should handle multiple blacklist patterns correctly', async () => {
        const versionCheckProcess = {
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
                return versionCheckProcess;
            }),
        };
        const mockScanProcess = {
            stdout: { on: jest.fn() },
            stderr: { on: jest.fn() },
            on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
                return mockScanProcess;
            }),
        };
        child_process_1.spawn
            .mockReturnValueOnce(versionCheckProcess)
            .mockReturnValueOnce(mockScanProcess);
        (0, modelScan_1.modelScanCommand)(program);
        const command = program.commands.find((cmd) => cmd.name() === 'scan-model');
        await command.parseAsync([
            'node',
            'scan-model',
            'model.pkl',
            '--blacklist',
            'pattern1',
            '--blacklist',
            'pattern2',
            '--blacklist',
            'pattern3',
            '--no-write',
        ]);
        const spawnCalls = child_process_1.spawn.mock.calls;
        const scanCall = spawnCalls.find((call) => call[1].includes('scan'));
        const args = scanCall[1];
        // Should contain all blacklist patterns
        expect(args).toContain('--blacklist');
        expect(args).toContain('pattern1');
        expect(args).toContain('pattern2');
        expect(args).toContain('pattern3');
        // Should have correct sequence
        const blacklistIndices = [];
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--blacklist') {
                blacklistIndices.push(i);
            }
        }
        expect(blacklistIndices).toHaveLength(3);
        expect(args[blacklistIndices[0] + 1]).toBe('pattern1');
        expect(args[blacklistIndices[1] + 1]).toBe('pattern2');
        expect(args[blacklistIndices[2] + 1]).toBe('pattern3');
    });
});
//# sourceMappingURL=modelScan.test.js.map