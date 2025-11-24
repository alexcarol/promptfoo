"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../../../src/redteam/strategies/util");
describe('pluginMatchesStrategyTargets', () => {
    describe('strategy-exempt plugins', () => {
        it('should exclude system-prompt-override plugin', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'system-prompt-override' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined);
            expect(result).toBe(false);
        });
        it('should exclude agentic:memory-poisoning plugin', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'agentic:memory-poisoning' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined);
            expect(result).toBe(false);
        });
        it('should exclude pliny plugin', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'pliny' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined);
            expect(result).toBe(false);
        });
        it('should exclude unsafebench plugin', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'unsafebench' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined);
            expect(result).toBe(false);
        });
        it('should exclude vlguard plugin', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'vlguard' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined);
            expect(result).toBe(false);
        });
        it('should exclude beavertails plugin', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'beavertails' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined);
            expect(result).toBe(false);
        });
        it('should exclude cyberseceval plugin', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'cyberseceval' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined);
            expect(result).toBe(false);
        });
    });
    describe('sequence provider exclusion', () => {
        it('should exclude sequence providers', () => {
            const testCase = {
                vars: { input: 'test' },
                provider: { id: 'sequence' },
                metadata: { pluginId: 'harmful:hate' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined);
            expect(result).toBe(false);
        });
        it('should not exclude non-sequence providers', () => {
            const testCase = {
                vars: { input: 'test' },
                provider: { id: 'openai:gpt-4' },
                metadata: { pluginId: 'harmful:hate' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined);
            expect(result).toBe(true);
        });
    });
    describe('plugin-level strategy exclusions', () => {
        it('should respect excludeStrategies config for specific strategy', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: {
                    pluginId: 'harmful:hate',
                    pluginConfig: {
                        excludeStrategies: ['base64', 'rot13'],
                    },
                },
            };
            expect((0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined)).toBe(false);
            expect((0, util_1.pluginMatchesStrategyTargets)(testCase, 'rot13', undefined)).toBe(false);
            expect((0, util_1.pluginMatchesStrategyTargets)(testCase, 'multilingual', undefined)).toBe(true);
        });
        it('should handle empty excludeStrategies array', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: {
                    pluginId: 'harmful:hate',
                    pluginConfig: {
                        excludeStrategies: [],
                    },
                },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined);
            expect(result).toBe(true);
        });
        it('should handle non-array excludeStrategies', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: {
                    pluginId: 'harmful:hate',
                    pluginConfig: {
                        excludeStrategies: 'not-an-array',
                    },
                },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined);
            expect(result).toBe(true);
        });
    });
    describe('target plugin matching', () => {
        it('should match when no target plugins specified', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'harmful:hate' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined);
            expect(result).toBe(true);
        });
        it('should match when empty target plugins array', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'harmful:hate' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', []);
            expect(result).toBe(true);
        });
        it('should match direct plugin ID', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'harmful:hate' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', ['harmful:hate', 'pii']);
            expect(result).toBe(true);
        });
        it('should not match when plugin ID not in targets', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'harmful:hate' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', ['pii', 'bias']);
            expect(result).toBe(false);
        });
        it('should match category prefix', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'harmful:hate' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', ['harmful']);
            expect(result).toBe(true);
        });
        it('should match specific subcategory when parent category targeted', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'harmful:cybercrime:malicious-code' },
            };
            expect((0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', ['harmful'])).toBe(true);
            expect((0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', ['harmful:cybercrime'])).toBe(true);
        });
        it('should not match partial category names', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'harmful:hate' },
            };
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', ['harm']);
            expect(result).toBe(false);
        });
        it('should handle undefined plugin ID', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: {
                    pluginId: 'unknown',
                },
            };
            expect((0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', ['harmful'])).toBe(false);
            expect((0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined)).toBe(true);
        });
        it('should handle missing metadata', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: {
                    pluginId: 'unknown',
                },
            };
            expect((0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', ['harmful'])).toBe(false);
            expect((0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', undefined)).toBe(true);
        });
    });
    describe('combined conditions', () => {
        it('should prioritize strategy-exempt over target matching', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: { pluginId: 'pliny' },
            };
            // Even if pliny is specifically targeted, it should be excluded
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', ['pliny']);
            expect(result).toBe(false);
        });
        it('should prioritize sequence provider over target matching', () => {
            const testCase = {
                vars: { input: 'test' },
                provider: { id: 'sequence' },
                metadata: { pluginId: 'harmful:hate' },
            };
            // Even if harmful:hate is targeted, sequence provider should exclude it
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', ['harmful:hate']);
            expect(result).toBe(false);
        });
        it('should prioritize plugin exclusion over target matching', () => {
            const testCase = {
                vars: { input: 'test' },
                metadata: {
                    pluginId: 'harmful:hate',
                    pluginConfig: {
                        excludeStrategies: ['base64'],
                    },
                },
            };
            // Even if harmful:hate is targeted, plugin exclusion should take precedence
            const result = (0, util_1.pluginMatchesStrategyTargets)(testCase, 'base64', ['harmful:hate']);
            expect(result).toBe(false);
        });
        it('should apply all filters in correct order', () => {
            // Test case that passes all filters
            const passingCase = {
                vars: { input: 'test' },
                provider: { id: 'openai:gpt-4' },
                metadata: {
                    pluginId: 'harmful:hate',
                    pluginConfig: {
                        excludeStrategies: ['rot13'],
                    },
                },
            };
            expect((0, util_1.pluginMatchesStrategyTargets)(passingCase, 'base64', ['harmful'])).toBe(true);
            // Test case blocked by strategy-exempt (dataset plugin)
            const exemptCase = {
                ...passingCase,
                metadata: {
                    ...passingCase.metadata,
                    pluginId: 'cyberseceval',
                },
            };
            expect((0, util_1.pluginMatchesStrategyTargets)(exemptCase, 'base64', ['cyberseceval'])).toBe(false);
            // Test case blocked by sequence provider
            const sequenceCase = {
                ...passingCase,
                provider: { id: 'sequence' },
            };
            expect((0, util_1.pluginMatchesStrategyTargets)(sequenceCase, 'base64', ['harmful'])).toBe(false);
            // Test case blocked by excludeStrategies
            const excludedCase = {
                ...passingCase,
                metadata: {
                    ...passingCase.metadata,
                    pluginConfig: {
                        excludeStrategies: ['base64'],
                    },
                },
            };
            expect((0, util_1.pluginMatchesStrategyTargets)(excludedCase, 'base64', ['harmful'])).toBe(false);
            // Test case blocked by target mismatch
            const mismatchCase = {
                ...passingCase,
                metadata: {
                    ...passingCase.metadata,
                    pluginId: 'pii:direct',
                },
            };
            expect((0, util_1.pluginMatchesStrategyTargets)(mismatchCase, 'base64', ['harmful'])).toBe(false);
        });
    });
});
//# sourceMappingURL=util.test.js.map