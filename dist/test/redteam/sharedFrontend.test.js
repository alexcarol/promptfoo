"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../src/redteam/constants");
const sharedFrontend_1 = require("../../src/redteam/sharedFrontend");
describe('getRiskCategorySeverityMap', () => {
    it('should return default severity map when no plugins provided', () => {
        const result = (0, sharedFrontend_1.getRiskCategorySeverityMap)();
        expect(result).toBeDefined();
        expect(result['contracts']).toBe(constants_1.Severity.Medium);
    });
    it('should override default severities with plugin severities', () => {
        const plugins = [
            { id: 'contracts', severity: constants_1.Severity.High },
            { id: 'politics', severity: constants_1.Severity.Critical },
        ];
        const result = (0, sharedFrontend_1.getRiskCategorySeverityMap)(plugins);
        expect(result['contracts']).toBe(constants_1.Severity.High);
        expect(result['politics']).toBe(constants_1.Severity.Critical);
    });
    it('should handle plugins without severity override', () => {
        const plugins = [
            { id: 'contracts' },
            { id: 'politics', severity: constants_1.Severity.Critical },
        ];
        const result = (0, sharedFrontend_1.getRiskCategorySeverityMap)(plugins);
        expect(result['contracts']).toBe(constants_1.Severity.Medium); // Default severity
        expect(result['politics']).toBe(constants_1.Severity.Critical);
    });
});
describe('getUnifiedConfig', () => {
    const baseConfig = {
        description: 'Test config',
        prompts: ['test prompt'],
        target: {
            id: 'test-target',
            config: {
                sessionSource: 'test-session',
                stateful: true,
                apiKey: 'test-key',
            },
        },
        plugins: ['test-plugin'],
        strategies: ['basic'],
        purpose: 'testing',
        applicationDefinition: {},
        entities: [],
    };
    it('should transform config correctly', () => {
        const result = (0, sharedFrontend_1.getUnifiedConfig)(baseConfig);
        expect(result.description).toBe('Test config');
        expect(result.prompts).toEqual(['test prompt']);
        // @ts-ignore
        expect(result.targets[0].config.sessionSource).toBeUndefined();
        // @ts-ignore
        expect(result.targets[0].config.stateful).toBeUndefined();
        expect(result.redteam.purpose).toBe('testing');
    });
    it('should handle defaultTest transformation', () => {
        const configWithDefaultTest = {
            ...baseConfig,
            defaultTest: {
                vars: { test: 'value' },
                options: { someOption: true },
            },
        };
        const result = (0, sharedFrontend_1.getUnifiedConfig)(configWithDefaultTest);
        expect(typeof result.defaultTest).toBe('object');
        expect(result.defaultTest).toBeDefined();
        // Type assertion since we've verified it's an object above
        const defaultTest = result.defaultTest;
        expect(defaultTest.vars).toEqual({ test: 'value' });
        expect(defaultTest.options.transformVars).toBe('{ ...vars, sessionId: context.uuid }');
    });
    it('should transform plugins correctly', () => {
        const configWithPlugins = {
            ...baseConfig,
            plugins: ['simple-plugin', { id: 'complex-plugin', config: { setting: true } }],
        };
        const result = (0, sharedFrontend_1.getUnifiedConfig)(configWithPlugins);
        expect(result.redteam.plugins).toEqual([
            { id: 'simple-plugin' },
            { id: 'complex-plugin', config: { setting: true } },
        ]);
    });
    it('should transform strategies with stateful config', () => {
        const configWithStrategies = {
            ...baseConfig,
            strategies: ['basic', 'goat', { id: 'custom', config: { option: true } }],
        };
        const result = (0, sharedFrontend_1.getUnifiedConfig)(configWithStrategies);
        expect(result.redteam.strategies).toEqual([
            { id: 'basic' },
            { id: 'goat', config: { stateful: true } },
            { id: 'custom', config: { option: true, stateful: true } },
        ]);
    });
    it('should handle maxConcurrency configuration', () => {
        const configWithMaxConcurrency = {
            ...baseConfig,
            maxConcurrency: 5,
        };
        const result = (0, sharedFrontend_1.getUnifiedConfig)(configWithMaxConcurrency);
        expect(result.redteam.maxConcurrency).toBe(5);
        const configWithoutMaxConcurrency = (0, sharedFrontend_1.getUnifiedConfig)(baseConfig);
        expect(configWithoutMaxConcurrency.redteam.maxConcurrency).toBeUndefined();
    });
    it('should include testGenerationInstructions if provided', () => {
        const configWithInstructions = {
            ...baseConfig,
            testGenerationInstructions: 'Generate more tests',
        };
        const result = (0, sharedFrontend_1.getUnifiedConfig)(configWithInstructions);
        expect(result.redteam.testGenerationInstructions).toBe('Generate more tests');
    });
    it('should omit plugin config if empty', () => {
        const configWithEmptyPluginConfig = {
            ...baseConfig,
            plugins: [{ id: 'plugin-empty', config: {} }],
        };
        const result = (0, sharedFrontend_1.getUnifiedConfig)(configWithEmptyPluginConfig);
        expect(result.redteam.plugins).toEqual([{ id: 'plugin-empty' }]);
    });
    it('should omit strategy config if not needed', () => {
        const configWithSimpleStrategy = {
            ...baseConfig,
            strategies: [{ id: 'basic', config: {} }],
        };
        const result = (0, sharedFrontend_1.getUnifiedConfig)(configWithSimpleStrategy);
        expect(result.redteam.strategies).toEqual([{ id: 'basic' }]);
    });
    it('should add stateful to multi-turn strategies if stateful is true', () => {
        const configWithMultiTurn = {
            ...baseConfig,
            strategies: ['goat'],
            target: {
                ...baseConfig.target,
                config: {
                    ...baseConfig.target.config,
                    stateful: true,
                },
            },
        };
        const result = (0, sharedFrontend_1.getUnifiedConfig)(configWithMultiTurn);
        expect(result.redteam.strategies).toEqual([{ id: 'goat', config: { stateful: true } }]);
    });
    it('should not add stateful config for multi-turn strategies if stateful is false', () => {
        const configWithNonStateful = {
            ...baseConfig,
            strategies: ['goat'],
            target: {
                ...baseConfig.target,
                config: {
                    ...baseConfig.target.config,
                    stateful: false,
                },
            },
        };
        const result = (0, sharedFrontend_1.getUnifiedConfig)(configWithNonStateful);
        expect(result.redteam.strategies).toEqual([{ id: 'goat' }]);
    });
    it('should include frameworks when provided', () => {
        const configWithFrameworks = {
            ...baseConfig,
            frameworks: ['owasp:llm', 'nist:ai:measure'],
        };
        const result = (0, sharedFrontend_1.getUnifiedConfig)(configWithFrameworks);
        expect(result.redteam.frameworks).toEqual(['owasp:llm', 'nist:ai:measure']);
    });
});
//# sourceMappingURL=sharedFrontend.test.js.map