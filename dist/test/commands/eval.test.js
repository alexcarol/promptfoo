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
const path = __importStar(require("path"));
const commander_1 = require("commander");
const cache_1 = require("../../src/cache");
const eval_1 = require("../../src/commands/eval");
const evaluator_1 = require("../../src/evaluator");
const accounts_1 = require("../../src/globalConfig/accounts");
const cloud_1 = require("../../src/globalConfig/cloud");
const logger_1 = __importDefault(require("../../src/logger"));
const migrate_1 = require("../../src/migrate");
const eval_2 = __importDefault(require("../../src/models/eval"));
const index_1 = require("../../src/providers/index");
const share_1 = require("../../src/share");
const cloud_2 = require("../../src/util/cloud");
const load_1 = require("../../src/util/config/load");
const tokenUsage_1 = require("../../src/util/tokenUsage");
jest.mock('../../src/cache');
jest.mock('../../src/evaluator');
jest.mock('../../src/globalConfig/accounts');
jest.mock('../../src/globalConfig/cloud', () => ({
    cloudConfig: {
        isEnabled: jest.fn().mockReturnValue(false),
        getApiHost: jest.fn().mockReturnValue('https://api.promptfoo.app'),
    },
}));
jest.mock('../../src/migrate');
jest.mock('../../src/providers');
jest.mock('../../src/redteam/shared', () => ({}));
jest.mock('../../src/share');
jest.mock('../../src/table');
jest.mock('../../src/util/cloud', () => ({
    ...jest.requireActual('../../src/util/cloud'),
    getDefaultTeam: jest.fn().mockResolvedValue({ id: 'test-team-id', name: 'Test Team' }),
    checkCloudPermissions: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('fs');
jest.mock('path', () => {
    const actualPath = jest.requireActual('path');
    return {
        ...actualPath,
    };
});
jest.mock('../../src/util/config/load');
jest.mock('../../src/util/tokenUsage');
jest.mock('../../src/database/index', () => ({
    getDb: jest.fn(() => ({
        transaction: jest.fn((fn) => fn()),
        insert: jest.fn(() => ({
            values: jest.fn(() => ({
                onConflictDoNothing: jest.fn(() => ({
                    run: jest.fn(),
                })),
                run: jest.fn(),
            })),
        })),
        update: jest.fn(() => ({
            set: jest.fn(() => ({
                where: jest.fn(() => ({
                    run: jest.fn(),
                })),
            })),
        })),
    })),
}));
describe('evalCommand', () => {
    let program;
    const defaultConfig = {};
    const defaultConfigPath = 'config.yaml';
    beforeEach(() => {
        program = new commander_1.Command();
        jest.clearAllMocks();
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config: defaultConfig,
            testSuite: {
                prompts: [],
                providers: [],
            },
            basePath: path.resolve('/'),
        });
        jest.mocked(accounts_1.promptForEmailUnverified).mockResolvedValue({ emailNeedsValidation: false });
        jest.mocked(accounts_1.checkEmailStatusAndMaybeExit).mockResolvedValue('ok');
    });
    it('should create eval command with correct options', () => {
        const cmd = (0, eval_1.evalCommand)(program, defaultConfig, defaultConfigPath);
        expect(cmd.name()).toBe('eval');
        expect(cmd.description()).toBe('Evaluate prompts');
    });
    it('should have help option available', () => {
        const cmd = (0, eval_1.evalCommand)(program, defaultConfig, defaultConfigPath);
        // The help option is automatically added by commander
        const helpText = cmd.helpInformation();
        expect(helpText).toContain('-h, --help');
        expect(helpText).toContain('display help for command');
    });
    it('should handle --no-cache option', async () => {
        const cmdObj = { cache: false };
        await (0, eval_1.doEval)(cmdObj, defaultConfig, defaultConfigPath, {});
        expect(cache_1.disableCache).toHaveBeenCalledTimes(1);
    });
    it('should handle --write option', async () => {
        const cmdObj = { write: true };
        const mockEvalRecord = new eval_2.default(defaultConfig);
        jest.mocked(evaluator_1.evaluate).mockResolvedValue(mockEvalRecord);
        await (0, eval_1.doEval)(cmdObj, defaultConfig, defaultConfigPath, {});
        expect(migrate_1.runDbMigrations).toHaveBeenCalledTimes(1);
    });
    it('should handle redteam config', async () => {
        const cmdObj = {};
        const config = {
            redteam: { plugins: ['test-plugin'] },
            prompts: [],
        };
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config,
            testSuite: {
                prompts: [],
                providers: [],
                tests: [{ vars: { test: 'value' } }],
            },
            basePath: path.resolve('/'),
        });
        const mockEvalRecord = new eval_2.default(config);
        jest.mocked(evaluator_1.evaluate).mockResolvedValue(mockEvalRecord);
        await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
        expect(accounts_1.promptForEmailUnverified).toHaveBeenCalledTimes(1);
        expect(accounts_1.checkEmailStatusAndMaybeExit).toHaveBeenCalledTimes(1);
    });
    it('should handle share option when enabled', async () => {
        const cmdObj = { share: true };
        const config = { sharing: true };
        const evalRecord = new eval_2.default(config);
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config,
            testSuite: {
                prompts: [],
                providers: [],
            },
            basePath: path.resolve('/'),
        });
        jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
        jest.mocked(share_1.isSharingEnabled).mockReturnValue(true);
        jest.mocked(share_1.createShareableUrl).mockResolvedValue('http://share.url');
        await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
        expect(share_1.createShareableUrl).toHaveBeenCalledWith(expect.any(eval_2.default));
    });
    it('should not share when share is explicitly set to false even if config has sharing enabled', async () => {
        const cmdObj = { share: false };
        const config = { sharing: true };
        const evalRecord = new eval_2.default(config);
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config,
            testSuite: {
                prompts: [],
                providers: [],
            },
            basePath: path.resolve('/'),
        });
        jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
        jest.mocked(share_1.isSharingEnabled).mockReturnValue(true);
        await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
        expect(share_1.createShareableUrl).not.toHaveBeenCalled();
    });
    it('should share when share is true even if config has no sharing enabled', async () => {
        const cmdObj = { share: true };
        const config = {};
        const evalRecord = new eval_2.default(config);
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config,
            testSuite: {
                prompts: [],
                providers: [],
            },
            basePath: path.resolve('/'),
        });
        jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
        jest.mocked(share_1.isSharingEnabled).mockReturnValue(true);
        jest.mocked(share_1.createShareableUrl).mockResolvedValue('http://share.url');
        await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
        expect(share_1.createShareableUrl).toHaveBeenCalledWith(expect.any(eval_2.default));
    });
    it('should share when share is undefined and config has sharing enabled', async () => {
        const cmdObj = {};
        const config = { sharing: true };
        const evalRecord = new eval_2.default(config);
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config,
            testSuite: {
                prompts: [],
                providers: [],
            },
            basePath: path.resolve('/'),
        });
        jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
        jest.mocked(share_1.isSharingEnabled).mockReturnValue(true);
        jest.mocked(share_1.createShareableUrl).mockResolvedValue('http://share.url');
        await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
        expect(share_1.createShareableUrl).toHaveBeenCalledWith(expect.any(eval_2.default));
    });
    it('should auto-share when connected to cloud even if sharing is not explicitly enabled', async () => {
        const cmdObj = {};
        const config = {}; // No sharing config
        const evalRecord = new eval_2.default(config);
        // Mock cloud config as enabled
        jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(true);
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config,
            testSuite: {
                prompts: [],
                providers: [],
            },
            basePath: path.resolve('/'),
        });
        jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
        jest.mocked(share_1.isSharingEnabled).mockReturnValue(true);
        jest.mocked(share_1.createShareableUrl).mockResolvedValue('http://share.url');
        await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
        expect(share_1.createShareableUrl).toHaveBeenCalledWith(expect.any(eval_2.default));
    });
    it('should not auto-share when connected to cloud if share is explicitly set to false', async () => {
        const cmdObj = { share: false };
        const config = {};
        const evalRecord = new eval_2.default(config);
        // Mock cloud config as enabled
        jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValueOnce(true);
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config,
            testSuite: {
                prompts: [],
                providers: [],
            },
            basePath: path.resolve('/'),
        });
        jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
        jest.mocked(share_1.isSharingEnabled).mockReturnValueOnce(true);
        await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
        expect(share_1.createShareableUrl).not.toHaveBeenCalled();
    });
    it('should handle grader option', async () => {
        const cmdObj = { grader: 'test-grader' };
        const mockProvider = {
            id: () => 'test-grader',
            callApi: async () => ({ output: 'test' }),
        };
        jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockProvider);
        await (0, eval_1.doEval)(cmdObj, defaultConfig, defaultConfigPath, {});
        expect(index_1.loadApiProvider).toHaveBeenCalledWith('test-grader');
    });
    it('should handle repeat option', async () => {
        const cmdObj = { repeat: 3 };
        await (0, eval_1.doEval)(cmdObj, defaultConfig, defaultConfigPath, {});
        expect(evaluator_1.evaluate).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({ repeat: 3 }));
    });
    it('should handle delay option', async () => {
        const cmdObj = { delay: 1000 };
        await (0, eval_1.doEval)(cmdObj, defaultConfig, defaultConfigPath, {});
        expect(evaluator_1.evaluate).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({ delay: 1000 }));
    });
    it('should handle maxConcurrency option', async () => {
        const cmdObj = { maxConcurrency: 5 };
        await (0, eval_1.doEval)(cmdObj, defaultConfig, defaultConfigPath, {});
        expect(evaluator_1.evaluate).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({ maxConcurrency: 5 }));
    });
    it('should fallback to evaluateOptions.maxConcurrency when cmdObj.maxConcurrency is undefined', async () => {
        const cmdObj = {};
        const evaluateOptions = { maxConcurrency: 3 };
        await (0, eval_1.doEval)(cmdObj, defaultConfig, defaultConfigPath, evaluateOptions);
        expect(evaluator_1.evaluate).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({ maxConcurrency: 3 }));
    });
    it('should fallback to DEFAULT_MAX_CONCURRENCY when both cmdObj and evaluateOptions maxConcurrency are undefined', async () => {
        const cmdObj = {};
        const evaluateOptions = {};
        await (0, eval_1.doEval)(cmdObj, defaultConfig, defaultConfigPath, evaluateOptions);
        expect(evaluator_1.evaluate).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({ maxConcurrency: 4 }));
    });
});
describe('checkCloudPermissions', () => {
    const defaultConfigPath = 'config.yaml';
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(accounts_1.promptForEmailUnverified).mockResolvedValue({ emailNeedsValidation: false });
        jest.mocked(accounts_1.checkEmailStatusAndMaybeExit).mockResolvedValue('ok');
    });
    it('should fail when checkCloudPermissions throws an error', async () => {
        // Mock cloudConfig to be enabled
        jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(true);
        // Mock checkCloudPermissions to throw an error
        const permissionError = new cloud_2.ConfigPermissionError('Permission denied: insufficient access');
        jest.mocked(cloud_2.checkCloudPermissions).mockRejectedValueOnce(permissionError);
        // Setup the test configuration
        const config = {
            providers: ['openai:gpt-4'],
        };
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config,
            testSuite: {
                prompts: [],
                providers: [{ id: () => 'openai:gpt-4', callApi: async () => ({}) }],
                tests: [],
            },
            basePath: path.resolve('/'),
        });
        const cmdObj = {};
        await expect((0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {})).rejects.toThrow('Permission denied: insufficient access');
        // Verify checkCloudPermissions was called with the correct arguments
        expect(cloud_2.checkCloudPermissions).toHaveBeenCalledWith(config);
        // Verify that evaluate was not called
        expect(evaluator_1.evaluate).not.toHaveBeenCalled();
    });
    it('should call checkCloudPermissions and proceed when it succeeds', async () => {
        // Mock cloudConfig to be enabled
        jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(true);
        // Mock checkCloudPermissions to succeed (resolve without throwing)
        jest.mocked(cloud_2.checkCloudPermissions).mockResolvedValueOnce(undefined);
        // Setup the test configuration
        const config = {
            providers: ['openai:gpt-4'],
        };
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config,
            testSuite: {
                prompts: [],
                providers: [{ id: () => 'openai:gpt-4', callApi: async () => ({}) }],
                tests: [],
            },
            basePath: path.resolve('/'),
        });
        const mockEvalRecord = new eval_2.default(config);
        jest.mocked(evaluator_1.evaluate).mockResolvedValue(mockEvalRecord);
        const cmdObj = {};
        const result = await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
        // Verify checkCloudPermissions was called
        expect(cloud_2.checkCloudPermissions).toHaveBeenCalledWith(config);
        // Verify that the function proceeded normally
        expect(result).not.toBeNull();
        // Verify that evaluate was called
        expect(evaluator_1.evaluate).toHaveBeenCalled();
    });
    it('should call checkCloudPermissions but skip permission check when cloudConfig is disabled', async () => {
        // Mock cloudConfig to be disabled
        jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(false);
        // Mock checkCloudPermissions to succeed (it should return early due to disabled cloud)
        jest.mocked(cloud_2.checkCloudPermissions).mockResolvedValueOnce(undefined);
        // Setup the test configuration
        const config = {
            providers: ['openai:gpt-4'],
        };
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config,
            testSuite: {
                prompts: [],
                providers: [{ id: () => 'openai:gpt-4', callApi: async () => ({}) }],
                tests: [],
            },
            basePath: path.resolve('/'),
        });
        const mockEvalRecord = new eval_2.default(config);
        jest.mocked(evaluator_1.evaluate).mockResolvedValue(mockEvalRecord);
        const cmdObj = {};
        await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
        // Verify checkCloudPermissions was called (but returns early due to disabled cloud)
        expect(cloud_2.checkCloudPermissions).toHaveBeenCalledWith(config);
        // Verify that evaluate was called
        expect(evaluator_1.evaluate).toHaveBeenCalled();
    });
});
describe('formatTokenUsage', () => {
    it('should format complete token usage data', () => {
        const usage = {
            total: 1000,
            prompt: 400,
            completion: 600,
            cached: 200,
            completionDetails: {
                reasoning: 300,
                acceptedPrediction: 0,
                rejectedPrediction: 0,
            },
        };
        const result = (0, eval_1.formatTokenUsage)(usage);
        expect(result).toBe('1,000 total / 400 prompt / 600 completion / 200 cached / 300 reasoning');
    });
    it('should handle partial token usage data', () => {
        const usage = {
            total: 1000,
        };
        const result = (0, eval_1.formatTokenUsage)(usage);
        expect(result).toBe('1,000 total');
    });
    it('should handle empty token usage', () => {
        const usage = {};
        const result = (0, eval_1.formatTokenUsage)(usage);
        expect(result).toBe('');
    });
});
describe('showRedteamProviderLabelMissingWarning', () => {
    const mockWarn = jest.spyOn(logger_1.default, 'warn');
    beforeEach(() => {
        mockWarn.mockClear();
    });
    it('should show warning when provider has no label', () => {
        const testSuite = {
            prompts: [],
            providers: [
                {
                    label: '',
                    id: () => 'test-id',
                    callApi: async () => ({ output: 'test' }),
                },
            ],
        };
        (0, eval_1.showRedteamProviderLabelMissingWarning)(testSuite);
        expect(mockWarn).toHaveBeenCalledTimes(1);
    });
    it('should not show warning when all providers have labels', () => {
        const testSuite = {
            prompts: [],
            providers: [
                {
                    label: 'test-label',
                    id: () => 'test-id',
                    callApi: async () => ({ output: 'test' }),
                },
            ],
        };
        (0, eval_1.showRedteamProviderLabelMissingWarning)(testSuite);
        expect(mockWarn).not.toHaveBeenCalled();
    });
    it('should handle empty providers array', () => {
        const testSuite = {
            prompts: [],
            providers: [],
        };
        (0, eval_1.showRedteamProviderLabelMissingWarning)(testSuite);
        expect(mockWarn).not.toHaveBeenCalled();
    });
});
describe('Provider Token Tracking', () => {
    let mockTokenUsageTracker;
    const mockLogger = jest.spyOn(logger_1.default, 'info');
    beforeEach(() => {
        jest.clearAllMocks();
        mockLogger.mockClear();
        mockTokenUsageTracker = {
            getProviderIds: jest.fn(),
            getProviderUsage: jest.fn(),
            trackUsage: jest.fn(),
            resetAllUsage: jest.fn(),
            resetProviderUsage: jest.fn(),
            getTotalUsage: jest.fn(),
            cleanup: jest.fn(),
        };
        jest.mocked(tokenUsage_1.TokenUsageTracker.getInstance).mockReturnValue(mockTokenUsageTracker);
    });
    it('should create and configure TokenUsageTracker correctly', () => {
        const tracker = tokenUsage_1.TokenUsageTracker.getInstance();
        expect(tracker).toBeDefined();
        expect(tracker.getProviderIds).toBeDefined();
        expect(tracker.getProviderUsage).toBeDefined();
    });
    it('should handle provider token tracking when mocked properly', () => {
        const providerUsageData = {
            'openai:gpt-4': {
                total: 1500,
                prompt: 600,
                completion: 900,
                cached: 100,
                numRequests: 5,
                completionDetails: { reasoning: 200, acceptedPrediction: 0, rejectedPrediction: 0 },
            },
            'anthropic:claude-3': {
                total: 800,
                prompt: 300,
                completion: 500,
                cached: 50,
                numRequests: 3,
                completionDetails: { reasoning: 100, acceptedPrediction: 0, rejectedPrediction: 0 },
            },
        };
        mockTokenUsageTracker.getProviderIds.mockReturnValue(['openai:gpt-4', 'anthropic:claude-3']);
        mockTokenUsageTracker.getProviderUsage.mockImplementation((id) => providerUsageData[id]);
        const tracker = tokenUsage_1.TokenUsageTracker.getInstance();
        const providerIds = tracker.getProviderIds();
        expect(providerIds).toEqual(['openai:gpt-4', 'anthropic:claude-3']);
        const openaiUsage = tracker.getProviderUsage('openai:gpt-4');
        expect(openaiUsage).toEqual(providerUsageData['openai:gpt-4']);
        const claudeUsage = tracker.getProviderUsage('anthropic:claude-3');
        expect(claudeUsage).toEqual(providerUsageData['anthropic:claude-3']);
    });
});
describe('doEval with external defaultTest', () => {
    const defaultConfig = {};
    const defaultConfigPath = 'config.yaml';
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config: defaultConfig,
            testSuite: {
                prompts: [],
                providers: [],
                defaultTest: undefined,
            },
            basePath: path.resolve('/'),
        });
        jest.mocked(accounts_1.promptForEmailUnverified).mockResolvedValue({ emailNeedsValidation: false });
        jest.mocked(accounts_1.checkEmailStatusAndMaybeExit).mockResolvedValue('ok');
    });
    it('should handle grader option with string defaultTest', async () => {
        const cmdObj = { grader: 'test-grader' };
        const mockProvider = {
            id: () => 'test-grader',
            callApi: async () => ({ output: 'test' }),
        };
        jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockProvider);
        const testSuite = {
            prompts: [],
            providers: [],
            defaultTest: 'file://defaultTest.yaml',
        };
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config: defaultConfig,
            testSuite,
            basePath: path.resolve('/'),
        });
        await (0, eval_1.doEval)(cmdObj, defaultConfig, defaultConfigPath, {});
        expect(evaluator_1.evaluate).toHaveBeenCalledWith(expect.objectContaining({
            defaultTest: expect.objectContaining({
                options: expect.objectContaining({
                    provider: mockProvider,
                }),
            }),
        }), expect.anything(), expect.anything());
    });
    it('should handle var option with string defaultTest', async () => {
        const cmdObj = { var: { key: 'value' } };
        const testSuite = {
            prompts: [],
            providers: [],
            defaultTest: 'file://defaultTest.yaml',
        };
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config: defaultConfig,
            testSuite,
            basePath: path.resolve('/'),
        });
        await (0, eval_1.doEval)(cmdObj, defaultConfig, defaultConfigPath, {});
        expect(evaluator_1.evaluate).toHaveBeenCalledWith(expect.objectContaining({
            defaultTest: expect.objectContaining({
                vars: expect.objectContaining({
                    key: 'value',
                }),
            }),
        }), expect.anything(), expect.anything());
    });
    it('should handle both grader and var options with object defaultTest', async () => {
        const cmdObj = {
            grader: 'test-grader',
            var: { key: 'value' },
        };
        const mockProvider = {
            id: () => 'test-grader',
            callApi: async () => ({ output: 'test' }),
        };
        jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockProvider);
        const testSuite = {
            prompts: [],
            providers: [],
            defaultTest: {
                options: {},
                assert: [{ type: 'equals', value: 'test' }],
                vars: { existing: 'var' },
            },
        };
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config: defaultConfig,
            testSuite,
            basePath: path.resolve('/'),
        });
        await (0, eval_1.doEval)(cmdObj, defaultConfig, defaultConfigPath, {});
        expect(evaluator_1.evaluate).toHaveBeenCalledWith(expect.objectContaining({
            defaultTest: expect.objectContaining({
                assert: [{ type: 'equals', value: 'test' }],
                vars: { existing: 'var', key: 'value' },
                options: expect.objectContaining({
                    provider: mockProvider,
                }),
            }),
        }), expect.anything(), expect.anything());
    });
    it('should not modify defaultTest when no grader or var options', async () => {
        const cmdObj = {};
        const originalDefaultTest = {
            options: {},
            assert: [{ type: 'equals', value: 'test' }],
            vars: { foo: 'bar' },
        };
        const testSuite = {
            prompts: [],
            providers: [],
            defaultTest: originalDefaultTest,
        };
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config: defaultConfig,
            testSuite,
            basePath: path.resolve('/'),
        });
        await (0, eval_1.doEval)(cmdObj, defaultConfig, defaultConfigPath, {});
        expect(evaluator_1.evaluate).toHaveBeenCalledWith(expect.objectContaining({
            defaultTest: originalDefaultTest,
        }), expect.anything(), expect.anything());
    });
});
describe('Sharing Precedence - Comprehensive Test Coverage', () => {
    const defaultConfigPath = '/path/to/config.yaml';
    const defaultConfig = {
        prompts: [],
        providers: [],
    };
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(false);
        jest.mocked(share_1.isSharingEnabled).mockReturnValue(true);
        jest.mocked(share_1.createShareableUrl).mockResolvedValue('https://example.com/share/123');
        jest.mocked(load_1.resolveConfigs).mockResolvedValue({
            config: defaultConfig,
            testSuite: {
                prompts: [],
                providers: [],
            },
            basePath: path.resolve('/'),
        });
    });
    describe('Priority 1: Explicit disable (CLI --share=false, --no-share, or env var)', () => {
        it('should not share when cmdObj.share = false, regardless of other settings', async () => {
            const cmdObj = { share: false, table: false, write: false };
            const config = { sharing: true };
            const evalRecord = new eval_2.default(config);
            jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(true);
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config,
                testSuite: { prompts: [], providers: [] },
                basePath: path.resolve('/'),
                commandLineOptions: { share: true },
            });
            jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
            await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
            expect(share_1.createShareableUrl).not.toHaveBeenCalled();
        });
        it('should not share when cmdObj.noShare = true, regardless of other settings', async () => {
            const cmdObj = { noShare: true, table: false, write: false };
            const config = { sharing: true };
            const evalRecord = new eval_2.default(config);
            jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(true);
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config,
                testSuite: { prompts: [], providers: [] },
                basePath: path.resolve('/'),
                commandLineOptions: { share: true },
            });
            jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
            await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
            expect(share_1.createShareableUrl).not.toHaveBeenCalled();
        });
    });
    describe('Priority 2: Explicit enable via CLI --share=true', () => {
        it('should share when cmdObj.share = true, overriding config.sharing = false', async () => {
            const cmdObj = { share: true, table: false, write: false };
            const config = { sharing: false };
            const evalRecord = new eval_2.default(config);
            jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(false);
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config,
                testSuite: { prompts: [], providers: [] },
                basePath: path.resolve('/'),
            });
            jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
            await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
            expect(share_1.createShareableUrl).toHaveBeenCalledWith(expect.any(eval_2.default));
        });
        it('should share when cmdObj.share = true, overriding commandLineOptions.share = false', async () => {
            const cmdObj = { share: true, table: false, write: false };
            const config = {};
            const evalRecord = new eval_2.default(config);
            jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(false);
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config,
                testSuite: { prompts: [], providers: [] },
                basePath: path.resolve('/'),
                commandLineOptions: { share: false },
            });
            jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
            await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
            expect(share_1.createShareableUrl).toHaveBeenCalledWith(expect.any(eval_2.default));
        });
    });
    describe('Priority 3: commandLineOptions.share from config file', () => {
        it('should share when commandLineOptions.share = true, overriding config.sharing = false', async () => {
            const cmdObj = { table: false, write: false };
            const config = { sharing: false };
            const evalRecord = new eval_2.default(config);
            jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(false);
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config,
                testSuite: { prompts: [], providers: [] },
                basePath: path.resolve('/'),
                commandLineOptions: { share: true },
            });
            jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
            await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
            expect(share_1.createShareableUrl).toHaveBeenCalledWith(expect.any(eval_2.default));
        });
        it('should not share when commandLineOptions.share = false, overriding cloud enabled', async () => {
            const cmdObj = { table: false, write: false };
            const config = {};
            const evalRecord = new eval_2.default(config);
            jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(true);
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config,
                testSuite: { prompts: [], providers: [] },
                basePath: path.resolve('/'),
                commandLineOptions: { share: false },
            });
            jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
            await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
            expect(share_1.createShareableUrl).not.toHaveBeenCalled();
        });
    });
    describe('Priority 4: config.sharing from config file', () => {
        it('should share when config.sharing = true', async () => {
            const cmdObj = { table: false, write: false };
            const config = { sharing: true };
            const evalRecord = new eval_2.default(config);
            jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(false);
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config,
                testSuite: { prompts: [], providers: [] },
                basePath: path.resolve('/'),
            });
            jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
            await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
            expect(share_1.createShareableUrl).toHaveBeenCalledWith(expect.any(eval_2.default));
        });
        it('should not share when config.sharing = false, overriding cloud enabled', async () => {
            const cmdObj = { table: false, write: false };
            const config = { sharing: false };
            const evalRecord = new eval_2.default(config);
            jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(true);
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config,
                testSuite: { prompts: [], providers: [] },
                basePath: path.resolve('/'),
            });
            jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
            await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
            expect(share_1.createShareableUrl).not.toHaveBeenCalled();
        });
        it('should share when config.sharing is an object (custom API URL)', async () => {
            const cmdObj = { table: false, write: false };
            const config = { sharing: { apiBaseUrl: 'https://custom.api.url' } };
            const evalRecord = new eval_2.default(config);
            jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(false);
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config,
                testSuite: { prompts: [], providers: [] },
                basePath: path.resolve('/'),
            });
            jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
            await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
            expect(share_1.createShareableUrl).toHaveBeenCalledWith(expect.any(eval_2.default));
        });
    });
    describe('Priority 5: Default to cloud auto-share when nothing explicitly set', () => {
        it('should share when cloud is enabled and no other settings are specified', async () => {
            const cmdObj = { table: false, write: false };
            const config = {};
            const evalRecord = new eval_2.default(config);
            jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(true);
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config,
                testSuite: { prompts: [], providers: [] },
                basePath: path.resolve('/'),
            });
            jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
            await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
            expect(share_1.createShareableUrl).toHaveBeenCalledWith(expect.any(eval_2.default));
        });
        it('should not share when cloud is disabled and no other settings are specified', async () => {
            const cmdObj = { table: false, write: false };
            const config = {};
            const evalRecord = new eval_2.default(config);
            jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(false);
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config,
                testSuite: { prompts: [], providers: [] },
                basePath: path.resolve('/'),
            });
            jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
            await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
            expect(share_1.createShareableUrl).not.toHaveBeenCalled();
        });
    });
    describe('Edge cases and complex scenarios', () => {
        it('should handle config.sharing = undefined explicitly (not just missing)', async () => {
            const cmdObj = { table: false, write: false };
            const config = { sharing: undefined };
            const evalRecord = new eval_2.default(config);
            jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(true);
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config,
                testSuite: { prompts: [], providers: [] },
                basePath: path.resolve('/'),
            });
            jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
            await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
            expect(share_1.createShareableUrl).toHaveBeenCalledWith(expect.any(eval_2.default));
        });
        it('should respect commandLineOptions.share = true even when config.sharing = false and cloud disabled', async () => {
            const cmdObj = { table: false, write: false };
            const config = { sharing: false };
            const evalRecord = new eval_2.default(config);
            jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(false);
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config,
                testSuite: { prompts: [], providers: [] },
                basePath: path.resolve('/'),
                commandLineOptions: { share: true },
            });
            jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
            await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
            expect(share_1.createShareableUrl).toHaveBeenCalledWith(expect.any(eval_2.default));
        });
        it('should not call createShareableUrl when isSharingEnabled returns false', async () => {
            const cmdObj = { share: true, table: false, write: false };
            const config = {};
            const evalRecord = new eval_2.default(config);
            jest.mocked(share_1.isSharingEnabled).mockReturnValue(false);
            jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                config,
                testSuite: { prompts: [], providers: [] },
                basePath: path.resolve('/'),
            });
            jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
            await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
            expect(share_1.createShareableUrl).not.toHaveBeenCalled();
        });
    });
    describe('Full precedence verification matrix', () => {
        const testMatrix = [
            // [cmdObj.share, cmdObj.noShare, commandLineOptions.share, config.sharing, cloudEnabled, expectedToShare, description]
            [false, undefined, undefined, undefined, false, false, 'CLI --share=false blocks everything'],
            [false, undefined, true, true, true, false, 'CLI --share=false overrides all other enables'],
            [undefined, true, true, true, true, false, 'CLI --no-share overrides all other enables'],
            [true, undefined, false, false, false, true, 'CLI --share=true overrides all disables'],
            [
                undefined,
                undefined,
                true,
                false,
                false,
                true,
                'commandLineOptions.share=true overrides config.sharing=false',
            ],
            [
                undefined,
                undefined,
                false,
                true,
                true,
                false,
                'commandLineOptions.share=false overrides config and cloud',
            ],
            [undefined, undefined, undefined, true, false, true, 'config.sharing=true enables sharing'],
            [
                undefined,
                undefined,
                undefined,
                false,
                true,
                false,
                'config.sharing=false blocks cloud auto-share',
            ],
            [
                undefined,
                undefined,
                undefined,
                undefined,
                true,
                true,
                'cloud enabled auto-shares when nothing set',
            ],
            [
                undefined,
                undefined,
                undefined,
                undefined,
                false,
                false,
                'no sharing when nothing enables it',
            ],
        ];
        testMatrix.forEach(([cmdShare, cmdNoShare, cloShare, cfgShare, cloudEnabled, expectedToShare, description]) => {
            it(description, async () => {
                const cmdObj = { table: false, write: false };
                if (cmdShare !== undefined) {
                    cmdObj.share = cmdShare;
                }
                if (cmdNoShare !== undefined) {
                    cmdObj.noShare = cmdNoShare;
                }
                const config = (cfgShare !== undefined ? { sharing: cfgShare } : {});
                const evalRecord = new eval_2.default(config);
                jest.mocked(cloud_1.cloudConfig.isEnabled).mockReturnValue(cloudEnabled);
                jest.mocked(load_1.resolveConfigs).mockResolvedValue({
                    config,
                    testSuite: { prompts: [], providers: [] },
                    basePath: path.resolve('/'),
                    commandLineOptions: cloShare !== undefined ? { share: cloShare } : undefined,
                });
                jest.mocked(evaluator_1.evaluate).mockResolvedValue(evalRecord);
                await (0, eval_1.doEval)(cmdObj, config, defaultConfigPath, {});
                if (expectedToShare) {
                    expect(share_1.createShareableUrl).toHaveBeenCalledWith(expect.any(eval_2.default));
                }
                else {
                    expect(share_1.createShareableUrl).not.toHaveBeenCalled();
                }
            });
        });
    });
});
//# sourceMappingURL=eval.test.js.map