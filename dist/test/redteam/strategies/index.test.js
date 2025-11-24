"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const cliState_1 = __importDefault(require("../../../src/cliState"));
const esm_1 = require("../../../src/esm");
const logger_1 = __importDefault(require("../../../src/logger"));
const index_1 = require("../../../src/redteam/strategies/index");
jest.mock('../../../src/cliState');
jest.mock('../../../src/esm', () => ({
    importModule: jest.fn(),
}));
describe('validateStrategies', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });
    it('should validate valid strategies', async () => {
        const validStrategies = [
            { id: 'basic' },
            { id: 'base64' },
            { id: 'video' },
            { id: 'morse' },
            { id: 'piglatin' },
            { id: 'camelcase' },
            { id: 'emoji' },
            { id: 'mischievous-user' },
        ];
        await expect((0, index_1.validateStrategies)(validStrategies)).resolves.toBeUndefined();
    });
    it('should validate basic strategy with enabled config', async () => {
        const strategies = [{ id: 'basic', config: { enabled: true } }];
        await expect((0, index_1.validateStrategies)(strategies)).resolves.toBeUndefined();
    });
    it('should throw error for invalid basic strategy config', async () => {
        const strategies = [
            { id: 'basic', config: { enabled: 'not-a-boolean' } },
        ];
        await expect((0, index_1.validateStrategies)(strategies)).rejects.toThrow('Basic strategy enabled config must be a boolean');
    });
    it('should skip validation for file:// strategies', async () => {
        const strategies = [{ id: 'file://custom.js' }];
        await expect((0, index_1.validateStrategies)(strategies)).resolves.toBeUndefined();
    });
    it('should exit for invalid strategies', async () => {
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
        const invalidStrategies = [{ id: 'invalid-strategy' }];
        await (0, index_1.validateStrategies)(invalidStrategies);
        expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining('Invalid strategy(s)'));
        expect(mockExit).toHaveBeenCalledWith(1);
    });
});
describe('loadStrategy', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });
    it('should load predefined strategy', async () => {
        const strategy = await (0, index_1.loadStrategy)('basic');
        expect(strategy).toBeDefined();
        expect(strategy.id).toBe('basic');
    });
    it('should load video strategy', async () => {
        const strategy = await (0, index_1.loadStrategy)('video');
        expect(strategy).toBeDefined();
        expect(strategy.id).toBe('video');
        expect(typeof strategy.action).toBe('function');
    });
    it('should call video strategy action with correct parameters', async () => {
        const strategy = await (0, index_1.loadStrategy)('video');
        const testCases = [
            { vars: { test: 'value' }, metadata: { pluginId: 'test' } },
        ];
        const injectVar = 'inject';
        const config = {};
        await strategy.action(testCases, injectVar, config);
        expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining('Adding video encoding'));
        expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining('Added'));
    });
    it('should load morse strategy', async () => {
        const strategy = await (0, index_1.loadStrategy)('morse');
        expect(strategy).toBeDefined();
        expect(strategy.id).toBe('morse');
    });
    it('should load piglatin strategy', async () => {
        const strategy = await (0, index_1.loadStrategy)('piglatin');
        expect(strategy).toBeDefined();
        expect(strategy.id).toBe('piglatin');
    });
    it('should load camelcase strategy', async () => {
        const strategy = await (0, index_1.loadStrategy)('camelcase');
        expect(strategy).toBeDefined();
        expect(strategy.id).toBe('camelcase');
    });
    it('should load emoji strategy', async () => {
        const strategy = await (0, index_1.loadStrategy)('emoji');
        expect(strategy).toBeDefined();
        expect(strategy.id).toBe('emoji');
    });
    it('should call emoji strategy action with correct parameters', async () => {
        const strategy = await (0, index_1.loadStrategy)('emoji');
        const testCases = [
            { vars: { test: 'value' }, metadata: { pluginId: 'test' } },
        ];
        const injectVar = 'inject';
        const config = {};
        await strategy.action(testCases, injectVar, config);
        expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining('Adding emoji encoding'));
        expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining('Added'));
    });
    it('should load mischievous user strategy', async () => {
        const strategy = await (0, index_1.loadStrategy)('mischievous-user');
        expect(strategy).toBeDefined();
        expect(strategy.id).toBe('mischievous-user');
        expect(typeof strategy.action).toBe('function');
    });
    it('should call mischievous user strategy action with correct parameters', async () => {
        const strategy = await (0, index_1.loadStrategy)('mischievous-user');
        const testCases = [
            { vars: { test: 'value' }, metadata: { pluginId: 'test' } },
        ];
        const injectVar = 'inject';
        const config = {};
        await strategy.action(testCases, injectVar, config);
        expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining('Adding mischievous user test cases'));
        expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining('Added'));
    });
    it('should throw error for non-existent strategy', async () => {
        await expect((0, index_1.loadStrategy)('non-existent')).rejects.toThrow('Strategy not found: non-existent');
    });
    it('should load custom file strategy', async () => {
        const customStrategy = {
            id: 'custom',
            action: jest.fn(),
        };
        jest.mocked(esm_1.importModule).mockResolvedValue(customStrategy);
        cliState_1.default.basePath = '/test/path';
        const strategy = await (0, index_1.loadStrategy)('file://custom.js');
        expect(strategy).toEqual(customStrategy);
    });
    it('should throw error for non-js custom file', async () => {
        await expect((0, index_1.loadStrategy)('file://custom.txt')).rejects.toThrow('Custom strategy file must be a JavaScript file');
    });
    it('should throw error for invalid custom strategy', async () => {
        jest.mocked(esm_1.importModule).mockResolvedValue({});
        await expect((0, index_1.loadStrategy)('file://invalid.js')).rejects.toThrow("Custom strategy in invalid.js must export an object with 'key' and 'action' properties");
    });
    it('should use absolute path for custom strategy', async () => {
        const customStrategy = {
            id: 'custom',
            action: jest.fn(),
        };
        jest.mocked(esm_1.importModule).mockResolvedValue(customStrategy);
        await (0, index_1.loadStrategy)('file:///absolute/path/custom.js');
        expect(esm_1.importModule).toHaveBeenCalledWith('/absolute/path/custom.js');
    });
    it('should use relative path from basePath for custom strategy', async () => {
        const customStrategy = {
            id: 'custom',
            action: jest.fn(),
        };
        jest.mocked(esm_1.importModule).mockResolvedValue(customStrategy);
        cliState_1.default.basePath = '/base/path';
        await (0, index_1.loadStrategy)('file://relative/custom.js');
        expect(esm_1.importModule).toHaveBeenCalledWith(path_1.default.join('/base/path', 'relative/custom.js'));
    });
});
describe('custom strategy validation', () => {
    it('should reject custom strategy without strategyText', async () => {
        const strategies = [{ id: 'custom' }];
        await expect((0, index_1.validateStrategies)(strategies)).rejects.toThrow('Custom strategy requires strategyText in config');
    });
    it('should reject custom strategy variant without strategyText', async () => {
        const strategies = [{ id: 'custom:aggressive' }];
        await expect((0, index_1.validateStrategies)(strategies)).rejects.toThrow('Custom strategy requires strategyText in config');
    });
    it('should validate custom strategy with strategyText', async () => {
        const strategies = [
            { id: 'custom', config: { strategyText: 'Test strategy' } },
        ];
        await expect((0, index_1.validateStrategies)(strategies)).resolves.toBeUndefined();
    });
    it('should validate custom strategy variants with compound IDs', async () => {
        const strategies = [
            { id: 'custom:aggressive', config: { strategyText: 'Aggressive strategy' } },
            { id: 'custom:greeting-strategy', config: { strategyText: 'Greeting strategy' } },
            { id: 'custom:multi-word-variant', config: { strategyText: 'Multi-word variant' } },
            { id: 'custom:snake_case_variant', config: { strategyText: 'Snake case variant' } },
        ];
        await expect((0, index_1.validateStrategies)(strategies)).resolves.toBeUndefined();
    });
    it('should validate custom strategies with config', async () => {
        const strategies = [
            {
                id: 'custom:configured',
                config: {
                    strategyText: 'Custom strategy text',
                    stateful: true,
                    temperature: 0.8,
                },
            },
        ];
        await expect((0, index_1.validateStrategies)(strategies)).resolves.toBeUndefined();
    });
    it('should validate mixed strategies including custom variants', async () => {
        const strategies = [
            { id: 'basic' },
            { id: 'custom', config: { strategyText: 'Custom strategy' } },
            { id: 'custom:variant1', config: { strategyText: 'Variant 1' } },
            { id: 'crescendo' },
            { id: 'custom:variant2', config: { strategyText: 'Custom text' } },
        ];
        await expect((0, index_1.validateStrategies)(strategies)).resolves.toBeUndefined();
    });
    it('should validate custom strategies with complex variant names', async () => {
        const strategies = [
            {
                id: 'custom:very-long-complex-variant-name-with-many-hyphens',
                config: { strategyText: 'Long variant' },
            },
            {
                id: 'custom:variant_with_underscores_and_numbers_123',
                config: { strategyText: 'Underscore variant' },
            },
            { id: 'custom:CamelCaseVariant', config: { strategyText: 'CamelCase variant' } },
            { id: 'custom:variant.with.dots', config: { strategyText: 'Dot variant' } },
        ];
        await expect((0, index_1.validateStrategies)(strategies)).resolves.toBeUndefined();
    });
    it('should reject invalid custom-like strategy patterns', async () => {
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
        const strategies = [
            { id: 'invalid-strategy' },
            { id: 'custom-invalid' },
            { id: 'custom_invalid' },
            { id: 'notcustom:variant' },
        ];
        await (0, index_1.validateStrategies)(strategies);
        expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining('Invalid strategy(s)'));
        expect(mockExit).toHaveBeenCalledWith(1);
    });
});
describe('custom strategy loading', () => {
    it('should load simple custom strategy', async () => {
        const strategy = await (0, index_1.loadStrategy)('custom');
        expect(strategy).toBeDefined();
        expect(strategy.id).toBe('custom');
    });
    it('should call custom strategy action with correct parameters including strategyId', async () => {
        const strategy = await (0, index_1.loadStrategy)('custom');
        const testCases = [
            { vars: { test: 'value' }, metadata: { pluginId: 'test' } },
        ];
        const injectVar = 'inject';
        const config = { strategyText: 'Test strategy' };
        await strategy.action(testCases, injectVar, config, 'custom:test');
        expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining('Adding Custom'));
        expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining('Added'));
    });
});
//# sourceMappingURL=index.test.js.map