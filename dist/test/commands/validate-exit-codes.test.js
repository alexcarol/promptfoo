"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const validate_1 = require("../../src/commands/validate");
const logger_1 = __importDefault(require("../../src/logger"));
const load_1 = require("../../src/util/config/load");
jest.mock('../../src/logger');
jest.mock('../../src/util/config/load');
jest.mock('../../src/telemetry', () => ({
    record: jest.fn(),
    send: jest.fn(),
}));
describe('Validate Command Exit Codes', () => {
    let program;
    const defaultConfig = {};
    const defaultConfigPath = 'config.yaml';
    beforeEach(() => {
        program = new commander_1.Command();
        jest.clearAllMocks();
        // Reset exit code before each test
        process.exitCode = 0;
    });
    describe('Success scenarios - should set exit code 0', () => {
        it('should set exit code 0 when configuration is valid', async () => {
            // Mock successful config resolution and validation
            const mockValidConfig = {
                prompts: ['test prompt'],
                providers: ['test-provider'],
                tests: [{ vars: { test: 'value' } }],
            };
            const mockValidTestSuite = {
                prompts: [{ raw: 'test prompt', label: 'test' }],
                providers: [{ id: () => 'test-provider' }],
                tests: [{ vars: { test: 'value' } }],
            };
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config: mockValidConfig,
                testSuite: mockValidTestSuite,
                basePath: '/test',
            });
            await (0, validate_1.doValidate)({ config: ['test-config.yaml'] }, defaultConfig, defaultConfigPath);
            expect(logger_1.default.info).toHaveBeenCalledWith(expect.stringContaining('Configuration is valid'));
            expect(process.exitCode).toBe(0);
        });
        it('should set exit code 0 when validating with default config path', async () => {
            const mockValidConfig = {
                prompts: ['test prompt'],
                providers: ['test-provider'],
            };
            const mockValidTestSuite = {
                prompts: [{ raw: 'test prompt', label: 'test' }],
                providers: [{ id: () => 'test-provider' }],
            };
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config: mockValidConfig,
                testSuite: mockValidTestSuite,
                basePath: '/test',
            });
            await (0, validate_1.doValidate)({}, defaultConfig, defaultConfigPath);
            expect(logger_1.default.info).toHaveBeenCalledWith(expect.stringContaining('Configuration is valid'));
            expect(process.exitCode).toBe(0);
        });
    });
    describe('Failure scenarios - should set exit code 1', () => {
        it('should set exit code 1 when configuration validation fails', async () => {
            // Mock invalid config that fails schema validation
            const mockInvalidConfig = {
                // Missing required fields to trigger validation error
                invalidField: 'invalid value',
            };
            const mockValidTestSuite = {
                prompts: [{ raw: 'test prompt', label: 'test' }],
                providers: [{ id: () => 'test-provider' }],
            };
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config: mockInvalidConfig,
                testSuite: mockValidTestSuite,
                basePath: '/test',
            });
            await (0, validate_1.doValidate)({ config: ['invalid-config.yaml'] }, defaultConfig, defaultConfigPath);
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining('Configuration validation error'));
            expect(process.exitCode).toBe(1);
        });
        it('should set exit code 1 when test suite validation fails', async () => {
            // Mock valid config but invalid test suite
            const mockValidConfig = {
                prompts: ['test prompt'],
                providers: ['test-provider'],
            };
            const mockInvalidTestSuite = {
                // Invalid test suite structure to trigger validation error
                prompts: 'invalid prompts format', // Should be an array
                providers: [{ id: () => 'test-provider' }],
            };
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config: mockValidConfig,
                testSuite: mockInvalidTestSuite,
                basePath: '/test',
            });
            await (0, validate_1.doValidate)({ config: ['test-config.yaml'] }, defaultConfig, defaultConfigPath);
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining('Test suite validation error'));
            expect(process.exitCode).toBe(1);
        });
        it('should set exit code 1 when config resolution throws an error', async () => {
            // Mock resolveConfigs to throw an error
            jest.mocked(load_1.resolveConfigs).mockRejectedValue(new Error('Failed to load configuration'));
            await (0, validate_1.doValidate)({ config: ['non-existent-config.yaml'] }, defaultConfig, defaultConfigPath);
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining('Failed to validate configuration: Failed to load configuration'));
            expect(process.exitCode).toBe(1);
        });
    });
    describe('Command registration', () => {
        it('should register validate command correctly', () => {
            (0, validate_1.validateCommand)(program, defaultConfig, defaultConfigPath);
            const validateCmd = program.commands.find((cmd) => cmd.name() === 'validate');
            expect(validateCmd).toBeDefined();
            expect(validateCmd?.name()).toBe('validate');
            expect(validateCmd?.description()).toBe('Validate configuration files and test providers');
            // Check that the config subcommand is registered
            const configSubCmd = validateCmd?.commands.find((cmd) => cmd.name() === 'config');
            expect(configSubCmd).toBeDefined();
            // Check that the config option is registered on the config subcommand
            const configOption = configSubCmd?.options.find((opt) => opt.long === '--config');
            expect(configOption).toBeDefined();
        });
    });
});
//# sourceMappingURL=validate-exit-codes.test.js.map