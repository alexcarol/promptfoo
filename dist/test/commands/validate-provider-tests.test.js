"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const validate_1 = require("../../src/commands/validate");
const logger_1 = __importDefault(require("../../src/logger"));
const index_1 = require("../../src/providers/index");
const cloud_1 = require("../../src/util/cloud");
const load_1 = require("../../src/util/config/load");
const testProvider_1 = require("../../src/validators/testProvider");
jest.mock('../../src/logger');
jest.mock('../../src/util/config/load');
jest.mock('../../src/providers/index');
jest.mock('../../src/validators/testProvider');
jest.mock('../../src/util/cloud');
jest.mock('../../src/telemetry', () => ({
    record: jest.fn(),
    send: jest.fn(),
}));
jest.mock('uuid', () => ({
    validate: jest.fn((str) => {
        // Check if the string looks like a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    }),
}));
describe('Validate Command Provider Tests', () => {
    let program;
    const defaultConfig = {};
    const defaultConfigPath = 'config.yaml';
    // Mock provider objects
    const mockHttpProvider = {
        id: () => 'http://example.com',
        callApi: jest.fn(),
        constructor: { name: 'HttpProvider' },
    };
    const mockEchoProvider = {
        id: () => 'echo',
        callApi: jest.fn(),
        constructor: { name: 'EchoProvider' },
    };
    const mockOpenAIProvider = {
        id: 'openai:gpt-4',
        callApi: jest.fn(),
        constructor: { name: 'OpenAIProvider' },
    };
    beforeEach(() => {
        program = new commander_1.Command();
        jest.clearAllMocks();
        process.exitCode = 0;
        // Default mock for successful basic connectivity
        mockEchoProvider.callApi.mockResolvedValue({
            output: 'Hello, world!',
        });
        mockHttpProvider.callApi.mockResolvedValue({
            output: 'Test response',
        });
        mockOpenAIProvider.callApi.mockResolvedValue({
            output: 'OpenAI response',
        });
    });
    describe('Provider testing with -t flag (specific target)', () => {
        it('should test HTTP provider with comprehensive tests when -t flag is provided and connectivity passes', async () => {
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockHttpProvider);
            jest.mocked(testProvider_1.testProviderConnectivity).mockResolvedValue({
                success: true,
                message: 'Connectivity test passed',
                providerResponse: { output: 'test' },
                transformedRequest: {},
            });
            jest.mocked(testProvider_1.testProviderSession).mockResolvedValue({
                success: true,
                message: 'Session test passed',
            });
            await (0, validate_1.doValidateTarget)({ target: 'http://example.com' }, defaultConfig);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('http://example.com', {
                options: {
                    config: {
                        maxRetries: 1,
                        headers: {
                            'x-promptfoo-silent': 'true',
                        },
                    },
                },
            });
            expect(testProvider_1.testProviderConnectivity).toHaveBeenCalledWith(mockHttpProvider);
            expect(testProvider_1.testProviderSession).toHaveBeenCalledWith(mockHttpProvider, undefined, {
                skipConfigValidation: true,
            });
            expect(logger_1.default.info).toHaveBeenCalledWith('Testing provider...');
            expect(process.exitCode).toBe(0);
        });
        it('should skip session test when connectivity test fails', async () => {
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockHttpProvider);
            jest.mocked(testProvider_1.testProviderConnectivity).mockResolvedValue({
                success: false,
                message: 'Connection failed',
                error: 'Network error',
                providerResponse: {},
                transformedRequest: {},
            });
            await (0, validate_1.doValidateTarget)({ target: 'http://example.com' }, defaultConfig);
            expect(testProvider_1.testProviderConnectivity).toHaveBeenCalledWith(mockHttpProvider);
            expect(testProvider_1.testProviderSession).not.toHaveBeenCalled();
            expect(logger_1.default.info).toHaveBeenCalledWith(expect.stringContaining('Skipping session management test'));
        });
        it('should skip session test when target is not stateful (stateful=false)', async () => {
            const mockNonStatefulHttpProvider = {
                id: () => 'http://example.com',
                callApi: jest.fn(),
                config: { stateful: false },
                constructor: { name: 'HttpProvider' },
            };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockNonStatefulHttpProvider);
            jest.mocked(testProvider_1.testProviderConnectivity).mockResolvedValue({
                success: true,
                message: 'Connectivity test passed',
                providerResponse: { output: 'test' },
                transformedRequest: {},
            });
            await (0, validate_1.doValidateTarget)({ target: 'http://example.com' }, defaultConfig);
            expect(testProvider_1.testProviderConnectivity).toHaveBeenCalledWith(mockNonStatefulHttpProvider);
            expect(testProvider_1.testProviderSession).not.toHaveBeenCalled();
            expect(logger_1.default.info).toHaveBeenCalledWith(expect.stringContaining('Skipping session management test (target is not stateful)'));
        });
        it('should test non-HTTP provider with basic connectivity only when -t flag is provided', async () => {
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockEchoProvider);
            await (0, validate_1.doValidateTarget)({ target: 'echo' }, defaultConfig);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('echo');
            expect(mockEchoProvider.callApi).toHaveBeenCalledWith('Hello, world!', expect.any(Object));
            expect(testProvider_1.testProviderConnectivity).not.toHaveBeenCalled();
            expect(testProvider_1.testProviderSession).not.toHaveBeenCalled();
            expect(logger_1.default.info).toHaveBeenCalledWith(expect.stringContaining('Connectivity test passed'));
        });
        it('should load cloud provider when -t flag is UUID', async () => {
            const cloudUUID = '12345678-1234-1234-1234-123456789abc';
            const mockProviderOptions = {
                id: 'openai:gpt-4',
                config: {},
            };
            jest.mocked(cloud_1.getProviderFromCloud).mockResolvedValue(mockProviderOptions);
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockOpenAIProvider);
            await (0, validate_1.doValidateTarget)({ target: cloudUUID }, defaultConfig);
            expect(cloud_1.getProviderFromCloud).toHaveBeenCalledWith(cloudUUID);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('openai:gpt-4', {
                options: mockProviderOptions,
            });
            expect(logger_1.default.info).toHaveBeenCalledWith('Testing provider...');
            expect(mockOpenAIProvider.callApi).toHaveBeenCalled();
        });
    });
    describe('Config validation without -t flag (no provider testing)', () => {
        it('should only validate config when no target is provided', async () => {
            const mockValidConfig = {
                prompts: ['test prompt'],
                providers: ['echo', 'openai:gpt-4'],
            };
            const mockValidTestSuite = {
                prompts: [{ raw: 'test prompt', label: 'test' }],
                providers: [
                    { id: () => 'echo', label: 'echo' },
                    { id: () => 'openai:gpt-4', label: 'openai' },
                ],
                tests: [],
            };
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config: mockValidConfig,
                testSuite: mockValidTestSuite,
                basePath: '/test',
            });
            await (0, validate_1.doValidate)({ config: ['test-config.yaml'] }, defaultConfig, defaultConfigPath);
            // Should NOT test providers, only validate config
            expect(index_1.loadApiProviders).not.toHaveBeenCalled();
            expect(mockEchoProvider.callApi).not.toHaveBeenCalled();
            expect(mockOpenAIProvider.callApi).not.toHaveBeenCalled();
            // Should only report config validation success
            expect(logger_1.default.info).toHaveBeenCalledWith(expect.stringContaining('Configuration is valid'));
            expect(process.exitCode).toBe(0);
        });
        it('should validate config with empty providers list', async () => {
            const mockValidConfig = {
                prompts: ['test prompt'],
                providers: [],
            };
            const mockValidTestSuite = {
                prompts: [{ raw: 'test prompt', label: 'test' }],
                providers: [],
                tests: [],
            };
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config: mockValidConfig,
                testSuite: mockValidTestSuite,
                basePath: '/test',
            });
            await (0, validate_1.doValidate)({ config: ['test-config.yaml'] }, defaultConfig, defaultConfigPath);
            expect(index_1.loadApiProviders).not.toHaveBeenCalled();
            expect(logger_1.default.info).toHaveBeenCalledWith(expect.stringContaining('Configuration is valid'));
        });
    });
    describe('Error handling in provider tests', () => {
        it('should warn but not fail validation when provider test fails', async () => {
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockEchoProvider);
            mockEchoProvider.callApi.mockRejectedValue(new Error('Connection failed'));
            await (0, validate_1.doValidateTarget)({ target: 'echo' }, defaultConfig);
            expect(logger_1.default.warn).toHaveBeenCalledWith(expect.stringContaining('Connectivity test failed'));
            expect(process.exitCode).toBe(0); // Should not fail validation
        });
        it('should warn but not fail validation when provider returns error', async () => {
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockEchoProvider);
            mockEchoProvider.callApi.mockResolvedValue({
                error: 'Provider error',
            });
            await (0, validate_1.doValidateTarget)({ target: 'echo' }, defaultConfig);
            expect(logger_1.default.warn).toHaveBeenCalledWith(expect.stringContaining('Connectivity test failed'));
            expect(logger_1.default.warn).toHaveBeenCalledWith(expect.stringContaining('Provider error'));
            expect(process.exitCode).toBe(0);
        });
        it('should warn but not fail validation when provider returns no output', async () => {
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockEchoProvider);
            mockEchoProvider.callApi.mockResolvedValue({});
            await (0, validate_1.doValidateTarget)({ target: 'echo' }, defaultConfig);
            expect(logger_1.default.warn).toHaveBeenCalledWith(expect.stringContaining('Connectivity test returned no output'));
            expect(process.exitCode).toBe(0);
        });
        it('should warn when loadApiProvider fails with -t flag', async () => {
            jest.mocked(index_1.loadApiProvider).mockRejectedValue(new Error('Failed to load provider'));
            await (0, validate_1.doValidateTarget)({ target: 'invalid-provider' }, defaultConfig);
            expect(logger_1.default.warn).toHaveBeenCalledWith(expect.stringContaining('Provider tests failed: Failed to load provider'));
            expect(process.exitCode).toBe(0);
        });
    });
    describe('HTTP provider detection with target flag', () => {
        it('should detect HTTP provider by url in id when using target', async () => {
            const mockHttpProviderById = {
                id: () => 'http://custom-api.com',
                callApi: jest.fn().mockResolvedValue({ output: 'HTTP response' }),
                constructor: { name: 'HttpProvider' },
            };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockHttpProviderById);
            jest.mocked(testProvider_1.testProviderConnectivity).mockResolvedValue({
                success: true,
                message: 'Test passed',
                providerResponse: { output: 'test' },
                transformedRequest: {},
            });
            jest.mocked(testProvider_1.testProviderSession).mockResolvedValue({
                success: true,
                message: 'Test passed',
            });
            await (0, validate_1.doValidateTarget)({ target: 'http://custom-api.com' }, defaultConfig);
            // Should call HTTP-specific tests for providers with http:// id
            expect(testProvider_1.testProviderConnectivity).toHaveBeenCalled();
            expect(testProvider_1.testProviderSession).toHaveBeenCalled();
        });
    });
    describe('Testing without config file', () => {
        it('should test provider with -t flag when no config file is present', async () => {
            // No config paths provided
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockEchoProvider);
            await (0, validate_1.doValidateTarget)({ target: 'echo' }, defaultConfig);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('echo');
            expect(mockEchoProvider.callApi).toHaveBeenCalled();
            expect(logger_1.default.info).toHaveBeenCalledWith('Testing provider...');
            expect(process.exitCode).toBe(0);
        });
        it('should test cloud provider with UUID when no config file is present', async () => {
            const cloudUUID = '12345678-1234-1234-1234-123456789abc';
            const mockProviderOptions = {
                id: 'openai:gpt-4',
                config: {},
            };
            jest.mocked(cloud_1.getProviderFromCloud).mockResolvedValue(mockProviderOptions);
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockOpenAIProvider);
            await (0, validate_1.doValidateTarget)({ target: cloudUUID }, defaultConfig);
            expect(cloud_1.getProviderFromCloud).toHaveBeenCalledWith(cloudUUID);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('openai:gpt-4', {
                options: mockProviderOptions,
            });
            expect(logger_1.default.info).toHaveBeenCalledWith('Testing provider...');
            expect(mockOpenAIProvider.callApi).toHaveBeenCalled();
            expect(process.exitCode).toBe(0);
        });
        it('should handle errors gracefully when testing without config', async () => {
            jest.mocked(index_1.loadApiProvider).mockRejectedValue(new Error('Provider not found'));
            await (0, validate_1.doValidateTarget)({ target: 'invalid-provider' }, defaultConfig);
            // The error is caught by runProviderTests which logs a warning
            expect(logger_1.default.warn).toHaveBeenCalledWith(expect.stringContaining('Provider tests failed: Provider not found'));
            // Warnings don't cause validation to fail
            expect(process.exitCode).toBe(0);
        });
    });
    describe('Command registration', () => {
        it('should register target subcommand with -t/--target option', () => {
            (0, validate_1.validateCommand)(program, defaultConfig, defaultConfigPath);
            const validateCmd = program.commands.find((cmd) => cmd.name() === 'validate');
            const targetSubCmd = validateCmd?.commands.find((cmd) => cmd.name() === 'target');
            expect(targetSubCmd).toBeDefined();
            const targetOption = targetSubCmd?.options.find((opt) => opt.long === '--target');
            expect(targetOption).toBeDefined();
            expect(targetOption?.short).toBe('-t');
            expect(targetOption?.description).toContain('Provider ID');
            const configOption = targetSubCmd?.options.find((opt) => opt.long === '--config');
            expect(configOption).toBeDefined();
            expect(configOption?.short).toBe('-c');
            expect(configOption?.description).toContain('Path to configuration file');
        });
    });
});
//# sourceMappingURL=validate-provider-tests.test.js.map