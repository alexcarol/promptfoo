"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plugins_1 = require("../../../src/redteam/constants/plugins");
describe('plugins constants', () => {
    it('should have ALL_PLUGINS as sorted array', () => {
        const sorted = [...plugins_1.ALL_PLUGINS].sort();
        expect(plugins_1.ALL_PLUGINS).toEqual(sorted);
    });
    it('should have unique values in ALL_PLUGINS', () => {
        const uniquePlugins = new Set(plugins_1.ALL_PLUGINS);
        expect(uniquePlugins.size).toBe(plugins_1.ALL_PLUGINS.length);
    });
    describe('DATASET_EXEMPT_PLUGINS', () => {
        it('should include static dataset plugins', () => {
            expect(plugins_1.DATASET_EXEMPT_PLUGINS).toContain('beavertails');
            expect(plugins_1.DATASET_EXEMPT_PLUGINS).toContain('cyberseceval');
            expect(plugins_1.DATASET_EXEMPT_PLUGINS).toContain('pliny');
            expect(plugins_1.DATASET_EXEMPT_PLUGINS).toContain('unsafebench');
            expect(plugins_1.DATASET_EXEMPT_PLUGINS).toContain('vlguard');
        });
        it('should have unique values', () => {
            const uniquePlugins = new Set(plugins_1.DATASET_EXEMPT_PLUGINS);
            expect(uniquePlugins.size).toBe(plugins_1.DATASET_EXEMPT_PLUGINS.length);
        });
    });
    describe('AGENTIC_EXEMPT_PLUGINS', () => {
        it('should include agentic plugins', () => {
            expect(plugins_1.AGENTIC_EXEMPT_PLUGINS).toContain('system-prompt-override');
            expect(plugins_1.AGENTIC_EXEMPT_PLUGINS).toContain('agentic:memory-poisoning');
        });
        it('should have unique values', () => {
            const uniquePlugins = new Set(plugins_1.AGENTIC_EXEMPT_PLUGINS);
            expect(uniquePlugins.size).toBe(plugins_1.AGENTIC_EXEMPT_PLUGINS.length);
        });
    });
    describe('STRATEGY_EXEMPT_PLUGINS', () => {
        it('should include both agentic and dataset plugins', () => {
            // Should include all agentic plugins
            plugins_1.AGENTIC_EXEMPT_PLUGINS.forEach((plugin) => {
                expect(plugins_1.STRATEGY_EXEMPT_PLUGINS).toContain(plugin);
            });
            // Should include all dataset plugins
            plugins_1.DATASET_EXEMPT_PLUGINS.forEach((plugin) => {
                expect(plugins_1.STRATEGY_EXEMPT_PLUGINS).toContain(plugin);
            });
        });
        it('should have unique values', () => {
            const uniquePlugins = new Set(plugins_1.STRATEGY_EXEMPT_PLUGINS);
            expect(uniquePlugins.size).toBe(plugins_1.STRATEGY_EXEMPT_PLUGINS.length);
        });
        it('should be the union of agentic and dataset plugins', () => {
            const expectedLength = plugins_1.AGENTIC_EXEMPT_PLUGINS.length + plugins_1.DATASET_EXEMPT_PLUGINS.length;
            expect(plugins_1.STRATEGY_EXEMPT_PLUGINS.length).toBe(expectedLength);
        });
    });
});
//# sourceMappingURL=plugins.test.js.map